export const hasPermission = (itemPermissions, itemRoles, userPermissions, userRoles) => {
    // Normalize roles to lowercase for case-insensitive comparison
    const normalizedUserRoles = userRoles?.map((r) => String(r)?.toLowerCase()) || [];
    const normalizedItemRoles = itemRoles?.map((r) => String(r)?.toLowerCase()) || [];

    // Admin users can see everything
    if (normalizedUserRoles.includes('admin')) {
        return true;
    }

    // Check if user has required permissions
    const hasRequiredPermission =
        !itemPermissions || 
        itemPermissions.length === 0 || 
        itemPermissions.some((p) => userPermissions?.includes(p));

    // Check if user has required roles (case-insensitive)
    const hasRequiredRole =
        !itemRoles || 
        itemRoles.length === 0 || 
        normalizedItemRoles.some((r) => normalizedUserRoles.includes(r));

    // If both roles and permissions are specified, user needs BOTH:
    // - at least one of the roles AND at least one of the permissions
    // If only roles are specified, user needs one of those roles
    // If only permissions are specified, user needs one of those permissions
    // If neither are specified, show the item to everyone
    if (itemRoles && itemRoles.length > 0 && itemPermissions && itemPermissions.length > 0) {
        return hasRequiredRole && hasRequiredPermission;
    }
    if (itemRoles && itemRoles.length > 0) {
        return hasRequiredRole;
    }
    if (itemPermissions && itemPermissions.length > 0) {
        return hasRequiredPermission;
    }
    // If neither roles nor permissions are specified, show the item
    return true;
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

/**
 * Check if user has ONLY the 'staff' role (and no other roles)
 * @param {Array} userRoles - Array of user roles
 * @returns {boolean} True if user has only 'staff' role
 */
export const isStaffOnly = (userRoles) => {
    if (!userRoles || userRoles.length === 0) return false;
    
    const normalizedRoles = userRoles.map((r) => String(r)?.toLowerCase());
    
    // User must have exactly one role and it must be 'staff'
    return normalizedRoles.length === 1 && normalizedRoles.includes('staff');
};

/**
 * Check if a route/path is allowed for staff-only users
 * @param {string} pathname - The current pathname
 * @returns {boolean} True if the route is allowed for staff-only users
 */
export const isAllowedRouteForStaffOnly = (pathname) => {
    const allowedPaths = [
        '/',
        '/services',
        '/ppaa-internal-portal',
        '/ppaa-internal-portal/account/settings',
        '/ppaa-internal-portal/account/notifications',
        '/ppaa-internal-portal/account/connections',
        '/ppaa-internal-portal/account/password',
        // Allow staff-only users to access PPAA Maoni self-service pages
        '/ppaa-maoni',
        // Performance Dashboard (Strategic & Operational Performance Monitoring)
        '/performance-dashboard',
    ];
    
    // Check if pathname matches any allowed path exactly or starts with it
    return allowedPaths.some(path => {
        if (pathname === path) return true;
        // Allow sub-routes for account settings
        if (path === '/ppaa-internal-portal/account/settings' && pathname.startsWith('/ppaa-internal-portal/account/')) {
            return true;
        }
        // Allow all PPAA Maoni routes (self-service), but NOT the MNH admin dashboard routes
        if (path === '/ppaa-maoni' && pathname.startsWith('/ppaa-maoni')) {
            return true;
        }
        // Allow all Performance Dashboard routes
        if (path === '/performance-dashboard' && pathname.startsWith('/performance-dashboard')) {
            return true;
        }
        return false;
    });
};
