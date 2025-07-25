import { useEffect } from "react";
import { useSelector } from "react-redux";
import servicesList from "../data/servicesList.json";
import { useNavigate } from "react-router-dom";

export const Services = () => {
  const user = useSelector((state) => state.userReducer?.data);
  const navigate = useNavigate();

  useEffect(() => {
    dashboardAnalitics();
  }, []);
  return (
    <>
      <style>
        {`
          .service-card-btn {
            background: #fff !important;
            border: 2.5px solid;
            border-radius: 20px;
             background: 
            linear-gradient(#fff, #fff) padding-box,
            linear-gradient(135deg, #1976d2ef 0%, #e53835e7 60%, #ffd700 100%) border-box;
            transition:
              background 2.3s,
              border-color 2.3s,
              border-image 2.3s,
              box-shadow 0.3s ease,
              transform 0.3s ease,
              color 2.3s;
            box-shadow: 0 2px 8px rgba(33, 150, 243, 0.08);
          }

          .service-card-btn .bx-lg {
            color: #1976d2;
            background: linear-gradient(90deg, #1976d2 0%, #e53935 60%, #ffd700 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-fill-color: transparent;
            transition: color 0.3s, background 0.3s, -webkit-text-fill-color 0.3s;
          }

          .service-card-btn .service-title {
            background: linear-gradient(90deg, #1976d2 0%, #e53935 60%, #ffd700 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-fill-color: transparent;
            font-weight: bold;
            transition: color 0.3s easy, 
            background 0.3s easy;
          }

          .service-card-btn:hover,
          .service-card-btn:focus {
            background: linear-gradient(135deg, #1976d2 0%, #e53935 60%, #ffd700 100%) !important;
            border-color: #ffd700 !important;
            color: #fff !important;
            box-shadow: 0 6px 24px 0 rgba(229, 57, 53, 0.18), 0 1.5px 8px 0 rgba(25, 118, 210, 0.18) !important;
            transform: translateY(-4px) scale(1.04);
          }

          .service-card-btn:hover .bx-lg,
          .service-card-btn:focus .bx-lg {
            color: #ffd700;
            background: linear-gradient(90deg, #ffd700 0%, #fff 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-fill-color: transparent;
          }

          .service-card-btn:hover .service-title,
          .service-card-btn:focus .service-title {
            color: #fff !important;
            background: none;
            -webkit-text-fill-color: #fff !important;
            text-fill-color: #fff !important;
          }

          /* Remove Bootstrap outline-secondary background/border on hover */
          .service-card-btn.btn-outline-secondary:hover,
          .service-card-btn.btn-outline-secondary:focus {
            background: linear-gradient(135deg, #1976d2 0%, #e53935 60%, #ffd700 100%) !important;
            border-color: #ffd700 !important;
            color: #fff !important;
          }
        `}
      </style>

      <div className="row">
        <div className="col-lg-12 mb-4 order-0 h-100">
          <div
            className="card"
            style={{
              position: "relative",
              backgroundImage: `linear-gradient(rgba(253, 248, 248, 0.59), rgba(253, 247, 247, 0.65)), url('/assets/img/hospital-mohimbili.jpg')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              borderRadius: "18px",
              overflowY: "auto",
              overflowX: "hidden",
              minHeight: "300px",
              height: "78vh",
            }}
          >
            <div className="card-body">
              <h3 className="card-title text-center">MNH-CONECT SERVICES</h3>
              <div
                className="input-group"
                style={{
                  minWidth: "200px",
                  maxWidth: "500px",
                  margin: "0 auto",
                  marginTop: "100px",
                }}
              >
                <span className="input-group-text">
                  <i className="tf-icons bx bx-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search..."
                />
              </div>
            </div>
            <div
              className="col-sm-12 row g-4 m-3 p-4 align-items-center justify-content-center"
              style={{
                overflowY: "auto",
              }}
            >
              {servicesList.map((service, idx) => (
                <div
                  key={service.text + idx}
                  className="col-md-3 col-sm-6 mb-3 col-lg-3"
                  onClick={() => {
                    navigate("/dashboard");
                  }}
                >
                  <button
                    type="button"
                    className="service-card-btn btn btn-md btn-outline-secondary animate__animated animate__fadeInUp w-100 text-start"
                    style={{
                      minHeight: "80px",
                      marginBottom: "8px",
                      animationDelay: `${idx * 0.25}s`,
                      WebkitAnimationDelay: `${idx * 0.25}s`,
                    }}
                  >
                    <div className="m-1 p-1 d-flex justify-content-center">
                      <i className={service.icon + "  bx-lg"}></i>
                    </div>
                    <div
                      className="d-flex flex-column text-start"
                      style={{ width: "85%" }}
                    >
                      <span className="fw-bold">{service.text}</span>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
