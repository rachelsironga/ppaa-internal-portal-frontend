import React from 'react'
import { Link, useLocation } from 'react-router-dom';

const navData = [
    { link: '/account/settings', name: 'Personal Info' },
    { link: '/account/notifications', name: 'Account Setup' },
    { link: '/account/password', name: 'Change Password' }
];
const MenuItem = (item, index) => {
    const location = useLocation();
    const isActive = location.pathname === item.link;
    return (
        <li key={index} className="nav-item">
            <Link className={`nav-link ${isActive ? 'active' : ''}`} to={item.link} aria-label={`Go to ${item.ariaLabel}`}><i className="bx bx-user me-1"></i>{item.name}</Link>
        </li>
    )
};
export const AccountWrapper = ({ title, children }) => {
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
}
