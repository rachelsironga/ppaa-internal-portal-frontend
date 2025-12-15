import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

import servicesConfig from "../data/servicesConfig";
import { hasPermission, hasAnyVisibleItem } from "../utils/permissions";

// KEEPING YOUR ORIGINAL UI EXACTLY THE SAME

const Sidebar = ({ isService = false }) => {
  const user = useSelector((state) => state.userReducer?.data);
  const userPermissions = user?.user_permissions;
  const userRoles = user?.groups;

  const location = useLocation();

  const [activeService, setActiveService] = useState(null);
  const [currentMenu, setCurrentMenu] = useState([]);

  // Detect service by URL
  useEffect(() => {
    const currentPath = location.pathname;

    const service = servicesConfig.find((s) => currentPath.startsWith(s.link));

    if (service) {
      setActiveService(service.id);
      setCurrentMenu(service.menu);
    } else {
      setActiveService("");
      setCurrentMenu(servicesConfig[servicesConfig.length - 1].menu);
    }
  }, [location.pathname]);

  return (
    <aside
      id="layout-menu"
      className="layout-menu menu-vertical menu bg-menu-theme"
    >
      <div className="app-brand demo">
        <Link to="/" className="app-brand-link">
          <span className="app-brand-logo demo">
            <img src="/assets/img/nembo.jpg" width="70" height="70" />
          </span>
          <span style={{ width: "70px" }}></span>
          <span className="app-brand-logo demo">
            <img src="/assets/img/mnhlogo.png" width="70" height="70" />
          </span>
        </Link>
        <a className="layout-menu-toggle menu-link text-large ms-auto d-block d-xl-none">
          <i className="bx bx-chevron-left bx-sm align-middle"></i>
        </a>
      </div>

      <div style={{ textAlign: "center" }}>
        <span className="app-brand-text demo menu-text fw-bold ms-2">
          MNH-CONNECT
        </span>

        {activeService && (
          <h5 className="text-bold">
            {activeService
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
          currentMenu.map((section, sectionIndex) => (
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
                .map((item, itemIndex) => (
                  <MenuItem
                    key={item.id || itemIndex}
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

// KEEP YOUR ORIGINAL MENU ITEM UI
const MenuItem = (item) => {
  const { userPermissions, userRoles, submenu } = item;
  const location = useLocation();

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

  if (submenu && filteredSubmenu.length === 0) return null;

  const isActive =
    location.pathname === item.link ||
    location.pathname.startsWith(item.link + "/open/");

  const hasSubmenu = filteredSubmenu.length > 0;

  return (
    <li
      className={`menu-item ${isActive ? "active" : ""} ${
        hasSubmenu && isActive ? "open" : ""
      }`}
    >
      <NavLink
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
