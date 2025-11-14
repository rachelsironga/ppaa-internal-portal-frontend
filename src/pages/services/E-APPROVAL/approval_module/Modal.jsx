import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../../../helpers/ToastHelper";
import { ApprovalModuleContext } from "../../../../utils/context";
import { createUpdateItem } from "./Queries";
import FormikSelect from "../../../../components/ui-templates/form-components/FormikSelect";

const PermissionsModal = () => {
  const { selectedObj, setTableRefresh } = useContext(ApprovalModuleContext);

  const [errors, setOtherError] = useState({});
  const initialValues = {
    name: selectedObj?.name || "",
    code: selectedObj?.code || "",
    directory_uid: selectedObj?.directory?.uid || "",
    description: selectedObj?.description || "",
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Name is required"),
    code: Yup.string().required("Code is required"),
    directory_uid: Yup.string().required("Directory is required"),
    description: Yup.string().required("Description is required"),
  });

  const handleSubmit = async (
    values,
    { setSubmitting, resetForm, setErrors }
  ) => {
    try {
      if (selectedObj) {
        values.uid = selectedObj.uid;
      }

      const result = await createUpdateItem(values);

      if (result.status === 200 || result.status === 8000) {
        showToast("Data Saved Successfuly", "success", "Complete");
        setTableRefresh((prev) => prev + 1);
        handleClose();
        resetForm();
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
    const modalElement = document.getElementById("viewCreateModuleDataModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
  };

  return (
    <div
      className="modal modal-slide-in"
      id="viewCreateModuleDataModal"
      tabIndex="-1"
      aria-hidden="true"
      data-bs-backdrop="static"
      data-bs-keyboard="false"
    >
      <div className="modal-dialog modal-md" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="exampleModalLabel3">
              {selectedObj === null ? "Create New" : "View / Update"} Approval
              Module{" "}
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
                    <FormikSelect
                      name="code"
                      label={
                        <>
                          Code{" "}
                          <small className="text-info">
                            * ask the code from System Administrator
                          </small>
                        </>
                      }
                      containerClass="col-md-12 mb-3"
                      staticOptions={[
                        {
                          value: "INTERNET_EMAIL_ACCESS",
                          label: "INTERNET EMAIL ACCESS",
                        },
                        { value: "JEEVA_ACCESS", label: "JEEVA ACCESS" },
                        { value: "EDMS_ACCESS", label: "EDMS ACCESS" },
                        { value: "WELSOFT_ACCESS", label: "WELSOFT ACCESS" },
                      ]}
                      placeholder="Search Modules Code..."
                      debounceMs={500}
                      minChars={2}
                      isReadOnly={false}
                    />
                  </div>
                  <div className="row">
                    <FormikSelect
                      name="directory_uid"
                      label="Directory"
                      url="/directory"
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
                      placeholder="Search Directory ..."
                      debounceMs={500}
                      minChars={3}
                      isReadOnly={false}
                    />
                  </div>
                  <div className="row">
                    <div className="col mb-3">
                      <label htmlFor="descriptionLarge" className="form-label">
                        Description
                      </label>
                      <Field
                        as="textarea"
                        name="description"
                        id="descriptionLarge"
                        className="form-control"
                        rows="5"
                        placeholder="Enter Description"
                        style={{
                          maxHeight: "150px",
                          overflowY: "auto",
                        }}
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
  );
};

export default PermissionsModal;
