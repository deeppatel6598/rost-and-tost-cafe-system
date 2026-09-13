/**
 * The canteen's own name, and nothing else.
 *
 * Kept apart from data/seed.ts deliberately. That module imports password
 * hashing and the table-token signer, so importing a single string constant
 * from it drags scrypt and AUTH_SECRET into whatever bundle asked — and if the
 * asker is a client component, that means the browser, where the secret
 * resolves to undefined and throws on load. It cost a blank error page to find.
 *
 * Anything a client component needs to know about the canteen belongs here.
 */
export const CANTEEN_NAME = "Sakarchand Patel University Canteen";
export const CANTEEN_SHORT_NAME = "SK University Canteen";
