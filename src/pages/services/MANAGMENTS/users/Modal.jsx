import React, { useContext, useEffect, useState, useRef } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Swal from "sweetalert2";
import { createUpdateUser, getUsers } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";
import { UsersContext } from "../../../../utils/context";
import FormWizard from "react-form-wizard-component";
import "react-form-wizard-component/dist/style.css";

export const UserModal = ({ loadOnlyModal = false }) => {
  const { selectedObj, setSelectedObj, tableRefresh, setTableRefresh } =
    useContext(UsersContext);

  //for Wizard tab validation & Control
  const [errors, setOtherError] = useState({});
  const [tabsError, setTabsError] = useState([false, false, false]);
  const [isValidTab, setSInValidTab] = useState([false, false, false]);
  const [isFirstTabChange, setIsFirstTabChange] = useState(true);
  const [tabIndex, setTabIndex] = useState(0); // current tab index

  const initialValues = {
    pf_number: selectedObj?.pf_number || "",
    first_name: selectedObj?.first_name || "",
    middle_name: selectedObj?.middle_name || "",
    last_name: selectedObj?.last_name || "",
    dob: selectedObj?.dob || "",
    sex: selectedObj?.sex || "",

    email: selectedObj?.email || "",
    check_number: selectedObj?.check_number || "",

    phone_number: selectedObj?.phone_number || "",
    alternative_contact: selectedObj?.alternative_contact || "",
  };

  const validationSchema = Yup.object().shape({
    pf_number: Yup.string().required("pf number is required"),
    first_name: Yup.string().required("first name is required"),
    middle_name: Yup.string().required("middle name is required"),
    last_name: Yup.string().required("last name is required"),
    dob: Yup.date()
      .required("Date of birth is required")
      .typeError("Please enter a valid date of birth"),
    sex: Yup.string().required("Sex is required"),
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),
    phone_number: Yup.string()
      .required("Phone number is required")
      .matches(/^[0-9]+$/, "Phone number must be digits"),
  });

  //for Submit modal
  const handleSubmit = async (
    values,
    { setSubmitting, resetForm, setErrors }
  ) => {
    try {
      if (selectedObj) {
        values.uid = selectedObj.uid;
      }
      setSubmitting(true);
      const result = await createUpdateUser(values);

      if (result.status === 200 || result.status === 8000) {
        showToast("Data Saved Successfuly", "success", "Complete");
        handleClose();
        resetForm();
        setTableRefresh((prev) => prev + 1);
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
      handleClose(); // Close the modal after submission
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  //for closing modal
  const handleClose = () => {
    console.log("Modal closed");
    setSelectedObj(null);
    setIsFirstTabChange(true);
    const modalElement = document.getElementById("viewCreateUserModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
  };

  //for Wizard tab validation & Control
  const validateTab = async (values, setFieldError, setTouched) => {
    try {
      if (tabIndex === 1) {
        await validationSchema.validateAt("pf_number", values);
        await validationSchema.validateAt("dob", values);
        await validationSchema.validateAt("first_name", values);
        await validationSchema.validateAt("middle_name", values);
        await validationSchema.validateAt("last_name", values);
        await validationSchema.validateAt("sex", values);
      }
      if (tabIndex === 2) {
        await validationSchema.validateAt("email", values);
      }
      if (tabIndex === 3) {
        await validationSchema.validateAt("phone_number", values);
      }

      // Add more tab-specific validation as needed
      return true;
    } catch (err) {
      if (err.path && err.message) {
        setTouched({ [err.path]: true }, false);
        setFieldError(err.path, err.message);
      }
      return false;
    }
  };
  //for Wizard tab validation & Control
  const tabChanged = async (
    { handleNext },
    values,
    setSubmitting,
    resetForm,
    setErrors,
    setFieldError,
    setTouched,
    lastTab
  ) => {
    if (isFirstTabChange) {
      setIsFirstTabChange(false);
    }

    const isValid = await validateTab(values, setFieldError, setTouched);
    if (isValid) {
      setSInValidTab((prev) => {
        const updated = [...prev];
        updated[tabIndex - 1] = true;
        return updated;
      });
      setTabsError((prev) => {
        const updated = [...prev];
        updated[tabIndex - 1] = false;
        return updated;
      });
      if (tabIndex === lastTab) {
        handleSubmit(values, {
          setSubmitting,
          resetForm,
          setErrors,
          setTouched,
        });
        return false;
      } else {
        handleNext();
        return true;
      }
    } else {
      setSInValidTab((prev) => {
        const updated = [...prev];
        updated[tabIndex - 1] = false;
        return updated;
      });
      setTabsError((prev) => {
        const updated = [...prev];
        updated[tabIndex - 1] = true;
        return updated;
      });
      return false;
    }
  };

  return (
    <>
      {/* {!loadOnlyModal && (
        <button
          aria-label="Click me"
          type="button"
          className="btn btn-primary ms-auto btn-sm  animate__animated animate__fadeInRight animate__slow"
          data-bs-toggle="modal"
          data-bs-target="#viewCreateUserModal"
        >
          <i className="bx bx-edit-alt me-1"></i> Add User
        </button>
      )} */}

      <div
        className="modal modal-slide-in"
        id="viewCreateUserModal"
        tabIndex="-1"
        data-bs-backdrop="static"
        data-bs-keyboard="false"
      >
        <div className="modal-dialog modal-lg" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel3">
                Create New User{" "}
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
                isSubmitting,
                setSubmitting,
                values,
                setFieldValue,
                resetForm,
                setErrors,
                setFieldError,
                setTouched,
              }) => (
                <Form>
                  <FormWizard
                    shape="circle"
                    color="#696cff"
                    stepSize="xs"
                    onTabChange={({ prevIndex, nextIndex }) => {
                      setTabIndex(nextIndex);
                    }}
                    backButtonTemplate={(handlePrevious) => (
                      <button
                        type={"button"}
                        className="base-button btn btn-sm btn-primary float-right"
                        style={{ width: "100px", alignItems: "right" }}
                        onClick={handlePrevious}
                      >
                        <i className="bx bx-left-arrow-alt"></i> Back
                      </button>
                    )}
                    nextButtonTemplate={(handleNext) => (
                      <button
                        type={"button"}
                        className="base-button btn btn-sm btn-primary"
                        style={{ width: "100px", marginLeft: "80%" }}
                        onClick={async () =>
                          await tabChanged(
                            { handleNext },
                            values,
                            setSubmitting,
                            resetForm,
                            setErrors,
                            setFieldError,
                            setTouched,
                            3 // last tab index
                          )
                        }
                      >
                        Next <i className="bx bx-right-arrow-alt"></i>
                      </button>
                    )}
                    finishButtonTemplate={(handleNext) => (
                      <button
                        type={"button"}
                        className="base-button btn btn-sm btn-primary"
                        style={{ width: "150px", marginLeft: "70%" }}
                        disabled={isSubmitting}
                        onClick={async () =>
                          await tabChanged(
                            { handleNext },
                            values,
                            setSubmitting,
                            resetForm,
                            setErrors,
                            setFieldError,
                            setTouched,
                            3 // last tab index
                          )
                        }
                      >
                        {isSubmitting ? (
                          <>
                            <i className="bx bx-loader-alt bx-spin"></i>&nbsp;
                            Saving...
                          </>
                        ) : (
                          <>
                            <i className="bx bx-save"></i> &nbsp;Save User
                          </>
                        )}
                      </button>
                    )}
                  >
                    <FormWizard.TabContent
                      title="Personal details"
                      icon="ti-user"
                      showErrorOnTab={tabsError[0]}
                    >
                      {/* Tab 1 content */}
                      <div className="row text-start">
                        <div className="col-md-6 mb-3">
                          <label htmlFor="pfNumberLarge" className="form-label">
                            PF-Number
                          </label>
                          <Field
                            type="text"
                            name="pf_number"
                            id="pfNumberLarge"
                            className="form-control"
                            placeholder="Enter PF-Number"
                          />
                          <ErrorMessage
                            name="pf_number"
                            component="div"
                            className="text-danger"
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label htmlFor="dobLarge" className="form-label">
                            Date Of Birth
                          </label>
                          <Field
                            type="date"
                            name="dob"
                            id="dobLarge"
                            className="form-control"
                            placeholder="Enter Date of Birth"
                            min={
                              new Date(
                                new Date().setFullYear(
                                  new Date().getFullYear() - 60
                                )
                              )
                                .toISOString()
                                .split("T")[0]
                            } // optional: 60 years ago
                            max={
                              new Date(
                                new Date().setFullYear(
                                  new Date().getFullYear() - 17
                                )
                              )
                                .toISOString()
                                .split("T")[0]
                            } // 17 years ago from today
                          />{" "}
                          <ErrorMessage
                            name="dob"
                            component="div"
                            className="text-danger"
                          />
                        </div>
                      </div>
                      <div className="row text-start">
                        <div className="col-md-4 mb-3">
                          <label
                            htmlFor="firstNameLarge"
                            className="form-label"
                          >
                            First Name
                          </label>
                          <Field
                            type="text"
                            name="first_name"
                            id="firstNameLarge"
                            className="form-control"
                            placeholder="Enter First Name"
                          />
                          <ErrorMessage
                            name="first_name"
                            component="div"
                            className="text-danger"
                          />
                        </div>
                        <div className="col-md-4 mb-3">
                          <label
                            htmlFor="MiddleNameLarge"
                            className="form-label"
                          >
                            Middle Name
                          </label>
                          <Field
                            type="text"
                            name="middle_name"
                            id="MiddleNameLarge"
                            className="form-control"
                            placeholder="Enter Middle Name"
                          />
                          <ErrorMessage
                            name="middle_name"
                            component="div"
                            className="text-danger"
                          />
                        </div>
                        <div className="col-md-4 mb-3">
                          <label htmlFor="LastNameLarge" className="form-label">
                            Last Name
                          </label>
                          <Field
                            type="text"
                            name="last_name"
                            id="LastNameLarge"
                            className="form-control"
                            placeholder="Enter Last Name"
                          />
                          <ErrorMessage
                            name="last_name"
                            component="div"
                            className="text-danger"
                          />
                        </div>
                      </div>
                      <div className="row text-start">
                        <div className="col-md-6 mb-3">
                          <label className="form-label d-block">Gender</label>
                          <div className="form-check form-check-inline">
                            <Field
                              type="radio"
                              name="sex"
                              value="MALE"
                              id="genderMale"
                              className="form-check-input"
                            />
                            <label
                              className="form-check-label"
                              htmlFor="genderMale"
                            >
                              Male
                            </label>
                          </div>
                          <div className="form-check form-check-inline">
                            <Field
                              type="radio"
                              name="sex"
                              value="FEMALE"
                              id="genderFemale"
                              className="form-check-input"
                            />
                            <label
                              className="form-check-label"
                              htmlFor="genderFemale"
                            >
                              Female
                            </label>
                          </div>
                          <ErrorMessage
                            name="sex"
                            component="div"
                            className="text-danger"
                          />
                        </div>
                      </div>
                    </FormWizard.TabContent>
                    <FormWizard.TabContent
                      title="Contact Info"
                      icon="ti-world"
                      isValid={isValidTab[0]}
                      showErrorOnTab={tabsError[1]}
                    >
                      {/* Tab 2 content */}
                      <div className="row text-start">
                        <div className="col mb-3">
                          <label htmlFor="dobLarge" className="form-label">
                            Email
                          </label>
                          <Field
                            type="email"
                            name="email"
                            id="emailLarge"
                            className="form-control"
                            placeholder="Enter Email Address"
                          />
                          <ErrorMessage
                            name="email"
                            component="div"
                            className="text-danger"
                          />
                        </div>
                      </div>
                      <div className="row text-start">
                        <div className="col mb-3">
                          <label
                            htmlFor="checkNumberLarge"
                            className="form-label"
                          >
                            Check Number
                          </label>
                          <Field
                            type="text"
                            name="check_number"
                            id="checkNumberLarge"
                            className="form-control"
                            placeholder="Enter Check Number"
                          />
                          <ErrorMessage
                            name="check_number"
                            component="div"
                            className="text-danger"
                          />
                        </div>
                      </div>
                    </FormWizard.TabContent>
                    <FormWizard.TabContent
                      title="Submition"
                      icon="ti-check"
                      isValid={isValidTab[1]}
                      showErrorOnTab={tabsError[2]}
                    >
                      {/* Tab 3 content */}
                      <div className="row text-start">
                        <div className="col-md-6 mb-3">
                          <label
                            htmlFor="phoneNumberLarge"
                            className="form-label"
                          >
                            Phone Number
                          </label>
                          <Field
                            type="text"
                            name="phone_number"
                            id="phoneNumberLarge"
                            className="form-control"
                            placeholder="Enter Alt Phone Number"
                          />
                          <ErrorMessage
                            name="phone_number"
                            component="div"
                            className="text-danger"
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label
                            htmlFor="AltPhoneNumberLarge"
                            className="form-label"
                          >
                            Alt Phone Number
                          </label>
                          <Field
                            type="text"
                            name="alternative_contact"
                            id="AltPhoneNumberLarge"
                            className="form-control"
                            placeholder="Enter Alt Phone Number"
                          />
                          <ErrorMessage
                            name="alternative_contact"
                            component="div"
                            className="text-danger"
                          />
                        </div>
                      </div>
                    </FormWizard.TabContent>
                  </FormWizard>
                  {/* add style */}
                  <style>{`
                                        @import url("https://cdn.jsdelivr.net/gh/lykmapipo/themify-icons@0.1.2/css/themify-icons.css");
                                        .form-control {
                                            height: 36px;
                                            padding: 0.375rem 0.75rem;
                                            font-size: 1rem;
                                            font-weight: 400;
                                            line-height: 1.5;
                                            color: #495057;
                                            border: 1px solid #ced4da;
                                            border-radius: 0.25rem;
                                        }
                                        .wizard-card-footer {
                                            display: flex;
                                            justify-content: space-between;
                                            align-items: center;
                                            padding: 2rem 2.5rem;
                                            width: 100%;
                                        }
                                    `}</style>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </>
  );
};
