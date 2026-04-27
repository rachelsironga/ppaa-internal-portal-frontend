/**
 * Maoni reviewer access: IHRM, Executive Secretary, etc.
 *
 * Primary Django group: `PPAA_Maoni_Reviewer` → `ppaa_maoni_reviewer`.
 * Legacy: `HR` → `hr`. Dedicated template: `Maoni_Admin` → `maoni_admin`.
 */

export const MAONI_REVIEWER_ROLE_PRIMARY = "ppaa_maoni_reviewer";

/** Normalized group slugs that grant Maoni reviewer (dashboard, all suggestions, official replies). */
export const MAONI_REVIEWER_ROLES = [
  MAONI_REVIEWER_ROLE_PRIMARY,
  "hr",
  "maoni_admin",
];

export function getNormalizedGroupSlugs(user) {
  return (user?.groups || []).map((r) => String(r).toLowerCase().trim());
}

/** True if user has Maoni reviewer privileges (PPAA_Maoni_Reviewer or legacy HR / Maoni_Admin). */
export function isMaoniReviewer(user) {
  const roles = getNormalizedGroupSlugs(user);
  return MAONI_REVIEWER_ROLES.some((r) => roles.includes(r));
}

/** True if user can access Maoni reviewer views (reviewer, admin, superuser). */
export function canAccessMaoniReviewerFeatures(user) {
  if (user?.is_superuser) return true;
  const roles = getNormalizedGroupSlugs(user);
  if (roles.includes("admin")) return true;
  return isMaoniReviewer(user);
}
