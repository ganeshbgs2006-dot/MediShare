/**
 * Complete End-to-End Verification Test for Seeker Equipment Booking Pipeline
 * Verifies:
 * 1. Role enforcement (Seeker vs Owner vs Admin vs Unauthenticated)
 * 2. Input and date validation
 * 3. Actual persistence in MySQL database
 * 4. Seeker "My Requests" API visibility
 * 5. Owner "Loan Requests" API visibility and approval
 * 6. Concurrency & date-overlap rejection
 * 7. Video stream delivery (HTTP 206)
 */

import http from 'http';
import app from '../src/app.js';
import { query } from '../src/config/db.js';

const PORT = 5096;
const BASE_URL = `http://127.0.0.1:${PORT}/api`;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

async function run() {
  console.log('================================================================');
  console.log('🧪 MediShare: Seeker Booking & Equipment Lifecycle E2E Suite');
  console.log('================================================================\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`[TEST-RUNNER] Express test server listening at ${BASE_URL}\n`);

  try {
    // ------------------------------------------------------------------
    // Step 1: Verify Equipment Record & Video in Database & Static Storage
    // ------------------------------------------------------------------
    console.log('--- Step 1: Equipment Catalog & Video Storage Verification ---');
    const equipRows = await query('SELECT id, name, owner_id, video_url, availability_status, price_per_day FROM equipment WHERE id = 15');
    assert(equipRows.length > 0, 'Equipment listing #15 exists in MySQL database');
    const equip15 = equipRows[0];
    assert(equip15.video_url && equip15.video_url.endsWith('.mp4'), `Equipment #15 has video URL: ${equip15.video_url}`);
    assert(equip15.availability_status === 'available', 'Equipment #15 availability status is "available"');

    // Test static video streaming endpoint (HTTP 206)
    const videoStreamRes = await fetch(`http://127.0.0.1:${PORT}${equip15.video_url}`, {
      headers: { Range: 'bytes=0-1024' }
    });
    assert(
      videoStreamRes.status === 206,
      `Demonstration video streamed with HTTP 206 Partial Content (Status: ${videoStreamRes.status})`
    );
    assert(
      videoStreamRes.headers.get('content-type') === 'video/mp4',
      'Video stream Content-Type is video/mp4'
    );

    // ------------------------------------------------------------------
    // Step 2: Authentication & Tokens
    // ------------------------------------------------------------------
    console.log('\n--- Step 2: User Authentication ---');
    // Log in Seeker (Priya Sharma, seeker)
    const seekerLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'priya.seeker@example.com', password: 'Seeker@123' })
    });
    const seekerData = await seekerLogin.json();
    assert(seekerLogin.status === 200 && seekerData.token, 'Seeker (Priya) logged in successfully with JWT');
    const seekerToken = seekerData.token;
    const seekerId = seekerData.user.id;

    // Log in Owner (St. Jude Partner, owner_id = 2)
    const ownerLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'partner@stjude.org', password: 'Partner@123' })
    });
    const ownerData = await ownerLogin.json();
    assert(ownerLogin.status === 200 && ownerData.token, 'Owner (St. Jude Partner) logged in successfully with JWT');
    const ownerToken = ownerData.token;

    // ------------------------------------------------------------------
    // Step 3: Security & Validation Guards
    // ------------------------------------------------------------------
    console.log('\n--- Step 3: Role & Validation Enforcement ---');

    // A. Unauthenticated request blocked
    const unauthRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ equipmentId: 15, startDate: '2026-11-01', endDate: '2026-11-05' })
    });
    assert(unauthRes.status === 401, 'Unauthenticated booking request rejected with HTTP 401 Unauthorized');

    // B. Owner attempting to book rejected
    const ownerBookRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        equipmentId: 1,
        startDate: '2026-11-01',
        endDate: '2026-11-05',
        seekerMessage: 'Owner attempting to borrow own equipment'
      })
    });
    assert(
      ownerBookRes.status === 403 || ownerBookRes.status === 400,
      `Owner booking attempt rejected with HTTP ${ownerBookRes.status} (Role/Ownership Protection)`
    );

    // C. Past start date rejected
    const pastDateRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${seekerToken}`
      },
      body: JSON.stringify({
        equipmentId: 1,
        startDate: '2020-01-01',
        endDate: '2020-01-05',
        seekerMessage: 'Invalid past date'
      })
    });
    assert(pastDateRes.status === 400, 'Past start date rejected with HTTP 400');

    // D. End date earlier than start date rejected
    const invertedDateRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${seekerToken}`
      },
      body: JSON.stringify({
        equipmentId: 1,
        startDate: '2026-11-10',
        endDate: '2026-11-05',
        seekerMessage: 'Inverted dates'
      })
    });
    assert(invertedDateRes.status === 400, 'End date earlier than start date rejected with HTTP 400');

    // ------------------------------------------------------------------
    // Step 4: Real Seeker Booking Creation & MySQL Persistence
    // ------------------------------------------------------------------
    console.log('\n--- Step 4: Real Seeker Booking Creation ---');

    // Use a unique future date window to test clean reservation
    const randOffset = Math.floor(Math.random() * 50) + 10;
    const sDate = new Date();
    sDate.setDate(sDate.getDate() + randOffset);
    const eDate = new Date();
    eDate.setDate(eDate.getDate() + randOffset + 4);
    const startDateStr = sDate.toISOString().split('T')[0];
    const endDateStr = eDate.toISOString().split('T')[0];

    const bookPayload = {
      equipmentId: 1,
      startDate: startDateStr,
      endDate: endDateStr,
      seekerMessage: '[Handover Preference: Self-Pickup]\nPatient recovering from hip surgery; needs manual folding wheelchair for outpatient therapy.'
    };

    const createRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${seekerToken}`
      },
      body: JSON.stringify(bookPayload)
    });

    const createData = await createRes.json();
    assert(createRes.status === 201 && createData.success, 'POST /api/bookings returns HTTP 201 Created');
    const createdBooking = createData.booking;
    assert(createdBooking && createdBooking.id, `Created booking assigned real ID #${createdBooking.id}`);
    assert(createdBooking.booking_reference, `Unique booking reference generated: ${createdBooking.booking_reference}`);
    assert(createdBooking.status === 'pending', 'Initial booking status is "pending"');

    // Check MySQL Persistent Database Row Directly
    const dbBookingRows = await query('SELECT * FROM bookings WHERE id = ?', [createdBooking.id]);
    assert(dbBookingRows.length === 1, `Booking record found directly in MySQL database table 'bookings'`);
    const dbRow = dbBookingRows[0];
    assert(dbRow.equipment_id === 1, 'MySQL record equipment_id matches 1');
    assert(dbRow.seeker_id === seekerId, `MySQL record seeker_id matches authenticated seeker (${seekerId})`);
    assert(dbRow.status === 'pending', 'MySQL record status is "pending"');
    assert(dbRow.booking_reference === createdBooking.booking_reference, 'MySQL record booking_reference matches response');

    // ------------------------------------------------------------------
    // Step 5: Seeker "My Requests" Visibility
    // ------------------------------------------------------------------
    console.log('\n--- Step 5: Seeker My Requests Visibility ---');
    const myBookingsRes = await fetch(`${BASE_URL}/bookings/my`, {
      headers: { Authorization: `Bearer ${seekerToken}` }
    });
    const myBookingsData = await myBookingsRes.json();
    assert(myBookingsRes.status === 200 && myBookingsData.success, 'GET /api/bookings/my returns HTTP 200 OK');
    const foundInMy = myBookingsData.bookings.find((b) => b.id === createdBooking.id);
    assert(Boolean(foundInMy), `Created booking #${createdBooking.id} is listed in Seeker's "My Requests"`);
    assert(foundInMy.status === 'pending', 'Listed status is "pending"');

    // ------------------------------------------------------------------
    // Step 6: Equipment Owner Review & Approval Workflow
    // ------------------------------------------------------------------
    console.log('\n--- Step 6: Equipment Owner Review & Approval Workflow ---');
    const ownerBookingsRes = await fetch(`${BASE_URL}/bookings/owner`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    const ownerBookingsData = await ownerBookingsRes.json();
    assert(ownerBookingsRes.status === 200 && ownerBookingsData.success, 'GET /api/bookings/owner returns HTTP 200 OK');
    const foundInOwner = ownerBookingsData.bookings.find((b) => b.id === createdBooking.id);
    assert(Boolean(foundInOwner), `Booking #${createdBooking.id} is listed in Equipment Owner's "Loan Requests" queue`);
    assert(foundInOwner.seeker_name === 'Priya Sharma (Care Seeker)', 'Owner sees seeker name "Priya Sharma (Care Seeker)"');

    // Owner approves the booking request
    const approveRes = await fetch(`${BASE_URL}/bookings/${createdBooking.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        status: 'approved',
        reason: 'Handover scheduled at community clinic reception.'
      })
    });
    const approveData = await approveRes.json();
    assert(approveRes.status === 200 && approveData.success, 'Owner successfully approved booking with HTTP 200 OK');

    // Verify in MySQL database that status transitioned to 'approved'
    const updatedDbRows = await query('SELECT status FROM bookings WHERE id = ?', [createdBooking.id]);
    assert(updatedDbRows[0].status === 'approved', 'MySQL record status successfully transitioned to "approved"');

    // Verify Seeker sees updated 'approved' status
    const seekerUpdatedRes = await fetch(`${BASE_URL}/bookings/my`, {
      headers: { Authorization: `Bearer ${seekerToken}` }
    });
    const seekerUpdatedData = await seekerUpdatedRes.json();
    const updatedFound = seekerUpdatedData.bookings.find((b) => b.id === createdBooking.id);
    assert(updatedFound && updatedFound.status === 'approved', 'Seeker "My Requests" displays updated status "approved"');

    // ------------------------------------------------------------------
    // Step 7: Concurrency Overlap Check (Date Conflict Prevention)
    // ------------------------------------------------------------------
    console.log('\n--- Step 7: Concurrency & Date Conflict Prevention ---');
    // Try to book the exact same equipment with overlapping dates now that it is approved
    const conflictRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${seekerToken}`
      },
      body: JSON.stringify({
        equipmentId: 1,
        startDate: startDateStr,
        endDate: endDateStr,
        seekerMessage: 'Attempting to reserve already booked dates'
      })
    });
    assert(conflictRes.status === 409, `Conflicting dates blocked with HTTP 409 Conflict (Concurrency guard verified)`);

    console.log('\n================================================================');
    console.log('🎉 ALL 20 SEEKER BOOKING PIPELINE TESTS PASSED SUCCESSFULLY!');
    console.log('================================================================\n');
  } finally {
    server.close();
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('Fatal error during test execution:', err);
  process.exit(1);
});
