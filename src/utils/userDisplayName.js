/**
 * Full name from profile fields only (no username/email). Empty string if none set.
 * Used for welcome lines; callers fall back to a generic greeting when falsy.
 */
export function getUserFormalFullName(user) {
  if (!user) return "";
  const parts = [user.first_name, user.middle_name, user.last_name]
    .filter(Boolean)
    .map((s) => String(s).trim())
    .filter(Boolean);
  return parts.length ? parts.join(" ") : "";
}

/**
 * Label for the signed-in user when first/last name are unset in the database.
 */
export function getUserDisplayName(user) {
  if (!user) return "Guest";
  const fromNames = [user.first_name, user.middle_name, user.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (fromNames) return fromNames;
  if (user.username) return String(user.username).trim();
  if (user.email) {
    const local = String(user.email).split("@")[0];
    if (local) return local;
  }
  return "User";
}
