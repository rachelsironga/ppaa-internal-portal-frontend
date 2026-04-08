import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./MaintenancePage.css";

export const MaintenancePage = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Add entrance animation
    setTimeout(() => setLoaded(true), 100);

    // Add particles
    createFloatingElements();

    return () => {
      // Cleanup
      const particles = document.querySelectorAll(".floating-element");
      particles.forEach((p) => p.remove());
    };
  }, []);

  const createFloatingElements = () => {
    const container = document.querySelector(".maintenance-container");
    if (!container) return;

    for (let i = 0; i < 20; i++) {
      const element = document.createElement("div");
      element.className = "floating-element";
      element.style.cssText = `
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        width: ${Math.random() * 10 + 5}px;
        height: ${Math.random() * 10 + 5}px;
        animation-delay: ${Math.random() * 5}s;
        animation-duration: ${Math.random() * 10 + 15}s;
        background: hsl(${Math.random() * 60 + 200}, 70%, ${
        Math.random() * 30 + 70
      }%);
      `;
      container.appendChild(element);
    }
  };

  return (
    <div className={`maintenance-container ${loaded ? "loaded" : ""}`}>
      {/* Animated Background */}
      <div className="light-background">
        <div className="gradient-circle circle-1"></div>
        <div className="gradient-circle circle-2"></div>
        <div className="gradient-circle circle-3"></div>
      </div>

      {/* Main Content */}
      <div className="maintenance-wrapper">
        {/* Content Grid */}
        <div className="content-grid">
          {/* Left Column - Message */}

          {/* Right Column - GIF */}
          <div className="gif-column">
            <div className="gif-display">
              <h3 className="main-title">
                <span className="title-word">System is Under</span>
                <span className="title-word highlight">Development</span>
              </h3>
              <br />

              <div className="gif-frame">
                {/* Glow effect */}
                <div className="frame-glow"></div>
                <div className="frame-glow-2"></div>

                {/* GIF Container */}
                <div className="gif-container">
                  <img
                    src="/assets/img/illustrations/maintenanceFinal.gif"
                    alt="Maintenance in progress animation showing tools and gears"
                    className="maintenance-gif"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        "/assets/img/illustrations/maintenanceFinal.gif";
                    }}
                  />

                  {/* Overlay Effects */}
                  <div className="gif-overlay">
                    <div className="scan-line"></div>
                    <div className="corner-dot top-left"></div>
                    <div className="corner-dot top-right"></div>
                    <div className="corner-dot bottom-left"></div>
                    <div className="corner-dot bottom-right"></div>
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className="floating-icons">
                  <div className="icon-item tool">🔧</div>
                  <div className="icon-item gear">⚙️</div>
                  <div className="icon-item code">{"</>"}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="message-column">
            <div className="message-card">
              <p className="main-message">
                We're performing essential updates to improve your experience.
                Our team is working diligently to restore full functionality.
              </p>

              <div className="assurance">
                <div className="assurance-icon">✅</div>
                <p className="assurance-text">
                  Thank you for your patience and Support!
                </p>
              </div>

              <Link
                to="/services"
                className="home-button"
                aria-label="Return to home page"
              >
                <span className="button-inner">
                  <span className="button-icon">🏠</span>
                  <span className="button-text">Return to Home</span>
                </span>
                <div className="button-shine"></div>
              </Link>
            </div>
            {/* GIF Caption */}
            <div className="gif-caption">
              <div className="caption-icon">✨</div>
              <p className="caption-text">
                Our team is working on improvements
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="light-footer">
          <div className="footer-content">
            <div className="footer-logo">
              <div className="footer-sparkle">✨</div>
              <span className="footer-brand">Internal Portal</span>
            </div>
            <div className="footer-message">
              Micro-Service • Back online soon
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
