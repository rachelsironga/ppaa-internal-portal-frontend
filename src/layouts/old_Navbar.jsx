import { useDispatch, useSelector } from "react-redux";
import getGreetingMessage from "../utils/greetingHandler";
import { logout } from "../redux/actions/authentication/logoutAction";
import { Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
import servicesList from "../data/servicesList.json";

const Navbar = ({ isService = false }) => {
  const user = useSelector((state) => state.userReducer?.data);

  const [showDropdown, setShowDropdown] = useState(false);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/auth/login");
  };

  return (
    <nav
      className="layout-navbar navbar-detached navbar navbar-expand-xl align-items-center bg-navbar-theme container-fluid"
      id="layout-navbar"
    >
      <style>
        {`

          .service-content{
              background: #fff;
              border: 0.2px solid transparent;
              border-radius: 20px;
              padding: 10px;
              background:
                linear-gradient(#fff, #fff) padding-box,
                linear-gradient(135deg, #1976d2a6 0%, #e53835c2 60%, #ffd900c4 100%) border-box;
              transition:
                background 1s ease,
                border-color 1s ease,
                border-image 1s ease,
                box-shadow 0.4s ease,
                transform 0.4s ease,
                opacity 0.4s ease;
              box-shadow: 0 5px 16px rgba(10, 67, 124, 0.51);
              animation: fadeInSlideUp 0.5s ease forwards;
              opacity: 0;
              transform: translateY(10px);
          }

          .dropdown-services-box {
              background: #fff;
              border: 2.5px solid transparent;
              border-radius: 5px;
              min-height: 300px;
              background:
                linear-gradient(#fff, #fff) padding-box,
                linear-gradient(135deg, #1976d2ef 0%, #e53835e7 60%, #ffd700 100%) border-box;
              transition:
                background 1s ease,
                border-color 1s ease,
                border-image 1s ease,
                box-shadow 0.4s ease,
                transform 0.4s ease,
                opacity 0.4s ease;
              box-shadow: 0 5px 16px rgba(10, 67, 124, 0.51);
              animation: fadeInSlideUp 0.5s ease forwards;
              opacity: 0;
              transform: translateY(10px);
            }

            .dropdown-services-box.show {
              opacity: 1;
              transform: translateY(0);
            }

            .service-list-item:active,
            .service-list-item:hover,
            .service-list-item:focus {
              box-shadow: 0 6px 24px rgba(10, 67, 124, 0.18), 0 1.5px 8px rgba(25, 118, 210, 0.18);
              transform: translateX(40px); /* Slide from right */
              /* No scale, no zoom */
            }
            /* Icons inside cards */
            .dropdown-services-box .bx {
              font-size: 2rem;
              background: linear-gradient(90deg, #1976d2 0%, #e53935 60%, #ffd700 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              text-fill-color: transparent;
            }

            /* Gradient titles */
            .dropdown-services-box .service-title {
              font-weight: bold;
              background: linear-gradient(90deg, #1976d2 0%, #e53935 60%, #ffd700 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              text-fill-color: transparent;
            }

            /* Animation keyframe */
            @keyframes fadeInSlideUp {
              from {
                opacity: 0;
                transform: translateX(-50px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }`}
      </style>

      <div className="layout-menu-toggle navbar-nav align-items-xl-center me-3 me-xl-0 d-xl-none">
        <a
          aria-label="toggle for sidebar"
          className="nav-item nav-link px-0 me-xl-4"
          href="#"
        >
          <i className="bx bx-menu bx-sm"></i>
        </a>
      </div>

      <div
        className="navbar-nav-right d-flex align-items-center"
        id="navbar-collapse"
      >
        {isService ? (
          getGreetingMessage(user ? user.first_name : "")
        ) : (
          <div className="position-relative">
            <button
              aria-label="Click me"
              type="button"
              className="btn btn-sm btn-outline-primary me-2 me-xl-4"
              onClick={toggleDropdown}
            >
              <i className="bx bx-menu me-1"></i> Services
            </button>
            {/* Dropdown */}
            {showDropdown && (
              <div
                className={`dropdown-services-box show`}
                style={{
                  position: "absolute",
                  left: 0, // right below the button
                  top: 23,
                  right: 0,
                  width: "350px",
                  marginTop: "10px",
                  zIndex: 1000,
                  padding: "20px",
                }}
              >
                <div className="row">
                  <h5 className="text-info"> Choose The Services</h5>
                  <p className="text-muted">
                    The below is list of mnh-Connect Service you Included
                  </p>
                </div>
                <div
                  className="row mb-4"
                  style={{
                    overflowY: "auto",
                    overflowX: "hidden",
                    maxHeight: "300px",
                  }}
                >
                  {servicesList.map((doc, idx) => (
                    <div
                      className="d-flex align-items-center service-list-item cursor-pointer me-3 mb-3"
                      key={"docs_index_" + idx}
                      onClick={() => {
                        navigate("/dashboard");
                        setShowDropdown(false);
                      }}
                    >
                      <i className={`${doc.icon} icon-size me-3`}></i>
                      <div>
                        <div className="service-title">{doc.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <span className="text-secondary text-truncate  mt-3">
              <i className="bx bx-user me-1 mb-1"></i>
              {user ? `${user.first_name} ${user.last_name}` : ""}
            </span>
          </div>
        )}
        <ul className="navbar-nav flex-row align-items-center ms-auto">
          {user && user.position && (
            <li className="nav-item">
              <button
                aria-label="Click me"
                type="button"
                className="btn btn-sm btn-outline-primary me-2 me-xl-4"
              >
                <i className="bx bx-user me-1"></i>
                {user?.position?.level_name}
              </button>
            </li>
          )}

          <li className="nav-item ">
            <a
              aria-label="go to notifications"
              className="nav-link px-0 me-2 me-xl-4"
              href="#"
            >
              <i className="bx bx-bell bx-sm"></i>
            </a>
          </li>
          <li className="nav-item navbar-dropdown dropdown-user dropdown">
            <a
              aria-label="dropdown profile avatar"
              className="nav-link dropdown-toggle hide-arrow"
              href="#"
              data-bs-toggle="dropdown"
            >
              <div className="avatar avatar-online">
                <img
                  src={
                    user && user.photo && user.photo.trim() !== ""
                      ? user.photo
                      : "/assets/img/avatars/1.png"
                  }
                  style={{ width: "40px", height: "40px" }}
                  className="w-px-40 rounded-circle"
                  alt="avatar-image"
                  aria-label="Avatar Image"
                />
              </div>
            </a>
            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                <a
                  aria-label="go to profile"
                  className="dropdown-item"
                  href="#"
                >
                  <div className="d-flex">
                    <div className="flex-shrink-0 me-3">
                      <div className="avatar avatar-online">
                        <img
                          src={
                            user && user.photo && user.photo.trim() !== ""
                              ? user.photo
                              : "/assets/img/avatars/1.png"
                          }
                          style={{ width: "40px", height: "40px" }}
                          className="w-px-40  rounded-circle"
                          alt="avatar-image"
                          aria-label="Avatar Image"
                        />
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <span className="fw-medium d-block">
                        {user
                          ? user.first_name + " " + user.last_name
                          : "Guest"}
                      </span>
                      <small className="text-muted">
                        {user ? user.is_admin : "Member"}
                      </small>
                    </div>
                  </div>
                </a>
              </li>
              <li>
                <div className="dropdown-divider"></div>
              </li>
              <li>
                <span
                  aria-label="go to profile"
                  className="dropdown-item cursor-pointer"
                  href="#"
                  onClick={() => {
                    navigate("/account/settings");
                  }}
                >
                  <i className="bx bx-user me-2"></i>
                  <span className="align-middle">My Profile</span>
                </span>
              </li>
              <li>
                <a
                  aria-label="go to setting"
                  className="dropdown-item"
                  href="#"
                  onClick={handleLogout}
                >
                  <i className="bx bx-lock me-2"></i>
                  <span className="align-middle">Log Out</span>
                </a>
              </li>
              {
                // <li>
                //   <a aria-label='go to setting' className="dropdown-item" href="#">
                //     <i className="bx bx-cog me-2"></i>
                //     <span className="align-middle">Settings</span>
                //   </a>
                // </li>
                // <li>
                //   <a aria-label='go to billing' className="dropdown-item" href="#">
                //     <span className="d-flex align-items-center align-middle">
                //       <i className="flex-shrink-0 bx bx-credit-card me-2"></i>
                //       <span className="flex-grow-1 align-middle ms-1">Billing</span>
                //       <span className="flex-shrink-0 badge badge-center rounded-pill bg-danger w-px-20 h-px-20">4</span>
                //     </span>
                //   </a>
                // </li>
              }

              <li>
                <div className="dropdown-divider"></div>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </nav>
  );
};
export default Navbar;