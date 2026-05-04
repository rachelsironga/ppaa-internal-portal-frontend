import React from 'react'
import { Link } from 'react-router-dom'
import './page-auth.css'
export const AuthWrapper = ({ children, maxWidth }) => {
    maxWidth = maxWidth || "400px";
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100vh",
          backgroundImage: `linear-gradient(rgba(20, 1, 1, 0.59), rgba(32, 2, 2, 0.65)), url('/assets/img/ppaa_bckround image.jpg')`,
          backgroundSize: "110%", // starting slightly zoomed in
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          animation: "backgroundZoom 10s ease-in-out infinite",
        }}
      >
        <style>
          {`
      @keyframes backgroundZoom {
        0% {
          background-size: 100%;
        }
        50% {
          background-size: 110%;
        }
        100% {
          background-size: 100%;
        }
      }
    `}
        </style>
        <div className="container-xxl">
          <div className="authentication-wrapper authentication-basic container-p-y">
            <div
              className="authentication-inner"
              style={{ maxWidth: maxWidth }}
            >
              <div className="card">
                <div className="card-body">
                  <div className="app-brand justify-content-center">
                    <Link
                      aria-label="Go to Home Page"
                      to="/"
                      className="app-brand-link gap-2"
                    >
                      <span className="app-brand-logo demo">
                        <img
                          src="/assets/img/nembo.jpg"
                          alt="sneat-logo"
                          width={"70px"}
                          height={"70px"}
                        />
                      </span>
                      <span className="app-brand-text demo text-body fw-bold " style={{ textTransform: 'uppercase' }}>
                        PPAA PORTAL
                      </span>
                      <span className="app-brand-logo demo">
                        <img
                          src="/assets/img/logo.png"
                          alt="sneat-logo"
                          width={"70px"}
                          height={"70px"}
                        />
                      </span>
                    </Link>
                  </div>
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
}
