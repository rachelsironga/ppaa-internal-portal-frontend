export const hasPermission = (itemPermissions, itemRoles, userPermissions, userRoles) => {
    const hasRequiredPermission =
        !itemPermissions || itemPermissions.some((p) => userPermissions?.includes(p));

    const hasRequiredRole =
        !itemRoles || itemRoles.some((r) => userRoles?.includes(r));

    return hasRequiredPermission || hasRequiredRole;
};

export const hasAnyVisibleItem = (items, userPermissions, userRoles) => {
    return items.some((item) => {
        const parentVisible = hasPermission(
            item.permission,
            item.role,
            userPermissions,
            userRoles
        );

        if (parentVisible) return true;

        if (item.submenu) {
            return hasAnyVisibleItem(item.submenu, userPermissions, userRoles);
        }

        return false;
    });
};
