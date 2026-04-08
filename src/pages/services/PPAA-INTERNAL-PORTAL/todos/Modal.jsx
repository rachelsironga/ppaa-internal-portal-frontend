import React, { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Select from "react-select";
import { createUpdateTodo } from "./Queries";
import { getDepartments } from "../departments/Queries";
import showToast from "../../../../helpers/ToastHelper";

const TodoModal = ({ selectedObj, setSelectedObj, tableRefresh, setTableRefresh }) => {
  const [errors, setOtherError] = useState({});
  const [departments, setDepartments] = useState([]);

  const statusChoices = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  const priorityChoices = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'URGENT', label: 'Urgent' },
  ];

  const initialValues = {
    title: selectedObj?.title || "",
    description: selectedObj?.description || "",
    status: selectedObj?.status || "PENDING",
    priority: selectedObj?.priority || "MEDIUM",
    start_date: selectedObj?.start_date ? selectedObj.start_date.substring(0, 16) : "",
    due_date: selectedObj?.due_date ? selectedObj.due_date.substring(0, 16) : "",
    department_uid: selectedObj?.department?.uid || "",
  };

  const validationSchema = Yup.object().shape({
    title: Yup.string().required("Title is required"),
    status: Yup.string().required("Status is required"),
    priority: Yup.string().required("Priority is required"),
  });

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const deptsResult = await getDepartments({ search: "", pagination: { page: 1, page_size: 100 } });
        if (deptsResult.status === 200 || deptsResult.status === 8000) {
          const deptData = deptsResult.data?.results || deptsResult.data || [];
          setDepartments(
            deptData.map((dept) => ({
              value: dept.uid,
              label: dept.name,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };

    fetchDepartments();
  }, []);

  const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
    try {
      if (selectedObj) {
        values.uid = selectedObj.uid;
      }

      // Convert datetime-local format to ISO string
      if (values.start_date) {
        values.start_date = new Date(values.start_date).toISOString();
      }
      if (values.due_date) {
        values.due_date = new Date(values.due_date).toISOString();
      }

      // Explicitly set department_uid to null if empty to allow clearing department on update
      if (!values.department_uid) {
        values.department_uid = null;
      }

      const result = await createUpdateTodo(values);

      if (result.status === 200 || result.status === 8000) {
        showToast("Task saved successfully", "success", "Complete");
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
    const modalElement = document.getElementById("todoModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
    setSelectedObj(null);
  };

  useEffect(() => {
    const modalElement = document.getElementById("todoModal");
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
      id="todoModal"
      tabIndex="-1"
      aria-hidden="true"
      data-bs-backdrop="static"
      data-bs-keyboard="false"
    >
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {selectedObj === null ? "Create New" : "Update"} Task
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
            {({ isSubmitting, setFieldValue, values }) => (
              <Form>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12 mb-3">
                      <label className="form-label">Task Title *</label>
                      <Field
                        type="text"
                        name="title"
                        className="form-control"
                        placeholder="Enter task title"
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
                        rows="4"
                        placeholder="Enter task description"
                      />
                      <ErrorMessage
                        name="description"
                        component="div"
                        className="text-danger small"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Status *</label>
                      <Select
                        name="status"
                        options={statusChoices}
                        value={statusChoices.find((opt) => opt.value === values.status) || null}
                        onChange={(option) => setFieldValue("status", option?.value || "")}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        placeholder="Select status"
                      />
                      <ErrorMessage
                        name="status"
                        component="div"
                        className="text-danger small"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Priority *</label>
                      <Select
                        name="priority"
                        options={priorityChoices}
                        value={priorityChoices.find((opt) => opt.value === values.priority) || null}
                        onChange={(option) => setFieldValue("priority", option?.value || "")}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        placeholder="Select priority"
                      />
                      <ErrorMessage
                        name="priority"
                        component="div"
                        className="text-danger small"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Start Date & Time</label>
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
                      <label className="form-label">Due Date & Time</label>
                      <Field
                        type="datetime-local"
                        name="due_date"
                        className="form-control"
                      />
                      <ErrorMessage
                        name="due_date"
                        component="div"
                        className="text-danger small"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Department</label>
                      <Select
                        name="department_uid"
                        options={departments}
                        value={departments.find((opt) => opt.value === values.department_uid) || null}
                        onChange={(option) => setFieldValue("department_uid", option?.value || "")}
                        isClearable
                        className="react-select-container"
                        classNamePrefix="react-select"
                        placeholder="Select department (optional)"
                      />
                      <ErrorMessage
                        name="department_uid"
                        component="div"
                        className="text-danger small"
                      />
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

export default TodoModal;

