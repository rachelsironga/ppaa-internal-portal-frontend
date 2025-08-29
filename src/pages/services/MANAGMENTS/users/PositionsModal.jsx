import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../../../helpers/ToastHelper";
import { UsersContext } from "../../../../utils/context";
import Select from "react-select";
import { getDepartments } from "../../MANAGMENTS/department/Queries";
import { getDirectories } from "../../MANAGMENTS/directory/Queries";
import { getPositionalLevels } from "../../E-APPROVAL/positional_level/Queries";
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

  const [loadingDirectories, setLoadingDirectories] = useState(true);
  const [levels, setLevels] = useState(null);

  const initialValues = {
    user_uid: selectedObj?.guid || "",
    level_uid: selectedObj?.position?.level_uid || "",
    department_uid: selectedObj?.position?.department_uid || "",
    directory_uid: selectedObj?.position?.directory_uid || "",
    description: selectedObj?.position?.description || "",
    is_active: true,
  };

  const validationSchema = Yup.object().shape({
    level_uid: Yup.string().required("Position is required"),
    directory_uid: Yup.string().required("Directory is required"),
  });

  const handleSubmit = async (
    values,
    { setSubmitting, resetForm, setErrors }
  ) => {
    try {
      if (selectedObj) {
        values.user_uid = selectedObj?.guid;
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
                      Position
                    </p>
                    <div className="row">
                      <FormikSelect
                        name="level_uid"
                        label="Positions"
                        url="/positional-level"
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
                        placeholder="Search Levels ..."
                        debounceMs={500}
                        minChars={3}
                        isReadOnly={false}
                      />
                    </div>

                    <div className="row">
                      <FormikSelect
                        name="directory_uid"
                        label="Directory"
                        url="/directory"
                        containerClass="col-md-6 mb-3"
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
                        placeholder="Search Directory ..."
                        debounceMs={500}
                        minChars={3}
                        isReadOnly={false}
                      />
                      <FormikSelect
                        name="department_uid"
                        label="Departments"
                        url="/departments"
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
