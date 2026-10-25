import { query } from '../config/db.js';
import { notificationModel } from '../models/notificationModel.js';

export const reminderService = {
  /**
   * Run automated check for upcoming handovers, returns, and overdue loans
   */
  async runScheduledReminders() {
    const results = {
      handoverReminders: 0,
      returnReminders: 0,
      overdueAlerts: 0
    };

    try {
      // 1. Upcoming Handover (start_date is today or tomorrow, status = approved)
      const handoverSql = `
        SELECT 
          b.id,
          b.booking_reference,
          b.seeker_id,
          b.start_date,
          e.name AS equipment_name
        FROM bookings b
        JOIN equipment e ON b.equipment_id = e.id
        WHERE b.status = 'approved'
          AND b.start_date <= CURDATE() + INTERVAL 1 DAY
          AND b.start_date >= CURDATE()
      `;
      const handoverBookings = await query(handoverSql);
      for (const b of handoverBookings) {
        const notifId = await notificationModel.create({
          userId: b.seeker_id,
          type: 'reminder_upcoming_handover',
          title: 'Upcoming Equipment Handover',
          message: `Reminder: Loan for "${b.equipment_name}" (Ref: ${b.booking_reference}) is scheduled to start on ${b.start_date}. Coordinate pickup with your partner.`,
          entityType: 'booking',
          entityId: b.id
        });
        if (notifId) results.handoverReminders++;
      }

      // 2. Upcoming Return (end_date is today or tomorrow, status = active_loan)
      const returnSql = `
        SELECT 
          b.id,
          b.booking_reference,
          b.seeker_id,
          b.end_date,
          e.name AS equipment_name
        FROM bookings b
        JOIN equipment e ON b.equipment_id = e.id
        WHERE b.status = 'active_loan'
          AND b.end_date <= CURDATE() + INTERVAL 1 DAY
          AND b.end_date >= CURDATE()
      `;
      const returnBookings = await query(returnSql);
      for (const b of returnBookings) {
        const notifId = await notificationModel.create({
          userId: b.seeker_id,
          type: 'reminder_upcoming_return',
          title: 'Equipment Return Due Soon',
          message: `Reminder: Loan period for "${b.equipment_name}" concludes on ${b.end_date}. Please prepare for return inspection.`,
          entityType: 'booking',
          entityId: b.id
        });
        if (notifId) results.returnReminders++;
      }

      // 3. Overdue Loans (end_date < CURDATE(), status = active_loan)
      const overdueSql = `
        SELECT 
          b.id,
          b.booking_reference,
          b.seeker_id,
          b.end_date,
          e.name AS equipment_name
        FROM bookings b
        JOIN equipment e ON b.equipment_id = e.id
        WHERE b.status = 'active_loan'
          AND b.end_date < CURDATE()
      `;
      const overdueBookings = await query(overdueSql);
      for (const b of overdueBookings) {
        const notifId = await notificationModel.create({
          userId: b.seeker_id,
          type: 'alert_loan_overdue',
          title: 'Equipment Loan Overdue',
          message: `Notice: The agreed return date (${b.end_date}) for "${b.equipment_name}" has passed. Please contact the owner or coordinate return immediately.`,
          entityType: 'booking',
          entityId: b.id
        });
        if (notifId) results.overdueAlerts++;
      }

      return results;
    } catch (err) {
      console.error('[REMINDER SERVICE] Error running scheduled reminders:', err.message);
      return results;
    }
  }
};

export default reminderService;
