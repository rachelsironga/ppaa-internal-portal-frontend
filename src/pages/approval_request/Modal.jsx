import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../helpers/ToastHelper";
import { createUpdateApprovalRequest } from "./Queries";
import { ApprovalRequestsContext } from "../../utils/context";
import requestTypes from "../../data/requestTypes.json";
import { getDepartments } from "../department/Queries";
import { getApprovalLevels } from "../approval_level/Queries";

const ApprovalRequestModal = () => {
  const {
    handleFetchData,
    selectApprovalRequests,
    setSelectedApprovalRequests,
  } = useContext(ApprovalRequestsContext);
  const [errors, setOtherError] = useState({});

  const [loadingLevels, setLoadingLevels] = useState(false);
  const [levels, setLevels] = useState([]);

  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [departments, setDepartments] = useState([]);

  const initialValues = {
    name: selectApprovalRequests?.name || "",
    code: selectApprovalRequests?.code || "",
    is_active: selectApprovalRequests?.is_active ?? true,
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Name is required"),
    code: Yup.string().required("Code is required"),
  });

  const handleSubmit = async (
    values,
    { setSubmitting, resetForm, setErrors }
  ) => {
    try {
      if (selectApprovalRequests) {
        values.uid = selectApprovalRequests.uid;
      }
      const result = await createUpdateApprovalRequest(values);

      if (result.status === 200 || result.status === 8000) {
        showToast("Data Saved Successfuly", "success", "Complete");
        handleClose();
        resetForm();
        handleFetchData();
      } else if (result.status === 8002) {
        console.log("Validation error:", result.data);
        showToast(`${result.message}`, "warning", "Validation Failed");
        setErrors(result.data);
        setOtherError(result.data);
      } else {
        showToast(`${result.message}`, "warning", "Process Failed");
        handleClose();
        resetForm();
      }
    } catch (error) {
      console.log("Error submitting form:", error);
      showToast("Something went wrong while saving", "error", "Failed");
      handleClose(); // Close the modal after submission
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    console.log("Modal closed");
    setSelectedApprovalRequests(null);
    const modalElement = document.getElementById("viewCreateDataModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
  };

  const handleFetchLevels = async (searchValue = "") => {
    setLoadingLevels(true);
    try {
      const result = await getApprovalLevels({
        search: searchValue,
        pagination: {
          page: 1,
          page_size: 10,
          paginated: true,
        },
      });
      if (result.status === 200 || result.status === 8000) {
        setLevels(result.data);
      } else {
        setLevels(null);
      }
    } catch (err) {
      setLevels(null);
    } finally {
      setLoadingLevels(false);
    }
  };

  const fetchDepartments = async (searchValue = "") => {
    setLoadingDepartments(true);
    try {
      const result = await getDepartments({
        search: searchValue,
        pagination: {
          page: 1,
          page_size: 10,
          paginated: true,
        },
      });
      if (result.status === 200 || result.status === 8000) {
        setDepartments(result.data);
      } else {
        setDepartments(null);
      }
    } catch (err) {
      console.log("Fetching departments...");
      console.error("Error fetching departments:", err);
      setDepartments(null);
    } finally {
      setLoadingDepartments(false);
    }
  };

  return (
    <>
      {/* <button
                aria-label="Click me"
                type="button"
                className="btn btn-primary ms-auto btn-sm"
                data-bs-toggle="modal"
                data-bs-target="#viewCreateDataModal">
                <i className="bx bx-edit-alt me-1"></i> Add Approval Action hjkh
            </button> */}

      <div className="dropdown">
        <button
          aria-label="Click me"
          type="button"
          className="btn btn-primary ms-auto btn-sm dropdown-toggle hide-arrow"
          data-bs-toggle="dropdown"
        >
          <i className="bx bx-edit-alt me-1"></i> Create Request
        </button>
        <div className="dropdown-menu" style={{ minWidth: "300px" }}>
          <div className="list-group">
            {requestTypes.map((request) => (
              <button
                key={request.type}
                type="button"
                data-bs-toggle="modal"
                data-bs-target={`#${request.type}`}
                className="list-group-item list-group-item-action"
              // style={{ color: request.color }}
              >
                <i className={`bx ${request.icon} me-1 me-1`}></i>
                {request.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        className="modal modal-slide-in"
        id="INTERNET_EMAIL_CONNECTIVITY"
        tabIndex="-1"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-xl" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel3">
                Request For Internet & Email Connectivity
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={handleClose}
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <Formik
              enableReinitialize
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting, values, setFieldValue }) => (
                <Form>
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
                                  <span className="fw-bold text-primary">
                                    General Detail
                                  </span>
                                  <span className="small">
                                    Add General Request Info
                                  </span>
                                </div>
                              </div>
                            </div>
                          </li>
                          <li
                            style={{ paddingRight: "10px", paddingTop: "18px" }}
                          >
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
                                  <span className="small">
                                    Enter other Type Request Info
                                  </span>
                                </div>
                              </div>
                            </div>
                          </li>
                          <li
                            style={{ paddingRight: "10px", paddingTop: "18px" }}
                          >
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
                                  <span className="small">
                                    Enter other Type Request Info
                                  </span>
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
                              Icing pastry pudding oat cake. Lemon drops cotton
                              candy caramels cake caramels sesame snaps powder.
                              Bear claw candy topping.
                            </p>
                            <p className="mb-0">
                              Tootsie roll fruitcake cookie. Dessert topping
                              pie. Jujubes wafer carrot cake jelly. Bonbon
                              jelly-o jelly-o ice cream jelly beans candy canes
                              cake bonbon. Cookie jelly beans marshmallow
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
                              Donut dragée jelly pie halvah. Danish gingerbread
                              bonbon cookie wafer candy oat cake ice cream.
                              Gummies halvah tootsie roll muffin biscuit icing
                              dessert gingerbread. Pastry ice cream cheesecake
                              fruitcake.
                            </p>
                            <p className="mb-0">
                              Jelly-o jelly beans icing pastry cake cake lemon
                              drops. Muffin muffin pie tiramisu halvah cotton
                              candy liquorice caramels.
                            </p>

                            <div className="modal-footer">
                              <button
                                aria-label="Click me"
                                type="button"
                                disabled={isSubmitting}
                                onClick={handleClose}
                                className="btn btn-outline-secondary"
                                data-bs-dismiss="modal"
                              >
                                Close
                              </button>
                              <button
                                aria-label="Click me"
                                type="submit"
                                disabled={isSubmitting}
                                className="btn btn-primary"
                              >
                                {isSubmitting ? "Saving..." : "Save"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>

      <div
        className="modal modal-slide-in"
        id="viewCreateDataModalJeeva"
        tabIndex="-1"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel3">
                Create JEEVA Access
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={handleClose}
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <Formik
              enableReinitialize
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting, values, setFieldValue }) => (
                <Form>
                  <div className="modal-body">
                    <div className="row">
                      <div className="col mb-3">
                        <label htmlFor="nameLarge" className="form-label">
                          Name
                        </label>
                        <Field
                          type="text"
                          name="name"
                          id="nameLarge"
                          className="form-control"
                          placeholder="Enter Name"
                        />
                        <ErrorMessage
                          name="name"
                          component="div"
                          className="text-danger"
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col mb-3">
                        <label htmlFor="codeLarge" className="form-label">
                          Code
                        </label>
                        <Field
                          type="text"
                          name="code"
                          id="codeLarge"
                          className="form-control"
                          placeholder="Enter Code"
                        />
                        <ErrorMessage
                          name="code"
                          component="div"
                          className="text-danger"
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col mb-3">
                        <label htmlFor="statusSwitch" className="form-label">
                          Activate or Deactivate Option :{" "}
                        </label>
                        <div className="form-check form-switch">
                          <Field
                            type="checkbox"
                            className="form-check-input"
                            id="statusSwitch"
                            checked={values.is_active}
                            onChange={(e) =>
                              setFieldValue("is_active", e.target.checked)
                            }
                          />
                          <label
                            className="form-check-label"
                            htmlFor="statusSwitch"
                          >
                            {values.is_active ? "Active" : "Inactive"}
                          </label>
                        </div>
                        <ErrorMessage
                          name="is_active"
                          component="div"
                          className="text-danger"
                        />
                      </div>
                    </div>

                    {errors.non_field_errors &&
                      errors.non_field_errors.length > 0 && (
                        <div className="text-danger">
                          {errors.non_field_errors.map((error, index) => (
                            <div key={index}>{error}</div>
                          ))}
                        </div>
                      )}

                    <div className="modal-footer">
                      <button
                        aria-label="Click me"
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleClose}
                        className="btn btn-outline-secondary"
                        data-bs-dismiss="modal"
                      >
                        Close
                      </button>
                      <button
                        aria-label="Click me"
                        type="submit"
                        disabled={isSubmitting}
                        className="btn btn-primary"
                      >
                        {isSubmitting ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </>
  );
};

export default ApprovalRequestModal;
