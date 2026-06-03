// Shared request-validation helper built on Zod.
// Usage in a route:
//   const data = parseBody(mySchema, req.body)
// On failure it throws a 400 error whose message is the first validation
// issue; the central errorHandler turns that into { error: <message> }.
// Teammates: define a Zod schema per mutating route and run it through this.

export function parseBody(schema, body) {
  const result = schema.safeParse(body)
  if (!result.success) {
    const first = result.error.issues[0]
    const err = new Error(first?.message || 'Invalid request body')
    err.status = 400
    throw err
  }
  return result.data
}
