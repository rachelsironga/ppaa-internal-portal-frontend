/**
 * Maoni reviewer access: IHRM, Executive Secretary, etc.
 *
 * Primary Django group: `Maoni_Reviewer` → `maoni_reviewer`.
 * Legacy primary: `Maoni_Reviewe` / `PPAA_Maoni_Reviewer` → `maoni_reviewe` / `ppaa_maoni_reviewer`.
 * Legacy: `HR` → `hr`. Dedicated template: `Maoni_Admin` → `maoni_admin`.
 * Department queue uses Django group `Maoni_Handler` → `maoni_handler` only (not a bare `handler` slug).
 */

export const MAONI_REVIEWER_ROLE_PRIMARY = "maoni_reviewer";

/** Normalized group slugs that grant Maoni reviewer (dashboard, all suggestions, official replies). */
export const MAONI_REVIEWER_ROLES = [
  MAONI_REVIEWER_ROLE_PRIMARY,
  "maoni_handler",
  "maoni_reviewe",
  "ppaa_maoni_reviewer",
  "hr",
  "maoni_admin",
];

export function getNormalizedGroupSlugs(user) {
  return (user?.groups || []).map((r) => String(r).toLowerCase().trim());
}

export function isMaoniAdmin(user) {
  if (user?.is_superuser) return true;
  const roles = getNormalizedGroupSlugs(user);
  return roles.includes("admin") || roles.includes("maoni_admin");
}

export function isMaoniHandler(user) {
  if (isMaoniAdmin(user)) return true;
  const roles = getNormalizedGroupSlugs(user);
  return (
    roles.includes(MAONI_REVIEWER_ROLE_PRIMARY) ||
    roles.includes("maoni_handler") ||
    roles.includes("maoni_reviewe") ||
    roles.includes("ppaa_maoni_reviewer")
  );
}

/**
 * True only for department-queue handlers (not reviewers, admins, or superusers).
 * Used to scope /ppaa-maoni/suggestions to the handler's department.
 */
export function isMaoniDepartmentHandler(user) {
  if (!user || user.is_superuser) return false;
  if (isMaoniAdmin(user)) return false;
  const roles = getNormalizedGroupSlugs(user);
  if (
    roles.includes(MAONI_REVIEWER_ROLE_PRIMARY) ||
    roles.includes("maoni_reviewe") ||
    roles.includes("ppaa_maoni_reviewer") ||
    roles.includes("hr")
  ) {
    return false;
  }
  return roles.includes("maoni_handler");
}

/** True if user has Maoni reviewer privileges (PPAA_Maoni_Reviewer or legacy HR / Maoni_Admin). */
export function isMaoniReviewer(user) {
  const roles = getNormalizedGroupSlugs(user);
  return MAONI_REVIEWER_ROLES.some((r) => roles.includes(r));
}

/**
 * True only for the primary `Maoni_Reviewer` → `maoni_reviewer` group.
 * Used for reviewer-only workflow controls (e.g. "Return to handler"); department handlers
 * use `maoni_handler` and must not see those actions.
 */
export function isMaoniPrimaryReviewerGroup(user) {
  return getNormalizedGroupSlugs(user).includes(MAONI_REVIEWER_ROLE_PRIMARY);
}

/** True if user can access Maoni reviewer views (reviewer, admin, superuser). */
export function canAccessMaoniReviewerFeatures(user) {
  return isMaoniHandler(user) || isMaoniReviewer(user);
}
