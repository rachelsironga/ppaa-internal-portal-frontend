import React, { useMemo } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Menu data imports
import eApprovalMenu from '../data/eApprovalMenu.json';
import ictAssetsMenu from '../data/ictAssetsMenu.json';
import analyticsMenu from '../data/analyticsMenu.json';
import servicesList from '../data/servicesList.json';

// Namespace to menu mapping
const MENU_CONFIG = {
  'e-approval': {
    data: eApprovalMenu,
    title: 'E-Approval',
    type: 'sections' // Array of sections with header + items
  },
  'ict-assets': {
    data: ictAssetsMenu,
    title: 'ICT Assets',
    type: 'sections' // Array of sections with header + items
  },
  'analytics': {
    data: analyticsMenu,
    title: 'Analytics',
    type: 'flat' // Flat array of menu items
  }
};

// Default namespace when at root or unknown path
const DEFAULT_NAMESPACE = 'e-approval';

const hasPermission = (itemPermissions, itemRoles, userPermissions, userRoles) => {
  const hasRequiredPermission =
    !itemPermissions ||
    itemPermissions.length === 0 ||
    itemPermissions.some((permission) => userPermissions?.includes(permission));
  const hasRequiredRole =
    !itemRoles ||
    itemRoles.length === 0 ||
    itemRoles.some((role) => userRoles?.includes(role));
  return hasRequiredPermission || hasRequiredRole;
};

const hasAnyVisibleItem = (items, userPermissions, userRoles) => {
  return items?.some((item) => {
    const parentVisible = hasPermission(
      item.permission,
      item.role,
      userPermissions,
      userRoles
    );
    if (parentVisible) return true;

    if (item.submenu?.length > 0) {
      return hasAnyVisibleItem(item.submenu, userPermissions, userRoles);
    }
    return false;
  });
};

// Extract namespace from URL path
const getNamespaceFromPath = (pathname) => {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return DEFAULT_NAMESPACE;

  const firstSegment = segments[0].toLowerCase();
  const secondSegment = segments[1]?.toLowerCase() || '';

  // Check for portal-specific paths (e.g., /unisync360/external-counselor or /unisync360/lead-lancer)
  if (firstSegment === 'unisync360') {
    if (secondSegment === 'external-counselor') {
      return 'external-counselor';
    }
    if (secondSegment === 'lead-lancer') {
      return 'lead-lancer';
    }
  }

  // Check if the namespace exists in our config
  if (MENU_CONFIG[firstSegment]) {
    return firstSegment;
  }

  // Check servicesList for matching link patterns
  const matchedService = servicesList.find(service => {
    const serviceSegment = service.link.split('/').filter(Boolean)[0];
    return serviceSegment === firstSegment;
  });

  if (matchedService) {
    const serviceNamespace = matchedService.link.split('/').filter(Boolean)[0];
    return MENU_CONFIG[serviceNamespace] ? serviceNamespace : DEFAULT_NAMESPACE;
  }

  return DEFAULT_NAMESPACE;
};

const Sidebar = ({ isService = false }) => {
  const user = useSelector((state) => state.userReducer?.data);
  const userPermissions = user?.user_permissions;
  const userRoles = user?.groups;
  const location = useLocation();

  // Dynamically determine active namespace from URL
  const activeNamespace = useMemo(() => {
    return getNamespaceFromPath(location.pathname);
  }, [location.pathname]);

  // Get menu config for current namespace
  const menuConfig = MENU_CONFIG[activeNamespace] || MENU_CONFIG[DEFAULT_NAMESPACE];

  // Format namespace for display
  const formattedTitle = menuConfig.title || activeNamespace
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Filter services based on user permissions
  const filteredServices = servicesList.filter(service =>
    hasPermission(service.permission, service.role, userPermissions, userRoles)
  );

  return (
    <aside
      id="layout-menu"
      className="layout-menu menu-vertical menu bg-menu-theme"
    >
      <div className="app-brand demo mb-2">
        <Link
          aria-label="Navigate to sneat homepage"
          to="/"
          className="app-brand-link"
        >
          <span className="app-brand-logo demo me-4">
            <img src="/assets/img/mnhlogo.png" width="70" height="70" alt="MNH Logo" />
          </span>
          <span className="app-brand-logo demo ms-4">
            <img src="/assets/img/nembo.jpg" width="70" height="70" alt="Nembo" />
          </span>
        </Link>

        <a
          href="#"
          className="layout-menu-toggle menu-link text-large ms-auto d-block d-xl-none"
        >
          <i className="bx bx-chevron-left bx-sm align-middle"></i>
        </a>
      </div>

      <div style={{ alignContent: "center", textAlign: "center" }}>
        <h5 className="text-bold">{formattedTitle}</h5>
      </div>

      <div className="menu-inner-shadow"></div>

      <ul className="menu-inner py-1">
        {isService ? (
          <ServiceDocsMenu services={filteredServices} activeNamespace={activeNamespace} />
        ) : (
          <DynamicMenu
            menuConfig={menuConfig}
            userPermissions={userPermissions}
            userRoles={userRoles}
          />
        )}
      </ul>
    </aside>
  );
};

