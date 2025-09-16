import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { AccountContext } from "../../utils/context";
import { useSelector } from "react-redux";
import { assignDelegatedUser, getUsers } from "./Queries";
import Select from "react-select";
import showToast from "../../helpers/ToastHelper";
import { userTypes } from "../../redux/types/authentication";
import { useDispatch } from "react-redux";
import FormikSelect from "../../components/ui-templates/form-components/FormikSelect";

const DelegationModal = () => {
  const {
    selectedUser,
    loadDelagationModal,
    isActingChange,
    setIsActingChange,
    handleFetchData,
  } = useContext(AccountContext);

  const [errors, setOtherError] = useState({});
  const user = useSelector((state) => state.userReducer?.data);

  const [loadingUser, setLoadingUser] = useState(false);
  const [errorUser, setErrorUser] = useState(false);
  const [users, setUsers] = useState([]);
  const dispatch = useDispatch();

  const initialValues = {
    delegated_user: "",
    comment: "",
  };

  const validationSchema = Yup.object().shape({
    delegated_user: Yup.string().required("Delegated User is required"),
  });

  const handleClose = () => {
    const modalElement = document.getElementById("delegatedUserModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
  };

  const fetchUsers = async (searchValue = "") => {
    setLoadingUser(true);
    try {
      const result = await getUsers({
        search: searchValue,
        pagination: {
          page: 1,
          page_size: 10,
          paginated: true,
          exception: {
            user: "mimi",
            age: "sfdfd",
          },
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
      const result = await assignDelegatedUser(values);

      if (result.status === 200 || result.status === 8000) {
        showToast("Data Saved Successfuly", "success", "Complete");
        dispatch({
          type: userTypes.USER_UPDATE,
          payload: {
            user: result.data,
          },
        });

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
      console.log("Error submitting form:", error);
      showToast("Something went wrong while saving", "error", "Failed");
      handleClose();
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch ApprovalRequests on initial load
  useEffect(() => {
    fetchUsers();
  }, [loadDelagationModal]);

  return (
    <>
      <div
        className="modal modal-slide-in"
        id="delegatedUserModal"
        tabIndex="-1"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel3">
                Assign Delegated User
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
                      <div className="col-sm-12 col-md-12 text-justify mb-4">
                        <p className="mb-1 fw-bold">
                          <i className="bx bx-info-circle me-2"></i>
                          Description
                        </p>
                        <p className="mb-0">
                          In this section, you can assign responsibility to
                          another employee when you are on leave or have
                          received permission from your supervisor. You may
                          remove the assignment at any time.
                        </p>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col mb-3">
                        <label
                          htmlFor="DelegatedUserDiv"
                          className="form-label"
                        >
                          Delegated User
                        </label>

                        <FormikSelect
                          name="delegated_user"
                          label={
                            <>
                              <label
                                htmlFor="handlerLarge"
                                className="form-label"
                              >
                                Select Delegated User
                              </label>
                            </>
                          }
                          url={"/user/setup"}
                          isFullPath={true}
                          containerClass="col-md-8 mb-3"
                          filters={{
                            page: 1,
                            page_size: 10,
                            paginated: true,
                            excluded_user: user?.guid,
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
                        <ErrorMessage
                          name="delegated_user"
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
                      onClick={handleClose}
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
              )}
            </Formik>
          </div>
        </div>
      </div>
    </>
  );
};

export default DelegationModal;
