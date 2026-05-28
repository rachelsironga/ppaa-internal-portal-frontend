import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';
import {
  PORTAL_FONT_STORAGE_KEY,
  applyPortalRootFontSize,
  readPortalFontPct,
} from '../helpers/portalFontSize';
import {
  PORTAL_THEME_STORAGE_KEY,
  applyPortalThemeToDocument,
  readPortalThemeIsDark,
} from '../helpers/portalTheme';
import '../css/portalSurfaceDark.css';
import '../css/sidebarEdgeToggle.css';

const Layout = ({ children, isService = false, activeService = null }) => {
  const location = useLocation();
  const internalPortalRoute = location.pathname.startsWith('/ppaa-internal-portal');
  useEffect(() => {
    // Initialize menu - Main() is loaded from /assets/js/main.js
    // Use setTimeout to ensure DOM is ready
    const timer = setTimeout(() => {
      if (typeof Main === 'function') {
        Main();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Match public portal text scale (localStorage) for all authenticated pages
  useEffect(() => {
    applyPortalRootFontSize(readPortalFontPct());
    const onStorage = (e) => {
      if (e.key === PORTAL_FONT_STORAGE_KEY && e.newValue != null) {
        applyPortalRootFontSize(parseInt(e.newValue, 10));
      }
    };
    const onPortalFont = () => applyPortalRootFontSize(readPortalFontPct());
    window.addEventListener('storage', onStorage);
    window.addEventListener('portal-font-size-changed', onPortalFont);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('portal-font-size-changed', onPortalFont);
    };
  }, []);

  // Persisted portal dark/light (public landing + staff internal portal)
  useEffect(() => {
    applyPortalThemeToDocument(readPortalThemeIsDark());
    const onStorage = (e) => {
      if (e.key === PORTAL_THEME_STORAGE_KEY) {
        applyPortalThemeToDocument(e.newValue === 'dark');
      }
    };
    const onTheme = () => applyPortalThemeToDocument(readPortalThemeIsDark());
    window.addEventListener('storage', onStorage);
    window.addEventListener('portal-theme-changed', onTheme);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('portal-theme-changed', onTheme);
    };
  }, []);

  return (
    <div
      className={`layout-wrapper layout-content-navbar layout-menu-fixed${
        internalPortalRoute ? ' internal-portal-route' : ''
      }`}
    >
      <div className="layout-container">
        <Sidebar isService={isService} activeService={activeService} />
        {/* Desktop sidebar toggle: sits between sidebar + content */}
        <button
          type="button"
          className="layout-menu-toggle ppaa-sidebar-edge-toggle d-none d-xl-flex"
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
        >
          <i className="bx bx-chevron-left" aria-hidden="true"></i>
        </button>
        <div className="layout-page">
          <Navbar isService={isService} activeService={activeService} />
          <div className="content-wrapper">
            <div className="flex-grow-1 container-p-y container-fluid">
              {children}
            </div>
            <Footer />
          </div>
        </div>
        <div className="layout-overlay layout-menu-toggle"></div>
      </div>
    </div>
  );
};

export default Layout;