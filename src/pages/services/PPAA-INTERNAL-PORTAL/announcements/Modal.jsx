import React, { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Select from "react-select";
import { createUpdateAnnouncement, getAnnouncements } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";

const AnnouncementModal = ({ selectedObj, setSelectedObj, tableRefresh, setTableRefresh }) => {
  const [errors, setOtherError] = useState({});
  const [loading, setLoading] = useState(false);
  const [priorityChoices, setPriorityChoices] = useState([]);
  const [fileBase64, setFileBase64] = useState("");
  const [fileName, setFileName] = useState("");

  const initialValues = {
    title: selectedObj?.title || "",
    content: selectedObj?.content || "",
    priority: selectedObj?.priority || "MEDIUM",
    is_pinned: selectedObj?.is_pinned || false,
    start_date: selectedObj?.start_date ? selectedObj.start_date.substring(0, 16) : "",
    end_date: selectedObj?.end_date ? selectedObj.end_date.substring(0, 16) : "",
    is_active: selectedObj?.is_active !== undefined ? selectedObj.is_active : true,
  };

  const validationSchema = Yup.object().shape({
    title: Yup.string().required("Title is required"),
    content: Yup.string().required("Content is required"),
    priority: Yup.string().required("Priority is required"),
  });

  useEffect(() => {
    const fetchPriorityChoices = async () => {
      try {
        const announcementsResult = await getAnnouncements({ pagination: { page: 1, page_size: 1 } });

        if (announcementsResult.status === 200 || announcementsResult.status === 8000) {
          const announcementsData = announcementsResult.data?.results || announcementsResult.data || [];
          if (announcementsData.length > 0 && announcementsData[0].priority_choices) {
            setPriorityChoices(
              announcementsData[0].priority_choices.map((choice) => ({
                value: choice.value,
                label: choice.label,
              }))
            );
          } else {
            // Fallback to default choices
            setPriorityChoices([
              { value: 'LOW', label: 'Low' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'HIGH', label: 'High' },
              { value: 'URGENT', label: 'Urgent' },
            ]);
          }
        } else {
          // Fallback to default choices
          setPriorityChoices([
            { value: 'LOW', label: 'Low' },
            { value: 'MEDIUM', label: 'Medium' },
            { value: 'HIGH', label: 'High' },
            { value: 'URGENT', label: 'Urgent' },
          ]);
        }
      } catch (error) {
        console.error("Error fetching priority choices:", error);
        // Fallback to default choices on error
        setPriorityChoices([
          { value: 'LOW', label: 'Low' },
          { value: 'MEDIUM', label: 'Medium' },
          { value: 'HIGH', label: 'High' },
          { value: 'URGENT', label: 'Urgent' },
        ]);
      }
    };

    fetchPriorityChoices();
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setFileBase64(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
    try {
      setLoading(true);
      
      if (selectedObj) {
        values.uid = selectedObj.uid;
      }

      // Convert datetime-local format to ISO string
      if (values.start_date) {
        values.start_date = new Date(values.start_date).toISOString();
      }
      if (values.end_date) {
        values.end_date = new Date(values.end_date).toISOString();
      }

      // Add file data if provided
      if (fileBase64) {
        values.file_base64 = fileBase64;
        values.file_name = fileName;
      }

      const result = await createUpdateAnnouncement(values);

      if (result.status === 200 || result.status === 8000) {
        showToast("Announcement saved successfully", "success", "Complete");
        setTableRefresh((prev) => prev + 1);
        handleClose();
        resetForm();
        setSelectedObj(null);
        setFileBase64("");
        setFileName("");
      } else if (result.status === 8002) {
        showToast(`${result.message}`, "warning", "Validation Failed");
        setErrors(result.data);
        setOtherError(result.data);
      } else {
        showToast(`${result.message}`, "warning", "Process Failed");
        handleClose();
        resetForm();
      }
    } catch (error) {
      showToast("Something went wrong while saving", "error", "Failed");
      handleClose();
      resetForm();
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  const handleClose = () => {
    const modalElement = document.getElementById("announcementModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
    setSelectedObj(null);
    setFileBase64("");
    setFileName("");
  };

  useEffect(() => {
    const modalElement = document.getElementById("announcementModal");
    if (!modalElement) return;

    const handleHidden = () => {
      setSelectedObj(null);
      setFileBase64("");
      setFileName("");
    };

    modalElement.addEventListener("hidden.bs.modal", handleHidden);
    return () => {
      modalElement.removeEventListener("hidden.bs.modal", handleHidden);
    };
  }, []);

  return (
    <div
      className="modal modal-slide-in"
      id="announcementModal"
      tabIndex="-1"
      aria-hidden="true"
      data-bs-backdrop="static"
      data-bs-keyboard="false"
    >
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {selectedObj === null ? "Create New" : "Update"} Announcement
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
                    <div className="col-md-12 mb-3">
                      <label className="form-label">Title *</label>
                      <Field
                        type="text"
                        name="title"
                        className="form-control"
                        placeholder="Enter announcement title"
                      />
                      <ErrorMessage
                        name="title"
                        component="div"
                        className="text-danger small"
                      />
                    </div>

                    <div className="col-md-12 mb-3">
                      <label className="form-label">Content *</label>
                      <Field
                        as="textarea"
                        name="content"
                        className="form-control"
                        rows="5"
                        placeholder="Enter announcement content"
                      />
                      <ErrorMessage
                        name="content"
                        component="div"
                        className="text-danger small"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Priority *</label>
                      <Select
                        options={priorityChoices}
                        value={priorityChoices.find((choice) => choice.value === values.priority) || null}
                        onChange={(option) => setFieldValue("priority", option?.value || "MEDIUM")}
                        placeholder="Select priority"
                      />
                      <ErrorMessage
                        name="priority"
                        component="div"
                        className="text-danger small"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Status</label>
                      <div className="form-check mt-3">
                        <Field
                          type="checkbox"
                          name="is_active"
                          className="form-check-input"
                          id="is_active"
                        />
                        <label className="form-check-label" htmlFor="is_active">
                          Active
                        </label>
                      </div>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Start Date & Time</label>
                      <Field
                        type="datetime-local"
                        name="start_date"
                        className="form-control"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">End Date & Time</label>
                      <Field
                        type="datetime-local"
                        name="end_date"
                        className="form-control"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <div className="form-check">
                        <Field
                          type="checkbox"
                          name="is_pinned"
                          className="form-check-input"
                          id="is_pinned"
                        />
                        <label className="form-check-label" htmlFor="is_pinned">
                          Pin this announcement
                        </label>
                      </div>
                    </div>

                    <div className="col-md-12 mb-3">
                      <label className="form-label">File Upload (Optional)</label>
                      <input
                        type="file"
                        className="form-control"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg"
                      />
                      {fileName && (
                        <small className="text-muted">Selected: {fileName}</small>
                      )}
                      {selectedObj?.file_url && !fileBase64 && (
                        <div className="mt-2">
                          <a
                            href={selectedObj.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-primary"
                          >
                            <i className="bx bx-download me-1"></i> View Current File
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-label-secondary"
                    onClick={handleClose}
                    data-bs-dismiss="modal"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting || loading}
                  >
                    {isSubmitting || loading ? "Saving..." : "Save"}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementModal;

