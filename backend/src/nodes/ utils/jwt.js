const jwt = require("jsonwebtoken");

const {
  JWT_SECRET,
  JWT_ACCESS_EXPIRY   = "15m",
  JWT_REFRESH_EXPIRY  = "7d",
  JWT_ISSUER          = "flowapp",
} = process.env;

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET env var is required. " +
    "Generate one with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
  );
}

// ─── Token Types ──────────────────────────────────────────────────

const TOKEN_TYPES = {
  ACCESS:        "access",
  REFRESH:       "refresh",
  EMAIL_VERIFY:  "email_verify",
  PASSWORD_RESET:"password_reset",
};

// ─── Generate Tokens ──────────────────────────────────────────────

/**
 * Generate a short-lived access token.
 *
 * @param {object} payload  - { id, email, plan }
 * @returns {string}        - signed JWT
 */
const generateAccessToken = (payload) => {
  return jwt.sign(
    {
      id:    payload.id,
      email: payload.email,
      plan:  payload.plan ?? "free",
      type:  TOKEN_TYPES.ACCESS,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_ACCESS_EXPIRY,
      issuer:    JWT_ISSUER,
    }
  );
};

/**
 * Generate a long-lived refresh token.
 * Store the hash of this in the DB — never the raw token.
 *
 * @param {object} payload  - { id }
 * @returns {string}        - signed JWT
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(
    {
      id:   payload.id,
      type: TOKEN_TYPES.REFRESH,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_REFRESH_EXPIRY,
      issuer:    JWT_ISSUER,
    }
  );
};

/**
 * Generate a short-lived one-use token (email verify, password reset).
 *
 * @param {object} payload      - { id, email }
 * @param {string} type         - TOKEN_TYPES.EMAIL_VERIFY | TOKEN_TYPES.PASSWORD_RESET
 * @param {string} [expiry]     - default "1h"
 * @returns {string}
 */
const generateOtpToken = (payload, type, expiry = "1h") => {
  return jwt.sign(
    { id: payload.id, email: payload.email, type },
    JWT_SECRET,
    { expiresIn: expiry, issuer: JWT_ISSUER }
  );
};

/**
 * Convenience: generate both access + refresh tokens together.
 *
 * @param   {object} user  - User model instance or plain { id, email, plan }
 * @returns {{ accessToken, refreshToken }}
 */
const generateTokenPair = (user) => {
  const accessToken  = generateAccessToken({
    id:    user.id,
    email: user.email,
    plan:  user.plan?.name ?? user.plan ?? "free",
  });
  const refreshToken = generateRefreshToken({ id: user.id });
  return { accessToken, refreshToken };
};

// ─── Verify Tokens ────────────────────────────────────────────────

/**
 * Verify and decode any JWT issued by this app.
 *
 * @param   {string} token
 * @returns {object}        decoded payload
 * @throws  {JsonWebTokenError | TokenExpiredError}
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET, { issuer: JWT_ISSUER });
};

/**
 * Verify and assert token is of the expected type.
 *
 * @param   {string} token
 * @param   {string} expectedType  - one of TOKEN_TYPES
 * @returns {object}               decoded payload
 * @throws  if type mismatch or invalid
 */
const verifyTokenOfType = (token, expectedType) => {
  const decoded = verifyToken(token);
  if (decoded.type !== expectedType) {
    const err = new Error(`Invalid token type: expected "${expectedType}", got "${decoded.type}"`);
    err.name  = "JsonWebTokenError";
    throw err;
  }
  return decoded;
};

/**
 * Decode without verifying signature.
 * Use only for reading non-sensitive info (e.g. extracting user ID before full verify).
 *
 * @param   {string} token
 * @returns {object | null}
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Check if a token is expired without throwing.
 *
 * @param   {string} token
 * @returns {boolean}
 */
const isTokenExpired = (token) => {
  try {
    jwt.verify(token, JWT_SECRET);
    return false;
  } catch (err) {
    return err.name === "TokenExpiredError";
  }
};

// ─── Cookie Options ───────────────────────────────────────────────

/**
 * Standard secure cookie options for the refresh token cookie.
 * Use with res.cookie("refreshToken", token, cookieOptions())
 */
const refreshCookieOptions = () => ({
  httpOnly: true,
  secure:   process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path:     "/api/auth",              // only sent to auth endpoints
});

module.exports = {
  TOKEN_TYPES,
  generateAccessToken,
  generateRefreshToken,
  generateOtpToken,
  generateTokenPair,
  verifyToken,
  verifyTokenOfType,
  decodeToken,
  isTokenExpired,
  refreshCookieOptions,
};
