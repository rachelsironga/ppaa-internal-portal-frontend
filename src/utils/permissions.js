export const hasPermission = (
    itemPermissions,
    itemRoles,
    userPermissions,
    userRoles,
    user = null,
    excludeRoles = null
) => {
    if (user?.is_superuser) {
        return true;
    }
    // Normalize roles to lowercase for case-insensitive comparison
    let normalizedUserRoles = userRoles?.map((r) => String(r)?.toLowerCase()) || [];
    if (user?.is_staff && !normalizedUserRoles.includes('staff')) {
        normalizedUserRoles = [...normalizedUserRoles, 'staff'];
    }
    const normalizedItemRoles = itemRoles?.map((r) => String(r)?.toLowerCase()) || [];

    // Admin users can see everything
    if (normalizedUserRoles.includes('admin')) {
        return true;
    }

    if (excludeRoles && excludeRoles.length > 0) {
        const excluded = excludeRoles.map((r) => String(r).toLowerCase().trim());
        const hitsExclude = excluded.some((r) => normalizedUserRoles.includes(r));
        // SPISM admins keep full access even if they also carry a planning-officer group.
        if (hitsExclude && !normalizedUserRoles.includes("spism_admin")) {
            return false;
        }
    }

    const perms = userPermissions?.map((p) => String(p)) || [];
    // Check if user has required permissions (codenames; tolerate case)
    const hasRequiredPermission =
        !itemPermissions ||
        itemPermissions.length === 0 ||
        itemPermissions.some((p) => {
            const want = String(p);
            return perms.includes(want) || perms.includes(want.toLowerCase());
        });

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

export const hasAnyVisibleItem = (items, userPermissions, userRoles, user = null) => {
    return items.some((item) => {
        const parentVisible = hasPermission(
            item.permission,
            item.role,
            userPermissions,
            userRoles,
            user,
            item.excludeRoles
        );

        if (parentVisible) return true;

        if (item.submenu) {
            return hasAnyVisibleItem(item.submenu, userPermissions, userRoles, user);
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
        '/maintenance',
        '/ppaa-internal-portal',
        '/ppaa-internal-portal/account/settings',
        '/ppaa-internal-portal/account/notifications',
        '/ppaa-internal-portal/account/connections',
        '/ppaa-internal-portal/account/password',
        // Allow staff-only users to access PPAA Maoni self-service pages
        '/ppaa-maoni',
        // Performance Dashboard (Strategic & Operational Performance Monitoring)
        '/performance-dashboard',
        '/report-management',
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
        // Allow all Reports Management routes
        if (path === '/report-management' && pathname.startsWith('/report-management')) {
            return true;
        }
        // Help Desk (under maintenance / placeholder)
        if (pathname === '/help-desk' || pathname.startsWith('/help-desk/')) {
            return true;
        }
        return false;
    });
};
