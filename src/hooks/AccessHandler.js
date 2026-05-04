/**
 * Permission / role gate for UI and actions.
 * - Only permissions: user must have at least one listed permission.
 * - Only roles: user must have at least one listed role.
 * - Both: user needs a matching permission OR a matching role.
 * - Neither list: allowed (no constraint).
 */
export function hasAccess(user, requiredPermissions = [], requiredRoles = []) {
    if (!user) return false;

    if (user && user.is_superuser) return true;

    const userPermissions = user.user_permissions || [];
    const userRoles = user.groups || [];

    const permRequired =
        Array.isArray(requiredPermissions) && requiredPermissions.length > 0;
    const roleRequired =
        Array.isArray(requiredRoles) && requiredRoles.length > 0;

    if (!permRequired && !roleRequired) return true;

    const permSet = new Set(
        (userPermissions || []).map((p) => String(p).toLowerCase())
    );
    const hasPermission =
        permRequired &&
        requiredPermissions.some((perm) => {
            const want = String(perm).toLowerCase();
            return permSet.has(want) || userPermissions.includes(perm);
        });

    const normalizedUserRoles = (userRoles || []).map((r) =>
        String(r).toLowerCase()
    );
    const hasRole =
        roleRequired &&
        requiredRoles.some((role) =>
            normalizedUserRoles.includes(String(role).toLowerCase())
        );

    if (permRequired && roleRequired) return hasPermission || hasRole;
    if (permRequired) {
        // Match ProtectedRoute: portal "admin" group bypasses permission-only UI gates
        // when codenames are missing from the client payload (large sets / edge cases).
        if (normalizedUserRoles.includes("admin")) return true;
        return hasPermission;
    }
    if (roleRequired) return hasRole;
    return true;
}