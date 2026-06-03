// Central error handler — must be the LAST app.use() in app.js.
// Any route that calls next(err) lands here.
//
// Security: only client (4xx) error messages are returned to the caller.
// Internal/500 errors are logged server-side but replaced with a generic
// message so we never leak Prisma internals, stack traces, BigInt/parse
// errors, etc. Routes that want to surface a message must set err.status
// to a 4xx value (the validate.js helper does this for 400s).
export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500

  if (status >= 500) {
    console.error(err)
  }

  const message = status < 500 ? err.message || 'Bad request' : 'Internal server error'
  res.status(status).json({ error: message })
}
