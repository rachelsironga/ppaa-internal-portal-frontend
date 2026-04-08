import React, { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "./Costants";
import { formatDate } from "./helpers/DateFormater";
import { useNavigate } from "react-router-dom";

const PUBLIC_DASHBOARD_CACHE_KEY = "publicPortalDashboardCache";
const PUBLIC_DASHBOARD_CACHE_TTL_MS = 2 * 60 * 1000;

// Section reveal wrapper for scroll-triggered animations
const SectionReveal = ({ children, className = "", style = {}, as: Tag = "div", ...rest }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <Tag
      ref={ref}
      className={`portal-section-reveal ${visible ? "portal-section-visible" : ""} ${className}`.trim()}
      style={style}
      {...rest}
    >
      {children}
    </Tag>
  );
};

// Simple Calendar Component
const SimpleCalendar = ({ events = [], onEventClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  const getEventsForDate = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(event => {
      if (!event.start_date) return false;
      const startDate = new Date(event.start_date).toISOString().split('T')[0];
      return startDate === dateStr;
    });
  };

  const hasEventEndDate = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.some(event => {
      if (!event.end_date) return false;
      const endDate = new Date(event.end_date).toISOString().split('T')[0];
      return endDate === dateStr;
    });
  };
  
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
            No active events present
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
                                  fontSize: "6px", 
                                  color: "#00f2fe",
                                  marginTop: "2px"
                                }}
                                title="Event end date"
                              ></i>
                            )}
                          </div>
                          {dayEvents.length > 0 && (
                            <div className="d-flex flex-column gap-1">
                              {dayEvents.slice(0, 2).map((event, idx) => {
                                const eventColors = [
                                  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                                  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                                  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                                ];
                                return (
                                  <div
                                    key={idx}
                                    className="badge text-white"
                                    style={{ 
                                      fontSize: "0.65rem", 
                                      cursor: "pointer",
                                      background: eventColors[idx % eventColors.length],
                                      border: "none",
                                      padding: "3px 6px"
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onEventClick) onEventClick(event);
                                    }}
                                    title={event.title ? event.title.toUpperCase() : ''}
                                  >
                                    {event.title.length > 10 ? event.title.substring(0, 10) + '...' : event.title}
                                  </div>
                                );
                              })}
                              {dayEvents.length > 2 && (
                                <small className="text-muted">+{dayEvents.length - 2} more</small>
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

const PortalPage = () => {
  const [data, setData] = useState(null);
  const [quickLinkLogoErrors, setQuickLinkLogoErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [selectedFaq, setSelectedFaq] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [announcementOffset, setAnnouncementOffset] = useState(0);
  const [todoOffset, setTodoOffset] = useState(0);
  const [faqOffset, setFaqOffset] = useState(0);
  const [faqSearchQuery, setFaqSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showAllDocumentCategories, setShowAllDocumentCategories] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('portalFontSize');
    return saved ? parseInt(saved) : 100; // Default 100% (base size)
  });
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    const saved = localStorage.getItem('portalTheme');
    return saved === 'dark';
  });
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showPopupCard, setShowPopupCard] = useState(true);
  const lastPopupShownAt = React.useRef(Date.now());
  const SHOW_DURATION_MS = 60 * 1000;   // visible for 1 min
  const HIDE_DURATION_MS = 4 * 60 * 1000; // hidden 4 min, then show again (every 5 min)
  const FIVE_MIN_MS = 5 * 60 * 1000;

  // Default Daily Motivation when none in DB (used in popup and useEffects below)
  const DEFAULT_MOTIVATIONAL_QUOTE = "Timely and Fair Appeals Dispensation";
  const DEFAULT_GRATITUDE_MESSAGE =
    "I sincerely thank all employees for their dedication, professionalism, and commitment to delivering timely and fair services. Your hard work continues to strengthen our institution.";
  const DEFAULT_ES_IMAGE = "/assets/img/avatars/ES.png";
  const displayQuote = data?.popup_card?.motivational_quote || DEFAULT_MOTIVATIONAL_QUOTE;
  const displayGratitude = data?.popup_card?.gratitude_message || DEFAULT_GRATITUDE_MESSAGE;
  const displayEsImage = data?.popup_card?.es_image_url || DEFAULT_ES_IMAGE;

  // When card is visible: auto-hide after 1 min
  useEffect(() => {
    const hasContent = data && (displayQuote || displayGratitude || displayEsImage);
    if (!hasContent || !showPopupCard) return;
    lastPopupShownAt.current = Date.now();
    const t = window.setTimeout(() => setShowPopupCard(false), SHOW_DURATION_MS);
    return () => clearTimeout(t);
  }, [showPopupCard, data, displayQuote, displayGratitude, displayEsImage]);

  // When card is hidden: show again after 4 min (every 5 min) only if user is actively on the page (tab visible)
  useEffect(() => {
    const hasContent = data && (displayQuote || displayGratitude || displayEsImage);
    if (!hasContent || showPopupCard) return;
    const t = window.setTimeout(() => {
      if (document.visibilityState === "visible") {
        setShowPopupCard(true);
      }
    }, HIDE_DURATION_MS);
    return () => clearTimeout(t);
  }, [showPopupCard, data, displayQuote, displayGratitude, displayEsImage]);

  // When user returns to the tab: reopen card if it's been 5+ min since last show and they're actively on the page
  useEffect(() => {
    const hasContent = data && (displayQuote || displayGratitude || displayEsImage);
    if (!hasContent) return;
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible" || showPopupCard) return;
      const elapsed = Date.now() - lastPopupShownAt.current;
      if (elapsed >= FIVE_MIN_MS) {
        setShowPopupCard(true);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [showPopupCard, data, displayQuote, displayGratitude, displayEsImage]);

  // Save font size to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('portalFontSize', fontSize.toString());
  }, [fontSize]);

  // Apply dark/light theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkTheme) {
      root.setAttribute('data-portal-theme', 'dark');
      localStorage.setItem('portalTheme', 'dark');
    } else {
      root.removeAttribute('data-portal-theme');
      localStorage.setItem('portalTheme', 'light');
    }
  }, [isDarkTheme]);

  // Back to top: show button after scrolling down
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 10, 150)); // Max 150%
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 10, 70)); // Min 70%
  };

  const resetFontSize = () => {
    setFontSize(100); // Reset to default
  };

  useEffect(() => {
    const readCachedDashboard = () => {
      try {
        const raw = sessionStorage.getItem(PUBLIC_DASHBOARD_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed?.data || !parsed?.timestamp) return null;
        const isFresh = Date.now() - parsed.timestamp < PUBLIC_DASHBOARD_CACHE_TTL_MS;
        return isFresh ? parsed.data : null;
      } catch {
        return null;
      }
    };

    const cached = readCachedDashboard();
    if (cached) {
      setData(cached);
      setLoading(false);
    }

    const fetchPublicDashboard = async () => {
      try {
        if (!cached) setLoading(true);
        setError(null);
        const res = await axios.get(`${API_BASE_URL}/public/ppaa-dashboard/`, {
          timeout: 15000,
        });
        const nextData = res.data?.data || res.data;
        setData(nextData);
        try {
          sessionStorage.setItem(
            PUBLIC_DASHBOARD_CACHE_KEY,
            JSON.stringify({
              timestamp: Date.now(),
              data: nextData,
            })
          );
        } catch {
          // Ignore storage quota/cache issues.
        }
      } catch (err) {
        console.error("Failed to load public dashboard:", err);
        if (!cached) {
          setError("Failed to load portal data. Please try again later.");
        }
      } finally {
        if (!cached) setLoading(false);
      }
    };

    fetchPublicDashboard();
  }, []);

  const truncateWords = (text, words = 15) => {
    if (!text) return "";
    const parts = text.trim().split(/\s+/);
    if (parts.length <= words) return text;
    return parts.slice(0, words).join(" ") + "...";
  };

  // Track quick link clicks (public page) without blocking navigation
  const trackQuickLinkClick = (uid) => {
    try {
      const url = `${API_BASE_URL}/public/quick-links/${uid}/click/`;
      if (navigator?.sendBeacon) {
        // sendBeacon is best-effort and doesn't block page navigation
        navigator.sendBeacon(url);
        return;
      }
      // Fallback
      fetch(url, { method: "POST", keepalive: true }).catch(() => {});
    } catch {
      // ignore
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

  const stats = data?.stats || {};
  const announcementsData = data?.announcements || [];
  const eventsData = data?.events || [];
  const faqs = data?.faqs || [];
  const quickLinks = data?.quick_links || [];
  const documentsData = data?.documents || [];
  const todosData = data?.todos || [];
  const popupCard = data?.popup_card || null;

  // Filter documents to show only public and published documents
  const documents = useMemo(() => {
    return documentsData.filter(doc => {
      // Show only public documents
      if (doc.is_public !== true) {
        return false;
      }
      // Show only published documents
      if (doc.status !== 'PUBLISHED') {
        return false;
      }
      return true;
    });
  }, [documentsData]);

  // Get current date (start of today) for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter events to exclude those with end_date in the past
  const events = useMemo(() => {
    return eventsData.filter(event => {
      // If no end_date, include the event
      if (!event.end_date) return true;
      // Include only if end_date is today or in the future
      const endDate = new Date(event.end_date);
      endDate.setHours(0, 0, 0, 0);
      return endDate >= today;
    });
  }, [eventsData]);

  // Filter active todos (is_active=true and status not COMPLETED or CANCELLED)
  // Also exclude todos with due_date in the past
  // Sort by start_date (earliest first), then by due_date if start_date is missing
  const activeTodos = useMemo(() => {
    return todosData
      .filter(todo => {
        // Basic active filter
        if (todo.is_active !== true || 
            todo.status === 'COMPLETED' || 
            todo.status === 'CANCELLED') {
          return false;
        }
        // If todo has a due_date, check if it's in the past
        if (todo.due_date) {
          const dueDate = new Date(todo.due_date);
          dueDate.setHours(0, 0, 0, 0);
          // Exclude if due_date is before today
          if (dueDate < today) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        // Sort by start_date if available
        if (a.start_date && b.start_date) {
          return new Date(a.start_date) - new Date(b.start_date);
        }
        if (a.start_date) return -1;
        if (b.start_date) return 1;
        // If no start_date, sort by due_date
        if (a.due_date && b.due_date) {
          return new Date(a.due_date) - new Date(b.due_date);
        }
        if (a.due_date) return -1;
        if (b.due_date) return 1;
        return 0;
      });
  }, [todosData]);

  // Filter active announcements and sort by start_date (earliest first), then by created_at if start_date is missing
  // Also exclude announcements with end_date in the past
  const activeAnnouncements = useMemo(() => {
    // Get today's date string (YYYY-MM-DD) for comparison
    const todayStr = today.toISOString().split('T')[0];
    
    return announcementsData
      .filter(announcement => {
        // Basic active filter
        if (announcement.is_active !== true) {
          return false;
        }
        // If announcement has an end_date, check if it's in the past
        if (announcement.end_date) {
          const endDateStr = new Date(announcement.end_date).toISOString().split('T')[0];
          // Exclude if end_date is before today (comparing date strings)
          if (endDateStr < todayStr) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        // Sort by start_date if available
        if (a.start_date && b.start_date) {
          return new Date(a.start_date) - new Date(b.start_date);
        }
        if (a.start_date) return -1;
        if (b.start_date) return 1;
        // If no start_date, sort by created_at
        if (a.created_at && b.created_at) {
          return new Date(b.created_at) - new Date(a.created_at); // Most recent first if no start_date
        }
        return 0;
      });
  }, [announcementsData]);

  // Combine todos and announcements for alternating display
  // Show all announcements if there are more than one
  const combinedItems = useMemo(() => {
    const items = [];
    activeTodos.slice(0, 5).forEach(todo => {
      items.push({ type: 'todo', data: todo });
    });
    // Show all announcements instead of limiting to 5
    activeAnnouncements.forEach(announcement => {
      items.push({ type: 'announcement', data: announcement });
    });
    return items;
  }, [activeTodos, activeAnnouncements]);

  // Auto-rotate through items
  useEffect(() => {
    if (combinedItems.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % combinedItems.length);
    }, 5000); // Change every 5 seconds
    return () => clearInterval(interval);
  }, [combinedItems.length]);

  // Time-based greeting
  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { greeting: "Good morning", sub: "Here's what's new today." };
    if (hour < 17) return { greeting: "Good afternoon", sub: "Here's what's new today." };
    return { greeting: "Good evening", sub: "Here's what's new today." };
  }, []);

  // Next upcoming event for countdown
  const nextEventCountdown = useMemo(() => {
    const upcoming = events
      .filter(e => e.start_date && new Date(e.start_date) >= new Date())
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))[0];
    if (!upcoming) return null;
    const start = new Date(upcoming.start_date);
    const now = new Date();
    const diffMs = start - now;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let text = "Starts soon";
    if (diffDays > 0) text = `Starts in ${diffDays} ${diffDays === 1 ? "day" : "days"}`;
    else if (diffDays === 0 && diffHours > 0) text = `Starts in ${diffHours} ${diffHours === 1 ? "hour" : "hours"}`;
    else if (diffDays === 0 && diffHours <= 0) text = "Starting today";
    return { event: upcoming, text };
  }, [events]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
        className="d-flex align-items-center justify-content-center text-white"
      >
        <div className="text-center">
          <div className="spinner-border text-light mb-3" role="status" />
          <p className="mb-0">Loading portal data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Global styles for portal enhancements */}
      <style>{`
        .portal-animated-bg {
          position: fixed;
          inset: 0;
          z-index: -1;
          overflow: hidden;
          pointer-events: none;
        }
        .portal-animated-bg::before {
          content: "";
          position: absolute;
          inset: -50%;
          background: linear-gradient(135deg,
            rgba(102, 126, 234, 0.04) 0%,
            rgba(118, 75, 162, 0.03) 25%,
            rgba(79, 172, 254, 0.03) 50%,
            rgba(0, 242, 254, 0.02) 75%,
            rgba(102, 126, 234, 0.04) 100%);
          background-size: 400% 400%;
          animation: portalGradientShift 18s ease infinite;
        }
        .portal-animated-bg::after {
          content: "";
          position: absolute;
          width: 80vmax;
          height: 80vmax;
          top: -20vmax;
          right: -20vmax;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(118, 75, 162, 0.06) 0%, transparent 70%);
          animation: portalBlobFloat 22s ease-in-out infinite;
        }
        @keyframes portalGradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes portalBlobFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-5%, -10%) scale(1.05); }
          66% { transform: translate(5%, 5%) scale(0.98); }
        }
        [data-portal-theme="dark"] .portal-animated-bg::before {
          background: linear-gradient(135deg,
            rgba(30, 41, 59, 0.95) 0%,
            rgba(51, 65, 85, 0.9) 50%,
            rgba(30, 41, 59, 0.95) 100%);
          opacity: 0.5;
        }
        [data-portal-theme="dark"] .portal-animated-bg::after { opacity: 0.3; }
        .portal-section-reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }
        .portal-section-reveal.portal-section-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .portal-card-lift {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .portal-card-lift:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
        }
        [data-portal-theme="dark"] .portal-card-lift:hover {
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
        }
        .portal-back-to-top {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1060;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
          transition: transform 0.2s ease, opacity 0.3s ease, box-shadow 0.2s ease;
        }
        .portal-back-to-top:hover {
          transform: translateX(-50%) translateY(-3px);
          box-shadow: 0 8px 28px rgba(102, 126, 234, 0.5);
        }
        .portal-back-to-top i { transition: transform 0.2s ease; }
        .portal-back-to-top:hover i { transform: translateY(-2px); }
        .portal-greeting-heading {
          font-size: 1.4rem;
          letter-spacing: 0.02em;
          text-shadow: 0 2px 8px rgba(15, 23, 42, 0.35);
          animation: portalGreetingEnter 0.8s ease-out;
        }
        .portal-greeting-highlight {
          font-weight: 700;
        }
        .portal-greeting-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          margin-right: 8px;
        }
        @keyframes portalGreetingEnter {
          0% {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
          }
          60% {
            opacity: 1;
            transform: translateY(0) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        [data-portal-theme="dark"] {
          --portal-nav-bg: #1e293b;
          --portal-body-bg: rgba(15, 23, 42, 0.85);
          --portal-body-text: #e2e8f0;
        }
        [data-portal-theme="dark"] .text-muted { color: #94a3b8 !important; }
        [data-portal-theme="dark"] .card { background: rgba(30, 41, 59, 0.6); border-color: rgba(71, 85, 105, 0.5); }
        [data-portal-theme="dark"] .list-group-item { background: rgba(30, 41, 59, 0.4); border-color: rgba(71, 85, 105, 0.4); }
        [data-portal-theme="dark"] .form-control, [data-portal-theme="dark"] .input-group-text { background: #334155; border-color: #475569; color: #e2e8f0; }
      `}</style>

      {/* Subtle animated background */}
      <div className="portal-animated-bg" aria-hidden="true" />

      {/* Fixed Top Navigation Bar */}
      <nav
        className="navbar navbar-expand-lg shadow-sm portal-nav-theme"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1030,
          padding: "0.75rem 1.5rem",
          backgroundColor: "var(--portal-nav-bg, #fff)",
          color: "var(--portal-nav-text, inherit)",
        }}
      >
        <div className="container-fluid">
          <div className="d-flex align-items-center gap-3">
            <img
              src="/assets/img/nembo.jpg"
              alt="PPAA Logo Left"
              width={50}
              height={50}
              style={{ borderRadius: 8, objectFit: "cover" }}
            />
            <div className="d-flex align-items-center gap-2">
              <span
                className="fw-bold"
                style={{ fontSize: "1.1rem", color: "#667eea" }}
              >
                PPAA
              </span>
              <span
                className="fw-bold"
                style={{ fontSize: "1.1rem", color: "#764ba2" }}
              >
                PORTAL
              </span>
            </div>
            <img
              src="/assets/img/logo.png"
              alt="PPAA Logo Right"
              width={50}
              height={50}
              style={{ borderRadius: 8, objectFit: "cover" }}
            />
          </div>
          <div className="ms-auto d-flex align-items-center gap-3">
            {/* Dark/Light theme toggle */}
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setIsDarkTheme(prev => !prev)}
              title={isDarkTheme ? "Switch to light mode" : "Switch to dark mode"}
              style={{
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label={isDarkTheme ? "Light mode" : "Dark mode"}
            >
              <i className={isDarkTheme ? "bx bx-sun" : "bx bx-moon"} style={{ fontSize: "1.1rem" }} />
            </button>
            {/* Font Size Controls */}
            <div className="d-flex align-items-center gap-2">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={decreaseFontSize}
                title="Decrease text size"
                style={{
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <i className="bx bx-minus"></i>
              </button>
              <span
                className="text-muted"
                style={{
                  minWidth: "45px",
                  textAlign: "center",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              >
                {fontSize}%
              </span>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={increaseFontSize}
                title="Increase text size"
                style={{
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <i className="bx bx-plus"></i>
              </button>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={resetFontSize}
                title="Reset to default size"
                style={{
                  padding: "0.25rem 0.5rem",
                  fontSize: "0.75rem",
                }}
              >
                Reset
              </button>
            </div>
            <button
              className="btn btn-primary"
              style={{
                borderRadius: 999,
                padding: "0.5rem 1.5rem",
                fontWeight: 600,
              }}
              onClick={() => navigate("/auth/login")}
            >
              <i className="bx bx-log-in me-2" />
              Login
            </button>
          </div>
        </div>
      </nav>

      <div
        className="portal-main-content"
        style={{
          minHeight: "100vh",
          paddingTop: "5rem",
          paddingBottom: "3rem",
          paddingLeft: "1rem",
          paddingRight: "1rem",
          fontSize: `${fontSize}%`,
          color: "var(--portal-body-text, inherit)",
          backgroundColor: "var(--portal-body-bg, transparent)",
        }}
      >
        <div className="container">
        {/* Welcome + rotating card – scroll reveal */}
        <SectionReveal className="row mb-4 mt-4">
          <div className="col-lg-8 mb-3 mb-lg-0">
            <div
              className="card border-0"
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
              }}
            >
              <div className="d-flex align-items-end row">
                <div className="col-sm-7">
                  <div className="card-body">
                    <h5 className="card-title text-white mb-2 portal-greeting-heading">
                      <span className="portal-greeting-icon">
                        <i className="bx bx-smile"></i>
                      </span>
                      <span>
                        {timeGreeting.greeting},{" "}
                        <span className="portal-greeting-highlight">
                          welcome to PPAA Internal Portal
                        </span>
                      </span>
                    </h5>
                    <p className="text-white-50 mb-3" style={{ fontSize: "0.9rem" }}>
                      {timeGreeting.sub}
                    </p>
                    <p
                      className="mb-4 text-white-50"
                      style={{ fontSize: "0.95rem" }}
                    >
                      Explore public announcements, upcoming events, documents,
                      FAQs and quick links. Let's explore.
                    </p>
                    <button
                      className="btn btn-light btn-sm"
                      style={{ borderRadius: 999, fontWeight: 600 }}
                      onClick={() => navigate("/auth/login")}
                    >
                      <i className="bx bx-log-in me-2" />
                      Login to Internal Portal
                    </button>
                  </div>
                </div>
                <div className="col-sm-5 text-center text-sm-left">
                  <div className="card-body pb-0 px-0 px-md-4">
                    <img
                      aria-label="dashboard icon image"
                      src="/assets/img/illustrations/man-with-laptop-light.png"
                      height="140"
                      alt="Dashboard"
                      data-app-dark-img="illustrations/man-with-laptop-dark.png"
                      data-app-light-img="illustrations/man-with-laptop-light.png"
                      style={{ filter: "brightness(1.1)" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right highlight card – rotating animation */}
          <div className="col-lg-4">
            <div
              className="card border-0 shadow-lg h-100 portal-card-lift"
              style={{
                overflow: "hidden",
                position: "relative",
                minHeight: "200px",
              }}
            >
              {combinedItems.length === 0 ? (
                <div className="card-body d-flex align-items-center justify-content-center" style={{ minHeight: "200px" }}>
                  <div className="text-center text-muted">
                    <i className="bx bx-info-circle fs-1 mb-2"></i>
                    <p>No items to display</p>
                  </div>
                </div>
              ) : (
                <div style={{ position: "relative", height: "100%", minHeight: "200px" }}>
                  {combinedItems.map((item, index) => {
                    const isActive = index === currentIndex;
                    const isTodo = item.type === 'todo';
                    const data = item.data;
                    
                    return (
                      <div
                        key={`${item.type}-${data.uid}-${index}`}
                        className="card-body"
                        style={{
                          position: isActive ? "relative" : "absolute",
                          width: "100%",
                          opacity: isActive ? 1 : 0,
                          transform: isActive ? "translateX(0)" : "translateX(100%)",
                          transition: "all 1.9s ease-in-out",
                          zIndex: isActive ? 10 : 1,
                          minHeight: "200px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          background: isTodo 
                            ? "linear-gradient(135deg, #a8edea15 0%, #fed6e315 100%)"
                            : "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)",
                          borderTop: `4px solid ${isTodo ? "#a8edea" : "#667eea"}`,
                          borderRadius: "8px",
                          cursor: isActive ? "pointer" : "default"
                        }}
                        onClick={() => {
                          if (!isActive) return;
                          // Scroll to the appropriate section based on item type
                          // Account for fixed navbar (approximately 80px)
                          const navbarOffset = 80;
                          
                          if (item.type === 'todo') {
                            const todosSection = document.getElementById('todos-section');
                            if (todosSection) {
                              const elementPosition = todosSection.getBoundingClientRect().top;
                              const offsetPosition = elementPosition + window.pageYOffset - navbarOffset;
                              window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                            }
                          } else if (item.type === 'announcement') {
                            const announcementsSection = document.getElementById('announcements-section');
                            if (announcementsSection) {
                              const elementPosition = announcementsSection.getBoundingClientRect().top;
                              const offsetPosition = elementPosition + window.pageYOffset - navbarOffset;
                              window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                            }
                          } else if (item.type === 'event') {
                            const eventsSection = document.getElementById('events-section');
                            if (eventsSection) {
                              const elementPosition = eventsSection.getBoundingClientRect().top;
                              const offsetPosition = elementPosition + window.pageYOffset - navbarOffset;
                              window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                            }
                          }
                        }}
                      >
                        {isTodo ? (
                          <>
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <i className="bx bx-check-square" style={{ color: "#a8edea", fontSize: "1.5rem" }}></i>
                              <h6 className="mb-0 fw-bold" style={{ color: "#a8edea" }}>Active Todo</h6>
                            </div>
                            <h5 className="mb-2 fw-bold" style={{ color: "#333" }}>{data.title}</h5>
                            {data.description && (
                              <p className="text-muted mb-2 small" style={{ lineHeight: "1.0" }}>
                                {truncateWords(data.description, 15)}
                              </p>
                            )}
                            <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                              <span className={getTodoStatusBadge(data.status)}>
                                {data.status === 'PENDING' ? 'Pending' : 
                                 data.status === 'IN_PROGRESS' ? 'In Progress' : 
                                 data.status}
                              </span>
                              <span className={getTodoPriorityBadge(data.priority)}>
                                {data.priority}
                              </span>
                            </div>
                            <div className="d-flex align-items-center gap-3 flex-wrap">
                              {data.start_date && (
                                <small className="d-flex align-items-center" style={{ color: "#4facfe", fontWeight: "500" }}>
                                  <i className="bx bx-time me-1"></i>
                                  Start: {formatTodoDate(data.start_date)}
                                </small>
                              )}
                              {data.due_date && (
                                <small className="d-flex align-items-center" style={{ color: "#ff6b6b", fontWeight: "500" }}>
                                  <i className="bx bx-calendar-check me-1"></i>
                                  Due: {formatTodoDate(data.due_date)}
                                </small>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <i className="bx bx-bullhorn" style={{ color: "#667eea", fontSize: "1.5rem" }}></i>
                              <h6 className="mb-0 fw-bold" style={{ color: "#667eea" }}>Announcement</h6>
                              {data.is_pinned && <i className="bx bx-pin text-warning"></i>}
                            </div>
                            <h5 className="mb-2 fw-bold" style={{ color: "#333" }}>{data.title}</h5>
                            <p className="text-muted mb-2 small" style={{ lineHeight: "1.0" }}>
                              {truncateWords(data.content, 15)}
                            </p>
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <span className={`badge ${getPriorityColor(data.priority)}`}>
                                {data.priority}
                              </span>
                              <small className="text-muted">
                                <i className="bx bx-calendar me-1"></i>
                                {formatDate(data.created_at, "DD/MM/YYYY")}
                              </small>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                  {/* Navigation dots */}
                  {combinedItems.length > 1 && (
                    <div className="position-absolute bottom-0 start-50 translate-middle-x mb-2" style={{ zIndex: 20 }}>
                      <div className="d-flex gap-1">
                        {combinedItems.map((_, index) => (
                          <button
                            key={index}
                            className="btn btn-sm p-1"
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              padding: 0,
                              backgroundColor: index === currentIndex ? "#667eea" : "#ccc",
                              border: "none"
                            }}
                            onClick={() => setCurrentIndex(index)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </SectionReveal>

        {/* Events & FAQs row */}
        <SectionReveal className="row g-4 mb-4" id="events-section">
          {/* Events */}
          <div className="col-lg-8 col-md-12">
            <div
              className="card border-0 shadow-lg h-100 portal-card-lift"
              style={{ borderTop: "4px solid #00f2fe" }}
            >
              <div
                className="card-header border-0 d-flex justify-content-between align-items-center"
                style={{
                  background:
                    "linear-gradient(135deg, #4facfe15 0%, #00f2fe15 100%)",
                }}
              >
                <h5 className="mb-0">
                  <i
                    className="bx bx-calendar me-2"
                    style={{ color: "#00f2fe" }}
                  ></i>
                  <span style={{ color: "#00f2fe" }}>Events Calendar</span>
                </h5>
              </div>
              {nextEventCountdown && (
                <div
                  className="mx-3 mt-2 mb-0 py-2 px-3 rounded d-flex align-items-center justify-content-between flex-wrap gap-2"
                  style={{
                    background: "linear-gradient(135deg, #00f2fe18 0%, #4facfe18 100%)",
                    borderLeft: "4px solid #00f2fe",
                  }}
                >
                  <div>
                    <strong style={{ color: "#00f2fe" }}>Next up:</strong>{" "}
                    <span>{nextEventCountdown.event.title}</span>
                    <small className="text-muted ms-2">
                      {formatDate(nextEventCountdown.event.start_date, "DD/MM/YYYY HH:mm")}
                    </small>
                  </div>
                  <span className="badge bg-primary">{nextEventCountdown.text}</span>
                </div>
              )}
              <div className="card-body">
                <SimpleCalendar
                  events={events}
                  onEventClick={(event) => {
                    setSelectedEvent(event);
                    const modal = new window.bootstrap.Modal(document.getElementById('eventViewModal'));
                    modal.show();
                  }}
                />
             
                {events.length > 0 && (
                  <div className="mt-3">
                    <h6 className="mb-2">Upcoming Events</h6>
                    <div className="list-group">
                      {events
                        .filter(event => {
                          if (!event.start_date) return false;
                          return new Date(event.start_date) >= new Date();
                        })
                        .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
                        .slice(0, 3)
                        .map((event, index) => (
                          <div
                            key={event.uid}
                            className="list-group-item list-group-item-action cursor-pointer"
                            style={{ 
                              borderLeft: "4px solid #00f2fe",
                              transition: "all 0.5s ease-in-out",
                              opacity: 0,
                              transform: "translateX(100%)",
                              animation: `slideInRight 0.5s ease-out ${index * 0.2}s forwards`
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#00f2fe10";
                              e.currentTarget.style.transform = "translateX(5px)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "transparent";
                              e.currentTarget.style.transform = "translateX(0)";
                            }}
                            onClick={() => {
                              setSelectedEvent(event);
                              const modal = new window.bootstrap.Modal(document.getElementById('eventViewModal'));
                              modal.show();
                            }}
                          >
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <h6 className="mb-1 fw-semibold">{event.title}</h6>
                                <div className="d-flex align-items-center gap-2 mb-1">
                                  <small className="text-muted d-flex align-items-center">
                                    <i className="bx bx-calendar me-1"></i>
                                    <strong>Start:</strong> {formatDate(event.start_date, "DD/MM/YYYY HH:mm")}
                                  </small>
                                </div>
                                {event.end_date && (
                                  <div className="mb-1">
                                    <small className="text-muted d-flex align-items-center">
                                      <i className="bx bx-calendar-check me-1"></i>
                                      <strong>End:</strong> {formatDate(event.end_date, "DD/MM/YYYY HH:mm")}
                                    </small>
                                  </div>
                                )}
                                {event.location && (
                                  <div className="mt-1">
                                    <small className="text-muted d-flex align-items-center">
                                      <i className="bx bx-map me-1"></i>
                                      {event.location}
                                    </small>
                                  </div>
                                )}
                              </div>
                              {event.event_type && (
                                <span className="badge bg-light text-dark">
                                  {event.event_type}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* FAQs */}
          <div className="col-lg-4 col-md-12">
            <div
              className="card border-0 shadow-lg h-100 portal-card-lift"
              style={{ borderTop: "4px solid #fee140" }}
            >
              <div
                className="card-header border-0"
                
                style={{
                  background:
                    "linear-gradient(135deg, #fa709a15 0%, #fee14015 100%)",
                }}
              >
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="mb-0">
                    <i
                      className="bx bx-help-circle me-2"
                      style={{ color: "#fee140" }}
                    ></i>
                    <span style={{ color: "#fee140" }}>Recent FAQs</span>
                  </h5>
                </div>
                <div className="mt-2">
                  <div className="input-group input-group-sm">
                    <span className="input-group-text" style={{ backgroundColor: "white", borderColor: "#fee140" }}>
                      <i className="bx bx-search" style={{ color: "#fee140" }}></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search FAQs..."
                      value={faqSearchQuery}
                      onChange={(e) => {
                        setFaqSearchQuery(e.target.value);
                        setFaqOffset(0); // Reset offset when searching
                      }}
                      style={{ borderColor: "#fee140" }}
                    />
                  </div>
                </div>
              </div>
              <div className="card-body p-3">
                {(() => {
                  const filteredFaqs = faqs.filter(faq => {
                    if (!faqSearchQuery.trim()) return true;
                    const query = faqSearchQuery.toLowerCase();
                    return (
                      faq.question?.toLowerCase().includes(query) ||
                      faq.answer?.toLowerCase().includes(query)
                    );
                  });

                  if (filteredFaqs.length === 0) {
                    return (
                      <div className="text-center py-4 text-muted">
                        <i className="bx bx-info-circle fs-1 mb-2"></i>
                        <p>{faqSearchQuery ? "No FAQs found matching your search" : "No FAQs available"}</p>
                      </div>
                    );
                  }

                  return (
                    <>
                      <div 
                        className="row g-3"
                        style={{
                          overflow: "hidden",
                          position: "relative",
                          minHeight: "200px"
                        }}
                      >
                        {filteredFaqs.slice(faqOffset, faqOffset + 3).map((faq, index) => (
                          <div 
                            key={faq.uid} 
                            className="col-12"
                            style={{
                              animation: `slideInRight 0.5s ease-out ${index * 0.1}s both`
                            }}
                          >
                            <div
                              className="card border-0 shadow-sm cursor-pointer h-100"
                              style={{ 
                                borderLeft: "4px solid #fee140",
                                transition: "all 0.3s ease",
                                background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-5px)";
                                e.currentTarget.style.boxShadow = "0 8px 16px rgba(254, 225, 64, 0.2)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                              }}
                              onClick={() => {
                                setSelectedFaq(faq);
                                const modal = new window.bootstrap.Modal(document.getElementById('faqViewModal'));
                                modal.show();
                              }}
                            >
                              <div className="card-body p-3">
                                <div className="d-flex align-items-start mb-2">
                                  <i className="bx bx-help-circle text-warning me-2 mt-1 fs-5"></i>
                                  <h6 className="mb-0 fw-bold flex-grow-1" style={{ color: "#fee140" }}>
                                    {faq.question}
                                  </h6>
                                </div>
                                <p className="text-muted mb-2 small" style={{ lineHeight: "1.5" }}>
                                  {truncateWords(faq.answer, 20)}
                                </p>
                          
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {filteredFaqs.length > 3 && (
                        <div className="text-center mt-3 pt-3 border-top d-flex justify-content-between align-items-center">
                          {faqOffset > 0 && (
                            <button
                              className="btn btn-sm"
                              style={{ 
                                backgroundColor: "#fee140", 
                                color: "#333", 
                                border: "none",
                                fontWeight: "500"
                              }}
                              onClick={() => setFaqOffset(Math.max(0, faqOffset - 3))}
                            >
                              <i className="bx bx-chevron-left me-1"></i>
                              Previous
                            </button>
                          )}
                          {faqOffset === 0 && <div></div>}
                          {faqOffset + 3 < filteredFaqs.length && (
                            <button
                              className="btn btn-sm"
                              style={{ 
                                backgroundColor: "#fee140", 
                                color: "#333", 
                                border: "none",
                                fontWeight: "500"
                              }}
                              onClick={() => setFaqOffset(Math.min(filteredFaqs.length - 3, faqOffset + 3))}
                            >
                              <i className="bx bx-chevron-right me-1"></i>
                              See More ({filteredFaqs.length - faqOffset - 3} more)
                            </button>
                          )}
                          {faqOffset + 3 >= filteredFaqs.length && faqOffset > 0 && (
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
                })()}
              </div>
            </div>
          </div>
        </SectionReveal>

        {/* Active Todos and Announcements - Side by Side */}
        <SectionReveal className="row g-4 mb-4">
          {/* Active Todos Section - Left */}
          <div className="col-lg-6 col-md-12" id="todos-section">
            <div
              className="card border-0 shadow-lg h-100 portal-card-lift"
              style={{ borderTop: "4px solid #a8edea" }}
            >
              <div
                className="card-header border-0 d-flex justify-content-between align-items-center"
                style={{
                  background:
                    "linear-gradient(135deg, #a8edea15 0%, #fed6e315 100%)",
                }}
              >
                <h5 className="mb-0">
                  <i
                    className="bx bx-check-square me-2"
                    style={{ color: "#a8edea" }}
                  ></i>
                  <span style={{ color: "#a8edea", fontWeight: "bold" }}>
                    Active Todo List
                  </span>
                </h5>
              </div>
              <div className="card-body p-0">
                {activeTodos.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <i className="bx bx-info-circle fs-1 mb-2"></i>
                    <p>No Active Todo List at the moment</p>
                  </div>
                ) : (
                  <>
                    <div
                      className="list-group list-group-flush"
                      style={{
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      {activeTodos
                        .slice(todoOffset, todoOffset + 3)
                        .map((todo, index) => (
                          <div
                            key={todo.uid}
                            className="list-group-item list-group-item-action cursor-pointer"
                            style={{
                              borderLeft: "4px solid #a8edea",
                              transition: "all 0.2s ease",
                              animation: `slideInRight 0.5s ease-out ${
                                index * 0.1
                              }s both`,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#a8edea10";
                              e.currentTarget.style.transform = "translateX(5px)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "transparent";
                              e.currentTarget.style.transform = "translateX(0)";
                            }}
                            onClick={() => {
                              setSelectedTodo(todo);
                              const modal = new window.bootstrap.Modal(
                                document.getElementById("todoViewModal")
                              );
                              modal.show();
                            }}
                          >
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="flex-grow-1">
                                <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                                  <h6 className="mb-0">{todo.title}</h6>
                                  <span className={getTodoStatusBadge(todo.status)}>
                                    {todo.status === "PENDING"
                                      ? "Pending"
                                      : todo.status === "IN_PROGRESS"
                                      ? "In Progress"
                                      : todo.status}
                                  </span>
                                  <span className={getTodoPriorityBadge(todo.priority)}>
                                    {todo.priority}
                                  </span>
                                </div>
                                {todo.description && (
                                  <p className="text-muted mb-1 small">
                                    {todo.description.substring(0, 80)}
                                    {todo.description.length > 80 ? "..." : ""}
                                  </p>
                                )}
                                <div className="d-flex align-items-center gap-2 flex-wrap">
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
                                        fontWeight: "500",
                                      }}
                                    >
                                      <i className="bx bx-time me-1"></i>
                                      Start: {formatTodoDate(todo.start_date)}
                                    </small>
                                  )}
                                  {todo.due_date && (
                                    <small
                                      className="d-flex align-items-center"
                                      style={{
                                        color: "#ff6b6b",
                                        fontWeight: "500",
                                      }}
                                    >
                                      <i className="bx bx-calendar-check me-1"></i>
                                      Due: {formatTodoDate(todo.due_date)}
                                    </small>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                    {activeTodos.length > 3 && (
                      <div className="text-center py-3 border-top d-flex justify-content-between align-items-center">
                        {todoOffset > 0 && (
                          <button
                            className="btn btn-sm"
                            style={{
                              backgroundColor: "#a8edea",
                              color: "#333",
                              border: "none",
                              fontWeight: "500",
                            }}
                            onClick={() =>
                              setTodoOffset(Math.max(0, todoOffset - 3))
                            }
                          >
                            <i className="bx bx-chevron-left me-1"></i>
                            Previous
                          </button>
                        )}
                        {todoOffset === 0 && <div></div>}
                        {todoOffset + 3 < activeTodos.length && (
                          <button
                            className="btn btn-sm"
                            style={{
                              backgroundColor: "#a8edea",
                              color: "#333",
                              border: "none",
                              fontWeight: "500",
                            }}
                            onClick={() =>
                              setTodoOffset(
                                Math.min(activeTodos.length - 3, todoOffset + 3)
                              )
                            }
                          >
                            <i className="bx bx-chevron-right me-1"></i>
                            See More ({activeTodos.length - todoOffset - 3} more)
                          </button>
                        )}
                        {todoOffset + 3 >= activeTodos.length &&
                          todoOffset > 0 && <div></div>}
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
          <div className="col-lg-6 col-md-12" id="announcements-section">
            <div
              className="card border-0 shadow-lg h-100 portal-card-lift"
              style={{ borderTop: "4px solid #667eea" }}
            >
              <div
                className="card-header border-0 d-flex justify-content-between align-items-center"
                style={{
                  background:
                    "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)",
                }}
              >
                <h5 className="mb-0">
                  <i
                    className="bx bx-bullhorn me-2"
                    style={{ color: "#667eea" }}
                  ></i>
                  <span style={{ color: "#667eea" }}>Recent Announcements</span>
                </h5>
              </div>
              <div className="card-body p-3">
                {activeAnnouncements.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <i className="bx bx-info-circle fs-1 mb-2"></i>
                    <p className="mb-0">No announcements available</p>
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
                      {activeAnnouncements.slice(announcementOffset, announcementOffset + 3).map((announcement, index) => (
                        <div
                          key={announcement.uid}
                          className="col-12"
                          style={{
                            animation: `slideInRight 0.5s ease-out ${index * 0.1}s both`
                          }}
                        >
                          <div
                            className="card border-0 shadow-sm cursor-pointer h-100"
                            style={{
                              borderLeft: "4px solid #667eea",
                              transition: "all 0.3s ease",
                              background:
                                "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "translateY(-5px)";
                              e.currentTarget.style.boxShadow = "0 8px 16px rgba(102, 126, 234, 0.2)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
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
                                  <h6
                                    className="mb-0 fw-bold"
                                    style={{ color: "#667eea" }}
                                  >
                                    {announcement.title}
                                  </h6>
                                </div>
                                <span
                                  className={`badge ${getPriorityColor(
                                    announcement.priority
                                  )}`}
                                >
                                  {announcement.priority}
                                </span>
                              </div>
                              <p
                                className="text-muted mb-2 small"
                                style={{ lineHeight: "1.5" }}
                              >
                                {truncateWords(announcement.content, 20)}
                              </p>
                              <div className="d-flex align-items-center gap-2">
                                {announcement.start_date ? (
                                  <small className="text-muted d-flex align-items-center">
                                    <i className="bx bx-calendar me-1"></i>
                                    {formatDate(
                                      announcement.start_date,
                                      "DD/MM/YYYY"
                                    )}
                                  </small>
                                ) : (
                                  <small className="text-muted d-flex align-items-center">
                                    <i className="bx bx-calendar me-1"></i>
                                    {formatDate(
                                      announcement.created_at,
                                      "DD/MM/YYYY"
                                    )}
                                  </small>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {activeAnnouncements.length > 3 && (
                      <div className="text-center mt-3 pt-3 border-top d-flex justify-content-between align-items-center">
                        {announcementOffset > 0 && (
                          <button
                            className="btn btn-sm"
                            style={{ 
                              backgroundColor: "#667eea", 
                              color: "white", 
                              border: "none",
                              fontWeight: "500"
                            }}
                            onClick={() => setAnnouncementOffset(Math.max(0, announcementOffset - 3))}
                          >
                            <i className="bx bx-chevron-left me-1"></i>
                            Previous
                          </button>
                        )}
                        {announcementOffset === 0 && <div></div>}
                        {announcementOffset + 3 < activeAnnouncements.length && (
                          <button
                            className="btn btn-sm"
                            style={{ 
                              backgroundColor: "#667eea", 
                              color: "white", 
                              border: "none",
                              fontWeight: "500"
                            }}
                            onClick={() => setAnnouncementOffset(Math.min(activeAnnouncements.length - 3, announcementOffset + 3))}
                          >
                            <i className="bx bx-chevron-right me-1"></i>
                            See More ({activeAnnouncements.length - announcementOffset - 3} more)
                          </button>
                        )}
                        {announcementOffset + 3 >= activeAnnouncements.length && announcementOffset > 0 && (
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
        </SectionReveal>

        {/* Documents row */}
        <SectionReveal className="row g-4 mb-4">
          <div className="col-12">
            <div
              className="card border-0 shadow-lg h-100 portal-card-lift"
              style={{ borderTop: "4px solid #17a2b8" }}
            >
              <div
                className="card-header border-0 d-flex justify-content-between align-items-center"
                style={{
                  background:
                    "linear-gradient(135deg, #17a2b815 0%, #13849615 100%)",
                }}
              >
                <h5 className="mb-0">
                  <i
                    className="bx bx-file me-2"
                    style={{ color: "#17a2b8" }}
                  ></i>
                  <span style={{ color: "#17a2b8" }}>Documents by Category</span>
                </h5>
                <div className="d-flex align-items-center gap-2">
                  {selectedCategory && (
                    <button
                      className="btn btn-sm"
                      style={{ backgroundColor: "#17a2b8", color: "white", border: "none" }}
                      onClick={() => {
                        setSelectedCategory(null);
                      }}
                    >
                      <i className="bx bx-arrow-back me-1"></i>
                      Back to Categories
                    </button>
                  )}
                </div>
              </div>
              <div className="card-body p-0">
                {(() => {
                  // Group documents by category
                  const documentsByCategory = {};
                  documents.forEach(doc => {
                    const categoryName = doc.category?.name || "Uncategorized";
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
                        <p>No documents available</p>
                      </div>
                    );
                  }

                  // Show categories if none selected (first 6, then "See all" to show all)
                  if (!selectedCategory) {
                    const maxCategoriesToShow = 6;
                    const displayCategories = showAllDocumentCategories
                      ? categories
                      : categories.slice(0, maxCategoriesToShow);
                    const hasMoreCategories = categories.length > maxCategoriesToShow;

                    return (
                      <div className="card-body p-3">
                        <div className="row g-3">
                          {displayCategories.map((categoryName) => {
                            const categoryDocs = documentsByCategory[categoryName];
                            return (
                              <div key={categoryName} className="col-lg-4 col-md-6 col-sm-6">
                                <div
                                  className="card border-0 shadow-sm cursor-pointer h-100"
                                  style={{ 
                                    borderLeft: "4px solid #17a2b8",
                                    transition: "all 0.3s ease",
                                    background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)"
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "translateY(-5px)";
                                    e.currentTarget.style.boxShadow = "0 8px 16px rgba(23, 162, 184, 0.2)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                                  }}
                                  onClick={() => {
                                    setSelectedCategory(categoryName);
                                  }}
                                >
                                  <div className="card-body p-3 text-center">
                                    <i className="bx bx-folder fs-1 mb-3" style={{ color: "#17a2b8" }}></i>
                                    <h6 className="mb-2 fw-bold" style={{ color: "#17a2b8" }}>
                                      {categoryName}
                                    </h6>
                                    <p className="text-muted mb-0 small">
                                      {categoryDocs.length} {categoryDocs.length === 1 ? 'document' : 'documents'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {hasMoreCategories && (
                          <div className="text-center mt-3">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              style={{
                                borderColor: "#17a2b8",
                                color: "#17a2b8",
                                fontWeight: "500",
                              }}
                              onClick={() => setShowAllDocumentCategories((prev) => !prev)}
                            >
                              {showAllDocumentCategories ? (
                                <>
                                  <i className="bx bx-chevron-up me-1"></i>
                                  Show less
                                </>
                              ) : (
                                <>
                                  <i className="bx bx-chevron-down me-1"></i>
                                  See all ({categories.length} categories)
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Show documents for selected category
                  // Display ALL documents in the selected category (no pagination)
                  const categoryDocuments = documentsByCategory[selectedCategory] || [];
                  return (
                    <>
                      <div className="px-3 pt-3 pb-2 border-bottom bg-light">
                        <h6 className="mb-0 fw-bold">
                          <i className="bx bx-folder me-2" style={{ color: "#17a2b8" }}></i>
                          {selectedCategory} ({categoryDocuments.length} {categoryDocuments.length === 1 ? 'document' : 'documents'})
                        </h6>
                      </div>
                      <div 
                        className="row g-3 p-3"
                        style={{
                          overflow: "hidden",
                          position: "relative"
                        }}
                      >
                        {/* Display all documents in the category */}
                        {categoryDocuments.map((document, index) => (
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
                                e.currentTarget.style.backgroundColor = "#17a2b810";
                                e.currentTarget.style.transform = "translateX(5px)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "transparent";
                                e.currentTarget.style.transform = "translateX(0)";
                              }}
                            >
                              <div className="flex-grow-1 mb-3">
                                <h6 className="mb-1 fw-semibold">{document.title}</h6>
                                {document.description && (
                                  <p className="text-muted mb-2 small" style={{ lineHeight: "1.5" }}>
                                    {document.description.substring(0, 120)}
                                    {document.description.length > 120 ? "..." : ""}
                                  </p>
                                )}
                              </div>
                              {document.file_url ? (
                                <a
                                  href={document.file_url}
                                  download
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm w-100"
                                  style={{ 
                                    backgroundColor: "#17a2b8", 
                                    color: "white", 
                                    border: "none",
                                    fontWeight: "500",
                                    marginTop: "auto"
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  }}
                                >
                                  <i className="bx bx-download me-1"></i>
                                  Download
                                </a>
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
                                  No File Available
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
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
                })()}
              </div>
            </div>
          </div>
        </SectionReveal>

        {/* Quick Links row */}
        <SectionReveal className="row g-4">
          <div className="col-12">
            <div
              className="card border-0 shadow-lg h-100 portal-card-lift"
              style={{ borderTop: "4px solid #ff6b6b" }}
            >
              <div
                className="card-header border-0 d-flex justify-content-between align-items-center"
                style={{
                  background:
                    "linear-gradient(135deg, #ff6b6b15 0%, #ee5a6f15 100%)",
                }}
              >
                <h5 className="mb-0">
                  <i
                    className="bx bx-link me-2"
                    style={{ color: "#ff6b6b" }}
                  ></i>
                  <span style={{ color: "#ff6b6b" }}>Quick Links</span>
                </h5>
              </div>
              <div
                className="card-body p-3 p-md-4"
                style={{
                  background:
                    "linear-gradient(135deg, #ff6b6b05 0%, #ee5a6f05 100%)",
                }}
              >
                {quickLinks.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <i className="bx bx-info-circle fs-1 mb-2"></i>
                    <p className="mb-0">No quick links available</p>
                  </div>
                ) : (
                  <div className="row g-3 justify-content-start">
                    {quickLinks.slice(0, 8).map((link, index) => {
                      const colors = [
                        {
                          bg: "#f0f4ff",
                          border: "#667eea",
                          icon: "#667eea",
                          text: "#333",
                        },
                        {
                          bg: "#fff0f5",
                          border: "#f5576c",
                          icon: "#f5576c",
                          text: "#333",
                        },
                        {
                          bg: "#e6f7ff",
                          border: "#00f2fe",
                          icon: "#00f2fe",
                          text: "#333",
                        },
                        {
                          bg: "#fff9e6",
                          border: "#fee140",
                          icon: "#fee140",
                          text: "#333",
                        },
                      ];
                      const colorScheme = colors[index % colors.length];

                      return (
                        <div
                          key={link.uid}
                          className="col-xl-2 col-lg-3 col-md-4 col-sm-6 col-6"
                        >
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-decoration-none"
                            onClick={() => {
                              // Optimistic UI update
                              setData((prev) => {
                                if (!prev?.quick_links) return prev;
                                return {
                                  ...prev,
                                  quick_links: prev.quick_links.map((l) =>
                                    l.uid === link.uid
                                      ? { ...l, total_clicks: (l.total_clicks || 0) + 1 }
                                      : l
                                  ),
                                };
                              });
                              trackQuickLinkClick(link.uid);
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
                                flexDirection: "column",
                              }}
                            >
                              <div className="card-body p-3 p-md-4 d-flex flex-column justify-content-center align-items-center">
                                <div
                                  className="quick-link-icon mb-3"
                                  style={{
                                    width: "56px",
                                    height: "56px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    margin: "0 auto",
                                    backgroundColor: `${colorScheme.border}15`,
                                    borderRadius: "12px",
                                    overflow: "hidden",
                                  }}
                                >
                                  {link.logo && !quickLinkLogoErrors[link.uid] ? (
                                    <img
                                      src={link.logo}
                                      alt={link.name}
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "contain",
                                      }}
                                      onError={() => {
                                        setQuickLinkLogoErrors((prev) => ({
                                          ...prev,
                                          [link.uid]: true,
                                        }));
                                      }}
                                    />
                                  ) : (
                                    <i
                                      className="bx bx-link fs-2"
                                      style={{ color: colorScheme.icon }}
                                    ></i>
                                  )}
                                </div>
                                <h6
                                  className="mb-0 fw-bold"
                                  style={{
                                    fontSize: "0.875rem",
                                    lineHeight: "1.3",
                                    color: colorScheme.text,
                                  }}
                                >
                                  {link.name}
                                </h6>
                                {link.total_clicks > 0 && (
                                  <small className="d-block mt-2" style={{ color: `${colorScheme.text}80` }}>
                                    <i className="bx bx-mouse-alt me-1"></i>
                                    {link.total_clicks} clicks
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
              </div>
            </div>
          </div>
        </SectionReveal>

        <style>
          {`
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
          `}
        </style>
        </div>
      </div>

      {/* Back to top */}
      {showBackToTop && (
        <button
          type="button"
          className="portal-back-to-top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
        >
          <i className="bx bx-chevron-up" />
        </button>
      )}

      {/* FAQ View Modal */}
      <div
        className="modal fade"
        id="faqViewModal"
        tabIndex="-1"
        aria-labelledby="faqViewModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header border-bottom" style={{ backgroundColor: "#fee140", color: "#333" }}>
              <h5 className="modal-title fw-bold text-dark" id="faqViewModalLabel">
                <i className="bx bx-help-circle me-2"></i>
                FAQ
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={() => setSelectedFaq(null)}
              ></button>
            </div>
            <div className="modal-body">
              {selectedFaq && (
                <>
                  {/* Header */}
                  <div className="mb-3">
                    <h4 className="mb-2 fw-bold text-dark" style={{ lineHeight: "1.2" }}>
                      {selectedFaq.question}
                    </h4>

                    <div className="d-flex flex-wrap align-items-center gap-2">
                      <span
                        className="badge"
                        style={{
                          backgroundColor: "#fee14025",
                          color: "#8a6d00",
                          border: "1px solid #fee140",
                        }}
                      >
                          <i className="bx bx-message-rounded-dots me-1"></i>
                        Answer
                      </span>

                   
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3 rounded border" style={{ backgroundColor: "#f8f9fa" }}>
                    {selectedFaq.answer ? (
                      <p className="mb-0 text-dark" style={{ whiteSpace: "pre-wrap", lineHeight: "1.7" }}>
                        {selectedFaq.answer}
                      </p>
                    ) : (
                      <p className="mb-0 text-muted">No answer has been added for this FAQ yet.</p>
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
                onClick={() => setSelectedFaq(null)}
              >
                Close
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
            <div className="modal-header border-bottom" style={{ backgroundColor: "#667eea", color: "white" }}>
              <h5 className="modal-title fw-bold text-white" id="announcementViewModalLabel">
                <i className="bx bx-bullhorn me-2"></i>
                Announcement
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                aria-label="Close"
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
                          Pinned
                        </span>
                      )}

                      {selectedAnnouncement.priority && (
                        <span className={`badge ${getPriorityColor(selectedAnnouncement.priority)}`}>
                          <i className="bx bx-flag me-1"></i>
                          Priority: {selectedAnnouncement.priority}
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
                          <span style={{ color: "#ff6b6b", fontWeight: 700 }}>Until</span>{" "}
                          {formatDate(selectedAnnouncement.end_date, "DD/MM/YYYY")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3 rounded border" style={{ backgroundColor: "#f8f9fa" }}>
                    {selectedAnnouncement.content ? (
                      <p className="mb-0 text-dark" style={{ whiteSpace: "pre-wrap", lineHeight: "1.7" }}>
                        {selectedAnnouncement.content}
                      </p>
                    ) : (
                      <p className="mb-0 text-muted">No message provided for this announcement.</p>
                    )}
                  </div>

                  {/* Attachment */}
                  {selectedAnnouncement.file_url && (
                    <div className="mt-3">
                      <div className="card border-0" style={{ backgroundColor: "#ffffff" }}>
                        <div className="card-body p-3 border rounded d-flex align-items-center justify-content-between gap-3 flex-wrap">
                          <div className="d-flex align-items-center gap-3">
                            <div
                              className="d-flex align-items-center justify-content-center"
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 10,
                                background: "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)",
                              }}
                            >
                              <i className="bx bx-file" style={{ color: "#667eea", fontSize: "1.25rem" }}></i>
                            </div>

                            <div>
                    
                              <div className="text-muted small">Open or download the attached file</div>
                            </div>
                          </div>

                          <a
                            href={selectedAnnouncement.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-primary"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <i className="bx bx-download me-1"></i>
                            Open file
                          </a>
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
                Close
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
            <div className="modal-header border-bottom" style={{ backgroundColor: "#a8edea", color: "#333" }}>
              <h5 className="modal-title fw-bold text-dark" id="todoViewModalLabel">
                <i className="bx bx-check-square me-2"></i>
                Todo
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
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
                          Status:{" "}
                          {selectedTodo.status === "PENDING"
                            ? "Pending"
                            : selectedTodo.status === "IN_PROGRESS"
                            ? "In Progress"
                            : selectedTodo.status}
                        </span>
                      )}

                      {selectedTodo.priority && (
                        <span className={getTodoPriorityBadge(selectedTodo.priority)}>
                          <i className="bx bx-flag me-1"></i>
                          Priority: {selectedTodo.priority}
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
                          Department: {selectedTodo.department.name}
                        </span>
                      )}

                      {selectedTodo.start_date && (
                        <span className="badge bg-light text-dark">
                          <i className="bx bx-time me-1"></i>
                          Start: {formatTodoDate(selectedTodo.start_date)}
                        </span>
                      )}

                      {selectedTodo.due_date && (
                        <span className="badge bg-light text-dark">
                          <i className="bx bx-calendar-check me-1"></i>
                          <span style={{ color: "#ff6b6b", fontWeight: 700 }}>Due</span>:{" "}
                          {formatTodoDate(selectedTodo.due_date)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3 rounded border" style={{ backgroundColor: "#f8f9fa" }}>
                    {selectedTodo.description ? (
                      <p className="mb-0 text-dark" style={{ whiteSpace: "pre-wrap", lineHeight: "1.7" }}>
                        {selectedTodo.description}
                      </p>
                    ) : (
                      <p className="mb-0 text-muted">No details provided for this todo.</p>
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
                Close
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
                Event
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                aria-label="Close"
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
                        <span className="badge bg-light text-dark">
                          <i className="bx bx-tag-alt me-1"></i>
                          Type: {selectedEvent.event_type}
                        </span>
                      )}

                      {selectedEvent.location && (
                        <span className="badge bg-light text-dark">
                          <i className="bx bx-map me-1"></i>
                          Location: {selectedEvent.location}
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
                          <span style={{ color: "#ff6b6b", fontWeight: 700 }}>Until</span>{" "}
                          {formatDate(selectedEvent.end_date, "DD/MM/YYYY HH:mm")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3 rounded border" style={{ backgroundColor: "#f8f9fa" }}>
                    {selectedEvent.description ? (
                      <p className="mb-0 text-dark" style={{ whiteSpace: "pre-wrap", lineHeight: "1.7" }}>
                        {selectedEvent.description}
                      </p>
                    ) : (
                      <p className="mb-0 text-muted">No details provided for this event.</p>
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
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Motivation – floating popup: visible 1 min, reappears every 5 min (uses defaults if none in DB) */}
      {data && (displayQuote || displayGratitude || displayEsImage) && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 1050,
          }}
        >
          <style>{`
            @keyframes dailyMotivationFadeIn {
              from { opacity: 0; transform: translateY(16px) scale(0.97); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes dailyMotivationGlow {
              0%, 100% { box-shadow: 0 12px 48px rgba(99, 102, 241, 0.18), 0 0 0 1px rgba(99, 102, 241, 0.08); }
              50% { box-shadow: 0 16px 56px rgba(99, 102, 241, 0.22), 0 0 0 1px rgba(99, 102, 241, 0.12); }
            }
          `}</style>
          {showPopupCard ? (
            <div
              className="daily-motivation-card"
              style={{
                width: "360px",
                maxWidth: "calc(100vw - 48px)",
                background: "linear-gradient(165deg, #ffffff 0%, #fafbff 50%, #f5f3ff 100%)",
                border: "1px solid rgba(99, 102, 241, 0.2)",
                borderRadius: "20px",
                boxShadow: "0 12px 48px rgba(99, 102, 241, 0.18), 0 0 0 1px rgba(99, 102, 241, 0.08)",
                overflow: "hidden",
                animation: "dailyMotivationFadeIn 0.45s ease-out, dailyMotivationGlow 4s ease-in-out infinite",
              }}
            >
              {/* Header with close */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 14px 10px 18px",
                  background: "linear-gradient(135deg, #6366f1 0%, #7c3aed 50%, #8b5cf6 100%)",
                  color: "#fff",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, fontSize: "0.9rem", letterSpacing: "0.02em" }}>
                  <i className="bx bx-bulb" style={{ fontSize: "1.2rem", opacity: 0.95 }} />
                  Daily Motivation
                </span>
                <button
                  type="button"
                  className="btn btn-sm p-0 border-0"
                  style={{ color: "rgba(255,255,255,0.9)", background: "transparent", lineHeight: 1 }}
                  aria-label="Close"
                  onClick={() => setShowPopupCard(false)}
                >
                  <i className="bx bx-x" style={{ fontSize: "1.4rem" }} />
                </button>
              </div>

              {/* Content: image as the speaker, then their words */}
              <div style={{ padding: "20px 20px 14px" }}>
                {/* Image first – the one "saying" the words (default ES.png if none in DB or load fails) */}
                {(displayEsImage || displayQuote || displayGratitude) && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      marginBottom: "18px",
                    }}
                  >
                    <div
                      style={{
                        width: "88px",
                        height: "88px",
                        borderRadius: "50%",
                        overflow: "hidden",
                        border: "3px solid rgba(99, 102, 241, 0.35)",
                        boxShadow: "0 4px 20px rgba(99, 102, 241, 0.2)",
                        flexShrink: 0,
                        background: "#f3f4f6",
                      }}
                    >
                      <img
                        src={displayEsImage}
                        alt="Executive Secretary"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = DEFAULT_ES_IMAGE;
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Caption: "From the one in the image" */}
                {(displayQuote || displayGratitude) && (
                  <p
                    style={{
                      textAlign: "center",
                      fontSize: "0.7rem",
                      color: "#8b5cf6",
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      marginBottom: "12px",
                      marginTop: "-6px",
                    }}
                  >
                    From Executive Secretary
                  </p>
                )}

            

                {/* Gratitude message – their words (default if none in DB) */}
                {displayGratitude && (
                  <p
                    style={{
                      margin: 0,
                      lineHeight: 1.6,
                      fontSize: "0.875rem",
                      color: "#4b5563",
                      textAlign: "left",
                    }}
                  >
                    {displayGratitude}
                  </p>
                )}
                    {/* Quote – their words (default if none in DB) */}
                    {displayQuote && (
                  <div
                    style={{
                      position: "relative",
                      paddingLeft: "18px",
                      marginBottom: displayGratitude ? "14px" : "0",
                      borderLeft: "3px solid rgba(99, 102, 241, 0.4)",
                      borderRadius: "0 4px 4px 0",
                      background: "linear-gradient(90deg, rgba(99, 102, 241, 0.06) 0%, transparent 100%)",
                      paddingTop: "10px",
                      paddingBottom: "10px",
                      paddingRight: "8px",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        lineHeight: 1.65,
                        fontSize: "0.95rem",
                        color: "#1f2937",
                        fontStyle: "italic",
                        fontWeight: 500,
                      }}
                    >
                      &ldquo;{displayQuote}&rdquo;
                    </p>
                  </div>
                )}

                <p style={{ marginTop: "14px", marginBottom: 0, fontSize: "0.68rem", color: "#9ca3af", textAlign: "center" }}>
                  Auto-closes in 1 min · Shows again in 5 min
                </p>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-sm"
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                color: "#fff",
                border: "none",
                borderRadius: "14px",
                padding: "10px 18px",
                boxShadow: "0 6px 20px rgba(99, 102, 241, 0.4)",
                fontWeight: 600,
                fontSize: "0.875rem",
              }}
              onClick={() => setShowPopupCard(true)}
              aria-label="Show Daily Motivation"
            >
              <i className="bx bx-bulb me-1" /> Daily Motivation
            </button>
          )}
        </div>
      )}
    </>
  );
};

export default PortalPage;