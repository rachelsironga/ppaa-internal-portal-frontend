import React, { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Select from "react-select";
import { createUpdateEvent, getEvents } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";

const EventModal = ({ selectedObj, setSelectedObj, tableRefresh, setTableRefresh }) => {
  const [errors, setOtherError] = useState({});
  const [eventTypeChoices, setEventTypeChoices] = useState([]);

  // Helper function to format date for datetime-local input
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      
      // Format as YYYY-MM-DDTHH:mm (datetime-local format)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  const initialValues = {
    title: selectedObj?.title || "",
    description: selectedObj?.description || "",
    event_type: selectedObj?.event_type || "",
    start_date: formatDateForInput(selectedObj?.start_date),
    end_date: formatDateForInput(selectedObj?.end_date),
    location: selectedObj?.location || "",
    is_all_day: selectedObj?.is_all_day || false,
    is_public: selectedObj?.is_public || false,
  };

  const validationSchema = Yup.object().shape({
    title: Yup.string().required("Title is required"),
    start_date: Yup.string().required("Start date is required"),
    end_date: Yup.string().required("End date is required"),
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const eventsResult = await getEvents({ pagination: { page: 1, page_size: 1 } });

        // Extract event type choices from the first event in the response
        if (eventsResult.status === 200 || eventsResult.status === 8000) {
          const eventsData = eventsResult.data?.results || eventsResult.data || [];
          if (eventsData.length > 0 && eventsData[0].event_type_choices) {
            setEventTypeChoices(
              eventsData[0].event_type_choices.map((choice) => ({
                value: choice.value,
                label: choice.label,
              }))
            );
          } else {
            // Fallback to default choices if not available
            setEventTypeChoices([
              { value: 'MEETING', label: 'Meeting' },
              { value: 'TRAINING', label: 'Training' },
              { value: 'WORKSHOP', label: 'Workshop' },
              { value: 'HOLIDAY', label: 'Holiday' },
              { value: 'OTHER', label: 'Other' },
            ]);
          }
        } else {
          // Fallback to default choices
          setEventTypeChoices([
            { value: 'MEETING', label: 'Meeting' },
            { value: 'TRAINING', label: 'Training' },
            { value: 'WORKSHOP', label: 'Workshop' },
            { value: 'HOLIDAY', label: 'Holiday' },
            { value: 'OTHER', label: 'Other' },
          ]);
        }
      } catch (error) {
        console.error("Error fetching event options:", error);
        // Fallback to default choices on error
        setEventTypeChoices([
          { value: 'MEETING', label: 'Meeting' },
          { value: 'TRAINING', label: 'Training' },
          { value: 'WORKSHOP', label: 'Workshop' },
          { value: 'HOLIDAY', label: 'Holiday' },
          { value: 'OTHER', label: 'Other' },
        ]);
      }
    };

    fetchOptions();
  }, []);

  const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
    try {
      if (selectedObj) {
        values.uid = selectedObj.uid;
      }

      const result = await createUpdateEvent(values);

      if (result.status === 200 || result.status === 8000) {
        showToast("Event saved successfully", "success", "Complete");
        setTableRefresh((prev) => prev + 1);
        handleClose();
        resetForm();
        setSelectedObj(null);
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
    }
  };

  const handleClose = () => {
    const modalElement = document.getElementById("eventModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
    setSelectedObj(null);
  };

  useEffect(() => {
    const modalElement = document.getElementById("eventModal");
    if (!modalElement) return;

    const handleHidden = () => {
      setSelectedObj(null);
    };

    modalElement.addEventListener("hidden.bs.modal", handleHidden);
    return () => {
      modalElement.removeEventListener("hidden.bs.modal", handleHidden);
    };
  }, []);

  return (
    <div
      className="modal modal-slide-in"
      id="eventModal"
      tabIndex="-1"
      aria-hidden="true"
      data-bs-backdrop="static"
      data-bs-keyboard="false"
    >
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {selectedObj === null ? "Create New" : "Update"} Event
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
                        placeholder="Enter event title"
                      />
                      <ErrorMessage
                        name="title"
                        component="div"
                        className="text-danger small"
                      />
                    </div>

                    <div className="col-md-12 mb-3">
                      <label className="form-label">Description</label>
                      <Field
                        as="textarea"
                        name="description"
                        className="form-control"
                        rows="3"
                        placeholder="Enter description"
                      />
                      <ErrorMessage
                        name="description"
                        component="div"
                        className="text-danger small"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Event Type</label>
                      <Select
                        options={eventTypeChoices}
                        value={eventTypeChoices.find((choice) => choice.value === values.event_type) || null}
                        onChange={(option) => setFieldValue("event_type", option?.value || "")}
                        isClearable
                        placeholder="Select event type"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Location</label>
                      <Field
                        type="text"
                        name="location"
                        className="form-control"
                        placeholder="Enter location"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Start Date & Time *</label>
                      <Field
                        type="datetime-local"
                        name="start_date"
                        className="form-control"
                      />
                      <ErrorMessage
                        name="start_date"
                        component="div"
                        className="text-danger small"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">End Date & Time *</label>
                      <Field
                        type="datetime-local"
                        name="end_date"
                        className="form-control"
                      />
                      <ErrorMessage
                        name="end_date"
                        component="div"
                        className="text-danger small"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <div className="form-check">
                        <Field
                          type="checkbox"
                          name="is_all_day"
                          className="form-check-input"
                          id="is_all_day"
                        />
                        <label className="form-check-label" htmlFor="is_all_day">
                          All day event
                        </label>
                      </div>
                    </div>

                    <div className="col-md-6 mb-3">
                      <div className="form-check">
                        <Field
                          type="checkbox"
                          name="is_public"
                          className="form-check-input"
                          id="is_public"
                        />
                        <label className="form-check-label" htmlFor="is_public">
                          Public event
                        </label>
                      </div>
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
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save"}
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

export default EventModal;


