import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import servicesList from "../data/servicesList.json";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Grid,
  List,
  X,
  Filter,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export const Services = () => {
  const user = useSelector((state) => state.userReducer?.data);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filteredServices, setFilteredServices] = useState(servicesList);
  const [activeCategory, setActiveCategory] = useState("all");
  const [isGridView, setIsGridView] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);
  const searchRef = useRef(null);

  const categories = [
    "all",
    // ...new Set(
    //   servicesList.map((s) => s.category || "general").filter(Boolean)
    // ),
  ];

  useEffect(() => {
    const filtered = servicesList.filter((service) => {
      const matchesSearch =
        service.text.toLowerCase().includes(search.toLowerCase()) ||
        (service.description &&
          service.description.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory =
        activeCategory === "all" || service.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
    setFilteredServices(filtered);
  }, [search, activeCategory]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 15,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 150,
        damping: 15,
      },
    },
  };

  const handleServiceClick = async (service) => {
    const target =
      service.link ||
      service.path ||
      service.route ||
      `/dashboard/${encodeURIComponent(
        (service.text || "").toLowerCase().trim().replace(/\s+/g, "-")
      )}`;

    if (/^https?:\/\//i.test(target)) {
      window.open(target, "_blank");
      return;
    }

    try {
      const response = await fetch(target, { method: "HEAD" });
      if (response.ok) {
        navigate(target);
      }
    } catch (error) {
      // Silent fail for now
    }
  };

  return (
    <>
      <style>
        {`
          .services-container {
            min-height: 70vh;
            background: 
              linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.4)),
              url('/assets/img/hospital-mohimbili-inner.jpg');
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
            padding: 15px;
            border-radius: 15px;
          }

          .hero-section {
            text-align: center;
            margin-bottom: 10px;
            position: relative;
            padding-top: 10px;
          }

          .title-wrapper {
            display: inline-block;
            position: relative;
            margin-bottom: 4px;
          }

          .main-title {
            font-size: 2.8rem;
            font-weight: 900;
            color: white;
            text-shadow: 
              0 2px 10px rgba(0, 0, 0, 0.7),
              0 0 30px rgba(25, 118, 210, 0.5);
            letter-spacing: 0.5px;
            position: relative;
            padding: 0 20px;
            display: flex;
            align-items: center;
            gap: 15px;
            justify-content: center;
          }

          .title-sparkle {
            color: #ffd700;
            filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.6));
          }

          .title-border {
            position: absolute;
            top: -3px;
            left: 15%;
            right: 15%;
            height: 3px;
            background: linear-gradient(90deg, 
              transparent, 
              #1976d2, 
              #e53935, 
              #ffd700, 
              transparent
            );
            border-radius: 2px;
            animation: shimmer 3s infinite linear;
          }

          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }

          .subtitle {
            color: white;
            font-size: 1.2rem;
            font-weight: 300;
            max-width: 800px;
            margin: 5px auto;
            line-height: 1.5;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
            padding: 15px 25px;
            background: rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            border: 1px solid rgba(255, 255, 255, 0.15);
          }

          .controls-container {
            max-width: 800px; 
            margin: 0 auto 30px;
            padding: 20px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(15px);
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: 
              0 10px 30px rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
          }

          .search-container {
            position: relative;
            margin-bottom: 20px;
          }

          .search-input-wrapper {
            position: relative;
            display: flex;
            align-items: center;
          }

          .search-input {
            flex: 1;
            padding: 16px 20px 16px 50px;
            background: rgba(0, 0, 0, 0.3);
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 14px;
            color: white;
            font-size: 15px;
            outline: none;
            transition: all 0.3s ease;
            font-weight: 500;
          }

          .search-input:focus {
            border-color: rgba(255, 215, 0, 0.7);
            background: rgba(0, 0, 0, 0.4);
            box-shadow: 
              0 0 0 3px rgba(255, 215, 0, 0.15),
              0 8px 30px rgba(255, 215, 0, 0.2);
          }

          .search-input::placeholder {
            color: rgba(255, 255, 255, 0.7);
          }

          .search-icon {
            position: absolute;
            left: 20px;
            color: rgba(255, 255, 255, 0.9);
            z-index: 2;
          }

          .clear-btn {
            position: absolute;
            right: 20px;
            background: rgba(255, 255, 255, 0.12);
            border: none;
            color: rgba(255, 255, 255, 0.8);
            cursor: pointer;
            padding: 8px;
            border-radius: 50%;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 36px;
            min-height: 36px;
          }

          .clear-btn:hover {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            transform: rotate(90deg);
          }

          .filter-section {
            display: flex;
            gap: 15px;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
          }

          .categories-scroll {
            display: flex;
            gap: 8px;
            overflow-x: auto;
            padding: 5px 0;
            flex: 1;
            min-width: 300px;
          }

          .category-btn {
            padding: 10px 18px;
            background: rgba(255, 255, 255, 0.08);
            border: 1.5px solid rgba(255, 255, 255, 0.15);
            border-radius: 10px;
            color: rgba(255, 255, 255, 0.9);
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            white-space: nowrap;
            min-height: 40px;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .category-btn:hover {
            background: rgba(255, 255, 255, 0.15);
            border-color: rgba(255, 215, 0, 0.4);
            transform: translateY(-1px);
          }

          .category-btn.active {
            background: linear-gradient(135deg, #1976d2, #e53935);
            border-color: rgba(255, 215, 0, 0.6);
            color: white;
            box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
          }

          .view-toggle {
            display: flex;
            background: rgba(255, 255, 255, 0.08);
            border-radius: 10px;
            padding: 4px;
            border: 1.5px solid rgba(255, 255, 255, 0.15);
          }

          .view-btn {
            padding: 10px 18px;
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 0.8);
            cursor: pointer;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s ease;
            min-height: 40px;
            min-width: 90px;
            justify-content: center;
          }

          .view-btn:hover {
            background: rgba(255, 255, 255, 0.12);
            color: white;
          }

          .view-btn.active {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border-color: rgba(255, 215, 0, 0.6);
          }

          .results-info {
            text-align: center;
            color: white;
            font-size: 15px;
            font-weight: 600;
            margin: 20px auto;
            padding: 12px 20px;
            background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            max-width: 500px;
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
          }

          .results-info strong {
            color: #ffd700;
            font-weight: 700;
          }

          /* Compact Grid Container */
          .services-grid-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 10px;
          }

          .compact-grid {
            display: grid;
            gap: 16px;
          }

          .grid-view {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          }

          .list-view {
            grid-template-columns: 1fr;
            max-width: 700px;
            margin: 0 auto;
          }

          /* Small Grid Box Styling */
          .compact-service-card {
            background: #fff !important;
            border: 2.5px solid;
            border-radius: 18px;
            background: 
              linear-gradient(#fff, #fff) padding-box,
              linear-gradient(135deg, #1976d2ef 0%, #e53835e7 60%, #ffd700 100%) border-box;
            padding: 18px;
            cursor: pointer;
            position: relative;
            overflow: hidden;
            transition:
              background 2.3s,
              border-color 2.3s,
              border-image 2.3s,
              box-shadow 0.3s ease,
              transform 0.3s ease,
              color 2.3s;
            box-shadow: 0 3px 15px rgba(0, 0, 0, 0.08);
            display: flex;
            align-items: center;
            gap: 12px;
            min-height: 85px;
          }

          .compact-service-card:hover {
            background: linear-gradient(135deg, #1976d2 0%, #e53935 60%, #ffd700 100%) !important;
            border-color: #ffd700 !important;
            color: #fff !important;
            transform: translateY(-5px) scale(1.02);
            box-shadow: 
              0 10px 25px rgba(229, 57, 53, 0.15),
              0 3px 10px rgba(25, 118, 210, 0.15) !important;
          }

          /* Bending Icon Effect */
          .compact-icon-container {
            flex-shrink: 0;
            width: 48px;
            height: 48px;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid rgba(25, 118, 210, 0.15);
            transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            position: relative;
            overflow: hidden;
          }

          /* Bending effect on hover */
          .compact-service-card:hover .compact-icon-container {
            background: rgba(255, 255, 255, 0.2);
            border-color: rgba(255, 215, 0, 0.4);
            transform: 
              translateY(-2px) 
              rotate(8deg) 
              scale(1.1) 
              perspective(100px) 
              rotateX(5deg) 
              rotateY(5deg);
            box-shadow: 
              0 5px 15px rgba(255, 215, 0, 0.2),
              inset 0 0 10px rgba(255, 255, 255, 0.1);
          }

          /* Icon bending distortion effect */
          .compact-service-card:hover .compact-icon-container::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(
              45deg,
              transparent,
              rgba(255, 255, 255, 0.1),
              transparent
            );
            transform: rotate(45deg) skew(-5deg, -5deg);
            animation: iconShimmer 1.5s infinite;
          }

          @keyframes iconShimmer {
            0% {
              transform: translateX(-100%) translateY(-100%) rotate(45deg) skew(-5deg, -5deg);
            }
            100% {
              transform: translateX(100%) translateY(100%) rotate(45deg) skew(-5deg, -5deg);
            }
          }

          .compact-icon {
            font-size: 22px;
            background: linear-gradient(90deg, #1976d2 0%, #e53935 60%, #ffd700 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          }

          .compact-service-card:hover .compact-icon {
            color: #ffd700;
            background: linear-gradient(90deg, #ffd700 0%, #fff 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            transform: scale(1.1);
          }

          .compact-card-content {
            flex: 1;
            min-width: 0;
          }

          .compact-card-title {
            font-size: 15px;
            font-weight: 700;
            margin-bottom: 4px;
            background: linear-gradient(90deg, #1976d2 0%, #e53935 60%, #ffd700 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            transition: all 0.3s ease;
            line-height: 1.3;
          }

          .compact-service-card:hover .compact-card-title {
            color: #fff !important;
            background: none;
            -webkit-text-fill-color: #fff !important;
            text-fill-color: #fff !important;
          }

          .compact-card-description {
            font-size: 12px;
            color: #666;
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            transition: color 0.3s ease;
          }

          .compact-service-card:hover .compact-card-description {
            color: rgba(255, 255, 255, 0.9) !important;
          }

          .compact-card-badge {
            position: absolute;
            top: 12px;
            right: 12px;
            background: linear-gradient(135deg, #ffd700, #ff9800);
            color: #000;
            font-size: 10px;
            font-weight: 800;
            padding: 3px 9px;
            border-radius: 10px;
            box-shadow: 0 3px 10px rgba(255, 215, 0, 0.3);
            letter-spacing: 0.3px;
          }

          .compact-card-arrow {
            opacity: 0;
            color: rgba(25, 118, 210, 0.5);
            transition: all 0.3s ease;
            flex-shrink: 0;
            width: 18px;
            height: 18px;
          }

          .compact-service-card:hover .compact-card-arrow {
            opacity: 1;
            transform: translateX(3px);
            color: #ffd700;
          }

          /* List View Specific */
          .list-view .compact-service-card {
            padding: 16px;
            gap: 15px;
          }

          .list-view .compact-icon-container {
            width: 45px;
            height: 45px;
          }

          .list-view .compact-icon {
            font-size: 20px;
          }

          .list-view .compact-card-title {
            font-size: 16px;
          }

          .list-view .compact-card-description {
            font-size: 13px;
            -webkit-line-clamp: 1;
          }

          /* Empty State */
          .empty-state {
            text-align: center;
            padding: 60px 25px;
            background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(15px);
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.15);
            max-width: 600px;
            margin: 30px auto;
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
          }

          .empty-icon {
            font-size: 70px;
            margin-bottom: 20px;
            color: #ffd700;
            filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.5));
          }

          .empty-title {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 15px;
            color: white;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
          }

          .empty-message {
            font-size: 16px;
            color: rgba(255, 255, 255, 0.9);
            margin-bottom: 25px;
            line-height: 1.5;
            max-width: 450px;
            margin-left: auto;
            margin-right: auto;
          }

          .reset-btn {
            background: linear-gradient(135deg, #1976d2, #e53935);
            color: white;
            border: none;
            padding: 14px 35px;
            border-radius: 25px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 8px 25px rgba(25, 118, 210, 0.3);
            min-height: 48px;
          }

          .reset-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 35px rgba(25, 118, 210, 0.4);
          }

          /* Responsive */
          @media (max-width: 1200px) {
            .grid-view {
              grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
            }
          }

          @media (max-width: 768px) {
            .services-container {
              padding: 12px;
            }

            .main-title {
              font-size: 2.2rem;
              flex-direction: column;
              gap: 8px;
            }

            .subtitle {
              font-size: 1.1rem;
              padding: 12px 20px;
            }

            .controls-container {
              padding: 16px;
            }

            .filter-section {
              flex-direction: column;
              gap: 12px;
            }

            .categories-scroll {
              min-width: 100%;
              justify-content: flex-start;
            }

            .view-toggle {
              align-self: center;
            }

            .grid-view {
              grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
              gap: 12px;
            }

            .compact-service-card {
              padding: 16px;
              gap: 10px;
              min-height: 80px;
            }

            .compact-icon-container {
              width: 42px;
              height: 42px;
            }

            .compact-icon {
              font-size: 20px;
            }

            .compact-card-title {
              font-size: 14px;
            }

            .compact-card-description {
              font-size: 11px;
            }

            .empty-state {
              padding: 50px 20px;
              margin: 20px auto;
            }

            .empty-title {
              font-size: 22px;
            }

            .empty-message {
              font-size: 15px;
            }
          }

          @media (max-width: 480px) {
            .main-title {
              font-size: 1.8rem;
              padding: 0 15px;
            }

            .grid-view {
              grid-template-columns: 1fr;
            }

            .compact-service-card {
              padding: 14px;
              min-height: 75px;
            }

            .compact-icon-container {
              width: 40px;
              height: 40px;
            }

            .compact-icon {
              font-size: 18px;
            }

            .compact-card-title {
              font-size: 13px;
            }

            .compact-card-description {
              font-size: 10px;
            }

            .search-input {
              padding: 14px 18px 14px 45px;
              font-size: 14px;
            }

            .search-icon {
              left: 15px;
            }

            .clear-btn {
              right: 15px;
            }

            .reset-btn {
              padding: 12px 28px;
              font-size: 14px;
              min-height: 44px;
            }
          }

          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .compact-service-card {
            animation: fadeInUp 0.4s ease-out forwards;
            opacity: 0;
          }

          .compact-service-card:nth-child(1) { animation-delay: 0.1s; }
          .compact-service-card:nth-child(2) { animation-delay: 0.15s; }
          .compact-service-card:nth-child(3) { animation-delay: 0.2s; }
          .compact-service-card:nth-child(4) { animation-delay: 0.25s; }
          .compact-service-card:nth-child(5) { animation-delay: 0.3s; }
          .compact-service-card:nth-child(6) { animation-delay: 0.35s; }
          .compact-service-card:nth-child(7) { animation-delay: 0.4s; }
          .compact-service-card:nth-child(8) { animation-delay: 0.45s; }
          .compact-service-card:nth-child(9) { animation-delay: 0.5s; }
          .compact-service-card:nth-child(10) { animation-delay: 0.55s; }
        `}
      </style>

      <div className="services-container">
        <div className="main-content">
          {/* Hero Section */}
          <div className="hero-section">
            <div className="title-wrapper">
              <div className="title-border"></div>
              <h2 className="main-title">
                <Sparkles className="title-sparkle" size={28} />
                MNH-CONNECT SERVICES
                <Sparkles className="title-sparkle" size={28} />
              </h2>
            </div>

            <p className="subtitle">
              A streamlined portal connecting you to all MNH systems.
            </p>
          </div>

          {/* Controls */}
          <div className="controls-container">
            <div className="search-container">
              <div className="search-input-wrapper">
                <Search className="search-icon" size={20} />
                <input
                  ref={searchRef}
                  type="text"
                  className="search-input"
                  placeholder="Search Muhimbili services ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button className="clear-btn" onClick={() => setSearch("")}>
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>

            <div className="filter-section">
              <div className="categories-scroll">
                {categories.map((category) => (
                  <button
                    key={category}
                    className={`category-btn ${
                      activeCategory === category ? "active" : ""
                    }`}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category === "all" ? "All Services" : category}
                  </button>
                ))}
              </div>

              <div className="view-toggle">
                <button
                  className={`view-btn ${isGridView ? "active" : ""}`}
                  onClick={() => setIsGridView(true)}
                >
                  <Grid size={16} />
                  Grid
                </button>
                <button
                  className={`view-btn ${!isGridView ? "active" : ""}`}
                  onClick={() => setIsGridView(false)}
                >
                  <List size={16} />
                  List
                </button>
              </div>
            </div>
          </div>

          {/* Results Info */}
          <div className="results-info">
            Showing <strong>{filteredServices.length}</strong> of{" "}
            <strong>{servicesList.length}</strong> services
            {search && ` • Search: "${search}"`}
          </div>

          {/* Compact Services Grid */}
          <AnimatePresence>
            {filteredServices.length > 0 ? (
              <motion.div
                key={isGridView ? "grid" : "list"}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="services-grid-container"
              >
                <div
                  className={`compact-grid ${
                    isGridView ? "grid-view" : "list-view"
                  }`}
                >
                  {filteredServices.map((service, idx) => (
                    <motion.div
                      key={service.id || idx}
                      variants={cardVariants}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div
                        className="compact-service-card"
                        onClick={() => handleServiceClick(service)}
                        onMouseEnter={() => setHoveredCard(idx)}
                        onMouseLeave={() => setHoveredCard(null)}
                      >
                        {service.isNew && (
                          <div className="compact-card-badge">NEW</div>
                        )}

                        <div className="compact-icon-container">
                          <i className={`${service.icon} compact-icon`}></i>
                        </div>

                        <div className="compact-card-content">
                          <div className="compact-card-title">
                            {service.text}
                          </div>
                          {service.description && (
                            <div className="compact-card-description">
                              {service.description}
                            </div>
                          )}
                        </div>

                        <ChevronRight
                          className="compact-card-arrow"
                          size={18}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="empty-state"
              >
                <Search className="empty-icon" size={70} />
                <h3 className="empty-title">No Services Found</h3>
                <p className="empty-message">
                  {search
                    ? `No services match "${search}"`
                    : "No services available"}
                  {activeCategory !== "all" &&
                    ` in the ${activeCategory} category`}
                </p>
                <button
                  className="reset-btn"
                  onClick={() => {
                    setSearch("");
                    setActiveCategory("all");
                    if (searchRef.current) searchRef.current.focus();
                  }}
                >
                  Show All Services
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};
