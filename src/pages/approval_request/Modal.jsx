import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../helpers/ToastHelper";
import { createUpdateApprovalRequest } from "./Queries";
import { ApprovalRequestsContext } from "../../utils/context";
import requestTypes from "../../data/requestTypes.json";
import { getDepartments } from "../department/Queries";
import { getPositionalLevels } from "../positional_level/Queries";
import FormWizard from "react-form-wizard-component";
import "react-form-wizard-component/dist/style.css";
import Select, { components } from "react-select";
import { getModules } from "../approval_module/Queries";
import PDFViewer from "../../components/common/PDFViewer";
import jeevaData from "../../data/jeevaData.json";
import AccordionContainer from "../../components/accordion/AccordionContainer";

const ApprovalRequestModal = () => {
  const {
    handleFetchData,
    selectApprovalRequests,
    setSelectedApprovalRequest,
    isModalOpen,
    setIsModalOpen,
  } = useContext(ApprovalRequestsContext);
  const [errors, setOtherError] = useState({});

  const [activeChip, setActiveChip] = useState(null);
  const [activeChipLabel, setActiveChipLabel] = useState(null);

  const [selectedLeft, setSelectedLeft] = useState([]);
  const [selectedRight, setSelectedRight] = useState([]);
  const [leftOptions, setLeftOptions] = useState([]);
  const [rightOptions, setRightOptions] = useState([
    { label: "Modules", options: [] },
    { label: "Permissions", options: [] },
  ]);

  // Inside Select component:
  const CustomMultiValue = (props) => {
    const isActive = activeChip && props.data.value === activeChip;
    return (
      <div
        style={{
          background: isActive ? "#696CFF" : "#e2e3e5",
          borderRadius: "2px",
          margin: "3px",
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          padding: "1px 3px",
        }}
        onClick={() => {
          setActiveChip(props.data.value);
          setActiveChipLabel(props.data.label)
          // window.alert(`You clicked: ${props.data.label}`);
        }}
      >
        <components.MultiValue {...props} />
      </div>
    );
  };

  // Helpers
  const removeFromGrouped = (grouped, items) =>
    grouped.map(group => ({
      ...group,
      options: group.options.filter(
        opt => !items.some(sel => sel.value === opt.value)
      ),
    }));

  const addToGrouped = (grouped, items) =>
    grouped.map(group => ({
      ...group,
      options: [
        ...group.options,
        ...items.filter(
          item =>
            item.group === group.label &&
            !group.options.some(opt => opt.value === item.value)
        ),
      ],
    }));

  // Assign: left -> right
  const handleAssign = () => {
    // Get selected with group info
    const selectedWithGroup = [];
    leftOptions.forEach(group => {
      group.options.forEach(opt => {
        if (selectedLeft.some(sel => sel.value === opt.value)) {
          selectedWithGroup.push({ ...opt, group: group.label });
        }
      });
    });
    setLeftOptions(removeFromGrouped(leftOptions, selectedLeft));
    setSelectedLeft([]);
    setRightOptions(addToGrouped(rightOptions, selectedWithGroup));
  };

  // Remove: right -> left
  const handleRemove = () => {
    const selectedWithGroup = [];
    rightOptions.forEach(group => {
      group.options.forEach(opt => {
        if (selectedRight.some(sel => sel.value === opt.value)) {
          selectedWithGroup.push({ ...opt, group: group.label });
        }
      });
    });
    setRightOptions(removeFromGrouped(rightOptions, selectedRight));
    setSelectedRight([]);
    setLeftOptions(addToGrouped(leftOptions, selectedWithGroup));
  };


  const [loadingModules, setLoadingModules] = useState(false);
  const [modules, setModules] = useState([]);

  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [departments, setDepartments] = useState([]);

  //for Wizard tab validation & Control
  const [tabsError, setTabsError] = useState([false, false, false]);
  const [isValidTab, setSInValidTab] = useState([false, false, false]);
  const [isFirstTabChange, setIsFirstTabChange] = useState(true);
  const [tabIndex, setTabIndex] = useState(0); // current tab index


  const initialValues = {
    title: selectApprovalRequests?.title || "",
    type: selectApprovalRequests?.type || "",
    module_uid: selectApprovalRequests?.module_uid || "",
    department_uid: selectApprovalRequests?.department_uid || "",
    request_data: {
      purpose: selectApprovalRequests?.request_data?.purpose || "",
      start_date: selectApprovalRequests?.request_data?.start_date || "",
      end_date: selectApprovalRequests?.request_data?.end_date || "",
      expire_at: selectApprovalRequests?.request_data?.expire_at || "",
      grants: selectApprovalRequests?.request_data?.grants || [],
      revork: selectApprovalRequests?.request_data?.revork || [],
      is_read_term: selectApprovalRequests?.request_data?.is_read_term || false,
    },
  };

  const validationSchema = Yup.object().shape({
    title: Yup.string().required("Title is required"),
    type: Yup.string().required("Type is required"),
    module_uid: Yup.string().required("Approval Flow is required"),
    department_uid: Yup.string().required("Department is required"),
    request_data: Yup.object().shape({
      purpose: Yup.string().required("Purpose is required"),
      start_date: Yup.date().required("Access Start Date is required").typeError("Please enter a valid date"),
      end_date: Yup.date().required("Access End Date is required").typeError("Please enter a valid date"),
      expire_at: Yup.date().required("Expire At is required").typeError("Please enter a valid date"),
      grants: Yup.array().min(1, "At least one grant is required"),
      revork: Yup.array().min(0),
      is_read_term: Yup.boolean()
        .oneOf([true], "You must agree to the terms and conditions")
        .required("Read term is required")
    }),
  });

  const handleSubmit = async (
    values,
    { setSubmitting, resetForm, setErrors }
  ) => {
    try {
      if (selectApprovalRequests) {
        values.uid = selectApprovalRequests.uid;
      }
      setSubmitting(true);
      const result = await createUpdateApprovalRequest(values);

      if (result.status === 200 || result.status === 8000) {
        showToast("Data Saved Successfuly", "success", "Complete");
        handleClose();
        resetForm();
        handleFetchData();
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
      handleClose(); // Close the modal after submission
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedApprovalRequest(null);
    setIsFirstTabChange(true);
    setTabsError([false, false, false]);
    setSInValidTab([false, false, false]);
    setTabIndex(0);
    setIsModalOpen(false);
    const modalElement = document.getElementById("viewCreateRequestModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();

  };

  const handleFetchModule = async (searchValue = "") => {
    setLoadingModules(true);
    try {
      const result = await getModules({
        search: searchValue,
        pagination: {
          page: 1,
          page_size: 10,
          paginated: true,
        },
      });
      if (result.status === 200 || result.status === 8000) {
        setModules(result.data);
      } else {
        setModules(null);
      }
    } catch (err) {
      setModules(null);
    } finally {
      setLoadingModules(false);
    }
  };

  const fetchDepartments = async (searchValue = "") => {
    setLoadingDepartments(true);
    try {
      const result = await getDepartments({
        search: searchValue,
        pagination: {
          page: 1,
          page_size: 10,
          paginated: true,
        },
      });
      if (result.status === 200 || result.status === 8000) {
        setDepartments(result.data);
      } else {
        setDepartments(null);
      }
    } catch (err) {
      setDepartments(null);
    } finally {
      setLoadingDepartments(false);
    }
  };

  // Map Modules and Permissions to grouped options
  const groupedOptions = [
    {
      label: "Modules",
      options: jeevaData.Modules.map((mod) => ({
        value: mod.codename,
        label: mod.name,
      })),
    },
    // {
    //   label: "Permissions",
    //   options: jeevaData.Permissions.map((perm) => ({
    //     value: perm.codename,
    //     label: perm.name,
    //   })),
    // },
  ];

  //for Wizard tab validation & Control
  const validateTab = async (values, setFieldError, setTouched) => {
    try {
      if (tabIndex === 1) {
        await validationSchema.validateAt("type", values);
        await validationSchema.validateAt("title", values);
        await validationSchema.validateAt("module_uid", values);
        await validationSchema.validateAt("department_uid", values);
      }
      if (tabIndex === 2) {
        if (values.type === "INTERNET_EMAIL_ACCESS") {
          // await validationSchema.validateAt("request_data.access_period", values);
          // await validationSchema.validateAt("request_data.grants", values);
          // await validationSchema.validateAt("request_data.revork", values);
        }

        if (values.type === "JEEVA_ACCESS") {
          // await validationSchema.validateAt("request_data.expire_at", values);
          await validationSchema.validateAt("request_data.grants", values);
        // await validationSchema.validateAt("request_data.revork", values);
        }
        // Add more tab-specific validation as needed
        // await validationSchema.validateAt("email", values);
      }
      if (tabIndex === 3) {
        if (values.type === "INTERNET_EMAIL_ACCESS") {
          await validationSchema.validateAt("request_data.is_read_term", values);
        }
      }

      // Add more tab-specific validation as needed
      return true;
    } catch (err) {
      console.log("Validation error path:", err);
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

  useEffect(() => {
    if (isModalOpen) {
      setLeftOptions(groupedOptions);
      setRightOptions([
        { label: "Modules", options: [] },
        { label: "Permissions", options: [] },
      ]);
      fetchDepartments();
      handleFetchModule();
    }
  }, [isModalOpen]); 

  return (
    <>
      <button
        aria-label="Click me"
        type="button"
        style={{ minWidth: "150px" }}
        className="btn btn-primary ms-auto btn-sm"
        data-bs-toggle="modal"
        data-bs-target="#viewCreateRequestModal"
        onClick={setIsModalOpen(true)}
      >
        <i className="bx bx-edit-alt me-1"></i> &nbsp; Create New Request
      </button>

      <div
        className="modal modal-slide-in"
        id="viewCreateRequestModal"
        tabIndex="-1"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-xl" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel3">
                Approval Request
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
                    inlineStep={true}
                    showProggressBar={true}
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
                            <i className="bx bx-save"></i> &nbsp;Submit Form
                          </>
                        )}
                      </button>
                    )}
                  >
                    <FormWizard.TabContent
                      title={
                        <div className="d-flex flex-column text-start">
                          <span className="fw-bold">General Detail</span>
                          <span className="small">
                            Add General Request Info
                          </span>
                        </div>
                      }
                      icon="ti-user"
                      showErrorOnTab={tabsError[0]}
                    >
                      {/* Tab 1 content */}
                      <div className="row text-start">
                        <div className="col-md-6  mb-3">
                          <label htmlFor="type" className="form-label">
                            Request Type
                          </label>
                          <Select
                            className="select2-selection fetched-select2"
                            onChange={(e) => {
                              if (e === null || e.value === "") {
                                setFieldValue("type", "");
                              } else {
                                setFieldValue("type", e.value);
                              }
                            }}
                            options={requestTypes.map((item) => ({
                              value: item.type,
                              label: `${item.title} - ${item.description}`,
                            }))}
                            styles={{
                              menu: (base) => ({
                                ...base,
                                position: "absolute",
                                zIndex: 9999,
                              }),
                            }}
                            value={
                              requestTypes
                                .map((item) => ({
                                  value: item.type,
                                  label: `${item.title} - ${item.description}`,
                                }))
                                .find(
                                  (option) => option.value === values.type
                                ) || null
                            }
                            isClearable
                          />
                          <Field type="hidden" name="type" id="typeHidden" />
                          <ErrorMessage
                            name="type"
                            component="div"
                            className="text-danger"
                          />
                        </div>

                        <div className="col-md-6 mb-3">
                          <label htmlFor="titleLarge" className="form-label">
                            Request Title
                          </label>
                          <Field
                            type="text"
                            name="title"
                            id="titleLarge"
                            className="form-control"
                            placeholder="Enter Request Title"
                          />
                          <ErrorMessage
                            name="title"
                            component="div"
                            className="text-danger"
                          />
                        </div>
                      </div>

                      <div className="row text-start">
                        <div className="col-md-6 mb-3">
                          <label
                            htmlFor="ModuleUidLarge"
                            className="form-label"
                          >
                            Approval Flow
                          </label>
                          <Select
                            isLoading={loadingModules}
                            className="select2-selection fetched-select2"
                            onChange={(e) => {
                              console.log("Selected Apploval Flow:", e);
                              if (e === null || e.value == "") {
                                setFieldValue("module_uid", "");
                              } else {
                                setFieldValue("module_uid", e.value);
                              }
                            }}
                            onInputChange={(e) => {
                              handleFetchModule(e);
                            }}
                            options={modules?.map((item) => ({
                              value: item.uid,
                              label: `${item.name} (${item.description})`,
                            }))}
                            styles={{
                              menu: (base) => ({
                                ...base,
                                position: "absolute",
                                zIndex: 9999,
                              }),
                            }}
                            value={
                              modules
                                ?.map((item) => ({
                                  value: item.uid,
                                  label: `${item.name}`,
                                }))
                                .find(
                                  (option) => option.value === values.module_uid
                                ) || null
                            }
                            isClearable
                          />
                          <Field
                            type="hidden"
                            name="module_uid"
                            id="ModuleUidLarge"
                          />
                          <ErrorMessage
                            name="module_uid"
                            component="div"
                            className="text-danger"
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label htmlFor="departmentUid" className="form-label">
                            Department
                          </label>
                          <Select
                            isLoading={loadingDepartments}
                            className="select2-selection fetched-select2"
                            onChange={(e) => {
                              console.log("Selected Department:", e);
                              if (e === null || e.value == "") {
                                setFieldValue("department_uid", "");
                              } else {
                                setFieldValue("department_uid", e.value);
                              }
                            }}
                            onInputChange={(e) => {
                              fetchDepartments(e);
                            }}
                            options={departments?.map((item) => ({
                              value: item.uid,
                              label: `${item.name} (${item.code})`,
                            }))}
                            styles={{
                              menu: (base) => ({
                                ...base,
                                position: "absolute",
                                zIndex: 9999,
                              }),
                            }}
                            value={
                              departments
                                ?.map((item) => ({
                                  value: item.uid,
                                  label: `${item.name} (${item.code})`,
                                }))
                                .find(
                                  (option) =>
                                    option.value === values.department_uid
                                ) || null
                            }
                            isClearable
                          />
                          <Field
                            type="hidden"
                            name="department_uid"
                            id="departmentUidLarge"
                          />
                          <ErrorMessage
                            name="department_uid"
                            component="div"
                            className="text-danger"
                          />
                        </div>
                      </div>
                    </FormWizard.TabContent>

                    <FormWizard.TabContent
                      title={
                        <div className="d-flex flex-column text-start">
                          <span className="fw-bold">Specific Detail</span>
                          <span className="small">Add Key Request Info</span>
                        </div>
                      }
                      icon="ti-world"
                      isValid={isValidTab[0]}
                      showErrorOnTab={tabsError[1]}
                    >
                      {/* Tab 2 content */}
                      {values.type === "INTERNET_EMAIL_ACCESS" && (
                        <>
                          <div className="row text-start">
                            <div className="col-md-6 mb-3">
                              <label
                                htmlFor="startDateLarge"
                                className="form-label"
                              >
                                Access From
                              </label>
                              <Field
                                type="date"
                                name="request_data.start_date"
                                id="startDateLarge"
                                className="form-control"
                                placeholder="Enter Access Start Date"
                                min={new Date().toISOString().split("T")[0]}
                                max={
                                  new Date(
                                    Date.now() + 10 * 24 * 60 * 60 * 1000
                                  ) // today + 10 days
                                    .toISOString()
                                    .split("T")[0]
                                }
                              />
                              <ErrorMessage
                                name="request_data.start_date"
                                component="div"
                                className="text-danger"
                              />
                            </div>
                            <div className="col-md-6 mb-3">
                              <label
                                htmlFor="endDateLarge"
                                className="form-label"
                              >
                                Access Until
                              </label>
                              <Field
                                type="date"
                                name="request_data.end_date"
                                id="endDateLarge"
                                className="form-control"
                                placeholder="Enter Access End Date"
                                min={
                                  values.start_date ||
                                  new Date().toISOString().split("T")[0]
                                } // ensure it's at least start_date
                              />
                              <ErrorMessage
                                name="request_data.end_date"
                                component="div"
                                className="text-danger"
                              />
                            </div>
                          </div>
                          <div className="row text-start">
                            <div className="row">
                              <div className="col mb-3">
                                <label
                                  htmlFor="purposeLarge"
                                  className="form-label"
                                >
                                  Description
                                </label>
                                <Field
                                  as="textarea"
                                  name="request_data.purpose"
                                  id="purposeLarge"
                                  className="form-control"
                                  style={{ height: "100px" }}
                                  rows="4"
                                  placeholder="Enter Description"
                                />
                                <ErrorMessage
                                  name="request_data.purpose"
                                  component="div"
                                  className="text-danger"
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                      {values.type == "JEEVA_ACCESS" && (
                        <>
                          <div className="ibox-content" >
                            <div className="ibox-content-body" >
                              <div className="row">
                                <div className="col-sm-11 text-start" >
                                  <AccordionContainer
                                    className="text-start"
                                    style={{ border: "0.1px solid #dfd9d7", borderRadius: "7px" }}
                                    items={[
                                      {
                                        id: 3,
                                        title: 'Instructions for Selecting JEEVA Modules and Permissions',
                                        active: true,

                                        content: `On the left, you will find all available JEEVA Modules and Permissions you can request. Please make your selections, then click the green button to confirm your choices. On the right, your selected items will appear. You may also remove selections at any time by clicking the red button. You can use the search feature at any time to make your selection process easier.`,
                                      },
                                    ]}
                                  />
                                </div>
                                <div className="col-sm-4" style={{ minWidth: "300px" }} >
                                  <Select
                                    isLoading={loadingDepartments}
                                    closeMenuOnSelect={false}
                                    expandOnFocus={false}
                                    isSearchable
                                    isMulti
                                    menuIsOpen={true}
                                    className="select2-selection fetched-select2"
                                    options={leftOptions}
                                    value={selectedLeft}
                                    onChange={(selected, action) => {
                                      console.log(action.option)
                                      setSelectedLeft(selected);
                                      // Remove highlight if chip is removed
                                      if (action && action.removedValue && activeChip === action.removedValue.value) {
                                        setActiveChip(null);
                                      }

                                      if (action && action.option) {
                                        console.log(action);
                                        console.log(action.option);

                                        setActiveChip(action.option.value);
                                        setActiveChipLabel(action.option.label)
                                      }

                                    }}
                                    onInputChange={(e) => {
                                      // fetchDepartments(e);
                                    }}
                                    label="Select New Grants"
                                    styles={{
                                      menu: (base) => ({
                                        ...base,
                                        position: "relative",
                                        zIndex: 9999,
                                        textAlign: "left",
                                        padding: "8px",
                                        minHeight: "350px"
                                      }),
                                      groupHeading: (base) => ({
                                        ...base,
                                        fontWeight: "bolder",
                                        fontSize: "0.85rem",
                                        color: "#6f6c6b",
                                      }),
                                      placeholder: (base) => ({
                                        ...base,
                                        textAlign: "left",
                                      }),
                                      option: (base) => ({
                                        ...base,
                                        paddingLeft: "20px",
                                      }),
                                    }}
                                    isClearable
                                    components={{ MultiValue: CustomMultiValue }}
                                  />
                                </div>

                                <div className="col-sm-4 text-start pe-3" style={{ minWidth: "300px", marginTop: "50px" }} >
                                  <button type="Button" className="btn btn-outline-info btn-secondary btn-sm btn-block">
                                    <span className="fw-medium" style={{ fontSize: "16px" }}>Permisions for {activeChipLabel}</span>
                                  </button>

                                  {/* <div className="demo-inline-spacing shadow text-center" style={{ minHeight: "300px", display: "flex", alignItems: "center", fontSize: "16px" }} >
                                    <div className="w-100 text-center text-light">No Selected Module</div>
                                  </div> */}

                                  <div className="list-group list-group-flush mt-3 shadow " style={{ minHeight: "300px", maxHeight: "200px", overflowY: "scroll" }}>
                                    <label className="list-group-item me-3">
                                      <input className="form-check-input me-1" type="checkbox" value="" />
                                      Select All Permission
                                    </label>
                                    <div className="list-group pe-3">
                                      <label className="list-group-item">
                                        <input className="form-check-input me-1" type="checkbox" value="" />
                                        Soufflé pastry pie ice
                                      </label>
                                      <label className="list-group-item">
                                        <input className="form-check-input me-1" type="checkbox" value="" />
                                        Bear claw cake biscuit
                                      </label>
                                      <label className="list-group-item">
                                        <input className="form-check-input me-1" type="checkbox" value="" />
                                        Tart tiramisu cake
                                      </label>
                                      <label className="list-group-item">
                                        <input className="form-check-input me-1" type="checkbox" value="" />
                                        Bonbon toffee muffin
                                      </label>
                                      <label className="list-group-item">
                                        <input className="form-check-input me-1" type="checkbox" value="" />
                                        Dragée tootsie roll
                                      </label>
                                      <label className="list-group-item">
                                        <input className="form-check-input me-1" type="checkbox" value="" />
                                        Tart tiramisu cake
                                      </label>
                                      <label className="list-group-item">
                                        <input className="form-check-input me-1" type="checkbox" value="" />
                                        Bonbon toffee muffin
                                      </label>
                                      <label className="list-group-item">
                                        <input className="form-check-input me-1" type="checkbox" value="" />
                                        Dragée tootsie roll
                                      </label>
                                      <label className="list-group-item">
                                        <input className="form-check-input me-1" type="checkbox" value="" />
                                        Tart tiramisu cake
                                      </label>
                                      <label className="list-group-item">
                                        <input className="form-check-input me-1" type="checkbox" value="" />
                                        Bonbon toffee muffin
                                      </label>
                                      <label className="list-group-item">
                                        <input className="form-check-input me-1" type="checkbox" value="" />
                                        Dragée tootsie roll
                                      </label>
                                      <label className="list-group-item">
                                        <input className="form-check-input me-1" type="checkbox" value="" />
                                        Tart tiramisu cake
                                      </label>
                                      <label className="list-group-item">
                                        <input className="form-check-input me-1" type="checkbox" value="" />
                                        Bonbon toffee muffin
                                      </label>
                                      <label className="list-group-item">
                                        <input className="form-check-input me-1" type="checkbox" value="" />
                                        Dragée tootsie roll
                                      </label>
                                    </div>
                                  </div>

                                  {/* <Select
                                    isLoading={loadingDepartments}
                                    closeMenuOnSelect={false}
                                    expandOnFocus={false}
                                    isSearchable
                                    isMulti
                                    placeholder="Selected Grants"
                                    menuIsOpen={true} // Always show options
                                    className="select2-selection fetched-select2"
                                    options={rightOptions}
                                    value={selectedRight}
                                    onChange={setSelectedRight}
                                    onInputChange={(e) => {
                                      // fetchDepartments(e);
                                    }}
                                    styles={{
                                      menu: (base) => ({
                                        ...base,
                                        position: "relative",
                                        zIndex: 9999,
                                        textAlign: "left",
                                        padding: "8px",
                                        minHeight: "300px"

                                      }),
                                      groupHeading: (base) => ({
                                        ...base,
                                        fontWeight: "bolder",
                                        fontSize: "0.85rem",
                                        color: "#6f6c6b",

                                      }),
                                      placeholder: (base) => ({
                                        ...base,
                                        textAlign: "left",
                                      }),
                                      option: (base) => ({
                                        ...base,
                                        paddingLeft: "20px",
                                      }),
                                    }}
                                    isClearable
                                  /> */}
                                </div>

                                <div className="col-sm-1">
                                  <br /><br /><br />
                                  <button
                                    id="assignButton"
                                    className="btn btn-success btn-sm btn-assign"
                                    onClick={handleAssign}
                                    title="Assign" >
                                    <i className="bx bx-right-arrow-alt" ></i>
                                  </button>
                                  <br /><br />
                                  <button
                                    id="removeButton"
                                    className="btn btn-danger btn-sm btn-assign"
                                    onClick={() => {
                                      handleRemove();
                                    }
                                    }
                                    title="Remove">
                                    <i className="bx bx-left-arrow-alt" ></i>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </FormWizard.TabContent>

                    <FormWizard.TabContent
                      title={
                        <div className="d-flex flex-column text-start">
                          <span className="fw-bold">Submition</span>
                          <span className="small">Review & Submit</span>
                        </div>
                      }
                      icon="ti-check"
                      isValid={isValidTab[1]}
                      showErrorOnTab={tabsError[2]}
                    >
                      {/* Tab 3 content */}
                      <div className="row text-start">
                        <div className="col-md-12 mb-4">
                          <label className="form-label fw-bold">Terms and Conditions</label>
                          <PDFViewer fileUrl="/assets/doc/MNH_ICT_Security_Policy.pdf" />
                        </div>
                        <div>
                          <div className="form-check mb-3">
                            <Field
                              type="checkbox"
                              name="request_data.is_read_term"
                              id="isReadTerm"
                              className="form-check-input"
                            />
                            <label htmlFor="isReadTerm" className="form-check-label">
                              I have read and understood the Terms and Conditions
                            </label>
                            <ErrorMessage
                              name="request_data.is_read_term"
                              component="div"
                              className="text-danger"
                            />
                          </div>
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

export default ApprovalRequestModal;
