import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import "animate.css";
import "../../../../css/portalAnnouncementNewBadge.css";
import "../../../../css/portalFaqTheme.css";
import "../../../../css/portalHighlightCarousel.css";
import "../../../../css/portalWelcomeHero.css";
import "../../../../css/portalSurfaceDark.css";
import {
  readPortalThemeIsDark,
  PORTAL_THEME_STORAGE_KEY,
} from "../../../../helpers/portalTheme";
import { useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { formatDate } from "../../../../helpers/DateFormater";
import {
  buildInterleavedPortalHighlightItems,
  filterDashboardAnnouncements,
  filterDashboardEvents,
  filterDashboardTodos,
  getTodoDashboardAccentColor,
  isPortalAnnouncementNew,
  useUtcDateKey,
} from "../../../../helpers/dashboardActivityVisibility";
import showToast from "../../../../helpers/ToastHelper";
import { normalizePublicPortalAssetUrl } from "../../../../helpers/publicPortalAssetUrl";
import { portalPublicApi } from "../../../../portalPublicApi";
import { recordQuickLinkClick } from "../quick_links/Queries";
import { downloadPortalDocument } from "../documents/Queries";
import { downloadPortalAnnouncement } from "../announcements/Queries";
import {
  getEventTypeBadge,
  getEventTypeCalendarStyle,
} from "../events/eventDisplay";
import { getUserFormalFullName } from "../../../../utils/userDisplayName";
import { refreshCurrentUser } from "../../../../redux/actions/authentication/refreshUserAction";
import { PrFlyersGallery } from "../../../../components/portal/PrFlyersGallery.jsx";
import { useInternalPortalI18n } from "../../../../contexts/InternalPortalI18nContext.jsx";
import { INTERNAL_PORTAL_TRANSLATIONS } from "../../../../i18n/internalPortalTranslations";
import { InternalPortalLanguageToggle } from "../../../../components/portal/InternalPortalLanguageToggle.jsx";
import {
  dayHasEventEndDate,
  getCalendarDisplayEventsForDay,
  shouldShowEventEndMarkOnCalendarDay,
  shouldShowEventTitleOnCalendarDay,
  truncateEventTitle,
} from "../../../../helpers/portalEventCalendar";

// Simple Calendar Component
const SimpleCalendar = ({ events = [], onEventClick }) => {
  const { locale, t } = useInternalPortalI18n();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const pp =
    (INTERNAL_PORTAL_TRANSLATIONS[locale] || INTERNAL_PORTAL_TRANSLATIONS.en)
      .publicPortal;
  const monthNames = pp.calendarMonths;
  const dayNames = pp.calendarDays;
  
  const getEventsForDate = (day) =>
    getCalendarDisplayEventsForDay(events, year, month, day);

  const hasEventEndDate = (day) =>
    dayHasEventEndDate(events, year, month, day);
  
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  
  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }
  
  // Check if there are any events
  const hasEvents = events && events.length > 0;
  
  return (
    <div className="calendar-container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <button className="btn btn-sm btn-outline-primary" onClick={goToPreviousMonth}>
          <i className="bx bx-chevron-left"></i>
        </button>
        <h6 className="mb-0">{monthNames[month]} {year}</h6>
        <button className="btn btn-sm btn-outline-primary" onClick={goToNextMonth}>
          <i className="bx bx-chevron-right"></i>
        </button>
      </div>
      {!hasEvents ? (
        <div className="text-center py-5">
          <i className="bx bx-calendar-x fs-1 mb-3" style={{ color: "#00f2fe", opacity: 0.5 }}></i>
          <p className="text-muted mb-0" style={{ fontSize: "0.95rem" }}>
            {t("publicPortal.noEvents")}
          </p>
        </div>
      ) : (
        <div className="table-responsive">
        <table className="table table-bordered mb-0" style={{ fontSize: "0.85rem" }}>
          <thead>
            <tr>
              {dayNames.map(day => (
                <th key={day} className="text-center" style={{ width: "14.28%", padding: "0.5rem" }}>
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: Math.ceil(days.length / 7) }).map((_, weekIndex) => (
              <tr key={weekIndex}>
                {Array.from({ length: 7 }).map((_, dayIndex) => {
                  const day = days[weekIndex * 7 + dayIndex];
                  const dayEvents = day ? getEventsForDate(day) : [];
                  const isToday = day && 
                    new Date().getDate() === day && 
                    new Date().getMonth() === month && 
                    new Date().getFullYear() === year;
                  
                  const isEndDate = day ? hasEventEndDate(day) : false;
                  return (
                    <td
                      key={dayIndex}
                      className={`text-center ${isToday ? 'bg-primary-subtle' : ''}`}
                      style={{
                        height: "80px",
                        verticalAlign: "top",
                        padding: "0.25rem",
                        position: "relative"
                      }}
                    >
                      {day && (
                        <>
                          <div className="fw-medium mb-1 d-flex align-items-center justify-content-center gap-1">
                            {day}
                            {isEndDate && (
                              <i 
                                className="bx bx-circle" 
                                style={{ 
                                  fontSize: "0.375rem",
                                  color: "#00f2fe",
                                  marginTop: "2px"
                                }}
                                title={t("publicPortal.eventEndDate")}
                              ></i>
                            )}
                          </div>
                          {dayEvents.length > 0 && (
                            <div className="d-flex flex-column gap-1">
                              {dayEvents.slice(0, 2).map(({ event, dayRole }, idx) => {
                                const chipStyle = getEventTypeCalendarStyle(
                                  event.event_type
                                );
                                const isStartCard = shouldShowEventTitleOnCalendarDay(dayRole);
                                const isEndMark = shouldShowEventEndMarkOnCalendarDay(
                                  dayRole,
                                  event
                                );
                                return (
                                  <div
                                    key={event.uid || idx}
                                    className={
                                      isEndMark
                                        ? "d-flex justify-content-center"
                                        : "badge border-0"
                                    }
                                    style={
                                      isEndMark
                                        ? { cursor: "pointer" }
                                        : {
                                            fontSize: "0.65rem",
                                            cursor: "pointer",
                                            ...chipStyle,
                                            padding: "3px 6px",
                                          }
                                    }
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onEventClick) onEventClick(event);
                                    }}
                                    title={
                                      event.title ? event.title.toUpperCase() : ""
                                    }
                                  >
                                    {isStartCard ? (
                                      truncateEventTitle(event.title)
                                    ) : isEndMark ? (
                                      <span
                                        aria-hidden="true"
                                        style={{
                                          display: "inline-block",
                                          width: "0.5rem",
                                          height: "0.5rem",
                                          borderRadius: "50%",
                                          backgroundColor:
                                            chipStyle.backgroundColor,
                                          border: `2px solid ${chipStyle.backgroundColor}`,
                                          boxShadow: `0 0 0 1px ${chipStyle.color}`,
                                        }}
                                      />
                                    ) : null}
                                  </div>
                                );
                              })}
                              {dayEvents.length > 2 && (
                                <small className="text-muted">
                                  {t("publicPortal.moreCount", {
                                    n: dayEvents.length - 2,
                                  })}
                                </small>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
};

export const StaffDashboard = () => {
  const { t } = useInternalPortalI18n();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.userReducer?.data);
  const welcomeFormalName = useMemo(() => getUserFormalFullName(user), [user]);
  const navigate = useNavigate();
  const DASHBOARD_CACHE_KEY = `internalPortalDashboardCache:${user?.guid || "anonymous"}`;
  const DASHBOARD_CACHE_TTL_MS = 2 * 60 * 1000;

  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [events, setEvents] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [quickLinks, setQuickLinks] = useState([]);
  const [prFlyers, setPrFlyers] = useState([]);
  const [todosRaw, setTodosRaw] = useState([]);
  const utcDateKey = useUtcDateKey();
  const todos = useMemo(
    () => filterDashboardTodos(todosRaw),
    [todosRaw, utcDateKey]
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [announcementOffset, setAnnouncementOffset] = useState(0);
  const [todoOffset, setTodoOffset] = useState(0);
  const [selectedFaq, setSelectedFaq] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [documentOffset, setDocumentOffset] = useState(0);
  /** Documents card: switch between category browser and FAQs (separate search from Events row FAQs). */
  const [docsLibraryTab, setDocsLibraryTab] = useState("documents");
  const [libraryFaqSearch, setLibraryFaqSearch] = useState("");
  const [libraryFaqOffset, setLibraryFaqOffset] = useState(0);
  const [stats, setStats] = useState({
    totalAnnouncements: 0,
    totalDocuments: 0,
    totalEvents: 0,
    totalFAQs: 0,
    totalQuickLinks: 0,
    activeTodos: 0,
    pinnedAnnouncements: 0,
    upcomingEvents: 0,
  });

  const [quickLinksSearch, setQuickLinksSearch] = useState("");
  const [quickLinksPage, setQuickLinksPage] = useState(0);

  useEffect(() => {
    dispatch(refreshCurrentUser());
  }, [dispatch]);

  // Dashboard section order for drag-and-drop
  const defaultSectionOrder = [
    { id: 'events-faqs', name: 'Events & PR' },
    { id: 'todos-announcements', name: 'Todos & Announcements' },
    { id: 'documents', name: 'Documents' },
    { id: 'quick-links', name: 'Quick Links' },
  ];

  const [sectionOrder, setSectionOrder] = useState(() => {
    const saved = localStorage.getItem('dashboardSectionOrder');
    return saved ? JSON.parse(saved) : defaultSectionOrder;
  });

  const [portalDark, setPortalDark] = useState(() => readPortalThemeIsDark());

  // Welcome highlight: one carousel — announcement, todo, event, then repeat (same animation).
  const combinedItems = useMemo(
    () =>
      buildInterleavedPortalHighlightItems({
        announcements,
        todos,
        events,
      }),
    [todos, announcements, events]
  );

  useEffect(() => {
    setCurrentIndex((prev) => {
      if (combinedItems.length === 0) return 0;
      return prev < combinedItems.length ? prev : 0;
    });
  }, [combinedItems]);

  // Auto-rotate through items
  useEffect(() => {
    if (combinedItems.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % combinedItems.length);
    }, 5000); // Change every 5 seconds
    return () => clearInterval(interval);
  }, [combinedItems.length]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Save section order to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dashboardSectionOrder', JSON.stringify(sectionOrder));
  }, [sectionOrder]);

  useEffect(() => {
    const onTheme = (e) => {
      setPortalDark(
        typeof e.detail === "boolean" ? e.detail : readPortalThemeIsDark(),
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

  // Handle drag end
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(sectionOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSectionOrder(items);
  };

  // Handle FAQ modal cleanup
  useEffect(() => {
    const modalElement = document.getElementById('faqViewModal');
    if (!modalElement) return;

    const handleHidden = () => {
      setSelectedFaq(null);
    };

    modalElement.addEventListener('hidden.bs.modal', handleHidden);
    return () => {
      modalElement.removeEventListener('hidden.bs.modal', handleHidden);
    };
  }, []);

  // Handle Announcement modal cleanup
  useEffect(() => {
    const modalElement = document.getElementById('announcementViewModal');
    if (!modalElement) return;

    const handleHidden = () => {
      setSelectedAnnouncement(null);
    };

    modalElement.addEventListener('hidden.bs.modal', handleHidden);
    return () => {
      modalElement.removeEventListener('hidden.bs.modal', handleHidden);
    };
  }, []);

  // Handle Todo modal cleanup
  useEffect(() => {
    const modalElement = document.getElementById('todoViewModal');
    if (!modalElement) return;

    const handleHidden = () => {
      setSelectedTodo(null);
    };

    modalElement.addEventListener('hidden.bs.modal', handleHidden);
    return () => {
      modalElement.removeEventListener('hidden.bs.modal', handleHidden);
    };
  }, []);

  // Handle Event modal cleanup
  useEffect(() => {
    const modalElement = document.getElementById('eventViewModal');
    if (!modalElement) return;

    const handleHidden = () => {
      setSelectedEvent(null);
    };

    modalElement.addEventListener('hidden.bs.modal', handleHidden);
    return () => {
      modalElement.removeEventListener('hidden.bs.modal', handleHidden);
    };
  }, []);

  const fetchDashboardData = async () => {
    const readCachedDashboard = () => {
      try {
        const raw = sessionStorage.getItem(DASHBOARD_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed?.timestamp) return null;
        if (Date.now() - parsed.timestamp >= DASHBOARD_CACHE_TTL_MS) return null;
        return parsed.apiPayload ?? parsed.data ?? null;
      } catch {
        return null;
      }
    };

    const hydrateDashboardPayload = (payload) => {
      if (!payload) return;
      setAnnouncements(filterDashboardAnnouncements(payload.announcements || []));
      setDocuments(payload.documents || []);
      setEvents(filterDashboardEvents(payload.events || []));
      setFaqs(payload.faqs || []);
      setQuickLinks(payload.quick_links || []);
      setPrFlyers(payload.pr_flyers || []);
      setTodosRaw(payload.todos || []);
      setStats(payload.stats || {});
    };

    try {
      const cachedPayload = readCachedDashboard();
      if (cachedPayload) {
        hydrateDashboardPayload(cachedPayload);
        setLoading(false);
      } else {
        setLoading(true);
      }

      const response = await portalPublicApi.get("/api/internal-portal/dashboard-summary");
      const dashboardData = response?.data?.data || response?.data || {};
      hydrateDashboardPayload(dashboardData);

      try {
        sessionStorage.setItem(
          DASHBOARD_CACHE_KEY,
          JSON.stringify({
            timestamp: Date.now(),
            apiPayload: dashboardData,
          })
        );
      } catch {
        // Ignore cache write failures.
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      LOW: "bg-label-info",
      MEDIUM: "bg-label-primary",
      HIGH: "bg-label-warning",
      URGENT: "bg-label-danger",
    };
    return colors[priority] || "bg-label-secondary";
  };

  const getTodoStatusBadge = (status) => {
    const badges = {
      PENDING: "badge bg-warning text-white",
      IN_PROGRESS: "badge bg-info text-white",
      COMPLETED: "badge bg-success text-white",
      CANCELLED: "badge bg-secondary text-white",
    };
    return badges[status] || "badge bg-secondary text-white";
  };

  const getTodoPriorityBadge = (priority) => {
    const badges = {
      LOW: "badge bg-success text-white",
      MEDIUM: "badge bg-primary text-white",
      HIGH: "badge bg-warning text-white",
      URGENT: "badge bg-danger text-white",
    };
    return badges[priority] || "badge bg-secondary text-white";
  };

  const truncateWords = (text, minWords = 15) => {
    if (!text) return "";
    const words = text.trim().split(/\s+/);
    if (words.length <= minWords) return text;
    return words.slice(0, minWords).join(" ") + "...";
  };

  const formatTodoDate = (dateString, includeTime = true) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      
      // Always check if time exists in the original string
      const hasTime = dateString.includes('T') && dateString.split('T')[1] && 
                     dateString.split('T')[1].split('.')[0] !== '00:00:00' &&
                     (date.getHours() !== 0 || date.getMinutes() !== 0);
      
      // Format date components
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      
      if (includeTime && hasTime) {
        // Convert to 12-hour format with AM/PM
        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        const hoursFormatted = String(hours).padStart(2, '0');
        return `${day}/${month}/${year} ${hoursFormatted}:${minutes} ${ampm}`;
      } else {
        return `${day}/${month}/${year}`;
      }
    } catch (e) {
      console.error("Error formatting date:", e);
      return "";
    }
  };

  const quickLinkPalette = useMemo(() => {
    if (portalDark) {
      return [
        { bg: "rgba(0, 133, 63, 0.22)", border: "#34d399", icon: "#6ee7b7", text: "#e2e8f0" },
        { bg: "rgba(245, 87, 108, 0.15)", border: "#fb7185", icon: "#fda4af", text: "#e2e8f0" },
        { bg: "rgba(0, 242, 254, 0.12)", border: "#22d3ee", icon: "#67e8f9", text: "#e2e8f0" },
        { bg: "rgba(254, 225, 64, 0.14)", border: "#facc15", icon: "#fde047", text: "#e2e8f0" },
        { bg: "rgba(255, 107, 107, 0.15)", border: "#f87171", icon: "#fca5a5", text: "#e2e8f0" },
        { bg: "rgba(79, 172, 254, 0.15)", border: "#38bdf8", icon: "#7dd3fc", text: "#e2e8f0" },
        { bg: "rgba(61, 166, 106, 0.18)", border: "#4ade80", icon: "#86efac", text: "#e2e8f0" },
        { bg: "rgba(252, 182, 159, 0.14)", border: "#fdba74", icon: "#fed7aa", text: "#e2e8f0" },
      ];
    }
    return [
      { bg: "#f0f4ff", border: "#00853f", icon: "#00853f", text: "#333" },
      { bg: "#fff0f5", border: "#f5576c", icon: "#f5576c", text: "#333" },
      { bg: "#e6f7ff", border: "#00f2fe", icon: "#00f2fe", text: "#333" },
      { bg: "#fff9e6", border: "#fee140", icon: "#fee140", text: "#333" },
      { bg: "#ffe6e6", border: "#ff6b6b", icon: "#ff6b6b", text: "#333" },
      { bg: "#f0f9ff", border: "#4facfe", icon: "#4facfe", text: "#333" },
      { bg: "#f5f0ff", border: "#3da66a", icon: "#3da66a", text: "#333" },
      { bg: "#fff5e6", border: "#fcb69f", icon: "#fcb69f", text: "#333" },
    ];
  }, [portalDark]);

  const filteredQuickLinks = useMemo(() => {
    const q = (quickLinksSearch || "").trim().toLowerCase();
    const list = Array.isArray(quickLinks) ? quickLinks : [];
    if (!q) return list;
    return list.filter((l) => {
      const hay = `${l?.name || ""} ${l?.title || ""} ${l?.url || ""} ${l?.description || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [quickLinks, quickLinksSearch]);

  const QUICK_LINKS_PAGE_SIZE = 12; // ~2 rows on lg (col-lg-3)
  const quickLinksTotalPages = Math.max(
    1,
    Math.ceil(filteredQuickLinks.length / QUICK_LINKS_PAGE_SIZE)
  );
  const quickLinksPageSafe = Math.min(
    Math.max(0, quickLinksPage),
    quickLinksTotalPages - 1
  );
  const pagedQuickLinks = useMemo(() => {
    const start = quickLinksPageSafe * QUICK_LINKS_PAGE_SIZE;
    return filteredQuickLinks.slice(start, start + QUICK_LINKS_PAGE_SIZE);
  }, [filteredQuickLinks, quickLinksPageSafe]);

  if (loading) {
    return (
      <div className="portal-surface-scope text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t("dashboard.loadingTitle")}</span>
        </div>
        <p className="mt-2 text-muted">{t("dashboard.loadingLead")}</p>
      </div>
    );
  }

  return (
    <div className="portal-surface-scope">
      <div className="d-flex justify-content-end align-items-center mb-2 mb-md-3">
        <InternalPortalLanguageToggle showLabel />
      </div>
      {/* Welcome Section — shared styles: portalWelcomeHero.css */}
      <div className="row g-3 g-lg-4 mb-4 align-items-stretch">
        <div className="col-12 col-lg-8 order-0">
          <div className="card border-0 h-100 staff-dashboard-welcome-hero text-white">
            <div className="card-body px-3 px-sm-4 py-4 py-md-4 staff-dashboard-welcome-inner">
              <div className="row g-3 g-sm-4 align-items-center">
                <div className="col-12 col-sm-6 col-lg-7 text-center text-sm-start">
                  <h5 className="card-title internal-portal-welcome__title mb-2 mb-sm-3 animate__animated animate__fadeInDown">
                    <i className="bx bx-smile me-2" aria-hidden="true"></i>
                    {welcomeFormalName ? (
                      <>{t("dashboard.welcomeNamed", { name: welcomeFormalName })}</>
                    ) : (
                      <>{t("dashboard.welcomeGeneric")}</>
                    )}
                  </h5>
                  <p className="mb-0 internal-portal-welcome__lead animate__animated animate__fadeIn animate__slow">
                    {t("dashboard.welcomeLead")}
                  </p>
                </div>
                <div className="col-12 col-sm-5 col-lg-4">
                  <div className="d-flex justify-content-center justify-content-sm-end align-items-end pt-2 pt-sm-0 welcome-illustration-wrap">
                    <img
                      className="img-fluid welcome-illustration animate__animated animate__fadeIn animate__delay-1s"
                      aria-label="Dashboard illustration"
                      src="/assets/img/illustrations/man-with-laptop-light.png"
                      alt=""
                      data-app-dark-img="illustrations/man-with-laptop-dark.png"
                      data-app-light-img="illustrations/man-with-laptop-light.png"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-4 d-flex order-1">
          <div
            className="card border-0 shadow-lg h-100 flex-grow-1 w-100"
            style={{
              overflow: "hidden",
              position: "relative",
              minHeight: "clamp(200px, 42vw, 280px)",
            }}
          >
            {combinedItems.length === 0 ? (
              <div className="card-body d-flex align-items-center justify-content-center" style={{ minHeight: "200px" }}>
                <div className="text-center text-muted">
                  <i className="bx bx-info-circle fs-1 mb-2"></i>
                  <p>{t("dashboard.carouselEmpty")}</p>
                </div>
              </div>
            ) : (
              <div style={{ position: "relative", height: "100%", minHeight: "200px" }}>
                {combinedItems.map((item, index) => {
                  const isActive = index === currentIndex;
                  const isTodo = item.type === "todo";
                  const isEvent = item.type === "event";
                  const data = item.data;

                  return (
                    <div
                      key={`${item.type}-${data.uid}-${index}`}
                      className="card-body px-3 px-md-4 py-3 py-md-4"
                      style={{
                        position: isActive ? "relative" : "absolute",
                        width: "100%",
                        maxWidth: "100%",
                        left: 0,
                        top: 0,
                        minWidth: 0,
                        boxSizing: "border-box",
                        opacity: isActive ? 1 : 0,
                        transform: isActive ? "translateX(0)" : "translateX(100%)",
                        transition: "all 1.5s ease-in-out",
                        zIndex: isActive ? 10 : 1,
                        minHeight: "min(100%, 200px)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        overflow: "hidden",
                        background:
                          "linear-gradient(135deg, rgba(0, 133, 63, 0.14) 0%, rgba(61, 166, 106, 0.14) 100%)",
                        borderTop: "4px solid #00853f",
                        borderRadius: "8px",
                        paddingBottom: "2.75rem",
                        cursor: isActive ? "pointer" : "default",
                      }}
                      onClick={() => {
                        if (!isActive || !data?.uid) return;
                        if (item.type === "todo") {
                          navigate(`/ppaa-internal-portal/todos/open/${data.uid}`);
                        } else if (item.type === "announcement") {
                          navigate(`/ppaa-internal-portal/announcements/open/${data.uid}`);
                        } else if (item.type === "event") {
                          navigate(`/ppaa-internal-portal/events/open/${data.uid}`);
                        }
                      }}
                    >
                      {isTodo ? (
                        <>
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <i className="bx bx-check-square" style={{ color: "#00853f", fontSize: "1.5rem" }}></i>
                            <h6 className="mb-0 fw-bold" style={{ color: "#00853f" }}>
                              {t("publicPortal.activeTodo")}
                            </h6>
                          </div>
                          <h5
                            className="mb-2 fw-bold text-break"
                            style={{ color: "#333", wordBreak: "break-word", overflowWrap: "anywhere" }}
                          >
                            {data.title}
                          </h5>
                          <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                            <span className={getTodoStatusBadge(data.status)}>
                              {data.status === "PENDING"
                                ? t("publicPortal.pending")
                                : data.status === "IN_PROGRESS"
                                  ? t("publicPortal.inProgress")
                                  : data.status === "COMPLETED"
                                    ? t("publicPortal.completed")
                                    : data.status}
                            </span>
                            <span className={getTodoPriorityBadge(data.priority)}>
                              {data.priority}
                            </span>
                          </div>
                          <div className="d-flex align-items-center gap-3 flex-wrap">
                            {data.start_date && (
                              <small className="d-flex align-items-center" style={{ color: "#4facfe", fontWeight: "500" }}>
                                <i className="bx bx-time me-1"></i>
                                {t("publicPortal.start")}{" "}
                                {formatTodoDate(data.start_date)}
                              </small>
                            )}
                            {data.due_date && (
                              <small className="d-flex align-items-center" style={{ color: "#ff6b6b", fontWeight: "500" }}>
                                <i className="bx bx-calendar-check me-1"></i>
                                {t("publicPortal.due")}{" "}
                                {formatTodoDate(data.due_date)}
                              </small>
                            )}
                          </div>
                        </>
                      ) : isEvent ? (
                        <>
                          <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                            <i
                              className="bx bx-calendar-event"
                              style={{ color: "#4facfe", fontSize: "1.5rem" }}
                            />
                            <h6 className="mb-0 fw-bold" style={{ color: "#00853f" }}>
                              {t("publicPortal.event")}
                            </h6>
                            {data.event_type && (
                              <span
                                className={`badge rounded-pill ${getEventTypeBadge(data.event_type).class}`}
                              >
                                {getEventTypeBadge(data.event_type).label}
                              </span>
                            )}
                          </div>
                          <h5
                            className="mb-2 fw-bold text-break"
                            style={{ color: "#333", wordBreak: "break-word", overflowWrap: "anywhere" }}
                          >
                            {data.title}
                          </h5>
                          {data.description ? (
                            <p
                              className="text-muted mb-2 small text-break"
                              style={{ lineHeight: 1.35, wordBreak: "break-word", overflowWrap: "anywhere" }}
                            >
                              {truncateWords(data.description, 15)}
                            </p>
                          ) : null}
                          <div className="d-flex flex-row align-items-center flex-wrap gap-2 gap-sm-3 w-100" style={{ minWidth: 0 }}>
                            {data.start_date && (
                              <small className="d-flex align-items-center mb-0" style={{ color: "#198754" }}>
                                <i className="bx bx-calendar-event me-1" style={{ color: "#198754" }} />
                                <span className="fw-semibold me-1">
                                  {t("publicPortal.start")}
                                </span>
                                <span>{formatDate(data.start_date)}</span>
                              </small>
                            )}
                            {data.end_date && (
                              <small className="d-flex align-items-center mb-0" style={{ color: "#c62828" }}>
                                <i className="bx bx-calendar-check me-1" style={{ color: "#dc3545" }} />
                                <span className="fw-semibold me-1" style={{ color: "#b71c1c" }}>
                                  {t("publicPortal.end")}
                                </span>
                                <span style={{ color: "#c62828" }}>{formatDate(data.end_date)}</span>
                              </small>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                            <i className="bx bx-bullhorn" style={{ color: "#00853f", fontSize: "1.5rem" }}></i>
                            <h6 className="mb-0 fw-bold" style={{ color: "#00853f" }}>
                              {t("publicPortal.announcement")}
                            </h6>
                            {data.is_pinned && <i className="bx bx-pin text-warning"></i>}
                            {isPortalAnnouncementNew(data.created_at) && (
                              <span className="badge rounded-pill portal-announcement-new-badge">
                                {t("publicPortal.labelNew")}
                              </span>
                            )}
                          </div>
                          <h5
                            className="mb-2 fw-bold text-break"
                            style={{ color: "#333", wordBreak: "break-word", overflowWrap: "anywhere" }}
                          >
                            {data.title}
                          </h5>
                          <p
                            className="text-muted mb-2 small text-break"
                            style={{ lineHeight: 1.35, wordBreak: "break-word", overflowWrap: "anywhere" }}
                          >
                            {truncateWords(data.content, 15)}
                          </p>
                          <div
                            className="d-flex align-items-center gap-2 mb-2 flex-wrap w-100"
                            style={{ minWidth: 0 }}
                          >
                            <span className={`badge ${getPriorityColor(data.priority)} flex-shrink-0`}>
                              {data.priority}
                            </span>
                            {isPortalAnnouncementNew(data.created_at) ? (
                              <div
                                className="d-flex flex-row align-items-center flex-wrap gap-2 gap-sm-3 w-100"
                                style={{ minWidth: 0 }}
                              >
                                <small
                                  className="d-flex align-items-center mb-0"
                                  style={{ color: "#198754" }}
                                >
                                  <i
                                    className="bx bx-calendar-event me-1"
                                    style={{ color: "#198754" }}
                                  ></i>
                                  <span className="fw-semibold me-1">
                                    {t("publicPortal.start")}
                                  </span>
                                  <span>{formatDate(data.start_date || data.created_at)}</span>
                                </small>
                                <span
                                  className="d-none d-sm-inline text-muted"
                                  style={{ opacity: 0.45 }}
                                  aria-hidden
                                >
                                  |
                                </span>
                                <small
                                  className="d-flex align-items-center mb-0"
                                  style={{ color: "#c62828" }}
                                >
                                  <i
                                    className="bx bx-calendar-check me-1"
                                    style={{ color: "#dc3545" }}
                                  ></i>
                                  <span className="fw-semibold me-1" style={{ color: "#b71c1c" }}>
                                    {t("publicPortal.end")}
                                  </span>
                                  <span style={{ color: "#c62828" }}>
                                    {data.end_date ? formatDate(data.end_date) : "—"}
                                  </span>
                                </small>
                              </div>
                            ) : (
                              <small className="text-muted">
                                <i className="bx bx-calendar me-1"></i>
                                {formatDate(data.start_date || data.created_at, "DD/MM/YYYY")}
                              </small>
                            )}
                          </div>
                        
                        </>
                      )}
                    </div>
                  );
                })}
                {/* Navigation dots — same control design as PortalPage */}
                {combinedItems.length > 1 && (
                  <div
                    className="position-absolute bottom-0 start-50 translate-middle-x portal-highlight-carousel-dots"
                    style={{ zIndex: 20, paddingBottom: "max(0.35rem, env(safe-area-inset-bottom))" }}
                  >
                    <div
                      className="d-flex gap-0 align-items-center justify-content-center flex-nowrap"
                      role="tablist"
                      aria-label={t("publicPortal.highlightSlides")}
                    >
                      {combinedItems.map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          className={`portal-highlight-dot-btn ${index === currentIndex ? "is-active" : ""}`}
                          aria-label={t("publicPortal.showSlide", {
                            i: index + 1,
                            total: combinedItems.length,
                          })}
                          aria-selected={index === currentIndex}
                          role="tab"
                          onClick={() => setCurrentIndex(index)}
                        >
                          <span className="portal-highlight-dot" aria-hidden />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Draggable Dashboard Sections */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="dashboard-sections">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {sectionOrder.map((section, index) => {
                // Render Events & PR flyers section
                if (section.id === 'events-faqs') {
                  return (
                    <Draggable key={section.id} draggableId={section.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="mb-4"
                          style={{
                            ...provided.draggableProps.style,
                            opacity: snapshot.isDragging ? 0.8 : 1,
                            boxShadow: snapshot.isDragging ? '0 8px 16px rgba(0,0,0,0.2)' : 'none',
                            borderRadius: snapshot.isDragging ? '8px' : '0',
                          }}
                        >
                          {/* Events calendar and PR flyers — one row on large screens */}
                          <div className="row g-3 g-lg-4 mb-4 align-items-stretch">
        {/* Events Calendar */}
        <div className="col-12 col-lg-8 d-flex">
          <div
            className="card border-0 shadow-lg h-100 w-100 d-flex flex-column"
            style={{ borderTop: "4px solid #00f2fe" }}
          >
            <div className="card-header border-0 portal-dashboard-card-header d-flex justify-content-between align-items-center" style={{ 
              background: "linear-gradient(135deg, #4facfe15 0%, #00f2fe15 100%)"
            }}>
              <h5 className="mb-0">
                <i className="bx bx-calendar me-2" style={{ color: "#00f2fe" }}></i>
                <span style={{ color: "#00f2fe" }}>
                  {t("publicPortal.eventsCalendar")}
                </span>
              </h5>
              <div
                {...provided.dragHandleProps}
                style={{ cursor: "grab", padding: "5px" }}
                title={t("publicPortal.dragToRearrange")}
              >
                <i className="bx bx-menu" style={{ color: "#00f2fe", fontSize: "1.5rem" }}></i>
              </div>
            </div>
            <div className="card-body flex-grow-1 d-flex flex-column">
              <SimpleCalendar
                events={events}
                onEventClick={(event) => {
                  setSelectedEvent(event);
                  const modal = new window.bootstrap.Modal(document.getElementById('eventViewModal'));
                  modal.show();
                }}
              />
            </div>
          </div>
        </div>

        {/* PR flyers & posters — same row as Events */}
        <div className="col-12 col-lg-4 d-flex">
          <PrFlyersGallery flyers={prFlyers} compact />
        </div>
      </div>
                        </div>
                      )}
                    </Draggable>
                  );
                }

                // Render Todos & Announcements Section
              if (section.id === 'todos-announcements') {
                return (
                  <Draggable key={section.id} draggableId={section.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="mb-4"
                        style={{
                          ...provided.draggableProps.style,
                          opacity: snapshot.isDragging ? 0.8 : 1,
                          boxShadow: snapshot.isDragging ? '0 8px 16px rgba(0,0,0,0.2)' : 'none',
                          borderRadius: snapshot.isDragging ? '8px' : '0',
                        }}
                      >
                        {/* Active Todos and Announcements - Side by Side */}
      <div className="row g-3 g-lg-4 mb-4">
        {/* Active Todos Section - Left */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-lg h-100" style={{ borderTop: "4px solid #00853f" }}>
            <div className="card-header border-0 portal-dashboard-card-header d-flex justify-content-between align-items-center" style={{ 
              background: "linear-gradient(135deg, rgba(0, 133, 63, 0.14) 0%, rgba(61, 166, 106, 0.14) 100%)"
            }}>
              <h5 className="mb-0">
                <i className="bx bx-check-square me-2" style={{ color: "#00853f" }}></i>
                <span style={{ color: "#00853f" }}>
                  {t("publicPortal.activeTodoList")}
                </span>
              </h5>
              <div
                {...provided.dragHandleProps}
                style={{ cursor: "grab", padding: "5px" }}
                title={t("publicPortal.dragToRearrange")}
              >
                <i className="bx bx-menu" style={{ color: "#00853f", fontSize: "1.5rem" }}></i>
              </div>
            </div>
            <div className="card-body p-0">
              {todos.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="bx bx-info-circle fs-1 mb-2"></i>
                  <p>{t("publicPortal.noTodos")}</p>
                </div>
              ) : (
                <>
                  <div 
                    className="list-group list-group-flush"
                    style={{
                      overflow: "hidden",
                      position: "relative"
                    }}
                  >
                    {todos.slice(todoOffset, todoOffset + 3).map((todo, index) => (
                      <div
                        key={todo.uid}
                        className="list-group-item list-group-item-action cursor-pointer py-3 px-3"
                        style={{
                          borderLeft: `5px solid ${getTodoDashboardAccentColor(todo)}`,
                          transition: "all 0.2s ease",
                          animation: `slideInRight 0.5s ease-out ${index * 0.1}s both`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = portalDark
                            ? "rgba(52, 211, 153, 0.12)"
                            : "rgba(0, 133, 63, 0.06)";
                          e.currentTarget.style.transform = "translateX(5px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.transform = "translateX(0)";
                        }}
                        onClick={() => {
                          setSelectedTodo(todo);
                          const modal = new window.bootstrap.Modal(document.getElementById('todoViewModal'));
                          modal.show();
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1" style={{ minWidth: 0 }}>
                            <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                              <h6 className="mb-0 text-break">{todo.title}</h6>
                              <span className={`${getTodoStatusBadge(todo.status)} flex-shrink-0`}>
                                {todo.status === "PENDING"
                                  ? t("publicPortal.pending")
                                  : todo.status === "IN_PROGRESS"
                                    ? t("publicPortal.inProgress")
                                    : todo.status === "COMPLETED"
                                      ? t("publicPortal.completed")
                                      : todo.status}
                              </span>
                              <span className={`${getTodoPriorityBadge(todo.priority)} flex-shrink-0`}>
                                {todo.priority}
                              </span>
                            </div>
                            <div className="d-flex align-items-center gap-3 flex-wrap mt-1">
                              {todo.department && (
                                <span className="badge bg-light text-dark">
                                  <i className="bx bx-building me-1"></i>
                                  {todo.department.name}
                                </span>
                              )}
                              {todo.start_date && (
                                <small 
                                  className="d-flex align-items-center"
                                  style={{ 
                                    color: "#4facfe",
                                    fontWeight: "500"
                                  }}
                                >
                                  <i className="bx bx-time me-1"></i>
                                  {t("publicPortal.start")}{" "}
                                  {formatTodoDate(todo.start_date)}
                                </small>
                              )}
                              {todo.due_date && (
                                <small 
                                  className="d-flex align-items-center"
                                  style={{ 
                                    color: "#ff6b6b",
                                    fontWeight: "500"
                                  }}
                                >
                                  <i className="bx bx-calendar-check me-1"></i>
                                  {t("publicPortal.due")}{" "}
                                  {formatTodoDate(todo.due_date)}
                                </small>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {todos.length > 3 && (
                    <div className="text-center py-3 border-top d-flex justify-content-between align-items-center">
                      {todoOffset > 0 && (
                      <button
                          className="btn btn-sm"
                          style={{ 
                            backgroundColor: "#00853f", 
                            color: "#fff", 
                            border: "none",
                            fontWeight: "500"
                          }}
                          onClick={() => setTodoOffset(Math.max(0, todoOffset - 3))}
                        >
                          <i className="bx bx-chevron-left me-1"></i>
                          {t("publicPortal.previous")}
                      </button>
                      )}
                      {todoOffset === 0 && <div></div>}
                      {todoOffset + 3 < todos.length && (
                        <button
                          className="btn btn-sm"
                          style={{ 
                            backgroundColor: "#00853f", 
                            color: "#fff", 
                            border: "none",
                            fontWeight: "500"
                          }}
                          onClick={() => setTodoOffset(Math.min(todos.length - 3, todoOffset + 3))}
                        >
                          <i className="bx bx-chevron-right me-1"></i>
                          {t("publicPortal.seeMore", {
                            n: todos.length - todoOffset - 3,
                          })}
                      </button>
                      )}
                      {todoOffset + 3 >= todos.length && todoOffset > 0 && (
                        <div></div>
                      )}
                    </div>
                  )}
                  <style>{`
                    @keyframes slideInRight {
                      from {
                        opacity: 0;
                        transform: translateX(100%);
                      }
                      to {
                        opacity: 1;
                        transform: translateX(0);
                      }
                    }
                  `}</style>
                </>
              )}
            </div>
                </div>
              </div>

        {/* Announcements Section - Right */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-lg h-100" style={{ borderTop: "4px solid #00853f" }}>
            <div className="card-header border-0 portal-dashboard-card-header d-flex justify-content-between align-items-center" style={{ 
              background: "linear-gradient(135deg, rgba(0, 133, 63, 0.14) 0%, rgba(61, 166, 106, 0.14) 100%)"
            }}>
              <h5 className="mb-0">
                <i className="bx bx-bullhorn me-2" style={{ color: "#00853f" }}></i>
                <span style={{ color: "#00853f" }}>
                  {t("publicPortal.recentAnnouncements")}
                </span>
              </h5>
              <div
                {...provided.dragHandleProps}
                style={{ cursor: "grab", padding: "5px" }}
                title={t("publicPortal.dragToRearrange")}
              >
                <i className="bx bx-menu" style={{ color: "#00853f", fontSize: "1.5rem" }}></i>
              </div>
            </div>
            <div className="card-body p-3">
              {announcements.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="bx bx-info-circle fs-1 mb-2"></i>
                  <p>{t("publicPortal.noAnnouncements")}</p>
                </div>
              ) : (
                <>
                  <div 
                    className="row g-3"
                    style={{
                      overflow: "hidden",
                      position: "relative",
                      minHeight: "200px"
                    }}
                  >
                    {announcements.slice(announcementOffset, announcementOffset + 3).map((announcement, index) => (
                      <div 
                        key={announcement.uid} 
                        className="col-12"
                        style={{
                          animation: `slideInRight 0.5s ease-out ${index * 0.1}s both`
                        }}
                      >
                        <div
                          className="card border-0 shadow-sm cursor-pointer h-100 portal-tile-surface"
                          style={{ 
                            borderLeft: "4px solid #00853f",
                            transition: "all 0.3s ease",
                            background: portalDark
                              ? "linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(51, 65, 85, 0.75) 100%)"
                              : "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-5px)";
                            e.currentTarget.style.boxShadow = "0 8px 16px rgba(0, 133, 63, 0.18)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = portalDark
                              ? "0 2px 4px rgba(0,0,0,0.35)"
                              : "0 2px 4px rgba(0,0,0,0.1)";
                          }}
                          onClick={() => {
                            setSelectedAnnouncement(announcement);
                            const modal = new window.bootstrap.Modal(document.getElementById('announcementViewModal'));
                            modal.show();
                          }}
                        >
                          <div className="card-body p-3">
                            <div className="d-flex align-items-start justify-content-between mb-2">
                              <div className="d-flex align-items-center gap-2 flex-grow-1">
                                {announcement.is_pinned && (
                                  <i className="bx bx-pin text-warning fs-5"></i>
                                )}
                                <h6 className="mb-0 fw-bold" style={{ color: "#00853f" }}>
                                  {announcement.title}
                                </h6>
                                {isPortalAnnouncementNew(announcement.created_at) && (
                                  <span className="badge rounded-pill portal-announcement-new-badge">
                                    {t("publicPortal.labelNew")}
                                  </span>
                                )}
                      </div>
                              <span className={`badge ${getPriorityColor(announcement.priority)}`}>
                                {announcement.priority}
                              </span>
                    </div>
                            <p className="text-muted mb-2 small" style={{ lineHeight: "1.5" }}>
                              {truncateWords(announcement.content, 20)}
                            </p>
                            {isPortalAnnouncementNew(announcement.created_at) ? (
                              <div className="d-flex flex-row align-items-center flex-wrap gap-2 gap-sm-3">
                                <small
                                  className="d-flex align-items-center mb-0"
                                  style={{ color: "#198754" }}
                                >
                                  <i
                                    className="bx bx-calendar-event me-1"
                                    style={{ color: "#198754" }}
                                  ></i>
                                  <span className="fw-semibold me-1">
                                    {t("publicPortal.start")}
                                  </span>
                                  <span>
                                    {formatDate(
                                      announcement.start_date || announcement.created_at
                                    )}
                                  </span>
                                </small>
                                <span
                                  className="d-none d-sm-inline text-muted"
                                  style={{ opacity: 0.45 }}
                                  aria-hidden
                                >
                                  |
                                </span>
                                <small
                                  className="d-flex align-items-center mb-0"
                                  style={{ color: "#c62828" }}
                                >
                                  <i
                                    className="bx bx-calendar-check me-1"
                                    style={{ color: "#dc3545" }}
                                  ></i>
                                  <span className="fw-semibold me-1" style={{ color: "#b71c1c" }}>
                                    {t("publicPortal.end")}
                                  </span>
                                  <span style={{ color: "#c62828" }}>
                                    {announcement.end_date
                                      ? formatDate(announcement.end_date)
                                      : "—"}
                                  </span>
                                </small>
                              </div>
                            ) : (
                              <div className="d-flex align-items-center gap-2">
                                {announcement.start_date ? (
                                  <small className="text-muted d-flex align-items-center">
                                    <i className="bx bx-calendar me-1"></i>
                                    {formatDate(announcement.start_date, "DD/MM/YYYY")}
                                  </small>
                                ) : (
                                  <small className="text-muted d-flex align-items-center">
                                    <i className="bx bx-calendar me-1"></i>
                                    {formatDate(announcement.created_at, "DD/MM/YYYY")}
                                  </small>
                                )}
                              </div>
                            )}
              </div>
            </div>
                    </div>
                    ))}
                  </div>
                  {announcements.length > 3 && (
                    <div className="text-center mt-3 pt-3 border-top d-flex justify-content-between align-items-center">
                      {announcementOffset > 0 && (
                      <button
                          className="btn btn-sm"
                          style={{ 
                            backgroundColor: "#00853f", 
                            color: "white", 
                            border: "none",
                            fontWeight: "500"
                          }}
                          onClick={() => setAnnouncementOffset(Math.max(0, announcementOffset - 3))}
                        >
                          <i className="bx bx-chevron-left me-1"></i>
                          {t("publicPortal.previous")}
                      </button>
                      )}
                      {announcementOffset === 0 && <div></div>}
                      {announcementOffset + 3 < announcements.length && (
                        <button
                          className="btn btn-sm"
                          style={{ 
                            backgroundColor: "#00853f", 
                            color: "white", 
                            border: "none",
                            fontWeight: "500"
                          }}
                          onClick={() => setAnnouncementOffset(Math.min(announcements.length - 3, announcementOffset + 3))}
                        >
                          <i className="bx bx-chevron-right me-1"></i>
                          {t("publicPortal.seeMore", {
                            n: announcements.length - announcementOffset - 3,
                          })}
                        </button>
                      )}
                      {announcementOffset + 3 >= announcements.length && announcementOffset > 0 && (
                        <div></div>
                      )}
                    </div>
                  )}
                  <style>{`
                    @keyframes slideInRight {
                      from {
                        opacity: 0;
                        transform: translateX(100%);
                      }
                      to {
                        opacity: 1;
                        transform: translateX(0);
                      }
                    }
                  `}</style>
                </>
              )}
            </div>
          </div>
        </div>

      </div>
                        </div>
                      )}
                    </Draggable>
                  );
                }

                // Render Documents Section
              if (section.id === 'documents') {
                return (
                  <Draggable key={section.id} draggableId={section.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="mb-4"
                        style={{
                          ...provided.draggableProps.style,
                          opacity: snapshot.isDragging ? 0.8 : 1,
                          boxShadow: snapshot.isDragging ? '0 8px 16px rgba(0,0,0,0.2)' : 'none',
                          borderRadius: snapshot.isDragging ? '8px' : '0',
                        }}
                      >
                        {/* Documents Section - Moved to Last */}
                        <div className="row g-4 mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-lg h-100" style={{ borderTop: "4px solid #17a2b8" }}>
            <div className="card-header border-0 portal-dashboard-card-header d-flex flex-wrap justify-content-between align-items-center gap-2" style={{ 
              background: "linear-gradient(135deg, #17a2b815 0%, #13849615 100%)"
            }}>
              <h5 className="mb-0 d-flex align-items-center flex-wrap gap-2">
                <i className="bx bx-library me-2" style={{ color: "#17a2b8" }}></i>
                <span style={{ color: "#17a2b8" }}>
                  {t("publicPortal.documentsFaqs")}
                </span>
              </h5>
              <div className="d-flex align-items-center flex-wrap gap-2 ms-auto">
                <div
                  className="btn-group btn-group-sm"
                  role="group"
                  aria-label={t("publicPortal.documentsFaqs")}
                >
                  <button
                    type="button"
                    className={`btn ${docsLibraryTab === "documents" ? "" : "btn-outline-secondary"}`}
                    style={
                      docsLibraryTab === "documents"
                        ? { backgroundColor: "#17a2b8", color: "white", borderColor: "#17a2b8" }
                        : { borderColor: "#17a2b8", color: "#17a2b8" }
                    }
                    onClick={() => setDocsLibraryTab("documents")}
                  >
                    <i className="bx bx-folder me-1"></i>
                    {t("publicPortal.documentsTab")}
                  </button>
                  <button
                    type="button"
                    className={`btn ${docsLibraryTab === "faqs" ? "" : "btn-outline-secondary"}`}
                    style={
                      docsLibraryTab === "faqs"
                        ? { backgroundColor: "#17a2b8", color: "white", borderColor: "#17a2b8" }
                        : { borderColor: "#17a2b8", color: "#17a2b8" }
                    }
                    onClick={() => {
                      setDocsLibraryTab("faqs");
                      setLibraryFaqOffset(0);
                    }}
                  >
                    <i className="bx bx-help-circle me-1"></i>
                    {t("publicPortal.faqsTab")}
                  </button>
                </div>
                {docsLibraryTab === "documents" && selectedCategory && (
                  <button
                    className="btn btn-sm"
                    style={{ backgroundColor: "#17a2b8", color: "white", border: "none" }}
                    onClick={() => {
                      setSelectedCategory(null);
                      setDocumentOffset(0);
                    }}
                  >
                    <i className="bx bx-arrow-back me-1"></i>
                    {t("publicPortal.backToCategories")}
                  </button>
                )}
                <div
                  {...provided.dragHandleProps}
                  style={{ cursor: "grab", padding: "5px" }}
                  title={t("publicPortal.dragToRearrange")}
                >
                  <i className="bx bx-menu" style={{ color: "#17a2b8", fontSize: "1.5rem" }}></i>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              {docsLibraryTab === "faqs" ? (
                <div className="p-3">
                  {(() => {
                    const filtered = faqs;
                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-4 text-muted">
                          <i className="bx bx-info-circle fs-1 mb-2"></i>
                          <p className="mb-0">
                            {t("publicPortal.noFaqsAvailable")}
                          </p>
                        </div>
                      );
                    }
                    const pageSize = 5;
                    const slice = filtered.slice(libraryFaqOffset, libraryFaqOffset + pageSize);
                    return (
                      <>
                        <div className="row g-3">
                          {slice.map((faq, index) => (
                            <div key={faq.uid} className="col-12 col-md-6 col-xl-4">
                              <div
                                className="card border-0 shadow-sm h-100 cursor-pointer portal-faq-item-card"
                                style={{
                                  borderLeft: "4px solid #17a2b8",
                                  animation: `slideInRight 0.35s ease-out ${index * 0.06}s both`,
                                }}
                                onClick={() => {
                                  setSelectedFaq(faq);
                                  const modal = new window.bootstrap.Modal(
                                    document.getElementById("faqViewModal")
                                  );
                                  modal.show();
                                }}
                              >
                                <div className="card-body p-3">
                                  <div className="d-flex align-items-start mb-2">
                                    <i className="bx bx-help-circle me-2 mt-1 fs-5" style={{ color: "#17a2b8" }}></i>
                                    <h6 className="mb-0 flex-grow-1 fw-semibold">{faq.question}</h6>
                                  </div>
                                  <p className="mb-0 small text-muted" style={{ lineHeight: 1.5 }}>
                                    {truncateWords(faq.answer, 22)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {filtered.length > pageSize && (
                          <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              disabled={libraryFaqOffset <= 0}
                              onClick={() =>
                                setLibraryFaqOffset((o) => Math.max(0, o - pageSize))
                              }
                            >
                              <i className="bx bx-chevron-left me-1"></i>
                              {t("publicPortal.previous")}
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              disabled={libraryFaqOffset + pageSize >= filtered.length}
                              onClick={() =>
                                setLibraryFaqOffset((o) =>
                                  Math.min(
                                    Math.max(0, filtered.length - pageSize),
                                    o + pageSize
                                  )
                                )
                              }
                            >
                              {t("publicPortal.next")}
                              <i className="bx bx-chevron-right ms-1"></i>
                            </button>
                          </div>
                        )}
                        <style>{`
                          @keyframes slideInRight {
                            from { opacity: 0; transform: translateX(12px); }
                            to { opacity: 1; transform: translateX(0); }
                          }
                        `}</style>
                      </>
                    );
                  })()}
                </div>
              ) : null}
              {docsLibraryTab === "documents"
                ? (() => {
                // Group documents by category
                const documentsByCategory = {};
                documents.forEach(doc => {
                  const categoryName =
                    doc.category?.name || t("publicPortal.uncategorized");
                  if (!documentsByCategory[categoryName]) {
                    documentsByCategory[categoryName] = [];
                  }
                  documentsByCategory[categoryName].push(doc);
                });

                const categories = Object.keys(documentsByCategory);

                if (documents.length === 0) {
                  return (
                    <div className="text-center py-4 text-muted">
                      <i className="bx bx-info-circle fs-1 mb-2"></i>
                      <p>{t("publicPortal.noDocuments")}</p>
                    </div>
                  );
                }

                // Show categories if none selected
                if (!selectedCategory) {
                  return (
                    <div className="card-body p-3">
                      <div className="row g-3">
                        {categories.map((categoryName) => {
                          const categoryDocs = documentsByCategory[categoryName];
                          return (
                            <div key={categoryName} className="col-lg-4 col-md-6 col-sm-6">
                              <div
                                className="card border-0 shadow-sm cursor-pointer h-100 portal-tile-surface"
                                style={{ 
                                  borderLeft: "4px solid #17a2b8",
                                  transition: "all 0.3s ease",
                                  background: portalDark
                                    ? "linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(51, 65, 85, 0.75) 100%)"
                                    : "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)"
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = "translateY(-5px)";
                                  e.currentTarget.style.boxShadow = "0 8px 16px rgba(23, 162, 184, 0.2)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = "translateY(0)";
                                  e.currentTarget.style.boxShadow = portalDark
                                    ? "0 2px 4px rgba(0,0,0,0.35)"
                                    : "0 2px 4px rgba(0,0,0,0.1)";
                                }}
                                onClick={() => {
                                  setSelectedCategory(categoryName);
                                  setDocumentOffset(0);
                                }}
                              >
                                <div className="card-body p-3 text-center">
                                  <i className="bx bx-folder fs-1 mb-3" style={{ color: "#17a2b8" }}></i>
                                  <h6 className="mb-2 fw-bold" style={{ color: "#17a2b8" }}>
                                    {categoryName}
                                  </h6>
                                  <p className="text-muted mb-0 small">
                                    {categoryDocs.length === 1
                                      ? t("publicPortal.docCountOne", {
                                          n: categoryDocs.length,
                                        })
                                      : t("publicPortal.docCountMany", {
                                          n: categoryDocs.length,
                                        })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                // Show documents for selected category
                const categoryDocuments = documentsByCategory[selectedCategory] || [];
                return (
                  <>
                    <div className="px-3 pt-3 pb-2 border-bottom bg-light portal-docs-category-toolbar">
                      <h6 className="mb-0 fw-bold">
                        <i className="bx bx-folder me-2" style={{ color: "#17a2b8" }}></i>
                        {selectedCategory} (
                        {categoryDocuments.length === 1
                          ? t("publicPortal.docCountOne", {
                              n: categoryDocuments.length,
                            })
                          : t("publicPortal.docCountMany", {
                              n: categoryDocuments.length,
                            })}
                        )
                      </h6>
                    </div>
                    <div 
                      className="row g-3 p-3"
                      style={{
                        overflow: "hidden",
                        position: "relative"
                      }}
                    >
                      {categoryDocuments.slice(documentOffset, documentOffset + 5).map((document, index) => (
                        <div
                          key={document.uid}
                          className="col-lg-6 col-md-6 col-12"
                          style={{
                            animation: `slideInRight 0.5s ease-out ${index * 0.1}s both`
                          }}
                        >
                          <div
                            className="list-group-item list-group-item-action h-100"
                            style={{ 
                              borderLeft: "4px solid #17a2b8",
                              transition: "all 0.2s ease",
                              padding: "1rem",
                              display: "flex",
                              flexDirection: "column"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = portalDark
                                ? "rgba(23, 162, 184, 0.22)"
                                : "#17a2b810";
                              e.currentTarget.style.transform = "translateX(5px)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "transparent";
                              e.currentTarget.style.transform = "translateX(0)";
                            }}
                          >
                            <div className="flex-grow-1 mb-3">
                              <div className="d-flex align-items-center gap-2 mb-2">
                                <h6 className="mb-0 fw-semibold cursor-pointer" onClick={() => navigate(`/ppaa-internal-portal/documents/open/${document.uid}`)}>
                                  {document.title}
                                </h6>
                              </div>
                              {document.description && (
                                <p className="text-muted mb-2 small" style={{ lineHeight: "1.5" }}>
                                  {document.description.substring(0, 120)}
                                  {document.description.length > 120 ? "..." : ""}
                                </p>
                              )}
                            </div>
                            {document.file_key ? (
                              <button
                                type="button"
                                className="btn btn-sm w-100"
                                style={{
                                  backgroundColor: "#17a2b8",
                                  color: "white",
                                  border: "none",
                                  fontWeight: "500",
                                  marginTop: "auto",
                                }}
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await downloadPortalDocument(
                                      document.uid,
                                      document.original_filename || "document"
                                    );
                                  } catch {
                                    showToast(
                                      t("publicPortal.downloadFailedDocument"),
                                      "danger",
                                      t("publicPortal.download")
                                    );
                                  }
                                }}
                              >
                                <i className="bx bx-download me-1"></i>
                                {t("publicPortal.download")}
                              </button>
                            ) : (
                              <button
                                className="btn btn-sm w-100"
                                disabled
                                style={{ 
                                  backgroundColor: "#6c757d", 
                                  color: "white", 
                                  border: "none",
                                  fontWeight: "500",
                                  marginTop: "auto",
                                  cursor: "not-allowed"
                                }}
                              >
                                <i className="bx bx-download me-1"></i>
                                {t("publicPortal.noFileAvailable")}
                              </button>
                            )}
                      </div>
                    </div>
                      ))}
                  </div>
                    {categoryDocuments.length > 5 && (
                      <div className="text-center py-3 border-top d-flex justify-content-between align-items-center px-3">
                        {documentOffset > 0 && (
                          <button
                            className="btn btn-sm"
                            style={{ 
                              backgroundColor: "#17a2b8", 
                              color: "white", 
                              border: "none",
                              fontWeight: "500"
                            }}
                            onClick={() => setDocumentOffset(Math.max(0, documentOffset - 5))}
                          >
                            <i className="bx bx-chevron-left me-1"></i>
                            {t("publicPortal.previous")}
                          </button>
                        )}
                        {documentOffset === 0 && <div></div>}
                        {documentOffset + 5 < categoryDocuments.length && (
                          <button
                            className="btn btn-sm"
                            style={{ 
                              backgroundColor: "#17a2b8", 
                              color: "white", 
                              border: "none",
                              fontWeight: "500"
                            }}
                            onClick={() => setDocumentOffset(Math.min(categoryDocuments.length - 5, documentOffset + 5))}
                          >
                            <i className="bx bx-chevron-right me-1"></i>
                            {t("publicPortal.seeMore", {
                              n: categoryDocuments.length - documentOffset - 5,
                            })}
                          </button>
                        )}
                        {documentOffset + 5 >= categoryDocuments.length && documentOffset > 0 && (
                          <div></div>
                        )}
                </div>
                    )}
                    <style>{`
                      @keyframes slideInRight {
                        from {
                          opacity: 0;
                          transform: translateX(100%);
                        }
                        to {
                          opacity: 1;
                          transform: translateX(0);
                        }
                      }
                    `}</style>
                  </>
                );
              })()
              : null}
              </div>
            </div>
        </div>
      </div>

      {/* Quick Links Section - Moved to Bottom */}
      <div className="row g-4">
        <div className="col-12">
          <div className="card border-0 shadow-lg h-100" style={{ borderTop: "4px solid #ff6b6b" }}>
            <div className="card-header border-0 portal-dashboard-card-header d-flex justify-content-between align-items-center" style={{ 
              background: "linear-gradient(135deg, #ff6b6b15 0%, #ee5a6f15 100%)"
            }}>
              <h5 className="mb-0">
                <i className="bx bx-link me-2" style={{ color: "#ff6b6b" }}></i>
                <span style={{ color: "#ff6b6b" }}>
                  {t("publicPortal.quickLinks")}
                </span>
              </h5>
              <div
                {...provided.dragHandleProps}
                style={{ cursor: "grab", padding: "5px" }}
                title={t("publicPortal.dragToRearrange")}
              >
                <i className="bx bx-menu" style={{ color: "#ff6b6b", fontSize: "1.5rem" }}></i>
              </div>
            </div>
            <div
              className="card-body p-3 p-md-4 portal-quick-links-body"
              style={{ background: "linear-gradient(135deg, #ff6b6b05 0%, #ee5a6f05 100%)" }}
            >
              {quickLinks.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="bx bx-info-circle fs-1 mb-2"></i>
                  <p>{t("publicPortal.noQuickLinks")}</p>
                </div>
              ) : (
                <>
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
                    <div className="input-group" style={{ maxWidth: 560, minWidth: 280 }}>
                      <span className="input-group-text bg-light">
                        <i className="bx bx-search text-muted"></i>
                      </span>
                      <input
                        type="search"
                        className="form-control"
                        placeholder={t("publicPortal.searchQuickLinksPlaceholder")}
                        aria-label={t("publicPortal.searchQuickLinksAria")}
                        value={quickLinksSearch}
                        style={{ minHeight: 42, fontSize: "0.95rem" }}
                        onChange={(e) => {
                          setQuickLinksSearch(e.target.value);
                          setQuickLinksPage(0);
                        }}
                      />
                    </div>
                    <div className="d-flex align-items-center gap-2 ms-auto">
                      <small className="text-muted d-none d-sm-inline">
                        {t("publicPortal.pageOf", {
                          n: quickLinksPageSafe + 1,
                          total: quickLinksTotalPages,
                        })}
                      </small>
                      <div className="btn-group" role="group" aria-label={t("publicPortal.quickLinks")}>
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          disabled={quickLinksPageSafe <= 0}
                          onClick={() => setQuickLinksPage((p) => Math.max(0, p - 1))}
                          style={{ minHeight: 42, minWidth: 44 }}
                        >
                          <i className="bx bx-chevron-left fs-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          disabled={quickLinksPageSafe + 1 >= quickLinksTotalPages}
                          onClick={() =>
                            setQuickLinksPage((p) =>
                              Math.min(quickLinksTotalPages - 1, p + 1)
                            )
                          }
                          style={{ minHeight: 42, minWidth: 44 }}
                        >
                          <i className="bx bx-chevron-right fs-4" aria-hidden />
                        </button>
                      </div>
                    </div>
                  </div>

                  {pagedQuickLinks.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                      <i className="bx bx-search fs-1 mb-2"></i>
                      <p className="mb-0">{t("dashboardSearch.noResults")}</p>
                    </div>
                  ) : (
                    <div className="row g-3 justify-content-start">
                      {pagedQuickLinks.map((link, index) => {
                    const colorScheme =
                      quickLinkPalette[index % quickLinkPalette.length];
                    
                    return (
                      <div key={link.uid} className="col-xl-2 col-lg-3 col-md-4 col-sm-6 col-6">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-decoration-none"
                          onClick={() => {
                            // Optimistic UI update so user sees the count increase immediately
                            setQuickLinks((prev) =>
                              prev.map((l) =>
                                l.uid === link.uid
                                  ? { ...l, total_clicks: (l.total_clicks || 0) + 1 }
                                  : l
                              )
                            );
                            // Persist to backend (fire and forget)
                            recordQuickLinkClick(link.uid);
                          }}
                        >
                          <div 
                            className="card h-100 text-center quick-link-card shadow-sm" 
                            style={{ 
                              backgroundColor: colorScheme.bg,
                              border: `2px solid ${colorScheme.border}`,
                              color: colorScheme.text,
                              transition: "all 0.3s ease",
                              cursor: "pointer",
                              borderRadius: "12px",
                              minHeight: "140px",
                              display: "flex",
                              flexDirection: "column"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "translateY(-5px)";
                              e.currentTarget.style.boxShadow = `0 6px 16px ${colorScheme.border}40`;
                              e.currentTarget.style.borderColor = colorScheme.border;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow = portalDark
                                ? "0 2px 8px rgba(0,0,0,0.35)"
                                : "0 2px 8px rgba(0,0,0,0.1)";
                              e.currentTarget.style.borderColor = colorScheme.border;
                            }}
                          >
                            <div className="card-body p-3 p-md-4 d-flex flex-column justify-content-center align-items-center">
                              {link.logo ? (
                                <img
                                  src={normalizePublicPortalAssetUrl(link.logo)}
                                  alt={link.name}
                                  className="mb-3"
                                  style={{
                                    width: "56px",
                                    height: "56px",
                                    objectFit: "contain",
                                    maxWidth: "100%",
                                    margin: "0 auto",
                                    display: "block"
                                  }}
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    const iconDiv = e.target.parentElement.querySelector('.quick-link-icon');
                                    if (iconDiv) iconDiv.style.display = "flex";
                                  }}
                                />
                              ) : null}
                              <div
                                className="quick-link-icon mb-3"
                                style={{
                                  width: "56px",
                                  height: "56px",
                                  display: link.logo ? "none" : "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  margin: "0 auto",
                                  backgroundColor: `${colorScheme.border}15`,
                                  borderRadius: "12px"
                                }}
                              >
                                <i className="bx bx-link fs-2" style={{ color: colorScheme.icon }}></i>
                    </div>
                              <h6 className="mb-0 fw-bold" style={{ fontSize: "0.875rem", lineHeight: "1.3", color: colorScheme.text }}>
                                {link.name}
                              </h6>
                              {link.total_clicks > 0 && (
                                <small className="d-block mt-2" style={{ color: `${colorScheme.text}80` }}>
                                  <i className="bx bx-mouse-alt me-1"></i>
                                  {t("publicPortal.clicks", { n: link.total_clicks })}
                                </small>
                              )}
                            </div>
                          </div>
                        </a>
                      </div>
                    );
                  })}
                    </div>
                  )}
                </>
              )}
                  </div>
                </div>
              </div>
            </div>
                        </div>
                      )}
                    </Draggable>
                  );
                }
                return null;
            })}
            {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* FAQ View Modal */}
      <div
        className="modal fade"
        id="faqViewModal"
        tabIndex="-1"
        aria-labelledby="faqViewModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content portal-faq-modal-content">
            <div className="modal-header border-bottom portal-faq-modal-header">
              <h5 className="modal-title fw-bold text-white" id="faqViewModalLabel">
                <i className="bx bx-help-circle me-2" aria-hidden></i>
                {t("publicPortal.faqTitle")}
              </h5>
              <button
                type="button"
                className="btn-close portal-faq-modal-close"
                data-bs-dismiss="modal"
                aria-label={t("publicPortal.close")}
                onClick={() => setSelectedFaq(null)}
              ></button>
            </div>
            <div className="modal-body portal-faq-modal-body">
              {selectedFaq && (
                <>
                  {/* Header */}
                  <div className="mb-3">
                    <h4 className="mb-2 fw-bold portal-faq-modal-question" style={{ lineHeight: "1.2" }}>
                      {selectedFaq.question}
                    </h4>

                    <div className="d-flex flex-wrap align-items-center gap-2">
                      <span className="badge portal-faq-modal-badge">
                        <i className="bx bx-message-rounded-dots me-1"></i>
                        {t("publicPortal.answer")}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3 rounded portal-faq-modal-answer">
                    {selectedFaq.answer ? (
                      <p className="mb-0" style={{ whiteSpace: "pre-wrap", lineHeight: "1.7" }}>
                        {selectedFaq.answer}
                      </p>
                    ) : (
                      <p className="mb-0 text-muted">{t("publicPortal.noFaqAnswer")}</p>
                    )}
                  </div>
                </>
              )}
              </div>
            <div className="modal-footer portal-faq-modal-footer">
                    <button
                      type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
                onClick={() => setSelectedFaq(null)}
              >
                {t("publicPortal.close")}
                      </button>
             
            </div>
          </div>
        </div>
      </div>

      {/* Announcement View Modal */}
      <div
        className="modal fade"
        id="announcementViewModal"
        tabIndex="-1"
        aria-labelledby="announcementViewModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header border-bottom" style={{ backgroundColor: "#00853f", color: "white" }}>
              <h5 className="modal-title fw-bold text-white" id="announcementViewModalLabel">
                <i className="bx bx-bullhorn me-2"></i>
                {t("publicPortal.announcementModalTitle")}
              </h5>
                    <button
                      type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                aria-label={t("publicPortal.close")}
                onClick={() => setSelectedAnnouncement(null)}
              ></button>
            </div>
            <div className="modal-body">
              {selectedAnnouncement && (
                <>
                  {/* Header */}
                  <div className="mb-3">
                    <h4 className="mb-2 fw-bold text-dark" style={{ lineHeight: "1.2" }}>
                      {selectedAnnouncement.title}
                    </h4>

                    <div className="d-flex flex-wrap align-items-center gap-2">
                      {selectedAnnouncement.is_pinned && (
                        <span className="badge bg-warning text-dark">
                          <i className="bx bx-pin me-1"></i>
                          {t("publicPortal.pinned")}
                        </span>
                      )}

                      {selectedAnnouncement.priority && (
                        <span className={`badge ${getPriorityColor(selectedAnnouncement.priority)}`}>
                          <i className="bx bx-flag me-1"></i>
                          {t("publicPortal.priorityPrefix", {
                            priority: selectedAnnouncement.priority,
                          })}
                        </span>
                      )}

                      <span className="badge bg-light text-dark">
                        <i className="bx bx-calendar me-1"></i>
                        {formatDate(
                          selectedAnnouncement.start_date || selectedAnnouncement.created_at,
                          "DD/MM/YYYY"
                        )}
                      </span>

                      {selectedAnnouncement.end_date && (
                        <span className="badge bg-light text-dark">
                          <i className="bx bx-calendar-check me-1"></i>
                          <span style={{ color: "#ff6b6b", fontWeight: 700 }}>
                            {t("publicPortal.until")}
                          </span>{" "}
                          {formatDate(selectedAnnouncement.end_date, "DD/MM/YYYY")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div
                    className="p-3 rounded border portal-modal-muted-panel"
                    style={{ backgroundColor: "#f8f9fa" }}
                  >
                    {selectedAnnouncement.content ? (
                      <p className="mb-0 text-dark" style={{ whiteSpace: "pre-wrap", lineHeight: "1.7" }}>
                        {selectedAnnouncement.content}
                      </p>
                    ) : (
                      <p className="mb-0 text-muted">{t("publicPortal.noAnnouncementBody")}</p>
                    )}
                  </div>

                  {/* Attachment */}
                  {selectedAnnouncement.file_key && (
                    <div className="mt-3">
                      <div className="card border-0 portal-modal-muted-panel" style={{ backgroundColor: "#ffffff" }}>
                        <div className="card-body p-3 border rounded d-flex align-items-center justify-content-between gap-3 flex-wrap">
                          <div className="d-flex align-items-center gap-3">
                            <div
                              className="d-flex align-items-center justify-content-center"
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 10,
                                background: "linear-gradient(135deg, rgba(0, 133, 63, 0.1) 0%, rgba(61, 166, 106, 0.1) 100%)",
                              }}
                            >
                              <i className="bx bx-file" style={{ color: "#00853f", fontSize: "1.25rem" }}></i>
                            </div>

                            <div>
                              <div className="text-muted small">
                                {t("publicPortal.openDownloadHint")}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await downloadPortalAnnouncement(
                                  selectedAnnouncement.uid,
                                  selectedAnnouncement.original_filename || "attachment"
                                );
                              } catch {
                                showToast(
                                  t("publicPortal.downloadFailedAnnouncement"),
                                  "danger",
                                  t("publicPortal.download")
                                );
                              }
                            }}
                          >
                            <i className="bx bx-download me-1"></i>
                            {t("publicPortal.download")}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
                </div>
            <div className="modal-footer">
                    <button
                      type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
                onClick={() => setSelectedAnnouncement(null)}
              >
                {t("publicPortal.close")}
                    </button>
              </div>
            </div>
          </div>
        </div>

      {/* Todo View Modal */}
      <div
        className="modal fade"
        id="todoViewModal"
        tabIndex="-1"
        aria-labelledby="todoViewModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div
              className="modal-header border-bottom portal-todo-modal-header"
              style={{ backgroundColor: "#a8edea", color: "#333" }}
            >
              <h5 className="modal-title fw-bold text-dark" id="todoViewModalLabel">
                <i className="bx bx-check-square me-2"></i>
                {t("publicPortal.todoTitle")}
              </h5>
              <button
                type="button"
                className={portalDark ? "btn-close btn-close-white" : "btn-close"}
                data-bs-dismiss="modal"
                aria-label={t("publicPortal.close")}
                onClick={() => setSelectedTodo(null)}
              ></button>
      </div>
            <div className="modal-body">
              {selectedTodo && (
                <>
                  {/* Header */}
                  <div className="mb-3">
                    <h4 className="mb-2 fw-bold text-dark" style={{ lineHeight: "1.2" }}>
                      {selectedTodo.title}
                    </h4>

                    <div className="d-flex flex-wrap align-items-center gap-2">
                      {selectedTodo.status && (
                        <span className={getTodoStatusBadge(selectedTodo.status)}>
                          <i className="bx bx-badge-check me-1"></i>
                          {t("publicPortal.statusLabel")}:{" "}
                          {selectedTodo.status === "PENDING"
                            ? t("publicPortal.pending")
                            : selectedTodo.status === "IN_PROGRESS"
                            ? t("publicPortal.inProgress")
                            : selectedTodo.status === "COMPLETED"
                            ? t("publicPortal.completed")
                            : selectedTodo.status}
                  </span>
                      )}

                      {selectedTodo.priority && (
                        <span className={getTodoPriorityBadge(selectedTodo.priority)}>
                          <i className="bx bx-flag me-1"></i>
                          {t("publicPortal.priorityPrefix", {
                            priority: selectedTodo.priority,
                          })}
                        </span>
                      )}

                      {selectedTodo.department?.name && (
                        <span
                          className="badge"
                          style={{
                            backgroundColor: "#a8edea15",
                            color: "#0f766e",
                            border: "1px solid #a8edea",
                          }}
                        >
                          <i className="bx bx-building me-1"></i>
                          {t("publicPortal.departmentLabel")}: {selectedTodo.department.name}
                    </span>
                      )}

                      {selectedTodo.start_date && (
                        <span className="badge bg-light text-dark">
                          <i className="bx bx-time me-1"></i>
                          {t("publicPortal.start")} {formatTodoDate(selectedTodo.start_date)}
                        </span>
                      )}

                      {selectedTodo.due_date && (
                        <span className="badge bg-light text-dark">
                          <i className="bx bx-calendar-check me-1"></i>
                          <span style={{ color: "#ff6b6b", fontWeight: 700 }}>
                            {t("publicPortal.due")}
                          </span>{" "}
                          {formatTodoDate(selectedTodo.due_date)}
                        </span>
                      )}
                </div>
              </div>

                  {/* Content */}
                  <div
                    className="p-3 rounded border portal-modal-muted-panel"
                    style={{ backgroundColor: "#f8f9fa" }}
                  >
                    {selectedTodo.description ? (
                      <p className="mb-0 text-dark" style={{ whiteSpace: "pre-wrap", lineHeight: "1.7" }}>
                        {selectedTodo.description}
                      </p>
                    ) : (
                      <p className="mb-0 text-muted">{t("publicPortal.todoNoDetails")}</p>
                    )}
            </div>
                </>
              )}
              </div>
            <div className="modal-footer">
                    <button
                      type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
                onClick={() => setSelectedTodo(null)}
              >
                {t("publicPortal.close")}
                    </button>
            </div>
          </div>
        </div>
      </div>

      {/* Event View Modal */}
      <div
        className="modal fade"
        id="eventViewModal"
        tabIndex="-1"
        aria-labelledby="eventViewModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header border-bottom" style={{ backgroundColor: "#00f2fe", color: "white" }}>
              <h5 className="modal-title fw-bold text-white" id="eventViewModalLabel">
                <i className="bx bx-calendar me-2"></i>
                {t("publicPortal.event")}
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                aria-label={t("publicPortal.close")}
                onClick={() => setSelectedEvent(null)}
              ></button>
            </div>
            <div className="modal-body">
              {selectedEvent && (
                <>
                  {/* Header */}
                  <div className="mb-3">
                    <h4 className="mb-2 fw-bold text-dark" style={{ lineHeight: "1.2" }}>
                      {selectedEvent.title}
                    </h4>

                    <div className="d-flex flex-wrap align-items-center gap-2">
                      {selectedEvent.event_type && (
                        <span
                          className={`badge rounded-pill ${getEventTypeBadge(selectedEvent.event_type).class}`}
                        >
                          <i className="bx bx-tag-alt me-1"></i>
                          {getEventTypeBadge(selectedEvent.event_type).label}
                        </span>
                      )}

                      {selectedEvent.location && (
                    <span
                          className="badge"
                          style={{
                            backgroundColor: "#00853f15",
                            border: "1px solid #00853f",
                            color: "#3f51b5",
                          }}
                        >
                          <i className="bx bx-map me-1" style={{ color: "#00853f" }}></i>
                          {t("publicPortal.locationLabel")}: {selectedEvent.location}
                    </span>
                      )}

                      <span className="badge bg-light text-dark">
                        <i className="bx bx-calendar me-1"></i>
                        {formatDate(
                          selectedEvent.start_date || selectedEvent.created_at,
                          "DD/MM/YYYY HH:mm"
                        )}
                      </span>

                      {selectedEvent.end_date && (
                        <span className="badge bg-light text-dark">
                          <i className="bx bx-calendar-check me-1"></i>
                          <span style={{ color: "#ff6b6b", fontWeight: 700 }}>
                            {t("publicPortal.until")}
                          </span>{" "}
                          {formatDate(selectedEvent.end_date, "DD/MM/YYYY HH:mm")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div
                    className="p-3 rounded border portal-modal-muted-panel"
                    style={{ backgroundColor: "#f8f9fa" }}
                  >
                    {selectedEvent.description ? (
                      <p className="mb-0 text-dark" style={{ whiteSpace: "pre-wrap", lineHeight: "1.7" }}>
                        {selectedEvent.description}
                      </p>
                    ) : (
                      <p className="mb-0 text-muted">{t("publicPortal.eventNoDetails")}</p>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
                    <button
                      type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
                onClick={() => setSelectedEvent(null)}
              >
                {t("publicPortal.close")}
                    </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
