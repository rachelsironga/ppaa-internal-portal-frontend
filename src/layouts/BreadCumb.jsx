import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/actions/authentication/logoutAction";
import { useNavigate } from "react-router-dom";
import { Children } from "react";

const BreadCumb = ({ pageList = [], children }) => {
  const user = useSelector((state) => state.userReducer?.data);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/auth/login");
  };

  const navigateTOPrevPage = () => {
    navigate(-1);
  };

  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <h4 className="py-3 mb-4 animate__animated animate__fadeInLeft animate__slow">
        <button
          className="btn btn-sm btn-outline-info pe-1 text-start"
          style={{
            fontSize: "12px",
            marginRight: "10px",
            animation: "pulseAttention 3s ease",
            animationIterationCount: "infinite",
          }}
          onClick={navigateTOPrevPage}
        >
          <i className="bx bx-left-arrow-alt"></i>&nbsp;Back&nbsp;&nbsp;
        </button>
        <span className="fw-light">
          <span
            type="button"
            className="text-muted cursor-pointer"
            onClick={() => {
              navigate(-1);
            }}
          >
            Home&nbsp;/&nbsp;
          </span>
          {pageList.map((page, index) => (
            <span key={`brc-key-${index}`}>
              <span
                className={`px-2 ${
                  index !== pageList.length - 1 ? "text-muted" : ""
                }`}
              >
                {page}
              </span>
              {index !== pageList.length - 1 && (
                <span className="text-muted">&nbsp;/&nbsp;</span>
              )}
            </span>
          ))}
        </span>
      </h4>
      <div
        className="py-3 mb-4"
        style={{ marginRight: "25px" }}
        id="dropdown-icon-demo"
      >
        {children}
      </div>
    </div>
  );
};

export default BreadCumb;
