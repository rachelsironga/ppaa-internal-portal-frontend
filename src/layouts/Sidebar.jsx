import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import menuData from '../data/menuData.json'
import { useSelector } from 'react-redux';

const Sidebar = () => {
    const user = useSelector((state) => state.userReducer?.data);
    const userPermissions = user?.user_permissions;
    const userRoles = user?.groups;


    console.log('userPermissions', userPermissions);
    console.log('userRoles', userRoles);

    const hasPermission = (itemPermissions, itemRoles, userPermissions, userRoles) => {
        const hasRequiredPermission = !itemPermissions || itemPermissions.some(permission => userPermissions?.includes(permission));
        const hasRequiredRole = !itemRoles || itemRoles.some(role => userRoles.includes(role));
        return hasRequiredPermission || hasRequiredRole;
    };

    console.log('user', user);
    return (
        <aside id="layout-menu" className="layout-menu menu-vertical menu bg-menu-theme">
            <div className="app-brand demo">
                <Link aria-label='Navigate to sneat homepage' to="/" className="app-brand-link">
                    <span className="app-brand-logo demo" >
                        <img src="/assets/img/nembo.jpg" alt="sneat-logo" width={"70px"} height={"70px"} aria-label='Sneat logo image' />
                    </span>
                    <span style={{ width: "70px" }}></span>
                    <span className="app-brand-logo demo">
                        <img src="/assets/img/mnhlogo.png" alt="sneat-logo" width={"70px"} height={"70px"} aria-label='Sneat logo image' />
                    </span>
                </Link>


                <a href="#" className="layout-menu-toggle menu-link text-large ms-auto d-block d-xl-none">
                    <i className="bx bx-chevron-left bx-sm align-middle"></i>
                </a>
            </div>
            <div style={{ alignContent: "center", textAlign: "center" }}>
                <span className="app-brand-text demo menu-text fw-bold ms-2">E-APPROVAL</span>
            </div>

            <div className="menu-inner-shadow"></div>


            <ul className="menu-inner py-1">
                {menuData.map((section) => (
                    <React.Fragment key={section.header}>
                        {section.header && section.items.length > 0 && (
                            <li className="menu-header small text-uppercase">
                                <span className="menu-header-text">{section.header}</span>
                            </li>
                        )}
                        {section.items.filter(item => hasPermission(item.permission, item.role, userPermissions, userRoles)).map(MenuItem)}
                    </React.Fragment>
                ))}
            </ul>
        </aside>
    );
};

const MenuItem = (item) => {
    const location = useLocation();
    const isActive = location.pathname === item.link;
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isSubmenuActive = hasSubmenu && item.submenu.some(subitem => location.pathname === subitem.link);



    return (
        <li className={`menu-item ${isActive || isSubmenuActive ? 'active' : ''} ${hasSubmenu && isSubmenuActive ? 'open' : ''}`}>
            <NavLink
                aria-label={`Navigate to ${item.text} ${!item.available ? 'Pro' : ''}`}
                to={item.link}
                className={`menu-link ${item.submenu ? 'menu-toggle' : ''}`}
                target={item.link.includes('http') ? '_blank' : undefined}
            >
                <i className={`menu-icon tf-icons ${item.icon}`}></i>
                <div>{item.text}</div> {item.available === false && (
                    <div className="badge bg-label-primary fs-tiny rounded-pill ms-auto">Pro</div>
                )}
            </NavLink>
            {item.submenu && (
                <ul key={item.submenu} className="menu-sub">{item.submenu.map(MenuItem)}</ul>
            )}
        </li>
    );
};

export default Sidebar;