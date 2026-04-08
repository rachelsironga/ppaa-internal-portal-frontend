import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

import servicesConfig from "../data/servicesConfig";
import { hasPermission, hasAnyVisibleItem, isStaffOnly, isAllowedRouteForStaffOnly } from "../utils/permissions";

// KEEPING YOUR ORIGINAL UI EXACTLY THE SAME

const Sidebar = ({ isService = false }) => {
  const user = useSelector((state) => state.userReducer?.data);
  const userPermissions = user?.user_permissions;
  const userRoles = user?.groups;
  const staffOnly = isStaffOnly(userRoles);

  const location = useLocation();

  const [activeService, setActiveService] = useState(null);
  const [activeServiceName, setActiveServiceName] = useState("");
  const [currentMenu, setCurrentMenu] = useState([]);

  // Detect service by URL
  useEffect(() => {
    const currentPath = location.pathname;

    const service = servicesConfig.find((s) => currentPath.startsWith(s.link));

    if (service) {
      setActiveService(service.id);
      setActiveServiceName(service.name || "");
      setCurrentMenu(service.menu);
    } else {
      setActiveService("");
      setActiveServiceName("");
      setCurrentMenu(servicesConfig[servicesConfig.length - 1].menu);
    }
  }, [location.pathname]);

  // Auto-open parent menu items when submenu items are active
  useEffect(() => {
    const openActiveParentMenus = () => {
      const activeSubmenuLinks = document.querySelectorAll('.menu-sub .menu-link.active');
      activeSubmenuLinks.forEach((activeLink) => {
        const parentMenuItem = activeLink.closest('.menu-sub')?.parentElement;
        if (parentMenuItem && parentMenuItem.classList.contains('menu-item')) {
          parentMenuItem.classList.add('open');
          // Also open any parent of this parent if it exists
          const grandParent = parentMenuItem.closest('.menu-sub')?.parentElement;
          if (grandParent && grandParent.classList.contains('menu-item')) {
            grandParent.classList.add('open');
          }
        }
      });
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(openActiveParentMenus, 100);
    return () => clearTimeout(timer);
  }, [currentMenu, location.pathname]);

  return (
    <aside
      id="layout-menu"
      className="layout-menu menu-vertical menu bg-menu-theme"
    >
      <div className="app-brand demo">
        <Link to="/services" className="app-brand-link">
          <span className="app-brand-logo demo">
            <img src="/assets/img/nembo.jpg" width="70" height="70" />
          </span>
          <span style={{ width: "70px" }}></span>
          <span className="app-brand-logo demo">
            <img src="/assets/img/ppaa-bg.png" width="70" height="70" />
          </span>
        </Link>
        <a className="layout-menu-toggle menu-link text-large ms-auto d-block d-xl-none">
          <i className="bx bx-chevron-left bx-sm align-middle"></i>
        </a>
      </div>

      <div style={{ textAlign: "center" }}>
        <span className="app-brand-text demo menu-text fw-bold ms-2">
         PPAA-PORTAL
        </span>

        {activeService && (
          <h5 className="text-bold">
            {activeServiceName || activeService
              .replace(/-/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase())}
          </h5>
        )}
      </div>

      <div className="menu-inner-shadow"></div>

      <ul className="menu-inner py-1">
        {isService ? (
          // Documentation Mode
          <>
            <li className="menu-header small text-uppercase">
              <span className="menu-header-text">Documentation</span>
            </li>

            {servicesConfig.map((service, idx) => (
              <li className="menu-item" key={idx}>
                <a className="menu-link" href="#" target="_blank">
                  <i className="menu-icon tf-icons bx bx-file"></i>
                  <div>{service.name} Docs</div>
                </a>
              </li>
            ))}
          </>
        ) : (
          // Dynamic Service Menu
          currentMenu.map((section, sectionIndex) => {
            // For staff-only users, filter items to only show allowed routes
            const filteredItems = staffOnly
              ? section.items.filter((item) => {
                  // Check if item link is allowed for staff-only users
                  if (item.link && isAllowedRouteForStaffOnly(item.link)) {
                    return true;
                  }
                  // Check submenu items
                  if (item.submenu) {
                    const hasAllowedSubmenu = item.submenu.some((sub) =>
                      sub.link && isAllowedRouteForStaffOnly(sub.link)
                    );
                    return hasAllowedSubmenu;
                  }
                  return false;
                })
              : section.items;

            return (
              <React.Fragment key={"header-" + sectionIndex}>
                {section.header &&
                  hasAnyVisibleItem(
                    filteredItems,
                    userPermissions,
                    userRoles
                  ) && (
                    <li className="menu-header small text-uppercase">
                      <span className="menu-header-text">{section.header}</span>
                    </li>
                  )}

                {filteredItems
                  .filter((item) =>
                    hasPermission(
                      item.permission,
                      item.role,
                      userPermissions,
                      userRoles
                    )
                  )
                  .map((item, itemIndex) => (
                    <MenuItem
                      key={item.id || itemIndex}
                      {...item}
                      userPermissions={userPermissions}
                      userRoles={userRoles}
                      staffOnly={staffOnly}
                    />
                  ))}
              </React.Fragment>
            );
          })
        )}
      </ul>
    </aside>
  );
};

// KEEP YOUR ORIGINAL MENU ITEM UI
const MenuItem = (item) => {
  const { userPermissions, userRoles, submenu, staffOnly, isMain } = item;
  const location = useLocation();

  // Filter submenu items - for staff-only, only show allowed routes
  let filteredSubmenu = submenu
    ? submenu.filter((subitem) => {
        // First check permission
        const hasPerm = hasPermission(
          subitem.permission,
          subitem.role,
          userPermissions,
          userRoles
        );
        
        if (!hasPerm) return false;
        
        // If staff-only, also check if route is allowed
        if (staffOnly && subitem.link) {
          return isAllowedRouteForStaffOnly(subitem.link);
        }
        
        return true;
      })
    : [];

  // Check if parent item itself is visible
  const isParentVisible = hasPermission(
    item.permission,
    item.role,
    userPermissions,
    userRoles
  );

  // If parent has submenu but no visible submenu items, still show parent if it's visible
  if (submenu && filteredSubmenu.length === 0 && !isParentVisible) return null;

  const hasSubmenu = filteredSubmenu.length > 0;
  
  // Check if any submenu item is active (supports query-string links like ?type=implementation)
  const isSubmenuActive =
    hasSubmenu &&
    filteredSubmenu.some((sub) => {
      const fullLink = sub.link || "";
      const [basePath, queryString] = fullLink.split("?");
      const pathMatches =
        location.pathname === fullLink ||
        location.pathname === basePath ||
        location.pathname.startsWith(basePath + "/open/");

      if (!pathMatches) return false;

      if (!queryString) {
        // No query part on the link; treat as active ONLY when there is no explicit type param
        const currentSearch = (location.search || "").replace(/^\?/, "");
        return !currentSearch.includes("type=");
      }

      // When the submenu link has a query (e.g. ?type=implementation),
      // ensure the current location.search contains that query fragment
      const currentSearch = (location.search || "").replace(/^\?/, "");
      return currentSearch.includes(queryString);
    });

  // For parent items with submenu, check if link is empty or if submenu is active
  let isActive;
  if (hasSubmenu) {
    isActive = isSubmenuActive;
  } else {
    const fullLink = item.link || "";
    const [basePath, queryString] = fullLink.split("?");
    const pathMatches =
      location.pathname === fullLink ||
      location.pathname === basePath ||
      location.pathname.startsWith(basePath + "/open/");

    if (!pathMatches) {
      isActive = false;
    } else if (!queryString) {
      // No query part on the link; treat as active ONLY when there is no explicit type param
      const currentSearch = (location.search || "").replace(/^\?/, "");
      isActive = !currentSearch.includes("type=");
    } else {
      // When the link has a query (e.g. ?type=implementation),
      // ensure the current location.search contains that query fragment
      const currentSearch = (location.search || "").replace(/^\?/, "");
      isActive = currentSearch.includes(queryString);
    }
  }

  // Handle empty links for parent items with submenus (submenu shown only after click)
  const linkTo = item.link || "#";
  const isParentWithSubmenu = hasSubmenu && (!item.link || item.link === "");

  return (
    <li
      className={`menu-item ${isActive ? "active" : ""} ${
        hasSubmenu && (isActive || isSubmenuActive) ? "open" : ""
      } ${isMain ? "menu-item-main" : ""}`}
    >
      {isParentWithSubmenu ? (
        <a
          href="#"
          className="menu-link menu-toggle"
          onClick={(e) => {
            e.preventDefault();
            const menuItem = e.currentTarget.closest(".menu-item");
            if (menuItem) {
              menuItem.classList.toggle("open");
            }
          }}
          aria-expanded={hasSubmenu && (isActive || isSubmenuActive)}
        >
          <i className={`menu-icon tf-icons ${item.icon}`}></i>
          <div>{item.text}</div>

          {item.available === false && (
            <div className="badge bg-label-primary fs-tiny rounded-pill ms-auto">
              Pro
            </div>
          )}
        </a>
      ) : (
        <NavLink
          to={linkTo}
          className={() =>
            `menu-link ${hasSubmenu ? "menu-toggle" : ""} ${
              isMain ? "menu-link-main" : ""
            } ${isActive ? "active" : ""}`
          }
          target={item.link && item.link.includes("http") ? "_blank" : undefined}
        >
          <i className={`menu-icon tf-icons ${item.icon}`}></i>
          <div>{item.text}</div>

          {item.available === false && (
            <div className="badge bg-label-primary fs-tiny rounded-pill ms-auto">
              Pro
            </div>
          )}
        </NavLink>
      )}

      {hasSubmenu && (
        <ul className="menu-sub">
          {filteredSubmenu.map((sub, i) => (
            <MenuItem
              key={sub.id || `${item.id}-${i}`}
              {...sub}
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
