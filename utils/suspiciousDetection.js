import { logSecurityEvent } from '../models/auditModel.js';

// Call this after each login attempt
export async function detectSuspiciousLogin({ user_id, email, ip_address, success }) {
  // 1. Multiple failed logins from same IP
  const { rows } = await db.query(
    `SELECT COUNT(*) FROM security_events WHERE event_type='failed_login' AND ip_address=$1 AND created_at > NOW() - INTERVAL '10 minutes'`,
    [ip_address]
  );
  if (parseInt(rows[0].count, 10) > 5) {
    await logSecurityEvent({
      user_id, event_type: 'suspicious_login_attempt', details: `>5 failed attempts from IP ${ip_address}`, ip_address
    });
  }
  // 2. Login from new country/device (requires geo IP + user agent tracking)
  // ...implement as needed
}