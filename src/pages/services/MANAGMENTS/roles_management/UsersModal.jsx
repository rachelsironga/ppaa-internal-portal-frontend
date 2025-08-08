import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useSelector } from "react-redux";
import Select from "react-select";
import showToast from "../../../../helpers/ToastHelper";
import { createUpdateData, fetchData } from "../../../../utils/GlobalQueries";
import { RolesManagementContext } from "../../../../utils/context";

const UsersModal = () => {
  const { selectedObj, setSelectedObj, tableRefresh, setTableRefresh } =
    useContext(RolesManagementContext);
  const [errors, setOtherError] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [users, setUsers] = useState([]);

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

  const fetchUsers = async (searchValue = "") => {
    if (!selectedObj) {
      showToast("Unable to Identify the current Role", "info", "Info");
      return;
    }

    setLoadingUser(true);
    try {
      const result = await fetchData({
        url: "/system/roles-users",
        filter: {
          page: 1,
          page_size: 10,
          paginated: true,
          search: searchValue,
          excluded_role: selectedObj?.id,
        },
      });
      if (result.status === 200 || result.status === 8000) {
        setUsers(result.data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      setUsers([]);
    } finally {
      setLoadingUser(false);
    }
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

  // Fetch ApprovalRequests on initial load
  useEffect(() => {
    if (selectedObj) {
      fetchUsers();
    }
  }, [selectedObj]);

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
                      <div className="col mb-3">
                        <label
                          htmlFor="DelegatedUserDiv"
                          className="form-label"
                        >
                          Employees
                        </label>
                        <Select
                          isLoading={loadingUser}
                          className="select2-selection fetched-select2"
                          name="permitted_user"
                          onChange={(e) => {
                            if (e === null || e.value === "") {
                              setFieldValue("permitted_user", "");
                            } else {
                              setFieldValue("permitted_user", e.value);
                            }
                          }}
                          onInputChange={(e) => {
                            fetchUsers(e);
                          }}
                          options={users?.map((item) => ({
                            value: item.guid,
                            label: `${item.first_name} ${item.middle_name} ${item.last_name}`,
                            email: item.email,
                            photo: item.photo,
                            first_name: item.first_name,
                            middle_name: item.middle_name,
                            last_name: item.last_name,
                          }))}
                          styles={{
                            menu: (base) => ({
                              ...base,
                              position: "absolute",
                              zIndex: 9999,
                            }),
                          }}
                          value={
                            users
                              ?.map((item) => ({
                                value: item.guid,
                                label: `${item.first_name} ${item.middle_name} ${item.last_name}`,
                                email: item.email,
                                photo: item.photo,
                                first_name: item.first_name,
                                middle_name: item.middle_name,
                                last_name: item.last_name,
                              }))
                              .find(
                                (option) =>
                                  option.value === values.permitted_user
                              ) || null
                          }
                          isClearable
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
                        />
                        <ErrorMessage
                          name="permitted_user"
                          component="div"
                          className="text-danger"
                        />
                      </div>
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
