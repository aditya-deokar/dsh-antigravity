/**
 * Text helpers shared by the host adapter and the test suite.
 *
 * These functions deliberately have no DSH imports so they can be tested on a
 * plain Node.js runtime.
 */

/**
 * Replace only unpaired UTF-16 surrogate code units.
 *
 * JavaScript represents supplementary Unicode characters (including most
 * emoji) as valid high/low surrogate pairs. Replacing every surrogate code
 * unit corrupts those characters, so use the platform's well-formedness
 * normalization instead.
 *
 * @param {unknown} text
 * @returns {string}
 */
export function sanitizeText(text) {
  const value = String(text ?? "");
  return typeof value.toWellFormed === "function" ? value.toWellFormed() : value;
}

/**
 * Mask an email address for display. The full address is never needed in a
 * screenshot, a log, or a support report.
 *
 * @param {unknown} email
 * @returns {string}
 */
export function maskEmail(email) {
  const value = String(email ?? "").trim();
  const at = value.indexOf("@");
  if (at <= 0) return value;
  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(1, local.length - visible.length))}@${domain}`;
}

/**
 * Redact common credential shapes from diagnostic text.
 *
 * @param {unknown} text
 * @returns {string}
 */
export function redactSecrets(text) {
  return String(text)
    .replace(/\bya29\.[A-Za-z0-9._~+/-]+=*/g, "[redacted-access-token]")
    .replace(/\b1\/[A-Za-z0-9_-]{20,}/g, "[redacted-refresh-token]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi, "Bearer [redacted]")
    .replace(
      /("?(?:access_token|refresh_token|id_token|token|client_secret|code_verifier|authorization)"?\s*[:=]\s*")[^"]*(")/gi,
      "$1[redacted]$2",
    )
    .replace(
      /("?(?:access_token|refresh_token|id_token|token|client_secret|code_verifier|authorization)"?\s*[:=]\s*)[^\s&,}]+/gi,
      "$1[redacted]",
    );
}

/**
 * Parse JSON without throwing, for untrusted HTTP bodies.
 *
 * @param {unknown} text
 * @returns {unknown}
 */
export function safeJsonParse(text) {
  try {
    return JSON.parse(String(text));
  } catch {
    return undefined;
  }
}
