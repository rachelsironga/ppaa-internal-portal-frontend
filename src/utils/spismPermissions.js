import { hasPermission } from "./permissions";

/**
 * True if the user has any of the given SPISM permission codenames.
 * Uses the same rules as menu visibility (including portal admin bypass).
 */
export function spismCan(user, ...codenames) {
  if (!codenames.length) return true;
  return hasPermission(codenames, [], user?.user_permissions, user?.groups);
}
