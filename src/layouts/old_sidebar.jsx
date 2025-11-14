import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import menuData from '../data/menuData.json'
import { useSelector } from 'react-redux';
import documentationList from "../data/documentationList.json";
import serviceList from "../data/servicesList.json";

const hasPermission = (
  itemPermissions,
  itemRoles,
  userPermissions,
  userRoles
) => {
  const hasRequiredPermission =
    !itemPermissions ||
    itemPermissions.some((permission) => userPermissions?.includes(permission));
  const hasRequiredRole =
    !itemRoles || itemRoles.some((role) => userRoles?.includes(role));
  return hasRequiredPermission || hasRequiredRole;
};

const hasAnyVisibleItem = (items, userPermissions, userRoles) => {
  return items.some((item) => {
    // Check if the parent itself is visible
    const parentVisible = hasPermission(
      item.permission,
      item.role,
      userPermissions,
      userRoles
    );

    // If parent visible, we show
    if (parentVisible) {
      return true;
    }

    // If parent not visible, but submenus exist
    if (item.submenu && item.submenu.length > 0) {
      // Check if any submenu items are visible
      const childVisible = hasAnyVisibleItem(
        item.submenu,
        userPermissions,
        userRoles
      );
      if (childVisible) {
        return true;
      }
    }

    return false;
  });
};

const Sidebar = ({ isService = false }) => {
  const user = useSelector((state) => state.userReducer?.data);
  const userPermissions = user?.user_permissions;
  const userRoles = user?.groups;

  return (
    <aside
      id="layout-menu"
      className="layout-menu menu-vertical menu bg-menu-theme"
    >
      <div className="app-brand demo">
        <Link
          aria-label="Navigate to sneat homepage"
          to="/"
          className="app-brand-link"
        >
          <span className="app-brand-logo demo">
            <img
              src="/assets/img/nembo.jpg"
              alt="sneat-logo"
              width={"70px"}
              height={"70px"}
              aria-label="Sneat logo image"
            />
          </span>
          <span style={{ width: "70px" }}></span>
          <span className="app-brand-logo demo">
            <img
              src="/assets/img/mnhlogo.png"
              alt="sneat-logo"
              width={"70px"}
              height={"70px"}
              aria-label="Sneat logo image"
            />
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
        <span className="app-brand-text demo menu-text fw-bold ms-2">
          MNH-CONNECT
        </span>
        <h5 className="text-bold">(e-approval)</h5>
      </div>

      <div className="menu-inner-shadow"></div>

      <ul className="menu-inner py-1">
        {isService ? (
          <>
            <li className="menu-header small text-uppercase">
              <span className="menu-header-text">Documentation</span>
            </li>
            {serviceList.map((doc, idx) => (
              <li className="menu-item" key={"docs_index_" + idx}>
                <a
                  className="menu-link"
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className={`menu-icon tf-icons bx bx-file`}></i>
                  <div>{doc.text + " Docs"}</div>
                </a>
              </li>
            ))}
          </>
        ) : (
          menuData.map((section, sectionIndex) => (
            <React.Fragment key={"header-" + sectionIndex}>
              {section.header &&
                hasAnyVisibleItem(
                  section.items,
                  userPermissions,
                  userRoles
                ) && (
                  <li className="menu-header small text-uppercase">
                    <span className="menu-header-text">{section.header}</span>
                  </li>
                )}
              {section.items
                .filter((item) =>
                  hasPermission(
                    item.permission,
                    item.role,
                    userPermissions,
                    userRoles
                  )
                )
                .map((item, intemIndex) => (
                  <MenuItem
                    key={item.id || intemIndex}
                    {...item}
                    userPermissions={userPermissions}
                    userRoles={userRoles}
                  />
                ))}
            </React.Fragment>
          ))
        )}
      </ul>
    </aside>
  );
};

  const MenuItem = (item) => {
    const { userPermissions, userRoles, submenu, ...rest } = item;

    const location = useLocation();

    // Filter the submenu here
    const filteredSubmenu = submenu
      ? submenu.filter((subitem) =>
          hasPermission(
            subitem.permission,
            subitem.role,
            userPermissions,
            userRoles
          )
        )
      : [];

    // If the item had submenu, but after filtering it's empty, don't show this parent
    if (submenu && filteredSubmenu.length === 0) {
      return null;
    }

    const isActive =
      location.pathname === item.link ||
      location.pathname.startsWith(item.link + "/open/");

    const hasSubmenu = filteredSubmenu.length > 0;

    const isSubmenuActive =
      hasSubmenu &&
      filteredSubmenu.some((subitem) => location.pathname === subitem.link);

    return (
      <li
        className={`menu-item ${isActive || isSubmenuActive ? "active" : ""} ${
          hasSubmenu && isSubmenuActive ? "open" : ""
        }`}
      >
        <NavLink
          aria-label={`Navigate to ${item.text} ${
            !item.available ? "Pro" : ""
          }`}
          to={item.link}
          className={`menu-link ${hasSubmenu ? "menu-toggle" : ""}`}
          target={item.link.includes("http") ? "_blank" : undefined}
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
          <ul key={`submenu-${item.id || item.text}`} className="menu-sub">
            {filteredSubmenu.map((subitem, subitemIndex) => (
              <MenuItem
                key={subitem.id || `${item.id || item.text}-${subitemIndex}`}
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