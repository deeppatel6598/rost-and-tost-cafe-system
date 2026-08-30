/**
 * Drops keys whose value is `undefined`.
 *
 * Route handlers build patches like `{ isOpen, opensAt: body.opensAt }`, where
 * anything the client didn't send comes through as `undefined`. Spreading that
 * straight onto a stored row (`{ ...row, ...patch }`) does not skip those keys
 * — it overwrites good values with `undefined`. That is how toggling "accept
 * cash" once wiped a stall's opening hours and left every guest screen unable
 * to compute whether the stall was open.
 *
 * Every update in this folder runs its patch through here first.
 */
export function definedOnly<T extends object>(patch: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) {
      out[key as keyof T] = value as T[keyof T];
    }
  }
  return out;
}
