import React, { useContext, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../../../helpers/ToastHelper";
import { UsersContext } from "../../../../utils/context";
import { createUpdatePositions } from "./Queries";
import FormikSelect from "../../../../components/ui-templates/form-components/FormikSelect";

const PositionsModal = () => {
  const {
    selectedObj,
    setSelectedObj,
    tableRefresh,
    setTableRefresh,
    isModalOpen,
    setIsModalOpen,
  } = useContext(UsersContext);
  const [errors, setOtherError] = useState({});

  const initialValues = {
    user_uid: selectedObj?.guid || "",
    department_uid: selectedObj?.position?.department_uid || "",
    level_uid: selectedObj?.position?.level_uid || "",
    description: selectedObj?.position?.description || "",
    is_active: true,
  };

  const validationSchema = Yup.object().shape({
    department_uid: Yup.string().required("Department is required"),
  });

  const handleSubmit = async (
    values,
    { setSubmitting, resetForm, setErrors }
  ) => {
    try {
      if (selectedObj) {
        values.user_uid = selectedObj?.guid;
      }
      
      // Remove level_uid if empty (only department is required)
      if (!values.level_uid || values.level_uid === "") {
        delete values.level_uid;
      }
      
      console.log("Submitting form with selectedObj:", selectedObj);

      const result = await createUpdatePositions(values);

      if (result.status === 200 || result.status === 8000) {
        showToast("Data Saved Successfuly", "success", "Complete");
        setTableRefresh((prev) => prev + 1);
        handleClose();
        resetForm();
      } else if (result.status === 8002) {
        console.log("Validation error:", result.data);
        // Extract actual error message from validation errors
        let errorMessage = result.message || "Validation Failed";
        if (result.data) {
          // Check for position error (or any other field error)
          if (result.data.position && Array.isArray(result.data.position) && result.data.position.length > 0) {
            errorMessage = result.data.position[0];
          } else if (result.data.position && typeof result.data.position === 'string') {
            errorMessage = result.data.position;
          } else {
            // Try to get first error from any field
            const firstErrorKey = Object.keys(result.data)[0];
            if (firstErrorKey && result.data[firstErrorKey]) {
              const firstError = Array.isArray(result.data[firstErrorKey]) 
                ? result.data[firstErrorKey][0] 
                : result.data[firstErrorKey];
              errorMessage = firstError;
            }
          }
        }
        showToast(errorMessage, "error", "Validation Failed");
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
    const modalElement = document.getElementById(
      "viewCreateUserPossitionModal"
    );
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
    setIsModalOpen(false);
  };

  return (
    <>
      <div
        className="modal modal-slide-in"
        id="viewCreateUserPossitionModal"
        tabIndex="-1"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel3">
                Change{" "}
                <span className="text-primary">
                  {selectedObj?.first_name} {selectedObj?.last_name}
                </span>{" "}
                Position
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
                    <p className="align-justify text-muted">
                      {" "}
                      If you Made Changes here. User will be Asigned by new
                      Department
                    </p>
                    <div className="row">
                      <FormikSelect
                        name="department_uid"
                        label="Department"
                        url="/departments"
                        containerClass="col-md-12 mb-3"
                        filters={{
                          page: 1,
                          page_size: 10,
                          paginated: true,
                        }}
                        mapOption={(item) => ({
                          value: item.uid,
                          label: `${item.name}`,
                          name: `${item.name}`,
                          code: `${item.code}`,
                        })}
                        placeholder="Search Departments..."
                        debounceMs={500}
                        minChars={3}
                        isReadOnly={false}
                      />
                    </div>

                    <div className="row">
                      <FormikSelect
                        name="level_uid"
                        label="Position/Designation (Optional)"
                        url="/internal-portal/positional-levels"
                        containerClass="col-md-12 mb-3"
                        filters={{
                          page: 1,
                          page_size: 10,
                          paginated: true,
                          is_active: true,
                        }}
                        mapOption={(item) => ({
                          value: item.uid,
                          label: `${item.name}${item.code ? ` (${item.code})` : ''}`,
                          name: `${item.name}`,
                          code: `${item.code || ''}`,
                        })}
                        placeholder="Search Position/Designation... (e.g., Executive Secretary, HEAD OF ICT) - Optional"
                        debounceMs={500}
                        minChars={0}
                        isReadOnly={false}
                        isRequired={false}
                      />
                      <small className="text-muted ms-3">
                        Select the user's job title or designation. If not selected, a default will be assigned.
                      </small>
                    </div>

                    <div className="row">
                      <div className="col mb-3">
                        <label
                          htmlFor="descriptionLarge"
                          className="form-label"
                        >
                          Description
                        </label>
                        <Field
                          as="textarea"
                          name="description"
                          id="descriptionLarge"
                          className="form-control"
                          rows="3"
                          placeholder="Enter Description"
                        />
                        <ErrorMessage
                          name="description"
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
                        {isSubmitting ? "Assigning..." : "Assign Position"}
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

export default PositionsModal;
