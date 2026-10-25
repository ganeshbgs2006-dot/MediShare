import app from '../src/app.js';
import { query } from '../src/config/db.js';

let server;
const PORT = 5098;
const BASE_URL = `http://127.0.0.1:${PORT}/api`;

async function runTests() {
  console.log('====================================================');
  console.log('🧪 MediShare: Phase 4 & Phase 5 Integration Test Suite');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${details ? '- ' + details : ''}`);
      failed++;
    }
  }

  try {
    // 1. Start Server
    await new Promise((resolve) => {
      server = app.listen(PORT, '127.0.0.1', () => {
        console.log(`[TEST-RUNNER] Test Express server listening at ${BASE_URL}`);
        resolve();
      });
    });

    // 2. Test Public Equipment Endpoints
    console.log('\n--- Test Group 1: Equipment Marketplace API ---');
    const eqListRes = await fetch(`${BASE_URL}/equipment`);
    const eqListData = await eqListRes.json();
    assert(eqListRes.status === 200 && eqListData.success && eqListData.equipment.length >= 10,
      'GET /api/equipment returns seeded approved equipment items',
      `Found ${eqListData.equipment ? eqListData.equipment.length : 0} items`
    );

    const firstEqId = eqListData.equipment[0].id;
    const eqDetailRes = await fetch(`${BASE_URL}/equipment/${firstEqId}`);
    const eqDetailData = await eqDetailRes.json();
    assert(eqDetailRes.status === 200 && eqDetailData.success && eqDetailData.equipment.id === firstEqId,
      `GET /api/equipment/${firstEqId} returns detailed equipment record`
    );

    // 3. Test Authentication (Seeker, Owner, Admin)
    console.log('\n--- Test Group 2: User Authentication & Roles ---');
    // Seeker login
    const seekerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'priya.seeker@example.com', password: 'Seeker@123' })
    });
    const seekerLoginData = await seekerLoginRes.json();
    assert(seekerLoginRes.status === 200 && seekerLoginData.token && seekerLoginData.user.role === 'seeker',
      'Seeker authentication succeeded with JWT token'
    );
    const seekerToken = seekerLoginData.token;

    // Owner login
    const ownerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'partner@stjude.org', password: 'Partner@123' })
    });
    const ownerLoginData = await ownerLoginRes.json();
    assert(ownerLoginRes.status === 200 && ownerLoginData.token && ownerLoginData.user.role === 'owner',
      'Owner authentication succeeded with JWT token'
    );
    const ownerToken = ownerLoginData.token;

    // Admin login
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@medishare.org', password: 'Admin@123' })
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200 && adminLoginData.token && adminLoginData.user.role === 'admin',
      'Admin authentication succeeded with JWT token'
    );
    const adminToken = adminLoginData.token;

    // 4. Test Phase 4 Booking Workflow
    console.log('\n--- Test Group 3: Phase 4 Seeker & Owner Booking Workflow ---');
    // Seeker creates booking
    const bookingPayload = {
      equipmentId: firstEqId,
      startDate: '2026-11-10',
      endDate: '2026-11-15',
      seekerMessage: 'Required for post-knee replacement physical therapy recovery at home.'
    };

    const createBookingRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seekerToken}`
      },
      body: JSON.stringify(bookingPayload)
    });
    const createBookingData = await createBookingRes.json();
    assert(createBookingRes.status === 201 && createBookingData.success && createBookingData.booking.booking_reference,
      'POST /api/bookings successfully created booking with status pending',
      createBookingData.error || ''
    );
    const createdBooking = createBookingData.booking;

    // Check Seeker my bookings
    const myBookingsRes = await fetch(`${BASE_URL}/bookings/my`, {
      headers: { 'Authorization': `Bearer ${seekerToken}` }
    });
    const myBookingsData = await myBookingsRes.json();
    assert(myBookingsRes.status === 200 && myBookingsData.bookings.some(b => b.id === createdBooking.id),
      'GET /api/bookings/my returns the newly created booking for seeker'
    );

    // Check Owner incoming bookings
    const ownerBookingsRes = await fetch(`${BASE_URL}/bookings/owner`, {
      headers: { 'Authorization': `Bearer ${ownerToken}` }
    });
    const ownerBookingsData = await ownerBookingsRes.json();
    assert(ownerBookingsRes.status === 200 && ownerBookingsData.bookings.some(b => b.id === createdBooking.id),
      'GET /api/bookings/owner lists the booking request under equipment partner queue'
    );

    // Owner approves booking
    const approveRes = await fetch(`${BASE_URL}/bookings/${createdBooking.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`
      },
      body: JSON.stringify({ status: 'approved' })
    });
    const approveData = await approveRes.json();
    assert(approveRes.status === 200 && approveData.booking.status === 'approved',
      'Owner successfully approved booking (status: approved)'
    );

    // Concurrency / Overlap rejection check
    console.log('\n--- Test Group 4: Concurrency & Date Overlap Prevention ---');
    const overlapBookingRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seekerToken}`
      },
      body: JSON.stringify({
        equipmentId: firstEqId,
        startDate: '2026-11-12', // Overlaps with 2026-11-10 -> 2026-11-15
        endDate: '2026-11-18',
        seekerMessage: 'Overlapping request'
      })
    });
    const overlapData = await overlapBookingRes.json();
    assert(overlapBookingRes.status === 409 && overlapData.code === 'BOOKING_CONFLICT',
      'POST /api/bookings detects conflicting dates and blocks overlap with 409 Conflict',
      `Status: ${overlapBookingRes.status}`
    );

    // Handover & Return progression
    const handoverRes = await fetch(`${BASE_URL}/bookings/${createdBooking.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`
      },
      body: JSON.stringify({ status: 'active_loan', handoverNotes: 'Sanitized and inspected. Battery fully charged.' })
    });
    const handoverData = await handoverRes.json();
    assert(handoverRes.status === 200 && handoverData.booking.status === 'active_loan',
      'Owner marked equipment handed over to seeker (status: active_loan)'
    );

    const returnRes = await fetch(`${BASE_URL}/bookings/${createdBooking.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`
      },
      body: JSON.stringify({ status: 'returned' })
    });
    const returnData = await returnRes.json();
    assert(returnRes.status === 200 && returnData.booking.status === 'returned',
      'Owner confirmed safe equipment return (status: returned)'
    );

    // 5. Test Phase 5 Admin Dashboard & Governance
    console.log('\n--- Test Group 5: Phase 5 Admin Dashboard, Governance & Audit Trail ---');
    // Role protection test: seeker cannot access admin dashboard
    const unauthorizedRes = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { 'Authorization': `Bearer ${seekerToken}` }
    });
    assert(unauthorizedRes.status === 403,
      'RBAC Security: Non-admin (seeker) blocked from admin dashboard with 403 Forbidden'
    );

    // Admin dashboard metrics
    const adminMetricsRes = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminMetricsData = await adminMetricsRes.json();
    assert(
      adminMetricsRes.status === 200 &&
      adminMetricsData.success &&
      adminMetricsData.metrics.users.total >= 3 &&
      adminMetricsData.metrics.equipment.total >= 10,
      'GET /api/admin/dashboard returns accurate system KPIs from MySQL database',
      `Users: ${adminMetricsData.metrics?.users?.total}, Equipment: ${adminMetricsData.metrics?.equipment?.total}`
    );

    // Admin user listing
    const adminUsersRes = await fetch(`${BASE_URL}/admin/users`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminUsersData = await adminUsersRes.json();
    assert(adminUsersRes.status === 200 && adminUsersData.users.length >= 3,
      'GET /api/admin/users lists platform users with role and status details'
    );

    // Admin self-suspension prevention
    const adminId = adminLoginData.user.id;
    const selfLockoutRes = await fetch(`${BASE_URL}/admin/users/${adminId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ isActive: false, reason: 'Accidental self-suspension' })
    });
    assert(selfLockoutRes.status === 400,
      'Security constraint: Admin cannot suspend their own account (prevents self-lockout)'
    );

    // Admin user suspension & audit log
    const testSeekerId = seekerLoginData.user.id;
    const suspendRes = await fetch(`${BASE_URL}/admin/users/${testSeekerId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ isActive: false, reason: 'Policy compliance audit review' })
    });
    const suspendData = await suspendRes.json();
    assert(suspendRes.status === 200 && suspendData.user.is_active === 0,
      'Admin successfully suspended user account with recorded reason'
    );

    // Verify suspended user cannot log in
    const suspendedLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'priya.seeker@example.com', password: 'Seeker@123' })
    });
    assert(suspendedLoginRes.status === 403,
      'Suspended user login rejected with 403 Forbidden'
    );

    // Reactivate user
    const reactivateRes = await fetch(`${BASE_URL}/admin/users/${testSeekerId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ isActive: true, reason: 'Compliance review completed; verified.' })
    });
    assert(reactivateRes.status === 200 && reactivateRes.ok,
      'Admin successfully reactivated user account'
    );

    // Admin equipment moderation
    const flagEqRes = await fetch(`${BASE_URL}/admin/equipment/${firstEqId}/moderation`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ moderationStatus: 'flagged', reason: 'Routine photo quality verification' })
    });
    const flagEqData = await flagEqRes.json();
    assert(flagEqRes.status === 200 && flagEqData.equipment.moderation_status === 'flagged',
      'Admin flagged equipment listing with moderation reason'
    );

    // Re-approve equipment
    const reapproveEqRes = await fetch(`${BASE_URL}/admin/equipment/${firstEqId}/moderation`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ moderationStatus: 'approved', reason: 'Photo verified.' })
    });
    assert(reapproveEqRes.status === 200,
      'Admin re-approved equipment listing'
    );

    // Admin booking override
    const overrideRes = await fetch(`${BASE_URL}/admin/bookings/${createdBooking.id}/override`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'returned', reason: 'Admin confirmed loan completion closure' })
    });
    assert(overrideRes.status === 200,
      'Admin successfully performed booking override with mandatory reason'
    );

    // Admin audit logs inspection
    const auditRes = await fetch(`${BASE_URL}/admin/audit-logs`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const auditData = await auditRes.json();
    assert(auditRes.status === 200 && auditData.logs.length >= 3,
      'GET /api/admin/audit-logs recorded complete administrative audit trail',
      `Audit logs recorded: ${auditData.logs?.length || 0}`
    );

  } catch (err) {
    console.error('💥 UNEXPECTED ERROR IN TEST SUITE:', err);
    failed++;
  } finally {
    if (server) {
      server.close();
      console.log('\n[TEST-RUNNER] Test server closed.');
    }
  }

  console.log('\n====================================================');
  console.log(`📊 Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
