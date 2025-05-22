// AccordionContainer.js
import React, { useState } from "react";
import AccordionItem from "./WizardItem";
import { Formik } from "formik";

const CustomFormWizard = ({ title = "", initialValues = null, isSubmitting = false }) => {
  const [activeItem, setActiveItem] = useState(1);

  const handleToggle = (id) => {
    setActiveItem(id === activeItem ? null : id);
  };

  return (
    <div className="modal-body">
      <div className="col-xl-12">
        <div className="nav-align-top mb-4">
          <ul className="nav nav-tabs mb-3" role="tablist">
            <li
              className="nav-item"
              style={{
                marginRight: "5px",
                paddingRight: "10px",
              }}
            >
              <div
                aria-label="Click me"
                type="button"
                className="nav-link active d-flex justify-content-between align-items-center"
                role="tab"
                data-bs-toggle="tab"
                data-bs-target="#navs-pills-justified-1"
                aria-controls="navs-pills-justified-1"
                aria-selected="true"
              >
                <div className="d-flex align-items-center">
                  <span
                    className="btn btn-primary me-3"
                    style={{
                      fontSize: "1rem",
                    }}
                  >
                    1
                  </span>
                  <div className="d-flex flex-column text-start">
                    <span className="fw-bold text-primary">General Detail</span>
                    <span className="small">Add General Request Info</span>
                  </div>
                </div>
              </div>
            </li>
            <li style={{ paddingRight: "10px", paddingTop: "18px" }}>
              <span className="text-muted content-center">
                <i
                  className="tf-icons bx bx-chevron-right"
                  style={{
                    fontSize: "1.5rem",
                  }}
                ></i>
              </span>
            </li>
            <li
              className="nav-item"
              style={{
                marginRight: "10px",
                paddingRight: "10px",
              }}
            >
              <div
                aria-label="Click me"
                type="button"
                className="nav-link d-flex justify-content-between align-items-center"
                role="tab"
                data-bs-toggle="tab"
                data-bs-target="#navs-pills-justified-2"
                aria-controls="navs-pills-justified-2"
                aria-selected="false"
              >
                <div className="d-flex align-items-center">
                  <span
                    className="btn btn-secondary me-3"
                    style={{
                      fontSize: "1rem",
                      opacity: 0.6,
                    }}
                  >
                    2
                  </span>
                  <div className="d-flex flex-column text-start">
                    <span className="fw-bold">Other Detail</span>
                    <span className="small">Enter other Type Request Info</span>
                  </div>
                </div>
              </div>
            </li>
            <li style={{ paddingRight: "10px", paddingTop: "18px" }}>
              <span className="text-muted content-center">
                <i
                  className="tf-icons bx bx-chevron-right"
                  style={{
                    fontSize: "1.5rem",
                  }}
                ></i>
              </span>
            </li>
            <li
              className="nav-item"
              style={{
                marginRight: "10px",
                paddingRight: "10px",
              }}
            >
              <div
                aria-label="Click me"
                type="button"
                className="nav-link d-flex justify-content-between align-items-center"
                role="tab"
                data-bs-toggle="tab"
                data-bs-target="#navs-pills-justified-2"
                aria-controls="navs-pills-justified-2"
                aria-selected="false"
              >
                <div className="d-flex align-items-center">
                  <span
                    className="btn btn-secondary me-3"
                    style={{
                      fontSize: "1rem",
                      opacity: 0.6,
                    }}
                  >
                    2
                  </span>
                  <div className="d-flex flex-column text-start">
                    <span className="fw-bold">Other Detail</span>
                    <span className="small">Enter other Type Request Info</span>
                  </div>
                </div>
              </div>
            </li>
          </ul>
          <div className="tab-content">
            <div
              className="tab-pane fade show active"
              id="navs-pills-justified-1"
              role="tabpanel"
            >
              <p>
                Icing pastry pudding oat cake. Lemon drops cotton candy caramels
                cake caramels sesame snaps powder. Bear claw candy topping.
              </p>
              <p className="mb-0">
                Tootsie roll fruitcake cookie. Dessert topping pie. Jujubes
                wafer carrot cake jelly. Bonbon jelly-o jelly-o ice cream jelly
                beans candy canes cake bonbon. Cookie jelly beans marshmallow
                jujubes sweet.
              </p>
              <div className="modal-footer">
                <button
                  aria-label="Click me"
                  type="button"
                  className="btn btn-primary"
                  role="tab"
                  data-bs-toggle="tab"
                  data-bs-target="#navs-pills-justified-2"
                  aria-controls="navs-pills-justified-2"
                  aria-selected="false"
                >
                  Next
                </button>
              </div>
            </div>
            <div
              className="tab-pane fade"
              id="navs-pills-justified-2"
              role="tabpanel"
            >
              <p>
                Donut dragée jelly pie halvah. Danish gingerbread bonbon cookie
                wafer candy oat cake ice cream. Gummies halvah tootsie roll
                muffin biscuit icing dessert gingerbread. Pastry ice cream
                cheesecake fruitcake.
              </p>
              <p className="mb-0">
                Jelly-o jelly beans icing pastry cake cake lemon drops. Muffin
                muffin pie tiramisu halvah cotton candy liquorice caramels.
              </p>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomFormWizard;
