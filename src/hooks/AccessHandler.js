/**
 * Checks whether the user has any of the required permissions or roles.
 *
 * @param {object} user - The user object (must contain user_permissions and groups).
 * @param {Array<string>} requiredPermissions - Permissions required to access the feature.
 * @param {Array<string>} requiredRoles - Roles required to access the feature.
 * @returns {boolean} True if the user has access, false otherwise.
 */
export function hasAccess(user, requiredPermissions = [], requiredRoles = []) {
    if (!user) return false;

    if (user && user.is_superuser) return true;

    const userPermissions = user.user_permissions || [];
    const userRoles = user.groups || [];

    const hasPermission =
        !requiredPermissions.length ||
        requiredPermissions.some((perm) => userPermissions.includes(perm));

    const hasRole =
        !requiredRoles.length ||
        requiredRoles.some((role) => userRoles.includes(role));

    return hasPermission || hasRole;
}