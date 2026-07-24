/**
 * Structured security audit logging — stdout JSON for log aggregators.
 * Never logs passwords, session cookies, or env secrets.
 */

export type SecurityAuditEvent =
  | "login_success"
  | "login_failure"
  | "logout"
  | "revoke_session"
  | "revoke_all_sessions"
  | "rate_limit_exceeded"
  | "auth_failed"
  | "authorization_failure";

type AuditPayload = {
  event: SecurityAuditEvent;
  correlationId?: string;
  ip?: string;
  username?: string;
  path?: string;
  method?: string;
  detail?: string;
  retryAfterSec?: number;
};

function sanitizeDetail(detail: string | undefined): string | undefined {
  if (!detail) return undefined;
  return detail
    .replace(/password[=:]\s*\S+/gi, "password=[redacted]")
    .replace(/bearer\s+\S+/gi, "bearer [redacted]")
    .slice(0, 300);
}

export function securityAudit(payload: AuditPayload): void {
  const line = {
    type: "security_audit",
    ts: new Date().toISOString(),
    event: payload.event,
    correlationId: payload.correlationId,
    ip: payload.ip,
    username: payload.username ? payload.username.slice(0, 64) : undefined,
    path: payload.path,
    method: payload.method,
    detail: sanitizeDetail(payload.detail),
    retryAfterSec: payload.retryAfterSec,
  };

  console.info(JSON.stringify(line));
}
