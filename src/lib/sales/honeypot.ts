/**
 * Wire format for the public enquiry form's bot trap.
 *
 * Kept in its own module because both sides need it and the two cannot share a
 * file: the form is a client component, while the endpoint that checks the value
 * lives in a route handler. A route module may only export handlers and Next
 * config, so the constant could not be declared there and imported from the
 * form, and duplicating the literal is how a honeypot silently stops working --
 * the form fills one field name while the API checks another, and every bot
 * gets through.
 *
 * The value is deliberately not a plausible business field name: see the
 * endpoint for why.
 */
export const HONEYPOT_FIELD = "_company_url"
