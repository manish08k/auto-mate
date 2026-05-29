const jwt = require("jsonwebtoken");
const { ApiResponse } = require("../utils/apiResponse");
const logger = require("../utils/logger");

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Verifies JWT from Authorization header.
 * Attaches decoded user payload to req.user on success.
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json(ApiResponse.error("Authorization token missing or malformed", 401));
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, plan, iat, exp }

    next();
  } catch (err) {
    logger.warn(`Auth middleware failed: ${err.message}`);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json(ApiResponse.error("Token has expired", 401));
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json(ApiResponse.error("Invalid token", 401));
    }

    return res.status(401).json(ApiResponse.error("Authentication failed", 401));
  }
};

/**
 * Optional auth — attaches user if token present, but doesn't block if missing.
 * Useful for public routes that behave differently for logged-in users.
 */
const optionalAuthenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      req.user = jwt.verify(token, JWT_SECRET);
    }
  } catch (_) {
    // silently ignore — no user attached
  }
  next();
};

/**
 * Role/plan guard — use after authenticate().
 * Example: requirePlan("pro", "enterprise")
 */
const requirePlan = (...allowedPlans) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(ApiResponse.error("Not authenticated", 401));
    }
    if (!allowedPlans.includes(req.user.plan)) {
      return res
        .status(403)
        .json(ApiResponse.error(`This feature requires a ${allowedPlans.join(" or ")} plan`, 403));
    }
    next();
  };
};

module.exports = { authenticate, optionalAuthenticate, requirePlan };