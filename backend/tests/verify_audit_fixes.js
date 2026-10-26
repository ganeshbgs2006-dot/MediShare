import app from '../src/app.js';
import { query } from '../src/config/db.js';

let server;
const PORT = 5099;
const BASE_URL = `http://127.0.0.1:${PORT}/api`;

async function runAuditFixesTests() {
  console.log('================================================================');
  console.log('🧪 MediShare: Comprehensive Audit Report Fixes Verification Suite');
  console.log('================================================================\n');

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
    // Start Test Server
    await new Promise((resolve) => {
      server = app.listen(PORT, '127.0.0.1', () => {
        console.log(`[TEST-RUNNER] Express server listening at ${BASE_URL}`);
        resolve();
      });
    });

    const timestamp = Date.now();

    // -------------------------------------------------------------
    // Test 1: SEC-001 - Block Privilege Escalation during registration
    // -------------------------------------------------------------
    console.log('\n--- 1. SEC-001: Privilege Escalation Prevention ---');
    const adminEscalationRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Attacker Impersonator',
        email: `attacker_${timestamp}@medishare.org`,
        password: 'Password123!',
        role: 'admin'
      })
    });
    const adminEscalationData = await adminEscalationRes.json();
    assert(
      adminEscalationRes.status === 400 && adminEscalationData.error?.toLowerCase().includes('seeker'),
      'POST /api/auth/register with role="admin" is strictly blocked with HTTP 400',
      JSON.stringify(adminEscalationData)
    );

    // -------------------------------------------------------------
    // Test 2: ROLE-001 - Owner Registration defaults to pending approval
    // -------------------------------------------------------------
    console.log('\n--- 2. ROLE-001: Owner Approval Workflow ---');
    const ownerEmail = `newpartner_${timestamp}@medishare.org`;
    const ownerPassword = 'Password123!';
    const ownerRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'New Care Partner Clinic',
        email: ownerEmail,
        password: ownerPassword,
        role: 'owner',
        organizationName: 'New Care Foundation',
        serviceArea: 'North Metro Health Zone'
      })
    });
    const ownerRegData = await ownerRegRes.json();
    assert(
      ownerRegRes.status === 201 && ownerRegData.success && ownerRegData.user.approvalStatus === 'pending',
      'POST /api/auth/register with role="owner" creates account with approvalStatus="pending"',
      JSON.stringify(ownerRegData)
    );

    const pendingOwnerToken = ownerRegData.token;
    const pendingOwnerId = ownerRegData.user.id;

    // -------------------------------------------------------------
    // Test 3: EQUIP-001 / ROLE-001 - Pending Owner cannot list equipment
    // -------------------------------------------------------------
    console.log('\n--- 3. EQUIP-001: Pending Owner Listing Protection ---');
    const pendingCreateRes = await fetch(`${BASE_URL}/equipment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pendingOwnerToken}`
      },
      body: JSON.stringify({
        name: 'Unverified Partner Wheelchair',
        category: 'Wheelchairs',
        description: 'Testing unverified listing creation block.',
        serviceArea: 'North Metro Health Zone',
        sharingType: 'free',
        conditionGrade: 'Good'
      })
    });
    const pendingCreateData = await pendingCreateRes.json();
    assert(
      pendingCreateRes.status === 403 && pendingCreateData.code === 'ACCOUNT_PENDING_APPROVAL',
      'POST /api/equipment by pending owner is blocked with HTTP 403 ACCOUNT_PENDING_APPROVAL',
      JSON.stringify(pendingCreateData)
    );

    // -------------------------------------------------------------
    // Test 4: ADMIN-001 - Admin lists and approves the owner
    // -------------------------------------------------------------
    console.log('\n--- 4. ADMIN-001: Admin Partner Vetting & Approval ---');
    // Login as Admin
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@medishare.org',
        password: 'Admin@123'
      })
    });
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData.token;
    assert(adminLoginRes.status === 200 && adminLoginData.user.role === 'admin', 'Admin logged in successfully');

    // Get pending owners queue
    const pendingOwnersRes = await fetch(`${BASE_URL}/admin/owners/pending`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const pendingOwnersData = await pendingOwnersRes.json();
    assert(
      pendingOwnersRes.status === 200 && pendingOwnersData.owners.some((o) => Number(o.id) === Number(pendingOwnerId)),
      'GET /api/admin/owners/pending includes newly registered pending partner'
    );

    // Approve the owner
    const approveOwnerRes = await fetch(`${BASE_URL}/admin/users/${pendingOwnerId}/approval`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        approvalStatus: 'approved',
        reason: 'Verified healthcare organization registration certificates.'
      })
    });
    const approveOwnerData = await approveOwnerRes.json();
    assert(
      approveOwnerRes.status === 200 && approveOwnerData.user.approval_status === 'approved',
      'PATCH /api/admin/users/:id/approval successfully approves partner account'
    );

    // -------------------------------------------------------------
    // Test 5: Approved Owner can now create equipment
    // -------------------------------------------------------------
    console.log('\n--- 5. Approved Owner Equipment Creation & Media ---');
    // Re-login as owner to refresh profile
    const ownerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ownerEmail,
        password: ownerPassword
      })
    });
    const ownerLoginData = await ownerLoginRes.json();
    const approvedOwnerToken = ownerLoginData.token;
    assert(ownerLoginData.user.approvalStatus === 'approved', 'Owner profile shows approvalStatus="approved"');

    const createEqRes = await fetch(`${BASE_URL}/equipment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${approvedOwnerToken}`
      },
      body: JSON.stringify({
        name: 'MediShare Verified Heavy-Duty Wheelchair',
        category: 'Wheelchairs',
        description: 'Dual crossbrace steel frame with swing-away footrests, sanitized and ready.',
        serviceArea: 'North Metro Health Zone',
        sharingType: 'free',
        conditionGrade: 'Good',
        conditionDetails: 'Frame rigid, parking handbrakes hold firmly.',
        imageUrl: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80',
        videoUrl: '/uploads/videos/test-listing-walkthrough.mp4',
        gallery: [
          'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&w=800&q=80'
        ]
      })
    });
    const createEqData = await createEqRes.json();
    assert(
      createEqRes.status === 201 && createEqData.success && createEqData.equipment.name === 'MediShare Verified Heavy-Duty Wheelchair' && createEqData.equipment.video_url === '/uploads/videos/test-listing-walkthrough.mp4',
      'POST /api/equipment by approved owner succeeds and persists video_url'
    );
    const newEquipmentId = createEqData.equipment.id;

    // Verify GET /api/equipment/:id returns video_url
    const getEqRes = await fetch(`${BASE_URL}/equipment/${newEquipmentId}`);
    const getEqData = await getEqRes.json();
    assert(
      getEqRes.status === 200 && getEqData.equipment.video_url === '/uploads/videos/test-listing-walkthrough.mp4',
      'GET /api/equipment/:id returns equipment demonstration video_url'
    );

    // -------------------------------------------------------------
    // Test 6: Seeker books the equipment
    // -------------------------------------------------------------
    console.log('\n--- 6. Seeker Booking Workflow ---');
    const seekerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'priya.seeker@example.com',
        password: 'Seeker@123'
      })
    });
    const seekerLoginData = await seekerLoginRes.json();
    const seekerToken = seekerLoginData.token;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 5);

    const bookRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${seekerToken}`
      },
      body: JSON.stringify({
        equipmentId: newEquipmentId,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        seekerMessage: 'Rehabilitation support for family member.'
      })
    });
    const bookData = await bookRes.json();
    assert(bookRes.status === 201 && bookData.success, 'POST /api/bookings successfully requests loan');
    const bookingId = bookData.booking.id;

    // Owner approves and starts active loan
    await fetch(`${BASE_URL}/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${approvedOwnerToken}`
      },
      body: JSON.stringify({ status: 'approved' })
    });

    const handoverRes = await fetch(`${BASE_URL}/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${approvedOwnerToken}`
      },
      body: JSON.stringify({ status: 'active_loan', handoverNotes: 'Sanitized and inspected with borrower.' })
    });
    const handoverData = await handoverRes.json();
    assert(handoverRes.status === 200 && handoverData.booking.status === 'active_loan', 'Booking transition to active_loan succeeds');

    // -------------------------------------------------------------
    // Test 7: RETURN-001 - Enforce Dual Return Video Requirement
    // -------------------------------------------------------------
    console.log('\n--- 7. RETURN-001 & INSPECT-001: Dual Return Video Verification ---');
    // Attempting return without any video
    const prematureReturnRes = await fetch(`${BASE_URL}/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${approvedOwnerToken}`
      },
      body: JSON.stringify({ status: 'returned' })
    });
    const prematureReturnData = await prematureReturnRes.json();
    assert(
      prematureReturnRes.status === 400 && prematureReturnData.code === 'RETURN_VIDEOS_REQUIRED',
      'Attempting return without videos is blocked with HTTP 400 RETURN_VIDEOS_REQUIRED',
      JSON.stringify(prematureReturnData)
    );

    // Seeker records & submits return video
    const seekerVideoRes = await fetch(`${BASE_URL}/bookings/${bookingId}/return-inspection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${seekerToken}`
      },
      body: JSON.stringify({
        videoUrl: '/uploads/videos/return-seeker-evidence-test.webm',
        notes: 'Equipment thoroughly sanitized, folded and wheels intact.',
        conditionGrade: 'Good'
      })
    });
    const seekerVideoData = await seekerVideoRes.json();
    assert(
      seekerVideoRes.status === 200 && seekerVideoData.booking.seeker_return_video_url,
      'POST /api/bookings/:id/return-inspection succeeds for seeker'
    );

    // Attempting return with ONLY seeker video still blocked
    const partialReturnRes = await fetch(`${BASE_URL}/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${approvedOwnerToken}`
      },
      body: JSON.stringify({ status: 'returned' })
    });
    const partialReturnData = await partialReturnRes.json();
    assert(
      partialReturnRes.status === 400 && partialReturnData.code === 'RETURN_VIDEOS_REQUIRED' && partialReturnData.missingOwnerVideo === true,
      'Attempting return with only seeker video is still blocked (owner video required)',
      JSON.stringify(partialReturnData)
    );

    // Owner records & submits return video
    const ownerVideoRes = await fetch(`${BASE_URL}/bookings/${bookingId}/return-inspection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${approvedOwnerToken}`
      },
      body: JSON.stringify({
        videoUrl: '/uploads/videos/return-owner-evidence-test.webm',
        notes: 'Handover received. Brakes and frame checked and verified in Good order.',
        conditionGrade: 'Good'
      })
    });
    const ownerVideoData = await ownerVideoRes.json();
    assert(
      ownerVideoRes.status === 200 && ownerVideoData.booking.owner_return_video_url && ownerVideoData.booking.return_status === 'both_submitted',
      'POST /api/bookings/:id/return-inspection succeeds for owner with return_status="both_submitted"'
    );

    // Now final return succeeds!
    const finalReturnRes = await fetch(`${BASE_URL}/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${approvedOwnerToken}`
      },
      body: JSON.stringify({ status: 'returned', handoverNotes: 'Physical return completed and verified.' })
    });
    const finalReturnData = await finalReturnRes.json();
    assert(
      finalReturnRes.status === 200 && finalReturnData.booking.status === 'returned',
      'PATCH /api/bookings/:id/status -> "returned" succeeds when BOTH return videos are present'
    );

    console.log('\n================================================================');
    console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('================================================================\n');

  } catch (err) {
    console.error('Test Suite encountered an unexpected error:', err);
  } finally {
    if (server) {
      server.close();
    }
    process.exit(failed > 0 ? 1 : 0);
  }
}

runAuditFixesTests();
