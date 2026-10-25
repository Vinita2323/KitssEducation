export function sendSuccess(res, data, status = 200) {
  return res.status(status).json({ data, requestId: res.locals.requestId });
}
