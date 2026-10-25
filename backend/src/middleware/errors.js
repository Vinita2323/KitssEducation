import { AppError } from '../utils/AppError.js';

export function notFound(req, res, next) {
  next(new AppError(404, 'NOT_FOUND', 'The requested resource was not found'));
}

export function errorHandler(logger) {
  return (err, req, res, next) => {
    if (res.headersSent) return next(err);
    let error = err;
    if (['MongoServerSelectionError', 'MongooseServerSelectionError', 'MongoNetworkError', 'MongoNetworkTimeoutError'].includes(err.name)) error = new AppError(503, 'DATABASE_UNAVAILABLE', 'The service is temporarily unavailable');
    if (err.code === 11000) error = new AppError(409, 'IDENTITY_CONFLICT', 'The operation conflicts with an existing identity');
    if (['ValidationError', 'StrictModeError', 'CastError'].includes(err.name)) error = new AppError(422, 'INVALID_INPUT', 'The supplied fields are invalid');
    if (err.type === 'entity.too.large') error = new AppError(413, 'BODY_TOO_LARGE', 'Request body exceeds the allowed limit');
    else if (err.type === 'entity.parse.failed') error = new AppError(400, 'INVALID_JSON', 'Request body must contain valid JSON');
    else if (err.type === 'encoding.unsupported' || err.type === 'charset.unsupported') error = new AppError(415, 'UNSUPPORTED_ENCODING', 'Request encoding is not supported');
    else if (err.type === 'request.aborted' || err.type === 'request.size.invalid') error = new AppError(400, 'INVALID_REQUEST', 'The request could not be read');
    if (!(error instanceof AppError)) error = new AppError(500, 'INTERNAL_ERROR', 'An unexpected error occurred');
    logger[error.status >= 500 ? 'error' : 'warn']({ event: 'http_error', code: error.code,
      requestId: req.requestId, status: error.status }, 'Request failed');
    res.set('Cache-Control', 'no-store');
    if (error.status === 416 && Number.isSafeInteger(error.rangeBytes)) res.set('Content-Range', 'bytes */' + error.rangeBytes);
    return res.status(error.status).json({ error: { code: error.code, message: error.message,
      ...(error.fields ? { fields: error.fields } : {}) }, requestId: res.locals.requestId });
  };
}
