// ─── Response Shape ───────────────────────────────────────────────
//
//  Success:  { success: true,  data: <any>,   message: "...", meta?: {...} }
//  Error:    { success: false, error: "...",  code: 4xx|5xx, details?: any }
//  Paginated:{ success: true,  data: [...],   message: "...", pagination: {...} }
//

class ApiResponse {

  // ─── Success ──────────────────────────────────────────────────

  /**
   * 200 OK
   * @param {any}    data
   * @param {string} [message]
   * @param {object} [meta]     - extra top-level fields (e.g. { token })
   */
  static success(data = null, message = "Success", meta = {}) {
    return {
      success: true,
      message,
      data,
      ...meta,
    };
  }

  /**
   * 201 Created — use with res.status(201).json(ApiResponse.created(...))
   */
  static created(data = null, message = "Created successfully") {
    return ApiResponse.success(data, message);
  }

  /**
   * Paginated list response.
   *
   * @param {Array}  data
   * @param {object} pagination  - { page, limit, total, totalPages }
   * @param {string} [message]
   */
  static paginated(data, pagination, message = "Success") {
    return {
      success: true,
      message,
      data,
      pagination: {
        page:        pagination.page,
        limit:       pagination.limit,
        total:       pagination.total,
        totalPages:  pagination.totalPages ?? Math.ceil(pagination.total / pagination.limit),
        hasNextPage: pagination.page < Math.ceil(pagination.total / pagination.limit),
        hasPrevPage: pagination.page > 1,
      },
    };
  }

  // ─── Errors ───────────────────────────────────────────────────

  /**
   * Generic error response.
   *
   * @param {string}  message
   * @param {number}  [code=400]
   * @param {any}     [details]   - validation errors, stack trace in dev, etc.
   */
  static error(message = "Something went wrong", code = 400, details = undefined) {
    const body = {
      success: false,
      code,
      error:   message,
    };
    if (details !== undefined) body.details = details;
    return body;
  }

  /** 400 Bad Request */
  static badRequest(message = "Bad request", details = undefined) {
    return ApiResponse.error(message, 400, details);
  }

  /** 401 Unauthorized */
  static unauthorized(message = "Unauthorized") {
    return ApiResponse.error(message, 401);
  }

  /** 403 Forbidden */
  static forbidden(message = "You do not have permission to perform this action") {
    return ApiResponse.error(message, 403);
  }

  /** 404 Not Found */
  static notFound(resource = "Resource") {
    return ApiResponse.error(`${resource} not found`, 404);
  }

  /** 409 Conflict */
  static conflict(message = "Conflict") {
    return ApiResponse.error(message, 409);
  }

  /** 422 Validation Error — accepts field-level errors array */
  static validationError(errors) {
    return ApiResponse.error("Validation failed", 422, errors);
  }

  /** 429 Rate Limited */
  static tooManyRequests(message = "Too many requests. Please slow down.") {
    return ApiResponse.error(message, 429);
  }

  /** 500 Internal Server Error */
  static serverError(message = "An unexpected error occurred", details = undefined) {
    return ApiResponse.error(message, 500, details);
  }
}

// ─── Express res helper (optional mixin) ──────────────────────────
//
// Call attachToResponse(res) in a middleware to add shorthand methods:
//   res.ok(data)  |  res.created(data)  |  res.fail(msg, 400)
//
// Usage in app.js:
//   app.use((req, res, next) => { attachToResponse(res); next(); });

const attachToResponse = (res) => {
  res.ok = (data, message, meta) =>
    res.status(200).json(ApiResponse.success(data, message, meta));

  res.created = (data, message) =>
    res.status(201).json(ApiResponse.created(data, message));

  res.paginate = (data, pagination, message) =>
    res.status(200).json(ApiResponse.paginated(data, pagination, message));

  res.fail = (message, code = 400, details) =>
    res.status(code).json(ApiResponse.error(message, code, details));

  res.notFound = (resource) =>
    res.status(404).json(ApiResponse.notFound(resource));

  res.forbidden = (message) =>
    res.status(403).json(ApiResponse.forbidden(message));

  res.unauthorized = (message) =>
    res.status(401).json(ApiResponse.unauthorized(message));

  res.validationError = (errors) =>
    res.status(422).json(ApiResponse.validationError(errors));
};

module.exports = { ApiResponse, attachToResponse };
