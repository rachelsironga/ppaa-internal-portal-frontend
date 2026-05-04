import { useDispatch, useSelector } from "react-redux";
import getGreetingMessage from "../utils/greetingHandler";
import { logout } from "../redux/actions/authentication/logoutAction";
import { refreshCurrentUser } from "../redux/actions/authentication/refreshUserAction";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
import servicesList from "../data/servicesList.json";
import { isStaffOnly, isAllowedRouteForStaffOnly } from "../utils/permissions";
import {
  pathIsUnderMaintenanceApp,
  maintenanceScreenPath,
} from "../utils/maintenanceRedirects";
import {
  Search,
  Bell,
  User,
  Grid3x3,
  LogOut,
  Settings,
  ChevronRight,
  ChevronDown,
  Zap,
  Clock,
  Home,
  Briefcase,
  Menu,
  Building,
  Shield,
  Activity,
  Star,
  Sparkles,
} from "lucide-react";
import { getUserDisplayName } from "../utils/userDisplayName";
import {
  persistAndApplyPortalFontSize,
  readPortalFontPct,
} from "../helpers/portalFontSize";
import {
  applyPortalThemeToDocument,
  readPortalThemeIsDark,
  PORTAL_THEME_STORAGE_KEY,
} from "../helpers/portalTheme";
import { InternalPortalLanguageToggle } from "../components/portal/InternalPortalLanguageToggle.jsx";

