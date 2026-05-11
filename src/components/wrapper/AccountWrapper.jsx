import React from 'react'
import { Link, useLocation } from 'react-router-dom';

// Get the base path from current location
const getBasePath = (pathname) => {
    if (pathname.startsWith('/ppaa-internal-portal')) {
        return '/ppaa-internal-portal';
    }
    if (pathname.startsWith('/ppaa-maoni')) {
        return '/ppaa-maoni';
    }
    if (pathname.startsWith('/performance-dashboard')) {
        return '/performance-dashboard';
    }
    // Default fallback
    return '/ppaa-internal-portal';
};

const AccountWrapper = ({ title, children }) => {
    const location = useLocation();
    const basePath = getBasePath(location.pathname);
    
    const navData = [
        { link: `${basePath}/account/settings`, name: 'Personal Info' },
        { link: `${basePath}/account/notifications`, name: 'Account Setup' },
        { link: `${basePath}/account/password`, name: 'Change Password' }
    ];
    const MenuItem = (item, index) => {
        const isActive = location.pathname === item.link;
        return (
            <li key={index} className="nav-item">
                <Link className={`nav-link ${isActive ? 'active' : ''}`} to={item.link} aria-label={`Go to ${item.name}`}><i className="bx bx-user me-1"></i>{item.name}</Link>
            </li>
        )
    };

    return (
        <>
            <h4 className="py-3 mb-4"><span className="text-muted fw-light">Profile /</span> {title}</h4>

            <div className="row">
                <div className="col-md-12">
                    <ul className="nav nav-pills flex-column flex-md-row mb-3">
                        {navData.map(MenuItem)}
                    </ul>
                    {children}
                </div>
            </div>
        </>
    )
};

export { AccountWrapper };
