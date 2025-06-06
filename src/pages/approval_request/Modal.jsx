import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import Swal from "sweetalert2";
import * as Yup from "yup";
import showToast from "../../helpers/ToastHelper";
import { createUpdateApprovalRequest } from "./Queries";
import { ApprovalRequestsContext } from "../../utils/context";
import { getDepartments } from "../department/Queries";
import { getPositionalLevels } from "../positional_level/Queries";
import FormWizard from "react-form-wizard-component";
import "react-form-wizard-component/dist/style.css";
import Select, { components } from "react-select";
import { getModules } from "../approval_module/Queries";
import PDFViewer from "../../components/common/PDFViewer";
import jeevaData from "../../data/jeevaData.json";
import jeevaGroupData from "../../data/jeevaGroupData.json";
import requestTypes from "../../data/requestTypes.json";
import dateRangeData from "../../data/dateRangeData.json";
import AccordionContainer from "../../components/accordion/AccordionContainer";
import { Button } from "reactstrap";

const ApprovalRequestModal = () => {
  const {
    handleFetchData,
    selectApprovalRequests,
    setSelectedApprovalRequest,
    isModalOpen,
    setIsModalOpen,
  } = useContext(ApprovalRequestsContext);
  const [errors, setOtherError] = useState({});
  const [loadingDateRange, setLoadingDateRange] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isSelectModuleView, setIsSelectModuleView] = useState(false);
  const [selectedPermissionGroup, setSelectedPermissionGroup] = useState(null);



  const [activeChip, setActiveChip] = useState(null);
  const [activeChipLabel, setActiveChipLabel] = useState(null);

  const [selectedLeft, setSelectedLeft] = useState([]);
  const [selectedRight, setSelectedRight] = useState([]);
  const [leftOptions, setLeftOptions] = useState([]);
  const [rightOptions, setRightOptions] = useState([
    { label: "Modules", options: [] },
    { label: "Permissions", options: [] },
  ]);



  const [activeModulePermissions, setActiveModulePermissions] = useState([]);
  const [selectedModules, setSelectedModules] = useState([]); // [{ codename, name, Permissions: [...] }]


  // When a module chip is clicked, show its permissions
  const handleChipClick = (moduleCodename, moduleLabel) => {
    setActiveChip(moduleCodename);
    setActiveChipLabel(moduleLabel);
    // Show all possible permissions for this module
    const module = jeevaData.Modules.find(module => module.codename === moduleCodename);
    setActiveModulePermissions(module ? module.Permissions : []);
  };


  const handlePermissionToggle = (perm, checked) => {
    setSelectedModules(prev => {
      // Find the active module
      const moduleIdx = prev.findIndex(m => m.codename === activeChip);
      if (moduleIdx === -1) {
        // If not present, add it with this permission
        if (checked) {
          return [
            ...prev,
            {
              codename: activeChip,
              name: activeChipLabel,
              Permissions: [perm],
            },
          ];
        }
        return prev;
      }
      // If present, update its permissions
      const updated = [...prev];
      const perms = updated[moduleIdx].Permissions || [];
      if (checked) {
        // Add if not present
        if (!perms.some(p => p.codename === perm.codename)) {
          updated[moduleIdx] = {
            ...updated[moduleIdx],
            Permissions: [...perms, perm],
          };
        }
      } else {
        // Remove
        const newPerms = perms.filter(p => p.codename !== perm.codename);
        if (newPerms.length === 0) {
          // Remove module if no permissions left
          updated.splice(moduleIdx, 1);
        } else {
          updated[moduleIdx] = {
            ...updated[moduleIdx],
            Permissions: newPerms,
          };
        }
      }
      return updated;
    });
  };

  // For checkbox checked state:
  const isPermissionChecked = (perm) => {
    const mod = selectedModules.find(m => m.codename === activeChip);
    return !!mod && mod.Permissions.some(p => p.codename === perm.codename);
  };

  const isAllPermissionsChecked = () => {
    if (!activeChip || activeModulePermissions.length === 0) return false;
    const mod = selectedModules.find(m => m.codename === activeChip);
    if (!mod) return false;
    return activeModulePermissions.every(perm =>
      mod.Permissions.some(p => p.codename === perm.codename)
    );
  };

  const handleSelectAllPermissions = (checked) => {
    setSelectedModules(prev => {
      const moduleIdx = prev.findIndex(m => m.codename === activeChip);
      if (moduleIdx === -1) {
        // Add module with all permissions
        if (checked) {
          return [
            ...prev,
            {
              codename: activeChip,
              name: activeChipLabel,
              Permissions: [...activeModulePermissions],
            },
          ];
        }
        return prev;
      }
      // Update existing module
      const updated = [...prev];
      if (checked) {
        updated[moduleIdx] = {
          ...updated[moduleIdx],
          Permissions: [...activeModulePermissions],
        };
      } else {
        // Remove all permissions = remove module
        updated.splice(moduleIdx, 1);
      }
      return updated;
    });
  };

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
        onClick={() => handleChipClick(props.data.value, props.data.label)}

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
  const [selectedModule, setSelectedModule] = useState(selectApprovalRequests?.module);
  const CustomOption = (props) => (
    <components.Option {...props}>
      <div>
        <span>{props.data.name}</span>
        <span style={{ color: "#888", fontSize: "0.9em", marginLeft: 8 }}>
          (&nbsp;
          {props.data.description && props.data.description.length > 40
            ? props.data.description.slice(0, 40) + "..."
            : props.data.description
          }
          &nbsp;)
        </span>
      </div>
    </components.Option>
  );


  const initialValues = {
    title: selectApprovalRequests?.title || "",
    module_uid: selectApprovalRequests?.module?.uid || "",
    department_uid: selectApprovalRequests?.department_uid || "",
    date_range: selectApprovalRequests?.request_data?.date_range || "",
    date_from: selectApprovalRequests?.request_data?.date_from || "",
    date_to: selectApprovalRequests?.request_data?.date_to || "",
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
    date_range: Yup.object({
      title: Yup.string().required(),
      value: Yup.number().required(),
      type: Yup.string().required(),
    }).required("Date range is required").typeError("Please enter Select Date Range for your Request"),
    module_uid: Yup.string().required("Approval Module is required"),
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
        await validationSchema.validateAt("module_uid", values);
        await validationSchema.validateAt("title", values);
        await validationSchema.validateAt("date_range", values);
        await validationSchema.validateAt("department_uid", values);
      }
      if (tabIndex === 2) {
        if (selectedModule?.code === "INTERNET_EMAIL_ACCESS") {
          // await validationSchema.validateAt("request_data.access_period", values);
          // await validationSchema.validateAt("request_data.grants", values);
          // await validationSchema.validateAt("request_data.revork", values);
        }

        if (selectedModule?.code === "JEEVA_ACCESS") {
          // await validationSchema.validateAt("request_data.expire_at", values);
          await validationSchema.validateAt("request_data.grants", values);
        // await validationSchema.validateAt("request_data.revork", values);
        }
        // Add more tab-specific validation as needed
        // await validationSchema.validateAt("email", values);
      }
      if (tabIndex === 3) {
        if (selectedModule?.code === "INTERNET_EMAIL_ACCESS") {
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
      <style>{`
        .swal2-container,
          .swal2-popup {
            z-index: 9999 !important;
          }
      `}
      </style>
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
        role="dialog"
        data-bs-backdrop="static"
        data-bs-keyboard="false"
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
                          <label htmlFor="module_uid" className="form-label">
                            Request For
                          </label>
                          <Select
                            isLoading={loadingModules}
                            className="select2-selection fetched-select2"
                            onChange={(e) => {
                              if (!e) {
                                setFieldValue("module_uid", "");
                                setSelectedModule(null);
                              } else {
                                setFieldValue("module_uid", e.value);
                                // Find the full module object by uid
                                const moduleObj = modules.find((mod) => mod.uid === e.value);
                                setSelectedModule(moduleObj || null);
                              }
                            }}
                            onInputChange={(e) => {
                              handleFetchModule(e);
                            }}
                            options={modules?.map((item) => ({
                              value: item.uid,
                              label: item.name,
                              name: item.name,
                              description: item.description,
                            }))}
                            components={{ Option: CustomOption }}
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
                                  label: `${item.name} - (${item.description})`,
                                }))
                                .find((option) => option.value === values.module_uid) || null
                            }
                            isClearable
                          />

                          <Field type="hidden" name="module_uid" id="typeHidden" />
                          <ErrorMessage
                            name="module_uid"
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
                        <div className="col-md-6  mb-3">
                          <label htmlFor="date_range" className="form-label">
                            Access For Period Of
                          </label>
                          <Select
                            className="select2-selection fetched-select2"
                            onChange={(e) => {
                              setFieldValue("date_range", e ? e.value : "");
                            }}
                            options={dateRangeData.map((item) => ({
                              value: item, // value is the whole object
                              label: item.title,
                            }))}
                            styles={{
                              menu: (base) => ({
                                ...base,
                                position: "absolute",
                                zIndex: 9999,
                              }),
                            }}
                            value={
                              dateRangeData
                                .map((item) => ({
                                  value: item,
                                  label: item.title,
                                }))
                                .find((option) =>
                                  // Compare by value, type, and title for object equality
                                  option.value.value === values.date_range?.value &&
                                  option.value.type === values.date_range?.type &&
                                  option.value.title === values.date_range?.title
                                ) || null
                            }
                            isClearable
                          />
                          <ErrorMessage
                            name="date_range"
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
                      {selectedModule?.code === "INTERNET_EMAIL_ACCESS" && (
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
                      {selectedModule?.code === "JEEVA_ACCESS" && (
                        <>

                          <div className="ibox-content" >
                            <div className="ibox-content-body" >
                              <div className="row">
                                <div className="col-sm-11 text-start mb-4" >
                                  <h5 className="text-muted">Instructions for Selecting Modules and Permissions</h5>
                                  <p className="">
                                    Select a module from the left to view its permissions. Check the permissions you want to request. Click the Preview button to see a list of your selected modules and permissions. You may also select permissions by choosing your associated group.                                  </p>
                                </div>

                                <div className="col-sm-8">
                                  {isSelectModuleView ? (
                                    <div className="row h-100">
                                    <div className="col-sm-6" style={{ minWidth: "280px" }} >
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
                                          setSelectedLeft(selected);
                                          // Remove highlight if chip is removed
                                          if (action && action.removedValue && activeChip === action.removedValue.value) {
                                            setActiveChip(null);
                                            setActiveModulePermissions([]);
                                            setActiveChipLabel(null);
                                          }

                                          // Clear all selected modules if Select is cleared
                                          if (action && action.action === "clear") {
                                            setSelectedModules([]);
                                            setActiveChip(null);
                                            setActiveModulePermissions([]);
                                            setActiveChipLabel(null);
                                          }

                                          if (action && action.option) {
                                            handleChipClick(action.option.value, action.option.label)
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
                                        components={{ MultiValue: CustomMultiValue }}
                                      />
                                    </div>

                                    <div className="col-sm-6 text-start pe-3" style={{ minWidth: "300px", marginTop: "0px" }} >
                                      <div className="d-grid gap-2 col-lg-12 mx-auto">
                                        <button type="Button" className="btn btn-outline-info btn-secondary btn-sm btn-block">
                                            <span className="fw-medium" style={{ fontSize: "16px" }}> {activeChipLabel ? `Permissions For ${activeChipLabel}` : `No Selected Module`}</span>
                                        </button>
                                      </div>
                                      <div className="list-group list-group-flush mt-3 shadow " style={{ height: "300px", overflowY: "hidden" }}>
                                        <label className="list-group-item me-3 text-secondary btn-outline-info">
                                          {activeModulePermissions.length === 0 ? (
                                            <input className="form-check-input me-1" type="checkbox" disabled readOnly />

                                          ) : (
                                            <input
                                              className="form-check-input me-1 p-2 bg-secondary"
                                              type="checkbox"
                                              disabled={activeModulePermissions.length === 0}
                                              checked={isAllPermissionsChecked()}
                                              onChange={e => handleSelectAllPermissions(e.target.checked)}
                                            />

                                          )}
                                          Select All Permission
                                          </label>


                                        <div className="list-group list-group-flush mt-3 shadow  pe-3" style={{ height: "250px", overflowY: "auto" }}>
                                          {activeModulePermissions.length === 0 ? (
                                            <div className="demo-inline-spacing shadow text-center" style={{ height: "240px", display: "flex", alignItems: "center", fontSize: "16px" }} >
                                              <div className="w-100 text-center text-light p-4">Select a Module to view Permissions</div>
                                            </div>
                                          ) : (

                                              activeModulePermissions.map((perm) => (
                                                <label className="list-group-item" key={perm.codename}>
                                                  <input
                                                    className="form-check-input me-1"
                                                    type="checkbox"
                                                    value={perm.codename}
                                                    checked={isPermissionChecked(perm)}
                                                    onChange={e => handlePermissionToggle(perm, e.target.checked)}
                                                  />
                                                  {perm.name}
                                                </label>
                                              ))

                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    </div>
                                  ) : (
                                    <div className="row h-100 center">
                                      <div className="col-sm-11">
                                        <form className="d-flex" style={{ marginLeft: "50px" }}>
                                          <div className="input-group">
                                            <span className="input-group-text">
                                              <i className="tf-icons bx bx-search"></i>
                                            </span>
                                            <input
                                              type="text"
                                              className="form-control"
                                              placeholder="Search..."

                                              />
                                            </div>
                                          </form>
                                        </div>
                                        <div
                                          className="col-sm-12 row g-3 shadow m-3 p-4"
                                          style={{
                                            height: "400px",
                                            minWidth: "400px",
                                            border: "1px solid rgba(142, 145, 148, 0.45)",
                                            borderRadius: "10px",
                                            overflowY: "auto",

                                          }}
                                        >
                                          {/*
                                          {jeevaGroupData.map((group, idx) => (
                                            <div key={group.uid} className="col-12 col-sm-6" >
                                              <button
                                                onClick={() => {
                                                  setSelectedPermissionGroup(idx);

                                                  // Select all modules in Select
                                                  const groupModuleOptions = group.modules.map(mod => ({
                                                    value: mod.codename,
                                                    label: mod.name,
                                                  }));
                                                  setSelectedLeft(groupModuleOptions);

                                                  // Select all modules and permissions (for checked state)
                                                  setSelectedModules(
                                                    group.modules.map(mod => ({
                                                      codename: mod.codename,
                                                      name: mod.name,
                                                      Permissions: [...mod.Permissions],
                                                    }))
                                                  );

                                                  // Set first module as active chip and show all possible permissions
                                                  if (group.modules.length > 0) {
                                                    const firstModule = group.modules[0];
                                                    setActiveChip(firstModule.codename);
                                                    setActiveChipLabel(firstModule.name);

                                                    // Find all possible permissions for this module from jeevaData
                                                    const allPermsModule = jeevaData.Modules.find(m => m.codename === firstModule.codename);
                                                    setActiveModulePermissions(allPermsModule ? allPermsModule.Permissions : []);
                                                  } else {
                                                    setActiveChip(null);
                                                    setActiveChipLabel(null);
                                                    setActiveModulePermissions([]);
                                                  }
                                                }}
                                                className={`btn btn-md btn-outline-secondary ${idx === selectedPermissionGroup ? "active" : ""} w-100`}
                                              >
                                                <div className="m-1 p-1 d-flex justify-content-center">
                                                  <i className="bx bx-user bx-x1 bx-lg"></i>
                                                </div>
                                                <div className="d-flex flex-column text-start" style={{ width: "85%" }}>
                                                  <span className="fw-bold">{group.name}</span>
                                                  <span className="small">Modules Assigned: {group.modules.length}</span>
                                                  <span className="small">
                                                    (&nbsp;
                                                    {group.modules.map((module, modid) => {
                                                      { module.name }
                                                    })}
                                                    &nbsp;)
                                                  </span>
                                                </div>
                                              </button>
                                            </div>
                                          ))} */}

                                          {jeevaGroupData.map((group, idx) => (
                                            <div key={group.uid} className="col-12 col-sm-6 mb-3">
                                              <button
                                                onClick={() => {
                                                  setSelectedPermissionGroup(idx);

                                                  // Select all modules in Select
                                                  const groupModuleOptions = group.modules.map(mod => ({
                                                    value: mod.codename,
                                                    label: mod.name,
                                                  }));
                                                  setSelectedLeft(groupModuleOptions);

                                                  // Select all modules and permissions (for checked state)
                                                  setSelectedModules(
                                                    group.modules.map(mod => ({
                                                      codename: mod.codename,
                                                      name: mod.name,
                                                      Permissions: [...mod.Permissions],
                                                    }))
                                                  );

                                                  // Set first module as active chip and show all possible permissions
                                                  if (group.modules.length > 0) {
                                                    const firstModule = group.modules[0];
                                                    setActiveChip(firstModule.codename);
                                                    setActiveChipLabel(firstModule.name);

                                                    // Find all possible permissions for this module from jeevaData
                                                    const allPermsModule = jeevaData.Modules.find(m => m.codename === firstModule.codename);
                                                    setActiveModulePermissions(allPermsModule ? allPermsModule.Permissions : []);
                                                  } else {
                                                    setActiveChip(null);
                                                    setActiveChipLabel(null);
                                                    setActiveModulePermissions([]);
                                                  }
                                                }}
                                                className={`btn btn-md btn-outline-secondary ${idx === selectedPermissionGroup ? "active" : ""} w-100 text-start`}
                                                style={{ minHeight: "110px", marginBottom: "8px" }}
                                              >
                                                <div className="m-1 p-1 d-flex justify-content-center">
                                                  <i className="bx bx-user bx-x1 bx-lg"></i>
                                                </div>
                                                <div className="d-flex flex-column text-start" style={{ width: "85%" }}>
                                                  <span className="fw-bold">{group.name}</span>
                                                  <span className="small mb-1">Modules Assigned: {group.modules.length}</span>
                                                  <span className="small">
                                                    {group.modules.length > 0 ? (
                                                      <span>(&nbsp;
                                                        {group.modules.map((module, modid) => (
                                                          <span
                                                            key={module.codename || modid}
                                                            className=" fw-bold  me-1 mb-1"
                                                            style={{ fontSize: "0.85em" }}
                                                          >
                                                            {module.name},
                                                          </span>
                                                        ))}
                                                        &nbsp;)
                                                      </span>
                                                    ) : (
                                                      <span className="text-muted">No modules</span>
                                                    )}
                                                  </span>
                                                </div>
                                              </button>
                                            </div>
                                          ))}

                                        </div>
                                      </div>
                                  )}
                                </div>
                                <div
                                  className="col-sm-4 text"
                                  style={{
                                    minHeight: "350px",
                                    display: "flex",
                                    flexDirection: "column", // Stack buttons vertically
                                    justifyContent: "center", // Center vertically
                                    alignItems: "center",     // Center horizontally
                                  }}>

                                  <button
                                    type="button"
                                    className="btn btn-primary btn-sm btn-preview m-2"
                                    onClick={() => setShowPreviewModal(true)}
                                    title="Preview" >
                                    <i className="bx bx-list-ol" ></i> Preview Selected Permissions
                                  </button>

                                  {isSelectModuleView === true ? (
                                    <button
                                      type="button"
                                      className="btn btn-info btn-outline-info btn-sm btn-copy-group m-2"
                                      onClick={async () => {
                                        const confirmation = await Swal.fire({
                                          text: "The selected modules and permissions will be overwritten by the group permissions.",
                                          icon: "info",
                                          showCancelButton: true,
                                          confirmButtonColor: "#DD6B55",
                                          cancelButtonColor: "#aaa",
                                          confirmButtonText: "Continue",
                                          allowOutsideClick: false,
                                          allowEscapeKey: false,
                                        });

                                        if (confirmation.isConfirmed) {
                                          setIsSelectModuleView(false);
                                          setSelectedModules([]);
                                          setActiveChip(null);
                                          setActiveModulePermissions([]);
                                          setActiveChipLabel(null);
                                        }
                                      }}
                                      title="Assign" >
                                      <i className="bx bx-group" ></i> Copy Permission From Group
                                    </button>
                                  ) : isSelectModuleView === false && selectedPermissionGroup ? (
                                    // show button to edit permittion when user selest one group
                                    <button
                                      type="button"
                                      className="btn btn-info btn-outline-info btn-sm btn-group-edit m-2"
                                      onClick={async () => {
                                        const confirmation = await Swal.fire({
                                          text: "Click Continue to add or remove modules and permissions from the selected group before proceeding to the next step.",
                                          icon: "info",
                                          showCancelButton: true,
                                          confirmButtonColor: "#DD6B55",
                                          cancelButtonColor: "#aaa",
                                          confirmButtonText: "Continue",
                                          allowOutsideClick: false,
                                          allowEscapeKey: false,
                                        });

                                          if (confirmation.isConfirmed) {
                                            setIsSelectModuleView(true);
                                            // setSelectedModules([]);
                                            // setActiveChip(null);
                                            // setActiveModulePermissions([]);
                                            // setActiveChip(null);
                                            // setActiveChipLabel(null);
                                          }
                                        }}
                                        title="Assign" >
                                        <i className="bx bx-user-plus" ></i> Edit Selected Group Permission
                                      </button>
                                    ) : (
                                        <button
                                          id="assignButton"
                                          type="button"
                                          className="btn btn-info btn-outline-info btn-sm btn-assign m-2"
                                          onClick={async () => {
                                            const confirmation = await Swal.fire({
                                              text: "Select Module & Permission Direct from List",
                                              icon: "info",
                                              showCancelButton: true,
                                              confirmButtonColor: "#DD6B55",
                                              cancelButtonColor: "#aaa",
                                              confirmButtonText: "Continue",
                                              allowOutsideClick: false,
                                              allowEscapeKey: false,
                                            });

                                            if (confirmation.isConfirmed) {
                                              setIsSelectModuleView(true);
                                              setSelectedPermissionGroup(null)
                                              setSelectedModules([]);
                                              setActiveChip(null);
                                              setActiveModulePermissions([]);
                                              setActiveChip(null);
                                              setActiveChipLabel(null);
                                            }
                                          }}
                                          title="Manually Select" >
                                          <i className="bx bx-poll" ></i> Select Permission Manually
                                        </button>
                                  )}


                                  {selectedModules.length !== 0 && (
                                    <button
                                      id="assignButton"
                                      type="button"
                                      className="btn btn-danger btn-sm btn-assign m-2"
                                      onClick={() => {
                                        setIsSelectModuleView(false);
                                        setSelectedModules([]);
                                        setActiveChip(null);
                                        setActiveModulePermissions([]);
                                        setActiveChipLabel(null);
                                        setSelectedPermissionGroup(null)
                                      }}
                                      title="Assign" >
                                      <i className="bx bx-trash-alt" ></i> Clear Selection
                                    </button>
                                  )}


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

      {showPreviewModal && (
        <div
          className="modal fade show"
          tabIndex="-1"
          style={{
            display: "block",
            background: "rgba(0,0,0,0.5)",
            zIndex: 2000,
          }}
          aria-modal="true"
          role="dialog"
        >
          <div className="modal-dialog modal-xl" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Preview Selected Permissions</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowPreviewModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                {showPreviewModal === true && (
                  <div className="container py-4">
                    {/* You can render selectedModules or any content you want */}
                    {/* Example: */}
                    {selectedModules.length === 0 ? (
                      <div className="text-center text-muted">No permissions selected.</div>
                    ) : (
                      <div className="row g-4">
                        <p className="text-muted">
                          Here is the list of permissions selected for your request. These are the permissions that will be included in your submission. Please review them carefully before submitting your request.
                        </p>
                        {selectedModules.map((mod) => (
                          <div key={mod.codename} className="col-12 col-sm-6 col-md-4 col-lg-">
                            <div className="card h-100 shadow-sm">
                              <div className="card-body d-flex flex-column">
                                <h5 className="card-title mb-3">{mod.name}</h5>

                                <div
                                  style={{
                                    flex: 1,
                                    minHeight: "120px",
                                    maxHeight: "220px",
                                    overflowY: "auto",
                                    border: "1px solid #f0f0f0",
                                    borderRadius: "6px",
                                    background: "#fafbfc",
                                    padding: "0.5rem",
                                    textAlign: "left"
                                  }}
                                >
                                  <ul className="list-group list-group-flush small">
                                    {mod.Permissions.map((perm) => (
                                      <li key={perm.codename} className="list-group-item py-1 px-2">
                                        <i className="bx bx-check-shield me-2" style={{ color: "#696cff", fontSize: "1.1em" }}></i>
                                        {perm.name}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                {/* Optional: Show count of permissions */}
                                <div className="mt-2 text-end small text-muted">
                                  {mod.Permissions.length} permission{mod.Permissions.length > 1 ? "s" : ""}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="text-end">
                  <button
                    style={{ width: "150px" }}
                    type="button"
                    className="btn btn-danger btn-sm btn-close-preview m-2"
                    onClick={() => setShowPreviewModal(false)}
                  >
                    <i className="bx bx-trash-alt"></i> &nbsp;Close Preview
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ApprovalRequestModal;
