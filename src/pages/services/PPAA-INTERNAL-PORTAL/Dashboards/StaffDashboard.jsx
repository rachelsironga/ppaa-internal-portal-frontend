import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import "animate.css";
import { useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { formatDate } from "../../../../helpers/DateFormater";
import api from "../../../../api";
import { recordQuickLinkClick } from "../quick_links/Queries";

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

export const StaffDashboard = () => {
  const user = useSelector((state) => state.userReducer?.data);
  const navigate = useNavigate();
  const DASHBOARD_CACHE_KEY = `internalPortalDashboardCache:${user?.guid || "anonymous"}`;
  const DASHBOARD_CACHE_TTL_MS = 2 * 60 * 1000;

  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [events, setEvents] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [quickLinks, setQuickLinks] = useState([]);
  const [todos, setTodos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [announcementOffset, setAnnouncementOffset] = useState(0);
  const [todoOffset, setTodoOffset] = useState(0);
  const [faqOffset, setFaqOffset] = useState(0);
  const [faqSearchQuery, setFaqSearchQuery] = useState("");
  const [selectedFaq, setSelectedFaq] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [documentOffset, setDocumentOffset] = useState(0);
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

  // Dashboard section order for drag-and-drop
  const defaultSectionOrder = [
    { id: 'events-faqs', name: 'Events & FAQs' },
    { id: 'todos-announcements', name: 'Todos & Announcements' },
    { id: 'documents', name: 'Documents' },
    { id: 'quick-links', name: 'Quick Links' },
  ];

  const [sectionOrder, setSectionOrder] = useState(() => {
    const saved = localStorage.getItem('dashboardSectionOrder');
    return saved ? JSON.parse(saved) : defaultSectionOrder;
  });

  // Combine todos and announcements for alternating display
  const combinedItems = useMemo(() => {
    const items = [];
    todos.slice(0, 5).forEach(todo => {
      items.push({ type: 'todo', data: todo });
    });
    announcements.slice(0, 5).forEach(announcement => {
      items.push({ type: 'announcement', data: announcement });
    });
    return items;
  }, [todos, announcements]);

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
        if (!parsed?.data || !parsed?.timestamp) return null;
        return Date.now() - parsed.timestamp < DASHBOARD_CACHE_TTL_MS ? parsed.data : null;
      } catch {
        return null;
      }
    };

    try {
      const cached = readCachedDashboard();
      if (cached) {
        setAnnouncements(cached.announcements || []);
        setDocuments(cached.documents || []);
        setEvents(cached.events || []);
        setFaqs(cached.faqs || []);
        setQuickLinks(cached.quick_links || []);
        setTodos(cached.todos || []);
        setStats(cached.stats || {});
        setLoading(false);
      } else {
        setLoading(true);
      }

      const response = await api.get("/api/internal-portal/dashboard-summary");
      const dashboardData = response?.data?.data || response?.data || {};

      setAnnouncements(dashboardData.announcements || []);
      setDocuments(dashboardData.documents || []);
      setEvents(dashboardData.events || []);
      setFaqs(dashboardData.faqs || []);
      setQuickLinks(dashboardData.quick_links || []);
      setTodos(dashboardData.todos || []);
      setStats(dashboardData.stats || {});

      try {
        sessionStorage.setItem(
          DASHBOARD_CACHE_KEY,
          JSON.stringify({
            timestamp: Date.now(),
            data: dashboardData,
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

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2 text-muted">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <>
      {/* Welcome Section */}
      <div className="row mb-4">
        <div className="col-lg-8 mb-4 order-0">
          <div className="card border-0" style={{ 
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white"
          }}>
            <div className="d-flex align-items-end row">
              <div className="col-sm-7">
                <div className="card-body">
                  <h5 className="card-title text-white mb-3">
                    <i className="bx bx-smile me-2"></i>
                    Welcome, {user?.first_name} {user?.last_name}!
                  </h5>
                  <p className="mb-4 text-white-50" style={{ fontSize: "0.95rem" }}>
                    Here's an overview of all Internal Portal activities including announcements, documents, events, FAQs, and quick links.
                  </p>
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
        <div className="col-lg-4 col-md-4 order-1">
          <div 
            className="card border-0 shadow-lg h-100"
            style={{
              overflow: "hidden",
              position: "relative",
              minHeight: "200px"
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
                        transition: "all 1.5s ease-in-out",
                        zIndex: isActive ? 10 : 1,
                        minHeight: "200px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        background: isTodo 
                          ? "linear-gradient(135deg, #a8edea15 0%, #fed6e315 100%)"
                          : "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)",
                        borderTop: `4px solid ${isTodo ? "#a8edea" : "#667eea"}`,
                        borderRadius: "8px"
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
      </div>

      {/* Draggable Dashboard Sections */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="dashboard-sections">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {sectionOrder.map((section, index) => {
                // Render Events & FAQs Section
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
                          {/* Events Calendar and FAQs */}
                          <div className="row g-4 mb-4">
        {/* Events Calendar */}
        <div className="col-lg-8 col-md-12">
          <div className="card border-0 shadow-lg h-100" style={{ borderTop: "4px solid #00f2fe" }}>
            <div className="card-header border-0 d-flex justify-content-between align-items-center" style={{ 
              background: "linear-gradient(135deg, #4facfe15 0%, #00f2fe15 100%)"
            }}>
              <h5 className="mb-0">
                <i className="bx bx-calendar me-2" style={{ color: "#00f2fe" }}></i>
                <span style={{ color: "#00f2fe" }}>Events Calendar</span>
              </h5>
              <div {...provided.dragHandleProps} style={{ cursor: 'grab', padding: '5px' }} title="Drag to rearrange">
                <i className="bx bx-menu" style={{ color: "#00f2fe", fontSize: "1.5rem" }}></i>
              </div>
            </div>
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
                </div>
              )}
            </div>
                </div>
              </div>

        {/* FAQs Section */}
        <div className="col-lg-4 col-md-12">
          <div className="card border-0 shadow-lg h-100" style={{ borderTop: "4px solid #fee140" }}>
            <div className="card-header border-0" style={{ 
              background: "linear-gradient(135deg, #fa709a15 0%, #fee14015 100%)"
            }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="mb-0">
                  <i className="bx bx-help-circle me-2" style={{ color: "#fee140" }}></i>
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
      <div className="row g-4 mb-4">
        {/* Active Todos Section - Left */}
        <div className="col-lg-6 col-md-12">
          <div className="card border-0 shadow-lg h-100" style={{ borderTop: "4px solid #a8edea" }}>
            <div className="card-header border-0 d-flex justify-content-between align-items-center" style={{ 
              background: "linear-gradient(135deg, #a8edea15 0%, #fed6e315 100%)"
            }}>
              <h5 className="mb-0">
                <i className="bx bx-check-square me-2" style={{ color: "#a8edea" }}></i>
                <span style={{ color: "#a8edea", fontWeight: "bold"}}>Active Todo List</span>
              </h5>
              <div {...provided.dragHandleProps} style={{ cursor: 'grab', padding: '5px' }}>
                <i className="bx bx-menu" style={{ color: "#a8edea", fontSize: "1.5rem" }}></i>
              </div>
            </div>
            <div className="card-body p-0">
              {todos.length === 0 ? (
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
                      position: "relative"
                    }}
                  >
                    {todos.slice(todoOffset, todoOffset + 3).map((todo, index) => (
                      <div
                        key={todo.uid}
                        className="list-group-item list-group-item-action cursor-pointer"
                        style={{ 
                          borderLeft: "4px solid #a8edea",
                          transition: "all 0.2s ease",
                          animation: `slideInRight 0.5s ease-out ${index * 0.1}s both`
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
                          const modal = new window.bootstrap.Modal(document.getElementById('todoViewModal'));
                          modal.show();
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                              <h6 className="mb-0">{todo.title}</h6>
                              <span className={getTodoStatusBadge(todo.status)}>
                                {todo.status === 'PENDING' ? 'Pending' : 
                                 todo.status === 'IN_PROGRESS' ? 'In Progress' : 
                                 todo.status}
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
                                    fontWeight: "500"
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
                                    fontWeight: "500"
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
                  {todos.length > 3 && (
                    <div className="text-center py-3 border-top d-flex justify-content-between align-items-center">
                      {todoOffset > 0 && (
                      <button
                          className="btn btn-sm"
                          style={{ 
                            backgroundColor: "#a8edea", 
                            color: "#333", 
                            border: "none",
                            fontWeight: "500"
                          }}
                          onClick={() => setTodoOffset(Math.max(0, todoOffset - 3))}
                        >
                          <i className="bx bx-chevron-left me-1"></i>
                          Previous
                      </button>
                      )}
                      {todoOffset === 0 && <div></div>}
                      {todoOffset + 3 < todos.length && (
                        <button
                          className="btn btn-sm"
                          style={{ 
                            backgroundColor: "#a8edea", 
                            color: "#333", 
                            border: "none",
                            fontWeight: "500"
                          }}
                          onClick={() => setTodoOffset(Math.min(todos.length - 3, todoOffset + 3))}
                        >
                          <i className="bx bx-chevron-right me-1"></i>
                          See More ({todos.length - todoOffset - 3} more)
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
        <div className="col-lg-6 col-md-12">
          <div className="card border-0 shadow-lg h-100" style={{ borderTop: "4px solid #667eea" }}>
            <div className="card-header border-0 d-flex justify-content-between align-items-center" style={{ 
              background: "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)"
            }}>
              <h5 className="mb-0">
                <i className="bx bx-bullhorn me-2" style={{ color: "#667eea" }}></i>
                <span style={{ color: "#667eea" }}>Recent Announcements</span>
              </h5>
              <div {...provided.dragHandleProps} style={{ cursor: 'grab', padding: '5px' }}>
                <i className="bx bx-menu" style={{ color: "#667eea", fontSize: "1.5rem" }}></i>
              </div>
            </div>
            <div className="card-body p-3">
              {announcements.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="bx bx-info-circle fs-1 mb-2"></i>
                  <p>No announcements available</p>
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
                          className="card border-0 shadow-sm cursor-pointer h-100"
                          style={{ 
                            borderLeft: "4px solid #667eea",
                            transition: "all 0.3s ease",
                            background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)"
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
                                <h6 className="mb-0 fw-bold" style={{ color: "#667eea" }}>
                                  {announcement.title}
                                </h6>
                      </div>
                              <span className={`badge ${getPriorityColor(announcement.priority)}`}>
                                {announcement.priority}
                              </span>
                    </div>
                            <p className="text-muted mb-2 small" style={{ lineHeight: "1.5" }}>
                              {truncateWords(announcement.content, 20)}
                            </p>
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
                      {announcementOffset + 3 < announcements.length && (
                        <button
                          className="btn btn-sm"
                          style={{ 
                            backgroundColor: "#667eea", 
                            color: "white", 
                            border: "none",
                            fontWeight: "500"
                          }}
                          onClick={() => setAnnouncementOffset(Math.min(announcements.length - 3, announcementOffset + 3))}
                        >
                          <i className="bx bx-chevron-right me-1"></i>
                          See More ({announcements.length - announcementOffset - 3} more)
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
            <div className="card-header border-0 d-flex justify-content-between align-items-center" style={{ 
              background: "linear-gradient(135deg, #17a2b815 0%, #13849615 100%)"
            }}>
              <h5 className="mb-0">
                <i className="bx bx-file me-2" style={{ color: "#17a2b8" }}></i>
                <span style={{ color: "#17a2b8" }}>Documents by Category</span>
              </h5>
              <div className="d-flex align-items-center gap-2">
                {selectedCategory && (
                  <button
                    className="btn btn-sm"
                    style={{ backgroundColor: "#17a2b8", color: "white", border: "none" }}
                    onClick={() => {
                      setSelectedCategory(null);
                      setDocumentOffset(0);
                    }}
                  >
                    <i className="bx bx-arrow-back me-1"></i>
                    Back to Categories
                  </button>
                )}
                <div {...provided.dragHandleProps} style={{ cursor: 'grab', padding: '5px' }}>
                  <i className="bx bx-menu" style={{ color: "#17a2b8", fontSize: "1.5rem" }}></i>
                </div>
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
                                  setDocumentOffset(0);
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
                    </div>
                  );
                }

                // Show documents for selected category
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
                              e.currentTarget.style.backgroundColor = "#17a2b810";
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
                            Previous
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
                            See More ({categoryDocuments.length - documentOffset - 5} more)
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
              })()}
              </div>
            </div>
        </div>
      </div>

      {/* Quick Links Section - Moved to Bottom */}
      <div className="row g-4">
        <div className="col-12">
          <div className="card border-0 shadow-lg h-100" style={{ borderTop: "4px solid #ff6b6b" }}>
            <div className="card-header border-0 d-flex justify-content-between align-items-center" style={{ 
              background: "linear-gradient(135deg, #ff6b6b15 0%, #ee5a6f15 100%)"
            }}>
              <h5 className="mb-0">
                <i className="bx bx-link me-2" style={{ color: "#ff6b6b" }}></i>
                <span style={{ color: "#ff6b6b" }}>Quick Links</span>
              </h5>
              <div {...provided.dragHandleProps} style={{ cursor: 'grab', padding: '5px' }}>
                <i className="bx bx-menu" style={{ color: "#ff6b6b", fontSize: "1.5rem" }}></i>
              </div>
            </div>
            <div className="card-body p-3 p-md-4" style={{ background: "linear-gradient(135deg, #ff6b6b05 0%, #ee5a6f05 100%)" }}>
              {quickLinks.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="bx bx-info-circle fs-1 mb-2"></i>
                  <p>No quick links available</p>
                </div>
              ) : (
                <div className="row g-3 justify-content-start">
                  {quickLinks.map((link, index) => {
                    const colors = [
                      { bg: "#f0f4ff", border: "#667eea", icon: "#667eea", text: "#333" },
                      { bg: "#fff0f5", border: "#f5576c", icon: "#f5576c", text: "#333" },
                      { bg: "#e6f7ff", border: "#00f2fe", icon: "#00f2fe", text: "#333" },
                      { bg: "#fff9e6", border: "#fee140", icon: "#fee140", text: "#333" },
                      { bg: "#ffe6e6", border: "#ff6b6b", icon: "#ff6b6b", text: "#333" },
                      { bg: "#f0f9ff", border: "#4facfe", icon: "#4facfe", text: "#333" },
                      { bg: "#f5f0ff", border: "#764ba2", icon: "#764ba2", text: "#333" },
                      { bg: "#fff5e6", border: "#fcb69f", icon: "#fcb69f", text: "#333" },
                    ];
                    const colorScheme = colors[index % colors.length];
                    
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
                              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                              e.currentTarget.style.borderColor = colorScheme.border;
                            }}
                          >
                            <div className="card-body p-3 p-md-4 d-flex flex-column justify-content-center align-items-center">
                              {link.logo ? (
                                <img
                                  src={link.logo}
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
                        <span
                          className="badge"
                          style={{
                            backgroundColor: "#00f2fe20",
                            border: "1px solid #00f2fe",
                            color: "#007c86",
                          }}
                        >
                          <i className="bx bx-tag-alt me-1" style={{ color: "#00bcd4" }}></i>
                          Type: {selectedEvent.event_type}
                    </span>
                      )}

                      {selectedEvent.location && (
                    <span
                          className="badge"
                          style={{
                            backgroundColor: "#667eea15",
                            border: "1px solid #667eea",
                            color: "#3f51b5",
                          }}
                        >
                          <i className="bx bx-map me-1" style={{ color: "#667eea" }}></i>
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
    </>
  );
};
