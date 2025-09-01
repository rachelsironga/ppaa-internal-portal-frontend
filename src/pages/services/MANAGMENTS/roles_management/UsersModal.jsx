import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../../../helpers/ToastHelper";
import { createUpdateData } from "../../../../utils/GlobalQueries";
import { RolesManagementContext } from "../../../../utils/context";
import FormikSelect from "../../../../components/ui-templates/form-components/FormikSelect";

const UsersModal = () => {
  const { selectedObj, setSelectedObj, tableRefresh, setTableRefresh } =
    useContext(RolesManagementContext);

  const initialValues = {
    permitted_user: "",
    selected_role: selectedObj?.id,
  };

  const validationSchema = Yup.object().shape({
    permitted_user: Yup.string().required("User is required"),
  });

  const handleClose = () => {
    const modalElement = document.getElementById("permiteUserModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
  };

  const handleSubmit = async (
    values,
    { setSubmitting, resetForm, setErrors }
  ) => {
    try {
      const result = await createUpdateData({
        url: "/system/roles-assign-users",
        formData: values,
      });

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
  return (
    <>
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
          <div
            className="modal modal-slide-in"
            id="permiteUserModal"
            tabIndex="-1"
            aria-hidden="true"
          >
            <div className="modal-dialog modal-lg" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title" id="exampleModalLabel3">
                    Assign Role to System User
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setFieldValue("permitted_user", "");
                      handleClose();
                    }}
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  ></button>
                </div>
                <Form>
                  <div className="modal-body">
                    <div className="row">
                      <div className="col-sm-12 col-md-12 text-justify mb-4">
                        <p className="mb-1 fw-bold">
                          <i className="bx bx-info-circle me-2"></i>
                          Description
                        </p>
                        <p className="mb-0">
                          In this section, you can assign Role to Selected
                          employee. You may remove the assignment at any time.
                        </p>
                      </div>
                    </div>
                    <div className="row">
                      <FormikSelect
                        name="permitted_user"
                        label="Employees"
                        url={"/system/roles-users"}
                        containerClass="col-md-12 mb-3"
                        filters={{
                          page: 1,
                          page_size: 10,
                          paginated: true,
                          excluded_role: selectedObj?.id,
                        }}
                        mapOption={(item) => ({
                          value: item.guid,
                          label: `${item.first_name} ${item.middle_name} ${item.last_name}`,
                          first_name: `${item.first_name}`,
                          middle_name: `${item.middle_name}`,
                          last_name: `${item.last_name}`,
                          email: `${item.email}`,
                          photo: item.photo,
                          guid: item.guid,
                          full_name: `${item.first_name} ${item.middle_name} ${item.last_name}`,
                        })}
                        formatOptionLabel={(user) => (
                          <div className="d-flex justify-content-start align-items-center user-name">
                            <div className="avatar-wrapper">
                              <div className="avatar avatar-sm me-4">
                                <img
                                  src={
                                    user.photo && user.photo !== ""
                                      ? user.photo
                                      : "../../assets/img/avatars/1.png"
                                  }
                                  alt="Avatar"
                                  className="rounded-circle"
                                  style={{ width: "32px", height: "32px" }}
                                />
                              </div>
                            </div>
                            <div className="d-flex flex-column">
                              <span className="text-heading text-truncate">
                                <span className="fw-medium">
                                  {user.first_name} {user.middle_name}{" "}
                                  {user.last_name}
                                </span>
                              </span>
                              <small className="text-primary">
                                {user.email && user.email !== ""
                                  ? user.email
                                  : "- - -"}
                              </small>
                            </div>
                          </div>
                        )}
                        placeholder="Search Users ..."
                        debounceMs={500}
                        minChars={3}
                        isReadOnly={false}
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => {
                        setFieldValue("permitted_user", "");
                        handleClose();
                      }}
                      style={{ marginRight: "20px", minWidth: "150px" }}
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-sm btn-info"
                      style={{ marginRight: "20px", minWidth: "150px" }}
                    >
                      Save
                    </button>
                  </div>
                </Form>
              </div>
            </div>
          </div>
        )}
      </Formik>
    </>
  );
};

export default UsersModal;
