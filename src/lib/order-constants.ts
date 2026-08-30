/**
 * Constants shared by client and server.
 *
 * Kept out of lib/store so client components can import the value without
 * pulling the whole server-side data layer into the browser bundle.
 */

/** Guests may cancel their own order for this long, and only while PLACED. */
export const CANCEL_WINDOW_MS = 90_000;
