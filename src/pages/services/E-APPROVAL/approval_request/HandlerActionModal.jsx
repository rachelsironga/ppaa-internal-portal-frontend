import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../../../helpers/ToastHelper";
import { ApprovalRequestsContext } from "../../../../utils/context";
import { useSelector } from "react-redux";
import { approveRejectRequest } from "./Queries";
import Swal from "sweetalert2";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { createUpdateData } from "../../../../utils/GlobalQueries";

const HandlerActionModal = ({ loadOnlyModal = false }) => {
  const user = useSelector((state) => state.userReducer?.data);

  const {
    handleFetchData,
    selectedRequest,
    setSelectedRequest,
    selectedModuleLevel,
    setSelectedModuleLevel,
    isLastStep,
  } = useContext(ApprovalRequestsContext);
  const [errors, setOtherError] = useState({});

  const initialValues = {
    request_uid: selectedRequest?.uid || "",
    handler_descriptions: selectedRequest?.handler_descriptions || "",
  };

  const validationSchema = Yup.object().shape({
    request_uid: Yup.string().required("Request is required"),
    handler_descriptions: Yup.string().required(
      "Please Write Something To Notify User "
    ),
  });

  const handleSubmit = async (
    values,
    { resetForm, setErrors, setSubmitting }
  ) => {
    try {
      const confirmation = await Swal.fire({
        title: "Are you sure?",
        text: `You are about to submit your action on this request.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#696cff",
        cancelButtonColor: "#fff",
        confirmButtonText: "Confirm",
        cancelButtonText: "Cancel",
        buttonsStyling: true,
        customClass: {
          confirmButton: "btn btn-info btn-sm",
          cancelButton: "btn btn-outline-secondary btn-sm",
        },
        // ensure Swal appears above Bootstrap modal (Bootstrap modal z-index ~1050)
        didOpen: () => {
          const popup = Swal.getPopup();
          if (popup) popup.style.zIndex = "20050";
          const container = document.querySelector(".swal2-container");
          if (container) container.style.zIndex = "20040";
        },
      });

      if (!confirmation.isConfirmed) return;

      if (!selectedRequest) {
        showToast(
          "Unable to perform action. Missing request context.",
          "error",
          ""
        );
        return;
      }

      // prepare payload using the two inputs (request_uid and handler_descriptions)
      const payload = {
        request_uid: values.request_uid || selectedRequest.uid,
        handler_descriptions: values.handler_descriptions || "",
      };

      // send to backend endpoint /request/handleing
      setSubmitting(true);
      const result = await createUpdateData({
        url: "/handle-approval-request",
        formData: payload,
      });

      if (result?.status === 200 || result?.status === 8000) {
        Swal.fire(
          "Process Completed!",
          "Request saved successfully.",
          "success"
        );
        handleClose();
        resetForm();
        if (typeof handleFetchData === "function") handleFetchData();
      } else if (result?.status === 8001) {
        // validation errors from backend - keep modal open
        setErrors(result.data || {});
        setOtherError(result.data || {});
        showToast(
          result.message || "Validation failed",
          "warning",
          "Validation Failed"
        );
      } else {
        // other failures - keep modal open so user can retry
        showToast(result?.message || "Process failed", "warning", "Failed");
      }
    } catch (error) {
      // extract API errors when available
      const apiErr = error?.response?.data;
      if (apiErr) {
        setErrors(apiErr);
        setOtherError(apiErr);
      }
      console.error("Handle request error:", error);
      showToast(
        "Unable to perform action. Please try again or contact support.",
        "error",
        "Failed"
      );
      // keep modal open on exception
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    const modalElement = document.getElementById("approvalHandleActionModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
  };

  return (
    <>
      <div
        className="modal modal-slide-in"
        id="approvalHandleActionModal"
        tabIndex="-1"
        aria-hidden="true"
        data-bs-backdrop="static"
        data-bs-keyboard="false"
      >
        <div className="modal-dialog modal-lg" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel3">
                Handle Action on Request
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
              {({
                values,
                resetForm,
                setErrors,
                setSubmitting,
                setFieldValue,
                isSubmitting,
              }) => (
                <Form>
                  <div className="modal-body">
                    <div className="row">
                      <div className="col-sm-12 col-md-12">
                        <div className=" text-justify mb-4">
                          <p className="mb-1 fw-bold">
                            <i className="bx bx-info-circle me-2"></i>
                            Attension
                          </p>
                          <p className="mb-0">
                            Please write a comment to Notify the Requester about
                            your Action on this Request.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col mb-3" style={{ height: "320px" }}>
                        <label
                          htmlFor="handler_descriptions"
                          className="form-label"
                        >
                          Comment
                        </label>
                        <ReactQuill
                          id="handler_descriptions"
                          value={values.handler_descriptions}
                          onChange={(val) =>
                            setFieldValue("handler_descriptions", val)
                          }
                          style={{ height: "250px" }}
                          theme="snow"
                          modules={{
                            toolbar: [
                              [{ header: [1, 2, 3, false] }],
                              ["bold", "italic", "underline", "strike"],
                              [{ list: "ordered" }, { list: "bullet" }],
                              ["blockquote", "code-block"],
                              ["link", "image"],
                              ["clean"],
                            ],
                          }}
                        />
                        <ErrorMessage
                          name="handler_descriptions"
                          component="div"
                          className="text-danger"
                        />
                      </div>
                    </div>

                    <div className="modal-footer">
                      <button
                        aria-label="Click me"
                        type="submit"
                        disabled={isSubmitting}
                        className="btn btn-sm btn-primary"
                        style={{ marginRight: "20px", minWidth: "150px" }}
                      >
                        {isSubmitting ? "Submitting..." : "Save & Submit"}
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

export default HandlerActionModal;