// Service Documentation Menu
const ServiceDocsMenu = ({ services }) => {
  // Extract namespace from service link (e.g., "/unisync360/dashboard" -> "unisync360")
  const getNamespace = (link) => {
    const segments = link.split('/').filter(Boolean);
    return segments[0] || '';
  };

  return (
    <>
      <li className="menu-header small text-uppercase">
        <span className="menu-header-text">Documentation</span>
      </li>
      {services.map((service, idx) => {
        const namespace = getNamespace(service.link);
        return (
          <li className="menu-item" key={`docs_${service.id}_${idx}`}>
            <NavLink
              className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}
              to={`/${namespace}/user-manual`}
            >
              <i className={`menu-icon tf-icons ${service.icon || 'bx bx-book-open'}`}></i>
              <div>{service.text} Manual</div>
            </NavLink>
          </li>
        );
      })}
    </>
  );
};

// Dynamic Menu Renderer
const DynamicMenu = ({ menuConfig, userPermissions, userRoles }) => {
  const { data, type } = menuConfig;

  if (type === 'flat') {
    // Flat array of menu items (e.g., analyticsMenu)
    return data
      .filter((item) => hasPermission(item.permission, item.role, userPermissions, userRoles))
      .map((item, itemIndex) => (
        <MenuItem
          key={item.id || `flat-item-${itemIndex}`}
          {...item}
          userPermissions={userPermissions}
          userRoles={userRoles}
        />
      ));
  }

  if (type === 'sections') {
    // E-Approval style: array of sections with header + items
    return data.map((section, sectionIndex) => (
      <React.Fragment key={`section-${sectionIndex}`}>
        {section.header && hasAnyVisibleItem(section.items, userPermissions, userRoles) && (
          <li className="menu-header small text-uppercase">
            <span className="menu-header-text">{section.header}</span>
          </li>
        )}
        {section.items
          ?.filter((item) => hasPermission(item.permission, item.role, userPermissions, userRoles))
          .map((item, itemIndex) => (
            <MenuItem
              key={item.id || `item-${sectionIndex}-${itemIndex}`}
              {...item}
              userPermissions={userPermissions}
              userRoles={userRoles}
            />
          ))}
      </React.Fragment>
    ));
  }

  if (type === 'nested') {
    // ICT Assets / UniSync360 style: array of items with header + submenu
    return data.map((section, sectionIndex) => (
      <React.Fragment key={`nested-${sectionIndex}`}>
        {section.header && hasAnyVisibleItem([section], userPermissions, userRoles) && (
          <li className="menu-header small text-uppercase">
            <span className="menu-header-text">{section.header}</span>
          </li>
        )}
        {section.submenu
          ?.filter((item) => hasPermission(item.permission, item.role, userPermissions, userRoles))
          .map((item, itemIndex) => (
            <MenuItem
              key={item.id || `nested-item-${sectionIndex}-${itemIndex}`}
              {...item}
              userPermissions={userPermissions}
              userRoles={userRoles}
            />
          ))}
      </React.Fragment>
    ));
  }

  return null;
};

// Menu Item Component
const MenuItem = ({ userPermissions, userRoles, submenu, ...item }) => {
  const location = useLocation();

  // Filter submenu items
  const filteredSubmenu = submenu
    ? submenu.filter((subitem) =>
      hasPermission(subitem.permission, subitem.role, userPermissions, userRoles)
    )
    : [];

  // Don't render if submenu existed but all items filtered out
  if (submenu && filteredSubmenu.length === 0) {
    return null;
  }

  // Extract pathname and search from item.link (handles links with query params)
  const getPathname = (link) => {
    if (!link) return '';
    const [pathname] = link.split('?');
    return pathname;
  };

  const itemPathname = getPathname(item.link);
  const currentFullUrl = location.pathname + location.search;

  // Check if active - compare both pathname and full URL with query params
  const isActive =
    (item.link && currentFullUrl === item.link) ||
    (itemPathname && location.pathname === itemPathname && !item.link?.includes('?')) ||
    (itemPathname && location.pathname.startsWith(itemPathname + '/') && !item.link?.includes('?'));

  const hasSubmenu = filteredSubmenu.length > 0;

  const isSubmenuActive =
    hasSubmenu &&
    filteredSubmenu.some((subitem) => {
      const subitemPathname = getPathname(subitem.link);
      const subitemFullUrl = subitem.link;
      return (
        currentFullUrl === subitemFullUrl ||
        (subitemPathname && location.pathname === subitemPathname && !subitem.link?.includes('?')) ||
        (subitemPathname && location.pathname.startsWith(subitemPathname + '/') && !subitem.link?.includes('?'))
      );
    });

  return (
    <li
      className={`menu-item ${isActive || isSubmenuActive ? 'active' : ''} ${hasSubmenu && isSubmenuActive ? 'open' : ''
        }`}
    >
      <NavLink
        aria-label={`Navigate to ${item.text}${!item.available ? ' Pro' : ''}`}
        to={item.link}
        className={`menu-link ${hasSubmenu ? 'menu-toggle' : ''}`}
        target={item.link?.includes('http') ? '_blank' : undefined}
      >
        <i className={`menu-icon tf-icons ${item.icon}`}></i>
        <div>{item.text}</div>
        {item.available === false && (
          <div className="badge bg-label-primary fs-tiny rounded-pill ms-auto">
            Pro
          </div>
        )}
      </NavLink>

      {hasSubmenu && (
        <ul className="menu-sub">
          {filteredSubmenu.map((subitem, subitemIndex) => (
            <MenuItem
              key={subitem.id || `${item.id || item.text}-sub-${subitemIndex}`}
              {...subitem}
              userPermissions={userPermissions}
              userRoles={userRoles}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export default Sidebar;