const Navbar = ({ isService = false, activeService = "" }) => {
  const user = useSelector((state) => state.userReducer?.data);
  const displayName = getUserDisplayName(user);
  const userRoles = user?.groups || [];
  const staffOnly = isStaffOnly(userRoles);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredServices, setFilteredServices] = useState(servicesList);
  const [hoveredService, setHoveredService] = useState(null);
  const dropdownRef = useRef(null);
  const profileRef = useRef(null);
  const searchRef = useRef(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [portalFontPct, setPortalFontPct] = useState(() => readPortalFontPct());
  const [portalDark, setPortalDark] = useState(() => readPortalThemeIsDark());

  useEffect(() => {
    const onPortalFont = (e) => {
      setPortalFontPct(
        typeof e.detail === "number" ? e.detail : readPortalFontPct()
      );
    };
    window.addEventListener("portal-font-size-changed", onPortalFont);
    return () => window.removeEventListener("portal-font-size-changed", onPortalFont);
  }, []);

  useEffect(() => {
    const onTheme = (e) => {
      setPortalDark(
        typeof e.detail === "boolean" ? e.detail : readPortalThemeIsDark()
      );
    };
    const onStorage = (e) => {
      if (!e.key || e.key === PORTAL_THEME_STORAGE_KEY) {
        setPortalDark(readPortalThemeIsDark());
      }
    };
    window.addEventListener("portal-theme-changed", onTheme);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("portal-theme-changed", onTheme);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    dispatch(refreshCurrentUser());
  }, [dispatch]);

  // Get the correct profile path based on current location
  const getProfilePath = () => {
    const pathname = location.pathname;
    if (pathname.startsWith('/ppaa-internal-portal')) {
      return '/ppaa-internal-portal/account/settings';
    }
    if (pathname.startsWith('/performance-dashboard')) {
      return '/performance-dashboard/profile';
    }
    if (pathname.startsWith('/ict-assets')) {
      return '/ict-assets/account/settings';
    }
    if (pathname.startsWith('/training')) {
      return '/training/account/settings';
    }
    // Default to ppaa-internal-portal
    return '/ppaa-internal-portal/account/settings';
  };

  // Generate unique IDs
  const navbarId = `ppaa-navbar-${Date.now()}`;
  const servicesDropdownId = `services-dropdown-${Date.now()}`;
  const profileDropdownId = `profile-dropdown-${Date.now()}`;

  // Filter services based on search and staff-only restrictions
  useEffect(() => {
    let services = servicesList;
    
    // For staff-only users, only show services they can access
    if (staffOnly) {
      services = services.filter((service) => {
        if (service.link && isAllowedRouteForStaffOnly(service.link)) {
          return true;
        }
        // Allow PPAA Internal Portal service for staff
        if (service.link === '/ppaa-internal-portal') {
          return true;
        }
        return false;
      });
    }
    
    if (searchQuery.trim() === "") {
      setFilteredServices(services.slice(0, 6));
    } else {
      const filtered = services
        .filter(
          (service) =>
            service.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (service.description &&
              service.description
                .toLowerCase()
                .includes(searchQuery.toLowerCase()))
        )
        .slice(0, 6);
      setFilteredServices(filtered);
    }
  }, [searchQuery, staffOnly]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/auth/login");
  };

  const handleServiceClick = (service) => {
    const raw =
      service.link ||
      `/dashboard/${service.text.toLowerCase().replace(/\s+/g, "-")}`;
    const dest = pathIsUnderMaintenanceApp(raw)
      ? maintenanceScreenPath()
      : raw;
    navigate(dest);
    setShowDropdown(false);
  };

  return (
    <>
      <style>
        {`
          /* Unique ID-based CSS for complete isolation */
          #${navbarId} {
            all: initial;
            margin: 10px;
          }
          
          #${navbarId} .ppaa-navbar-main {
            background: white;
            border-bottom: 1px solid rgba(0, 0, 0, 0.08);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            padding: 8px 20px;
            position: relative;
            z-index: 1030;
          }
          
          #${navbarId} .mnh-nav-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            max-width: 100%;
            margin: 0;
            min-width: 0;
          }
          
          /* Left Section - Controls */
          #${navbarId} .mnh-nav-controls {
            display: flex;
            align-items: center;
            gap: 20px;
            min-width: 0;
            flex: 1 1 auto;
          }
          
          #${navbarId} .mnh-mobile-menu-btn {
            background: none;
            border: none;
            color: #5a6a85;
            width: 40px;
            height: 40px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          #${navbarId} .mnh-mobile-menu-btn:hover {
            background: rgba(0, 133, 63, 0.08);
            color: #00853f;
          }
          
          /* Quick Access Button */
          #${navbarId} .mnh-quick-access-container {
            position: relative;
          }
          
          #${navbarId} .mnh-quick-access-btn {
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            border: 1.5px solid rgba(0, 133, 63, 0.28);
            border-radius: 12px;
            color: #2d3748;
            padding: 10px 16px;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0, 133, 63, 0.08);
          }
          
          #${navbarId} .mnh-quick-access-btn:hover {
            background: linear-gradient(135deg, #f0faf4 0%, #e8f5e9 100%);
            border-color: rgba(0, 133, 63, 0.5);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 133, 63, 0.14);
          }
          
          #${navbarId} .mnh-quick-access-btn:active {
            transform: translateY(0);
          }
          
          /* Services Dropdown */
          #${servicesDropdownId} {
            position: absolute;
            top: 100%;
            left: 0;
            margin-top: 8px;
            width: 380px;
            background: white;
            border-radius: 16px;
            border: 1px solid rgba(0, 0, 0, 0.1);
            box-shadow: 0 20px 60px rgba(0, 133, 63, 0.12), 0 0 40px rgba(0, 133, 63, 0.06);
            overflow: hidden;
            z-index: 1050;
            animation: mnhSlideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          @keyframes mnhSlideDown {
            from {
              opacity: 0;
              transform: translateY(-12px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          
          #${servicesDropdownId} .mnh-dropdown-header {
            padding: 20px;
            background: linear-gradient(135deg, #b9d9b7 0%, #3da66a 38%, #00853f 100%);
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            position: relative;
            overflow: hidden;
          }
          
          #${servicesDropdownId} .mnh-dropdown-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.15), transparent);
            animation: mnhShimmer 3s infinite linear;
          }
          
          @keyframes mnhShimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          
          #${servicesDropdownId} .mnh-dropdown-title {
            font-size: 16px;
            font-weight: 700;
            color: white;
            margin-bottom: 6px;
            text-shadow: 0 1px 3px rgba(0, 45, 22, 0.45);
            position: relative;
          }
          
          #${servicesDropdownId} .mnh-dropdown-subtitle {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.95);
            position: relative;
          }
          
          #${servicesDropdownId} .mnh-search-container {
            padding: 20px;
            background: linear-gradient(135deg, #f8fafc 0%, #ecf8ed 100%);
            border-bottom: 1px solid rgba(0, 133, 63, 0.1);
            position: relative;
          }
          
          #${servicesDropdownId} .mnh-search-input-wrapper {
            position: relative;
          }
          
          #${servicesDropdownId} .mnh-search-input {
            width: 100%;
            padding: 12px 16px 12px 45px;
            background: white;
            border: 2px solid rgba(0, 133, 63, 0.2);
            border-radius: 12px;
            font-size: 14px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            color: #334155;
            box-shadow: 0 2px 10px rgba(0, 133, 63, 0.06);
          }
          
          #${servicesDropdownId} .mnh-search-input:focus {
            outline: none;
            border-color: #00853f;
            box-shadow: 0 0 0 3px rgba(0, 133, 63, 0.18), 0 4px 20px rgba(0, 133, 63, 0.15);
            transform: scale(1.02);
          }
          
          #${servicesDropdownId} .mnh-search-icon {
            position: absolute;
            left: 16px;
            top: 50%;
            transform: translateY(-50%);
            color: #00853f;
            font-size: 16px;
            transition: all 0.3s ease;
          }
          
          #${servicesDropdownId} .mnh-search-input:focus + .mnh-search-icon {
            color: #006b34;
            transform: translateY(-50%) scale(1.1);
          }
          
          #${servicesDropdownId} .mnh-services-grid {
            max-height: 320px;
            overflow-y: auto;
            padding: 16px;
            display: grid;
            grid-template-columns: 1fr;
            gap: 10px;
            background: linear-gradient(135deg, #fafcfb 0%, #f4faf5 100%);
          }
          
          #${servicesDropdownId} .mnh-service-item {
            background: white;
            border: 2px solid transparent;
            border-radius: 14px;
            padding: 16px;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            gap: 14px;
            position: relative;
            overflow: hidden;
            box-shadow: 0 3px 15px rgba(0, 0, 0, 0.05);
          }
          
          #${servicesDropdownId} .mnh-service-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(185, 217, 183, 0.35), rgba(0, 133, 63, 0.12));
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          
          #${servicesDropdownId} .mnh-service-item:hover {
            transform: translateY(-4px) scale(1.02);
            border-image: linear-gradient(135deg, #b9d9b7, #3da66a, #00853f) 1;
            box-shadow: 0 12px 30px rgba(0, 133, 63, 0.15), 0 0 20px rgba(61, 166, 106, 0.12);
          }
          
          #${servicesDropdownId} .mnh-service-item:hover::before {
            opacity: 1;
          }
          
          #${servicesDropdownId} .mnh-service-item:hover .mnh-service-icon {
            background: linear-gradient(135deg, #b9d9b7 0%, #3da66a 45%, #00853f 100%);
            transform: rotate(12deg) scale(1.15);
          }
          
          #${servicesDropdownId} .mnh-service-icon {
            width: 40px;
            height: 40px;
            border-radius: 12px;
            background: linear-gradient(135deg, rgba(185, 217, 183, 0.45), rgba(0, 133, 63, 0.12));
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
          }
          
          #${servicesDropdownId} .mnh-service-icon::after {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent);
            transform: rotate(45deg);
            transition: all 0.6s ease;
            opacity: 0;
          }
          
          #${servicesDropdownId} .mnh-service-item:hover .mnh-service-icon::after {
            opacity: 1;
            transform: rotate(45deg) translate(50%, 50%);
          }
          
          #${servicesDropdownId} .mnh-service-icon i {
            font-size: 18px;
            background: linear-gradient(135deg, #5aaf78 0%, #00853f 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            transition: all 0.4s ease;
            position: relative;
            z-index: 1;
          }
          
          #${servicesDropdownId} .mnh-service-item:hover .mnh-service-icon i {
            -webkit-text-fill-color: white;
            background: none;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
          }
          
          #${servicesDropdownId} .mnh-service-content {
            flex: 1;
            min-width: 0;
          }
          
          #${servicesDropdownId} .mnh-service-name {
            font-size: 14px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 4px;
            transition: all 0.3s ease;
            background: linear-gradient(90deg, #1e293b, #334155);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          
          #${servicesDropdownId} .mnh-service-item:hover .mnh-service-name {
            -webkit-text-fill-color: #00853f;
            background: none;
          }
          
          #${servicesDropdownId} .mnh-service-category {
            font-size: 11px;
            color: #64748b;
            font-weight: 500;
            background: linear-gradient(90deg, #64748b, #94a3b8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          
          #${servicesDropdownId} .ppaa-service-arrow {
            opacity: 0;
            color: #94a3b8;
            transform: translateX(-8px);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          #${servicesDropdownId} .mnh-service-item:hover .mnh-service-arrow {
            opacity: 1;
            color: #00853f;
            transform: translateX(0);
          }
          
          #${servicesDropdownId} .mnh-dropdown-footer {
            padding: 20px;
            background: linear-gradient(135deg, #b9d9b7 0%, #3da66a 42%, #00853f 100%);
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            text-align: center;
          }
          
          #${servicesDropdownId} .mnh-view-all-btn {
            width: 100%;
            background: rgba(255, 255, 255, 0.95);
            border: none;
            color: #00853f;
            padding: 12px 20px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            position: relative;
            overflow: hidden;
          }
          
          #${servicesDropdownId} .mnh-view-all-btn:hover {
            background: white;
            color: #006b34;
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 133, 63, 0.2);
          }
          
          #${servicesDropdownId} .mnh-view-all-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
            transition: left 0.6s ease;
          }
          
          #${servicesDropdownId} .mnh-view-all-btn:hover::before {
            left: 100%;
          }
          
          /* Right Section - User Info */
          #${navbarId} .mnh-nav-right {
            display: flex;
            align-items: center;
            gap: 16px;
            flex-shrink: 0;
          }
          
          #${navbarId} .portal-nav-theme {
            flex-shrink: 0;
          }
          
          #${navbarId} .internal-portal-lang-toggle {
            flex-shrink: 0;
          }
          
          /* User Profile Compact */
          #${navbarId} .mnh-user-profile-compact {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 12px;
            background: linear-gradient(135deg, #f8fafc 0%, #f0faf4 100%);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            border: 1.5px solid rgba(0, 133, 63, 0.2);
          }
          
          #${navbarId} .mnh-user-profile-compact:hover {
            background: linear-gradient(135deg, #ecf8ed 0%, #d4eed8 100%);
            border-color: rgba(0, 133, 63, 0.45);
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(0, 133, 63, 0.12);
          }
          
          #${navbarId} .mnh-user-avatar {
            width: 38px;
            height: 38px;
            border-radius: 10px;
            overflow: hidden;
            background: linear-gradient(135deg, #b9d9b7 0%, #3da66a 42%, #00853f 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 700;
            font-size: 15px;
            box-shadow: 0 4px 12px rgba(0, 133, 63, 0.28);
            transition: all 0.3s ease;
          }
          
          #${navbarId} .mnh-user-profile-compact:hover .mnh-user-avatar {
            transform: rotate(8deg) scale(1.1);
            box-shadow: 0 6px 20px rgba(0, 133, 63, 0.38);
          }
          
          #${navbarId} .mnh-user-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          #${navbarId} .mnh-user-info-compact {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          
          #${navbarId} .mnh-user-name {
            font-size: 13px;
            font-weight: 700;
            color: #1e293b;
            white-space: nowrap;
            background: linear-gradient(90deg, #1e293b, #334155);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
                        text-transform: uppercase;

          }
          
          #${navbarId} .mnh-user-designation {
            font-size: 11.5px;
            text-transform: uppercase;
            color: #64748b;
            font-weight: 600;
            background: linear-gradient(90deg, #64748b, #94a3b8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          
          #${navbarId} .mnh-user-chevron {
            color: #94a3b8;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          #${navbarId} .mnh-user-profile-compact.active .mnh-user-chevron {
            transform: rotate(180deg);
            color: #00853f;
          }
          
          /* Notification Button */
          #${navbarId} .mnh-notification-btn {
            position: relative;
            background: none;
            border: none;
            width: 44px;
            height: 44px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            color: #5a6a85;
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            border: 1.5px solid rgba(0, 133, 63, 0.15);
          }
          
          #${navbarId} .mnh-notification-btn:hover {
            background: linear-gradient(135deg, #ecf8ed 0%, #d4eed8 100%);
            border-color: rgba(0, 133, 63, 0.4);
            color: #00853f;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 133, 63, 0.12);
          }
          
          #${navbarId} .mnh-notification-badge {
            position: absolute;
            top: 8px;
            right: 8px;
            width: 10px;
            height: 10px;
            background: linear-gradient(135deg, #e53935, #ff6b6b);
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(229, 57, 53, 0.4);
            animation: mnhPulse 2s infinite;
          }
          
          @keyframes mnhPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
          }
          
          /* Active Service Badge */
          #${navbarId} .mnh-active-service-badge {
            background: linear-gradient(135deg, #b9d9b7 0%, #3da66a 42%, #00853f 100%);
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 700;
            margin-left: 8px;
            box-shadow: 0 3px 15px rgba(0, 133, 63, 0.35);
            animation: mnhGlow 2s infinite alternate;
          }
          
          @keyframes mnhGlow {
            0% { box-shadow: 0 3px 15px rgba(0, 133, 63, 0.35); }
            100% { box-shadow: 0 3px 25px rgba(0, 133, 63, 0.55), 0 0 15px rgba(61, 166, 106, 0.35); }
          }
          
          /* Scrollbar Styling */
          #${servicesDropdownId} .mnh-services-grid::-webkit-scrollbar {
            width: 6px;
          }
          
          #${servicesDropdownId} .mnh-services-grid::-webkit-scrollbar-track {
            background: rgba(0, 133, 63, 0.06);
            border-radius: 3px;
          }
          
          #${servicesDropdownId} .mnh-services-grid::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #7bc49a 0%, #00853f 100%);
            border-radius: 3px;
          }



           #${navbarId} .mnh-sidebar-toggle-btn {
            background: none;
            border: none;
            color: #5a6a85;
            width: 40px;
            height: 40px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          #${navbarId} .mnh-sidebar-toggle-btn:hover {
            background: rgba(0, 133, 63, 0.08);
            color: #00853f;
          }
          
          #${navbarId} .mnh-sidebar-toggle-btn i {
            font-size: 20px;
            transition: transform 0.3s ease;
          }
          
          /* When sidebar is collapsed, rotate the icon */
          body.menu-collapsed #${navbarId} .mnh-sidebar-toggle-btn i {
            transform: rotate(180deg);
          }
          
          /* Mobile Responsive */
          @media (max-width: 768px) {
            #${navbarId} .ppaa-navbar-main {
              padding: 10px 16px;
            }
            
            #${navbarId} .mnh-nav-controls {
              gap: 12px;
            }
            
            #${navbarId} .mnh-quick-access-btn {
              padding: 8px 12px;
              font-size: 13px;
            }
            
            #${servicesDropdownId} {
              width: 320px;
              left: 50%;
              transform: translateX(-50%);
            }
            
            #${profileDropdownId} {
              width: 380px;
            }
            
            #${navbarId} .mnh-user-name {
              display: none;
            }
            
            #${navbarId} .mnh-user-designation {
              display: none;
            }
            
            #${navbarId} .mnh-user-profile-compact {
              padding: 6px;
            }
          }
          
          @media (max-width: 480px) {
            #${servicesDropdownId} {
              width: 280px;
              left: 50%;
              right: auto;
              transform: translateX(-50%) !important;
              position: fixed !important;
              margin-left: 0;
              max-width: calc(100vw - 20px);
            }
            
            #${profileDropdownId} {
              width: 280px;
            }
            
            #${navbarId} .mnh-quick-access-btn span:first-child {
              display: none;
            }
            
            #${navbarId} .mnh-quick-access-btn {
              padding: 8px;
            }
          }
        `}
      </style>

      <div id={navbarId}>
        <nav className="ppaa-navbar-main navbar-detached  container-fluid">
          <div className="mnh-nav-content">
            {/* Left Section - Controls */}
            <div className="mnh-nav-controls">
              {/* Mobile Menu Button */}
              <button className="mnh-mobile-menu-btn d-xl-none layout-menu-toggle menu-link text-large ms-auto d-block">
                <Menu size={20} />
              </button>

              {/* Quick Access Services */}
              <div className="mnh-quick-access-container" ref={dropdownRef}>
                <button
                  className="mnh-quick-access-btn"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <Grid3x3 size={18} />
                  <span>Services</span>
                  {activeService && (
                    <span className="mnh-active-service-badge">
                      {activeService
                        .split("-")
                        .map(
                          (word) => word.charAt(0).toUpperCase() + word.slice(1)
                        )
                        .join(" ")}
                    </span>
                  )}
                  <ChevronDown size={14} className="mnh-user-chevron" />
                </button>

                {/* Services Dropdown */}
                {showDropdown && (
                  <div id={servicesDropdownId}>
                    <div className="mnh-dropdown-header">
                      <div className="mnh-dropdown-title">
                        Quick Access Services
                      </div>
                      <div className="mnh-dropdown-subtitle">
                        Select a service to navigate instantly
                      </div>
                    </div>

                    <div className="mnh-search-container">
                      <div className="mnh-search-input-wrapper">
                        <Search className="mnh-search-icon" size={16} />
                        <input
                          ref={searchRef}
                          type="text"
                          className="mnh-search-input"
                          placeholder="Search services..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="mnh-services-grid">
                      {filteredServices.map((service, idx) => (
                        <div
                          key={idx}
                          className="mnh-service-item"
                          onClick={() => handleServiceClick(service)}
                          onMouseEnter={() => setHoveredService(idx)}
                          onMouseLeave={() => setHoveredService(null)}
                        >
                          <div className="mnh-service-icon">
                            <i className={service.icon}></i>
                          </div>
                          <div className="mnh-service-content">
                            <div className="mnh-service-name">
                              {service.text}
                            </div>
                            {service.category && (
                              <div className="mnh-service-category">
                                {service.category}
                              </div>
                            )}
                          </div>
                          <ChevronRight
                            className="mnh-service-arrow"
                            size={16}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="mnh-dropdown-footer">
                      <button
                        className="mnh-view-all-btn"
                        onClick={() => {
                          navigate("/services");
                          setShowDropdown(false);
                        }}
                      >
                        <Grid3x3 size={16} />
                        View All Services
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Section - User Info */}
            <div className="mnh-nav-right">
              {location.pathname.startsWith("/ppaa-internal-portal") ? (
                <div
                  className="portal-nav-theme d-flex align-items-center gap-1 me-1 flex-nowrap"
                  aria-label="Portal appearance"
                >
                  <InternalPortalLanguageToggle className="me-1" />
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary d-none d-md-flex"
                    onClick={() => applyPortalThemeToDocument(!portalDark)}
                    title={portalDark ? "Switch to light mode" : "Switch to dark mode"}
                    aria-pressed={portalDark}
                    style={{
                      borderRadius: "50%",
                      width: "34px",
                      height: "34px",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <i
                      className={portalDark ? "bx bx-sun" : "bx bx-moon"}
                      aria-hidden
                    />
                  </button>
                  <div
                    className="d-none d-md-flex align-items-center gap-1"
                    title="Portal text size"
                    aria-label="Portal text size controls"
                  >
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() =>
                        persistAndApplyPortalFontSize(readPortalFontPct() - 10)
                      }
                      title="Decrease text size"
                      style={{
                        borderRadius: "50%",
                        width: "34px",
                        height: "34px",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <i className="bx bx-minus" aria-hidden />
                    </button>
                    <span
                      className="text-muted small"
                      style={{ minWidth: "40px", textAlign: "center", fontWeight: 600 }}
                    >
                      {portalFontPct}%
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() =>
                        persistAndApplyPortalFontSize(readPortalFontPct() + 10)
                      }
                      title="Increase text size"
                      style={{
                        borderRadius: "50%",
                        width: "34px",
                        height: "34px",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <i className="bx bx-plus" aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary px-2 py-0"
                      onClick={() => persistAndApplyPortalFontSize(100)}
                      title="Reset text size"
                      style={{ fontSize: "0.7rem" }}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              ) : null}
              {/* Notifications */}
              <button className="mnh-notification-btn">
                <Bell size={20} />
                <span className="mnh-notification-badge"></span>
              </button>

              {/* User Profile */}
              <div className="profile-dropdown-container" ref={profileRef}>
                <div
                  className={`mnh-user-profile-compact ${
                    showProfileDropdown ? "active" : ""
                  }`}
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                >
                  <div className="mnh-user-avatar">
                    {user && user.photo && user.photo.trim() !== "" ? (
                      <img src={user.photo} alt={displayName} />
                    ) : (
                      <User size={20} />
                    )}
                  </div>
                  <div className="mnh-user-info-compact">
                    <div className="mnh-user-name">{displayName}</div>
                    <div className="mnh-user-designation">
                      {(() => {
                        const level =
                          user?.position?.level_name ||
                          user?.current_level_name;
                        if (!level) return "PPAA Staff";
                        return level.length > 35
                          ? `${level.substring(0, 32)}...`
                          : level;
                      })()}
                    </div>
                  </div>
                  <ChevronDown size={14} className="mnh-user-chevron" />
                </div>

                {/* Profile Dropdown (Kept minimal to avoid CSS conflicts) */}
                {showProfileDropdown && (
                  <div
                    id={profileDropdownId}
                    style={{
                      position: "absolute",
                      top: "100%",
                      right: 0,
                      marginTop: "8px",
                      width: "280px",
                      background: "white",
                      borderRadius: "16px",
                      border: "1px solid rgba(0, 0, 0, 0.1)",
                      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
                      overflow: "hidden",
                      zIndex: 1050,
                      animation:
                        "mnhSlideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    {/* Simple profile dropdown content */}
                    <div
                      style={{
                        padding: "20px",
                        background:
                          "linear-gradient(135deg, #b9d9b7 0%, #3da66a 42%, #00853f 100%)",
                        color: "white",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <div
                          style={{
                            width: "60px",
                            height: "50px",
                            borderRadius: "12px",
                            overflow: "hidden",
                            background: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {user && user.photo && user.photo.trim() !== "" ? (
                            <img
                              src={user.photo}
                              alt={displayName}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <User size={24} color="#00853f" />
                          )}
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: "700",
                              marginBottom: "4px",
                            }}
                          >
                            {displayName}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              opacity: 0.9,
                              textTransform: "uppercase",
                            }}
                          >
                            {user?.position?.level_name ||
                              user?.current_level_name ||
                              "PPAA Staff"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: "16px" }}>
                      <button
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px 16px",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          borderRadius: "10px",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#f1f5f9")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "none")
                        }
                        onClick={() => {
                          navigate(getProfilePath());
                          setShowProfileDropdown(false);
                        }}
                      >
                        <User size={16} color="#64748b" />
                        <span
                          style={{
                            flex: 1,
                            textAlign: "left",
                            fontSize: "14px",
                          }}
                        >
                          My Profile
                        </span>
                      </button>

                      <button
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px 16px",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          borderRadius: "10px",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#f1f5f9")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "none")
                        }
                        onClick={handleLogout}
                      >
                        <LogOut size={16} color="#e53935" />
                        <span
                          style={{
                            flex: 1,
                            textAlign: "left",
                            fontSize: "14px",
                            color: "#e53935",
                          }}
                        >
                          Log Out
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
};

export default Navbar;
