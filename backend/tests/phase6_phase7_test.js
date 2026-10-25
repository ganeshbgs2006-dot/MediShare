import app from '../src/app.js';
import { query } from '../src/config/db.js';
import { notificationModel } from '../src/models/notificationModel.js';
import { waitlistModel } from '../src/models/waitlistModel.js';
import { reviewModel } from '../src/models/reviewModel.js';

let server;
const PORT = 5097;
const BASE_URL = `http://127.0.0.1:${PORT}/api`;

async function runTests() {
  console.log('====================================================');
  console.log('🧪 MediShare: Phase 6 & Phase 7 Integration Test Suite');
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

    // 2. Authentication Tokens
    const seekerRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'priya.seeker@example.com', password: 'Seeker@123' })
    });
    const seekerData = await seekerRes.json();
    const seekerToken = seekerData.token;
    const seekerId = seekerData.user.id;

    const ownerRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'partner@stjude.org', password: 'Partner@123' })
    });
    const ownerData = await ownerRes.json();
    const ownerToken = ownerData.token;
    const ownerId = ownerData.user.id;

    const adminRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@medishare.org', password: 'Admin@123' })
    });
    const adminData = await adminRes.json();
    const adminToken = adminData.token;

    console.log('\n--- Test Group 1: Phase 6 In-App Notifications ---');
    // Notification creation via model
    const notifId = await notificationModel.create({
      userId: seekerId,
      type: 'test_notification',
      title: 'Welcome to MediShare Care',
      message: 'Your account is verified and ready to request assistive devices.',
      entityType: 'system'
    });
    assert(Boolean(notifId), 'notificationModel.create successfully inserted notification');

    // Duplicate prevention within 60s
    const duplicateNotifId = await notificationModel.create({
      userId: seekerId,
      type: 'test_notification',
      title: 'Welcome to MediShare Care',
      message: 'Your account is verified and ready to request assistive devices.',
      entityType: 'system'
    });
    assert(duplicateNotifId === notifId, 'Notification de-duplication prevented rapid duplicate insertion');

    // Retrieve unread count
    const unreadRes = await fetch(`${BASE_URL}/notifications/unread-count`, {
      headers: { 'Authorization': `Bearer ${seekerToken}` }
    });
    const unreadData = await unreadRes.json();
    assert(unreadRes.status === 200 && unreadData.count >= 1,
      'GET /api/notifications/unread-count returns accurate count of unread notifications',
      `Count: ${unreadData.count}`
    );

    // List notifications
    const listNotifRes = await fetch(`${BASE_URL}/notifications`, {
      headers: { 'Authorization': `Bearer ${seekerToken}` }
    });
    const listNotifData = await listNotifRes.json();
    assert(listNotifRes.status === 200 && listNotifData.notifications.length >= 1,
      'GET /api/notifications returns user notifications list'
    );

    // Cross-user authorization check: Owner cannot mark Seeker's notification as read
    const crossUserRes = await fetch(`${BASE_URL}/notifications/${notifId}/read`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${ownerToken}` }
    });
    assert(crossUserRes.status === 404,
      'Security RBAC: User cannot mark another user\'s notification as read (returns 404)'
    );

    // Mark as read by rightful recipient
    const markReadRes = await fetch(`${BASE_URL}/notifications/${notifId}/read`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${seekerToken}` }
    });
    const markReadData = await markReadRes.json();
    assert(markReadRes.status === 200 && markReadData.success,
      'PATCH /api/notifications/:id/read successfully marks notification as read'
    );

    // Mark all as read
    const markAllRes = await fetch(`${BASE_URL}/notifications/read-all`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${seekerToken}` }
    });
    assert(markAllRes.status === 200,
      'PATCH /api/notifications/read-all completes successfully'
    );

    console.log('\n--- Test Group 2: Phase 6 Reviews Workflow ---');
    // Find or create a completed returned booking
    const returnedBookings = await query(`
      SELECT b.id, b.equipment_id, b.seeker_id, e.owner_id 
      FROM bookings b 
      JOIN equipment e ON b.equipment_id = e.id 
      WHERE b.status = 'returned' 
      LIMIT 1
    `);
    let targetBooking;
    if (returnedBookings.length > 0) {
      targetBooking = returnedBookings[0];
    } else {
      // Create a completed booking for testing
      const ref = `BK-REV-TEST-${Date.now().toString(36).toUpperCase()}`;
      const insRes = await query(`
        INSERT INTO bookings (booking_reference, equipment_id, seeker_id, start_date, end_date, status, total_price)
        VALUES (?, 1, ?, '2026-10-01', '2026-10-05', 'returned', 0.00)
      `, [ref, seekerId]);
      targetBooking = { id: insRes.insertId, equipment_id: 1, seeker_id: seekerId, owner_id: 2 };
    }

    // Clean any prior test review on this target booking
    await query(`DELETE FROM reviews WHERE booking_id = ?`, [targetBooking.id]);

    // Submit review by seeker
    const createRevRes = await fetch(`${BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seekerToken}`
      },
      body: JSON.stringify({
        bookingId: targetBooking.id,
        rating: 5,
        comment: 'Wheelchair was clean, smooth-rolling, and immensely helpful during physical therapy.'
      })
    });
    const createRevData = await createRevRes.json();
    assert(createRevRes.status === 201 && createRevData.success && createRevData.review.rating === 5,
      'POST /api/reviews submitted verified review for returned loan'
    );

    // Prevent duplicate review for the same booking
    const dupRevRes = await fetch(`${BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seekerToken}`
      },
      body: JSON.stringify({
        bookingId: targetBooking.id,
        rating: 4,
        comment: 'Second review attempt'
      })
    });
    assert(dupRevRes.status === 409,
      'POST /api/reviews prevents duplicate reviews for the same completed booking with 409 Conflict'
    );

    // Verify rating summary from real database records
    const eqRevRes = await fetch(`${BASE_URL}/reviews/equipment/${targetBooking.equipment_id}`);
    const eqRevData = await eqRevRes.json();
    assert(
      eqRevRes.status === 200 &&
      eqRevData.success &&
      eqRevData.summary.totalReviews >= 1 &&
      eqRevData.summary.averageRating > 0,
      'GET /api/reviews/equipment/:id calculates real average rating and review breakdown',
      `Average: ${eqRevData.summary?.averageRating}`
    );

    // Admin review moderation
    const adminRevListRes = await fetch(`${BASE_URL}/reviews/admin/all`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminRevListData = await adminRevListRes.json();
    assert(adminRevListRes.status === 200 && adminRevListData.reviews.length >= 1,
      'GET /api/reviews/admin/all lists reviews for administrator moderation'
    );

    const testRevId = createRevData.review.id;
    const modRevRes = await fetch(`${BASE_URL}/reviews/admin/${testRevId}/moderation`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ moderationStatus: 'flagged', reason: 'Routine review audit' })
    });
    assert(modRevRes.status === 200,
      'PATCH /api/reviews/admin/:id/moderation updates review moderation state with audit trail'
    );

    // Re-approve review
    await fetch(`${BASE_URL}/reviews/admin/${testRevId}/moderation`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ moderationStatus: 'approved', reason: 'Audit verified.' })
    });

    console.log('\n--- Test Group 3: Phase 6 Waitlist Workflow ---');
    // Join waitlist for equipment 2
    const joinWaitRes = await fetch(`${BASE_URL}/waitlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seekerToken}`
      },
      body: JSON.stringify({
        equipmentId: 2,
        notes: 'Need this wheelchair once current patient finishes loan.'
      })
    });
    const joinWaitData = await joinWaitRes.json();
    assert(joinWaitRes.status === 200 && joinWaitData.success && joinWaitData.queuePosition >= 1,
      'POST /api/waitlist adds seeker to priority equipment queue with FIFO position',
      `Queue position: ${joinWaitData.queuePosition}`
    );

    // Duplicate waitlist attempt returns existing entry without creating duplicate row
    const dupWaitRes = await fetch(`${BASE_URL}/waitlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seekerToken}`
      },
      body: JSON.stringify({ equipmentId: 2 })
    });
    const dupWaitData = await dupWaitRes.json();
    assert(dupWaitData.entry.alreadyWaitlisted === true,
      'Waitlist duplicate prevention detects existing active entry'
    );

    // Check waitlist status endpoint
    const statusWaitRes = await fetch(`${BASE_URL}/waitlist/equipment/2/status`, {
      headers: { 'Authorization': `Bearer ${seekerToken}` }
    });
    const statusWaitData = await statusWaitRes.json();
    assert(statusWaitRes.status === 200 && statusWaitData.isWaitlisted === true,
      'GET /api/waitlist/equipment/:id/status returns accurate user queue state'
    );

    // Waitlist notification trigger: notify waitlisted seekers when equipment becomes available
    const notifiedCount = await waitlistModel.notifyEligibleWaitlist(2);
    assert(notifiedCount >= 1,
      'waitlistModel.notifyEligibleWaitlist dispatches in-app notification to queued seeker',
      `Notified: ${notifiedCount}`
    );

    // Leave waitlist
    const leaveWaitRes = await fetch(`${BASE_URL}/waitlist/equipment/2`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${seekerToken}` }
    });
    assert(leaveWaitRes.status === 200,
      'DELETE /api/waitlist/equipment/:id safely removes seeker from waitlist'
    );

    console.log('\n--- Test Group 4: Phase 7 Admin Analytics, Queues & CSV Reporting ---');
    // Filtered Analytics Dashboard
    const analytics7dRes = await fetch(`${BASE_URL}/admin/dashboard?range=7d`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const analytics7dData = await analytics7dRes.json();
    assert(
      analytics7dRes.status === 200 &&
      analytics7dData.metrics.operational !== undefined &&
      analytics7dData.metrics.trends.users !== undefined,
      'GET /api/admin/dashboard?range=7d returns operational stats and daily trend timeseries'
    );

    // Operational Queues
    const queuesRes = await fetch(`${BASE_URL}/admin/queues`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const queuesData = await queuesRes.json();
    assert(
      queuesRes.status === 200 &&
      Array.isArray(queuesData.queues.overdueReturns) &&
      Array.isArray(queuesData.queues.openDisputes) &&
      Array.isArray(queuesData.queues.pendingEquipment),
      'GET /api/admin/queues aggregates actionable work queues (overdue loans, disputes, pending moderation)'
    );

    // Secure CSV Export: Bookings Report
    const exportBookingsRes = await fetch(`${BASE_URL}/admin/reports/export?type=bookings`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const exportBookingsText = await exportBookingsRes.text();
    assert(
      exportBookingsRes.status === 200 &&
      exportBookingsRes.headers.get('content-type').includes('text/csv') &&
      exportBookingsText.includes('Booking Ref'),
      'GET /api/admin/reports/export?type=bookings generates valid sanitized CSV stream'
    );

    // CSV Export: Users Report (must NEVER contain password_hash or jwt)
    const exportUsersRes = await fetch(`${BASE_URL}/admin/reports/export?type=users`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const exportUsersText = await exportUsersRes.text();
    assert(
      exportUsersRes.status === 200 &&
      !exportUsersText.includes('password_hash') &&
      !exportUsersText.includes('$2a$') &&
      exportUsersText.includes('Full Name'),
      'Security: User CSV export strictly excludes password hashes and authentication credentials'
    );

    // RBAC: Seeker blocked from CSV export
    const forbiddenExportRes = await fetch(`${BASE_URL}/admin/reports/export?type=users`, {
      headers: { 'Authorization': `Bearer ${seekerToken}` }
    });
    assert(forbiddenExportRes.status === 403,
      'RBAC: Non-admin user blocked from data export with 403 Forbidden'
    );

    console.log('\n--- Test Group 5: Phase 7 & 8 Security, Health & Reminders ---');
    // Health endpoint with system metrics
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(
      healthRes.status === 200 &&
      healthData.status === 'healthy' &&
      healthData.memory !== undefined &&
      healthData.database.connected === true,
      'GET /api/health provides system uptime, memory, and database health'
    );

    // Security headers verification
    const secHeaders = healthRes.headers;
    assert(
      secHeaders.get('x-content-type-options') === 'nosniff' &&
      secHeaders.get('x-frame-options') === 'SAMEORIGIN' &&
      secHeaders.get('x-powered-by') === null,
      'Security Headers: nosniff, SAMEORIGIN, and removal of X-Powered-By verified'
    );

    // Scheduled reminders trigger
    const remindersRes = await fetch(`${BASE_URL}/admin/reminders/run`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const remindersData = await remindersRes.json();
    assert(remindersRes.status === 200 && remindersData.results !== undefined,
      'POST /api/admin/reminders/run evaluates automated loan reminders and return notices'
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
