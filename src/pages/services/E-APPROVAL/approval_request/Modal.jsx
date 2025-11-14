import React, { useContext, useEffect, useState, useMemo } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import Swal from "sweetalert2";
import * as Yup from "yup";
import showToast from "../../../../helpers/ToastHelper";
import { createUpdateApprovalRequest } from "./Queries";
import { ApprovalRequestsContext } from "../../../../utils/context";
import FormWizard from "react-form-wizard-component";
import "react-form-wizard-component/dist/style.css";
import Select, { components } from "react-select";
import PDFViewer from "../../../../components/common/PDFViewer";
import jeevaData from "../../../../data/jeevaData.json";
import jeevaGroupData from "../../../../data/jeevaGroupData.json";
import edmsData from "../../../../data/edmsData.json";
import edmsGroupData from "../../../../data/edmsGroupData.json";
import welsoftData from "../../../../data/welsoftData.json";
import welsoftGroupData from "../../../../data/welsoftGroupData.json";
import { useSelector } from "react-redux";
import FormikSelect from "../../../../components/ui-templates/form-components/FormikSelect";

const ApprovalRequestModal = () => {
  const user = useSelector((state) => state.userReducer)?.data;
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { selectedObj, setSelectedObj, tableRefresh, setTableRefresh } =
    useContext(ApprovalRequestsContext);

  const [longGroupData, setLongGroupData] = useState([]);
  const [longData, setLongData] = useState([]);
  const [groupSearch, setGroupSearch] = useState("");

  // filter groups, modules and permissions by search term
  const filteredGroups = useMemo(() => {
    if (!groupSearch || !longGroupData) return longGroupData || [];
    const s = groupSearch.trim().toLowerCase();
    if (!s) return longGroupData;
    return longGroupData.filter((g) => {
      if ((g.name || "").toLowerCase().includes(s)) return true;
      if (Array.isArray(g.modules)) {
        if (g.modules.some((m) => (m.name || "").toLowerCase().includes(s)))
          return true;
        if (
          g.modules.some(
            (m) =>
              Array.isArray(m.Permissions) &&
              m.Permissions.some(
                (p) =>
                  (p.name || "").toLowerCase().includes(s) ||
                  (p.codename || "").toLowerCase().includes(s)
              )
          )
        )
          return true;
      }
      return false;
    });
  }, [groupSearch, longGroupData]);

  const [errors, setOtherError] = useState({});
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showTermConditionModal, setShowTermConditionModal] = useState(false);
  const [isSelectModuleView, setIsSelectModuleView] = useState(false);
  const [selectedPermissionGroup, setSelectedPermissionGroup] = useState(null);
  const [isAgreedTerms, setIsAgreedTerms] = useState(false);

  const [activeChip, setActiveChip] = useState(null);
  const [activeChipLabel, setActiveChipLabel] = useState(null);

  const [selectedLeft, setSelectedLeft] = useState([]);
  const [leftOptions, setLeftOptions] = useState([]);

  const [activeModulePermissions, setActiveModulePermissions] = useState([]);
  const [selectedModules, setSelectedModules] = useState([]);
  const [selectedApprovalModule, setSelectedApprovalModule] = useState([]);

  // When a module chip is clicked, show its permissions
  const handleChipClick = (moduleCodename, moduleLabel) => {
    setActiveChip(moduleCodename);
    setActiveChipLabel(moduleLabel);
    // Show all possible permissions for this module
    const module = longData.Modules.find(
      (module) => module.codename === moduleCodename
    );
    setActiveModulePermissions(module ? module.Permissions : []);
  };

  const handlePermissionToggle = (perm, checked) => {
    setSelectedModules((prev) => {
      // Find the active module
      const moduleIdx = prev.findIndex((m) => m.codename === activeChip);
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
        if (!perms.some((p) => p.codename === perm.codename)) {
          updated[moduleIdx] = {
            ...updated[moduleIdx],
            Permissions: [...perms, perm],
          };
        }
      } else {
        // Remove
        const newPerms = perms.filter((p) => p.codename !== perm.codename);
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
    const mod = selectedModules.find((m) => m.codename === activeChip);
    return !!mod && mod.Permissions.some((p) => p.codename === perm.codename);
  };

  const isAllPermissionsChecked = () => {
    if (!activeChip || activeModulePermissions.length === 0) return false;
    const mod = selectedModules.find((m) => m.codename === activeChip);
    if (!mod) return false;
    return activeModulePermissions.every((perm) =>
      mod.Permissions.some((p) => p.codename === perm.codename)
    );
  };

  const handleSelectAllPermissions = (checked) => {
    setSelectedModules((prev) => {
      const moduleIdx = prev.findIndex((m) => m.codename === activeChip);
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

  const [loadingPermissions, stLoadingPermissions] = useState(false);

  //for Wizard tab validation & Control
  const [tabsError, setTabsError] = useState([false, false, false]);
  const [isValidTab, setSInValidTab] = useState([false, false, false]);
  const [isFirstTabChange, setIsFirstTabChange] = useState(true);
  const [tabIndex, setTabIndex] = useState(0); // current tab index
  const [selectedModule, setSelectedModule] = useState(selectedObj?.module);

  const initialValues = {
    title: selectedObj?.title || "",
    module_uid: selectedObj?.module?.uid || "",
    department_uid: user?.position?.department_uid,
    date_range_uid: selectedObj?.request_data?.date_range_uid || "",
    request_data: {
      attachment: selectedObj?.request_data?.attachment || "",
      grants: selectedObj?.request_data?.grants || [],
      is_edited: selectedObj?.request_data?.is_edited || false,
      is_read_term: selectedObj?.request_data?.is_read_term || false,
    },
  };

  const validationSchema = Yup.object().shape({
    title: Yup.string().required("Title is required"),
    date_range_uid: Yup.string().required(
      "Please enter Select Date Range for your Request"
    ),
    module_uid: Yup.string().required("Approval Module is required"),
    department_uid: Yup.string().required("Department is required"),
    description: Yup.string().required("Description is required"),
    request_data: Yup.object().shape({
      attachment: Yup.string().typeError(
        "Attachment should be File Not great than 5 Mb"
      ),
      grants: Yup.array().min(
        1,
        "Your Must Select Group or Manual Select Module with its Permission"
      ),
      is_edited: Yup.boolean().default(false),
      is_read_term: Yup.boolean()
        .oneOf([true], "You must agree to the terms and conditions")
        .required("Read term is required"),
    }),
  });

  const handleSubmit = async (
    values,
    { setSubmitting, resetForm, setErrors }
  ) => {
    try {
      if (selectedObj) {
        values.uid = selectedObj.uid;
      }
      setSubmitting(true);

      const result = await createUpdateApprovalRequest(values);

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
      console.log("Error submitting form:", error);
      showToast("Something went wrong while saving", "error", "Failed");
      handleClose(); // Close the modal after submission
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedObj(null);
    setIsFirstTabChange(true);
    setTabsError([false, false, false]);
    setSInValidTab([false, false, false]);
    setTabIndex(0);
    setIsModalOpen(false);
    const modalElement = document.getElementById("viewCreateRequestModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
  };

  const groupedOptions = [];

  //for Wizard tab validation & Control
  const validateTab = async (
    values,
    setFieldError,
    setFieldValue,
    setTouched
  ) => {
    try {
      if (tabIndex === 1) {
        await validationSchema.validateAt("module_uid", values);
        await validationSchema.validateAt("title", values);
        await validationSchema.validateAt("date_range_uid", values);
        await validationSchema.validateAt("department_uid", values);
        await validationSchema.validateAt("description", values);
      }
      if (tabIndex === 2) {
        if (selectedApprovalModule?.code === "INTERNET_EMAIL_ACCESS") {
          // await validationSchema.validateAt("request_data.attachment", values);
        }

        console.log(values.module_uid?.code);

        if (
          selectedApprovalModule?.code === "JEEVA_ACCESS" ||
          selectedApprovalModule?.code === "EDMS_ACCESS" ||
          selectedApprovalModule?.code === "WELSOFT_ACCESS"
        ) {
          if (selectedModules?.length === 0) {
            setFieldValue("request_data.grants", []);
            setFieldError(
              "request_data.grants",
              "Your Must Select Group or Manual Select Module with its Permissions"
            );
            await validationSchema.validateAt("request_data.grants", values);
            return false;
          } else {
            setTouched({ "request_data.grants": true }, false);
            setFieldValue("request_data.grants", selectedModules);
            return true;
          }
        }
        // Add more tab-specific validation as needed
        // await validationSchema.validateAt("email", values);
      }
      if (tabIndex === 3) {
        await validationSchema.validateAt("request_data.is_read_term", values);
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
    setFieldValue,
    resetForm,
    setErrors,
    setFieldError,
    setTouched,
    lastTab
  ) => {
    if (isFirstTabChange) {
      setIsFirstTabChange(false);
    }

    const isValid = await validateTab(
      values,
      setFieldError,
      setFieldValue,
      setTouched
    );

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
    const modalElement = document.getElementById("viewCreateRequestModal");
    if (!modalElement) return;

    const handleShow = () => setIsModalOpen(true);
    const handleHide = () => setIsModalOpen(false);

    modalElement.addEventListener("shown.bs.modal", handleShow);
    modalElement.addEventListener("hidden.bs.modal", handleHide);

    return () => {
      modalElement.removeEventListener("shown.bs.modal", handleShow);
      modalElement.removeEventListener("hidden.bs.modal", handleHide);
    };
  }, []);

  // When selectedApprovalModule changes, set the data
  useEffect(() => {
    if (isModalOpen) {
      if (isModalOpen) {
        setLeftOptions(groupedOptions);
      }

      console.log(selectedApprovalModule);

      if (selectedApprovalModule?.code === "JEEVA_ACCESS") {
        setLongData(jeevaData);
        setLongGroupData(jeevaGroupData);
      } else if (selectedApprovalModule?.code === "EDMS_ACCESS") {
        setLongData(edmsData);
        setLongGroupData(edmsGroupData);
      } else if (selectedApprovalModule?.code === "WELSOFT_ACCESS") {
        // Assuming welsoftData and welsoftGroupData are imported similarly
        setLongData(welsoftData);
        setLongGroupData(welsoftGroupData);
      } else {
        setLongData([]);
        setLongGroupData([]);
      }
    }
  }, [selectedApprovalModule, isModalOpen]);

  // When longData changes, build options
  useEffect(() => {
    if (longData && longData.Modules) {
      const options = [
        {
          label: "Modules",
          options: longData.Modules.map((mod) => ({
            value: mod.codename,
            label: mod.name,
          })),
        },
      ];
      setLeftOptions(options);
    } else {
      setLeftOptions([]); // Or null
    }
  }, [longData]);

  return (
    <>
      <style>
        {`
        .swal2-container,
          .swal2-popup {
            z-index: 9999 !important;
          }
      `}
      </style>

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
                Approval Request{" "}
                {selectedApprovalModule && (
                  <span className="text-info">
                    {" "}
                    &nbsp;( {selectedApprovalModule?.name} )
                  </span>
                )}
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
                errors,
                touched,
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
                        type="button"
                        className="base-button btn btn-sm btn-primary float-right"
                        style={{ width: "100px", alignItems: "right" }}
                        onClick={handlePrevious}
                      >
                        <i className="bx bx-left-arrow-alt"></i> Back
                      </button>
                    )}
                    nextButtonTemplate={(handleNext) => (
                      <button
                        type="button"
                        className="base-button btn btn-sm btn-primary"
                        style={{ width: "100px", marginLeft: "80%" }}
                        onClick={async () =>
                          await tabChanged(
                            { handleNext },
                            values,
                            setSubmitting,
                            setFieldValue,
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
                        type="button"
                        className="base-button btn btn-sm btn-primary"
                        style={{ width: "150px", marginLeft: "70%" }}
                        disabled={isSubmitting}
                        onClick={async () =>
                          await tabChanged(
                            { handleNext },
                            values,
                            setSubmitting,
                            setFieldValue,
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
                    {/* Tab 1 content */}
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
                      <div className="row text-start">
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
                          isReadOnly={true}
                        />
                        <FormikSelect
                          name="module_uid"
                          label="Request For"
                          url="/approval-module"
                          filters={{
                            page: 1,
                            page_size: 10,
                            paginated: true,
                            directory_uid: user?.position?.directory_uid,
                          }}
                          mapOption={(item) => ({
                            value: item.uid,
                            label: `${item.name}`,
                            name: item.name,
                            code: item.code,
                          })}
                          onSelectObject={(obj) => {
                            console.log("Selected object outside Formik:", obj);
                            // you can set it to local state if you want
                            setSelectedApprovalModule({
                              value: obj.uid,
                              label: obj.name,
                              name: obj.name,
                              code: obj.code,
                            });
                          }}
                          placeholder="Search Modules..."
                          debounceMs={500}
                          minChars={2}
                          isReadOnly={false}
                        />
                      </div>

                      <div className="row text-start">
                        <FormikSelect
                          name="date_range_uid"
                          label="Access For Period Of"
                          url="/date-range"
                          filters={{
                            page: 1,
                            page_size: 10,
                            paginated: true,
                          }}
                          mapOption={(item) => ({
                            value: item.uid,
                            label: `${item.name}`,
                            name: `${item.name}`,
                          })}
                          placeholder="Search Date Ranges ... "
                          debounceMs={500}
                          minChars={3}
                          isReadOnly={false}
                        />
                        <div className="col-md-6 mb-3">
                          <label htmlFor="titleLarge" className="form-label">
                            Request Title ( Subject )
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
                            style={{ height: "150px" }}
                            rows="4"
                            placeholder="Enter Description"
                          />
                          <ErrorMessage
                            name="description"
                            component="div"
                            className="text-danger"
                          />
                        </div>
                      </div>
                    </FormWizard.TabContent>

                    {/* Tab 2 content */}
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
                      {selectedApprovalModule?.code ===
                        "INTERNET_EMAIL_ACCESS" && (
                        <div style={{ minHeight: "300px" }}>
                          <div className="row text-start">
                            <div className="col mb-3">
                              <label
                                htmlFor="attachmentFile"
                                className="form-label"
                              >
                                Attachement ({" "}
                                <small className="text-muted">
                                  Not Mandatory
                                </small>{" "}
                                )
                              </label>
                              <Field
                                type="file"
                                name="request_data.attachment"
                                id="attachmentFile"
                                className="form-control"
                                placeholder="Enter Access Start Date"
                              />
                              <ErrorMessage
                                name="request_data.attachment"
                                component="div"
                                className="text-danger"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      {(selectedApprovalModule?.code === "JEEVA_ACCESS" ||
                        selectedApprovalModule?.code === "EDMS_ACCESS" ||
                        selectedApprovalModule?.code === "WELSOFT_ACCESS") && (
                        <>
                          <div className="ibox-content">
                            <div className="ibox-content-body">
                              <div className="row">
                                <div className="col-sm-11 text-start mb-4">
                                  <h5 className="text-muted">
                                    Instructions for Selecting Groups, Modules
                                    and Permissions
                                  </h5>
                                  <p className="">
                                    {isSelectModuleView
                                      ? `Select a module from the left to view its permissions. Check the permissions you want to request. Click the Preview button to see a list of your selected modules and permissions. You may also select permissions by choosing your associated group.`
                                      : `Select permissions by choosing your associated group then click the Preview button to check Associated Modules and Permissions. You can edit or change option using right buttons.`}
                                  </p>
                                </div>

                                <div className="col-sm-8">
                                  {(errors?.request_data?.grants ||
                                    selectedModules.length === 0) &&
                                    touched["request_data.grants"] && (
                                      <div className="alert alert-danger">
                                        {errors.request_data.grants}
                                      </div>
                                    )}
                                  {isSelectModuleView ? (
                                    <div className="row h-100">
                                      <div
                                        className="col-sm-6"
                                        style={{ minWidth: "280px" }}
                                      >
                                        <Select
                                          isLoading={loadingPermissions}
                                          closeMenuOnSelect={false}
                                          expandOnFocus={false}
                                          name="request_data.grants"
                                          isSearchable
                                          isMulti
                                          menuIsOpen={true}
                                          className="select2-selection fetched-select2"
                                          options={leftOptions}
                                          value={selectedLeft}
                                          onChange={(selected, action) => {
                                            setSelectedLeft(selected);
                                            // Remove highlight if chip is removed
                                            if (
                                              action &&
                                              action.removedValue &&
                                              activeChip ===
                                                action.removedValue.value
                                            ) {
                                              setSelectedModules([]);
                                              setActiveChip(null);
                                              setActiveModulePermissions([]);
                                              setActiveChipLabel(null);
                                            }

                                            // Clear all selected modules if Select is cleared
                                            if (
                                              action &&
                                              action.action === "clear"
                                            ) {
                                              setSelectedModules([]);
                                              setActiveChip(null);
                                              setActiveModulePermissions([]);
                                              setActiveChipLabel(null);
                                            }

                                            if (action && action.option) {
                                              handleChipClick(
                                                action.option.value,
                                                action.option.label
                                              );
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
                                              minHeight: "300px",
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
                                          components={{
                                            MultiValue: CustomMultiValue,
                                          }}
                                        />
                                      </div>

                                      <div
                                        className="col-sm-6 text-start pe-3"
                                        style={{
                                          minWidth: "300px",
                                          marginTop: "0px",
                                        }}
                                      >
                                        <div className="d-grid gap-2 col-lg-12 mx-auto">
                                          <button
                                            type="button"
                                            className="btn btn-outline-info btn-secondary btn-sm btn-block"
                                          >
                                            <span
                                              className="fw-medium"
                                              style={{ fontSize: "16px" }}
                                            >
                                              {" "}
                                              {activeChipLabel
                                                ? `Permissions For ${activeChipLabel}`
                                                : `No Selected Module`}
                                            </span>
                                          </button>
                                        </div>
                                        <div
                                          className="list-group list-group-flush mt-3 shadow "
                                          style={{
                                            height: "300px",
                                            overflowY: "hidden",
                                          }}
                                        >
                                          <label className="list-group-item me-3 text-secondary btn-outline-info">
                                            {activeModulePermissions.length ===
                                            0 ? (
                                              <input
                                                className="form-check-input me-1"
                                                type="checkbox"
                                                disabled
                                                readOnly
                                              />
                                            ) : (
                                              <input
                                                className="form-check-input me-1 p-2 bg-secondary"
                                                type="checkbox"
                                                disabled={
                                                  activeModulePermissions.length ===
                                                  0
                                                }
                                                checked={isAllPermissionsChecked()}
                                                onChange={(e) =>
                                                  handleSelectAllPermissions(
                                                    e.target.checked
                                                  )
                                                }
                                              />
                                            )}
                                            Select All Permission
                                          </label>

                                          <div
                                            className="list-group list-group-flush mt-3 shadow  pe-3"
                                            style={{
                                              height: "250px",
                                              overflowY: "auto",
                                            }}
                                          >
                                            {activeModulePermissions.length ===
                                            0 ? (
                                              <div
                                                className="demo-inline-spacing shadow text-center"
                                                style={{
                                                  height: "240px",
                                                  display: "flex",
                                                  alignItems: "center",
                                                  fontSize: "16px",
                                                }}
                                              >
                                                <div className="w-100 text-center text-light p-4">
                                                  Select a Module to view
                                                  Permissions
                                                </div>
                                              </div>
                                            ) : (
                                              activeModulePermissions.map(
                                                (perm) => (
                                                  <label
                                                    className="list-group-item"
                                                    key={perm.codename}
                                                  >
                                                    <input
                                                      className="form-check-input me-1"
                                                      type="checkbox"
                                                      value={perm.codename}
                                                      checked={isPermissionChecked(
                                                        perm
                                                      )}
                                                      onChange={(e) =>
                                                        handlePermissionToggle(
                                                          perm,
                                                          e.target.checked
                                                        )
                                                      }
                                                    />
                                                    {perm.name}
                                                  </label>
                                                )
                                              )
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="row h-100 center">
                                      <div className="col-sm-11 animate__animated animate__fadeInDown animate__fast">
                                        <div
                                          className="d-flex"
                                          style={{ marginLeft: "50px" }}
                                        >
                                          <div className="input-group">
                                            <span className="input-group-text">
                                              <i className="tf-icons bx bx-search"></i>
                                            </span>
                                            <input
                                              type="search"
                                              className="form-control"
                                              placeholder="Search groups, modules or permissions..."
                                              value={groupSearch}
                                              onChange={(e) =>
                                                setGroupSearch(e.target.value)
                                              }
                                            />
                                          </div>
                                        </div>
                                      </div>
                                      <div
                                        className="col-sm-12 row g-3 shadow m-3 p-4"
                                        style={{
                                          height: "400px",
                                          minWidth: "400px",
                                          border:
                                            "1px solid rgba(142, 145, 148, 0.45)",
                                          borderRadius: "10px",
                                          overflowY: "auto",
                                        }}
                                      >
                                        {filteredGroups.map((group, idx) => (
                                          <div
                                            key={group.uid}
                                            className="col-12 col-sm-6 mb-3"
                                          >
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setSelectedPermissionGroup(idx);

                                                // Select all modules in Select
                                                const groupModuleOptions =
                                                  group.modules.map((mod) => ({
                                                    value: mod.codename,
                                                    label: mod.name,
                                                  }));
                                                setSelectedLeft(
                                                  groupModuleOptions
                                                );

                                                // Select all modules and permissions (for checked state)
                                                setSelectedModules(
                                                  group.modules.map((mod) => ({
                                                    codename: mod.codename,
                                                    name: mod.name,
                                                    Permissions: [
                                                      ...mod.Permissions,
                                                    ],
                                                  }))
                                                );

                                                // Set first module as active chip and show all possible permissions
                                                if (group.modules.length > 0) {
                                                  const firstModule =
                                                    group.modules[0];
                                                  setActiveChip(
                                                    firstModule.codename
                                                  );
                                                  setActiveChipLabel(
                                                    firstModule.name
                                                  );

                                                  // Find all possible permissions for this module from longData
                                                  const allPermsModule =
                                                    longData.Modules.find(
                                                      (m) =>
                                                        m.codename ===
                                                        firstModule.codename
                                                    );
                                                  setActiveModulePermissions(
                                                    allPermsModule
                                                      ? allPermsModule.Permissions
                                                      : []
                                                  );
                                                } else {
                                                  setActiveChip(null);
                                                  setActiveChipLabel(null);
                                                  setActiveModulePermissions(
                                                    []
                                                  );
                                                }
                                              }}
                                              className={`btn btn-md btn-outline-secondary animate__animated animate__fadeInUp ${
                                                idx === selectedPermissionGroup
                                                  ? "active"
                                                  : ""
                                              } w-100 text-start`}
                                              style={{
                                                minHeight: "110px",
                                                marginBottom: "8px",
                                                animationDelay: `${
                                                  idx * 0.25
                                                }s`, // Staggered animation
                                                WebkitAnimationDelay: `${
                                                  idx * 0.25
                                                }s`,
                                              }}
                                            >
                                              <div className="m-1 p-1 d-flex justify-content-center">
                                                <i className="bx bx-user bx-x1 bx-lg"></i>
                                              </div>
                                              <div
                                                className="d-flex flex-column text-start"
                                                style={{ width: "85%" }}
                                              >
                                                <span className="fw-bold">
                                                  {group.name}
                                                </span>
                                                <span className="small mb-1">
                                                  Modules Assigned:{" "}
                                                  {group.modules.length}
                                                </span>
                                                <span className="small">
                                                  {group.modules.length > 0 ? (
                                                    <span>
                                                      (&nbsp;
                                                      {group.modules
                                                        .slice(0, 3)
                                                        .map(
                                                          (module, modid) => (
                                                            <span
                                                              key={
                                                                module.codename ||
                                                                modid
                                                              }
                                                              className="fw-bold me-1 mb-1"
                                                              style={{
                                                                fontSize:
                                                                  "0.85em",
                                                              }}
                                                            >
                                                              {module.name},
                                                            </span>
                                                          )
                                                        )}{" "}
                                                      {group.modules.length > 3
                                                        ? `...`
                                                        : ``}
                                                      &nbsp;)
                                                    </span>
                                                  ) : (
                                                    <span className="text-muted">
                                                      No modules
                                                    </span>
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
                                    alignItems: "center", // Center horizontally
                                  }}
                                >
                                  <button
                                    type="button"
                                    className="btn btn-primary btn-sm btn-preview m-2"
                                    onClick={() => setShowPreviewModal(true)}
                                    title="Preview"
                                  >
                                    <i className="bx bx-list-ol"></i> Preview
                                    Selected Permissions
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
                                          setSelectedModules([]);
                                          setActiveChip(null);
                                          setActiveModulePermissions([]);
                                          setActiveChipLabel(null);
                                          setIsSelectModuleView(false);
                                          setSelectedLeft([]); // <- CLEAR SELECTED MODULES IN SELECT
                                          setFieldValue(
                                            "request_data.grants",
                                            []
                                          );
                                        }
                                      }}
                                      title="Assign"
                                    >
                                      <i className="bx bx-group"></i> Copy
                                      Permission From Group
                                    </button>
                                  ) : isSelectModuleView === false &&
                                    selectedPermissionGroup !== null &&
                                    selectedPermissionGroup !== undefined ? (
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
                                          setActiveChip(null);
                                          setActiveModulePermissions([]);
                                          setActiveChipLabel(null);
                                          setIsSelectModuleView(true);
                                        }
                                      }}
                                      title="Assign"
                                    >
                                      <i className="bx bx-user-plus"></i> Edit
                                      Selected Group Permission
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
                                          setSelectedPermissionGroup(null);
                                          setSelectedModules([]);
                                          setActiveChip(null);
                                          setActiveModulePermissions([]);
                                          setActiveChip(null);
                                          setActiveChipLabel(null);
                                        }
                                      }}
                                      title="Manually Select"
                                    >
                                      <i className="bx bx-poll"></i> Select
                                      Permission Manually
                                    </button>
                                  )}

                                  {selectedModules.length !== 0 && (
                                    <button
                                      id="assignButton"
                                      type="button"
                                      className="btn btn-danger btn-sm btn-assign m-2"
                                      onClick={() => {
                                        setSelectedModules([]);
                                        setActiveChip(null);
                                        setActiveModulePermissions([]);
                                        setActiveChipLabel(null);
                                        setSelectedPermissionGroup(null);
                                        setSelectedLeft([]); // <- CLEAR SELECTED MODULES IN SELECT
                                      }}
                                      title="Assign"
                                    >
                                      <i className="bx bx-trash-alt"></i> Clear
                                      Selection
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
                          <span className="small">Declaration & Submit</span>
                        </div>
                      }
                      icon="ti-check"
                      isValid={isValidTab[1]}
                      showErrorOnTab={tabsError[2]}
                    >
                      {/* Tab 3 content */}
                      <div className="row text-start">
                        <div className="col-sm-12 text-start mb-4">
                          <h5 className="text-bold mb-2">APPENDIX</h5>
                          <div className="p-3">
                            <h5 className="text-bold mb-2">
                              Declarations by Staff{" "}
                            </h5>
                            <p className="me-2 text-justify">
                              These declarations have been designed to certify
                              that users acknowledge that they are aware of{" "}
                              <strong className="text-bold">MNH</strong>,
                              Acceptable information and communication
                              technology use policy, and agree to abide by their
                              terms.
                            </p>
                            <p className="me-2 text-justify">
                              I{" "}
                              <span
                                style={{
                                  display: "inline-block",
                                  fontWeight: "bold",
                                  borderBottom: "1px solid rgb(111, 121, 133)",
                                  textAlign: "center",
                                  paddingLeft: "10px",
                                  paddingRight: "10px",
                                }}
                              >
                                &nbsp; &nbsp;{" "}
                                {`${user?.first_name} ${
                                  user?.middle_name ?? ""
                                } ${user?.last_name}`}{" "}
                                &nbsp; &nbsp;
                              </span>{" "}
                              acknowledge that{" "}
                              <strong className="text-bold">MNH</strong>,
                              acceptable ICT use policy has been made available
                              to me for adequate review and understanding. I
                              certify that I have been given ample opportunity
                              to read and understand it and ask questions about
                              my responsibilities on it. Therefore, I am aware
                              that I am countable to all its terms and
                              requirements; and shall abide by them. I also
                              understand that failure to abide by them;{" "}
                              <strong className="text-bold">MNH</strong>, shall
                              take against me appropriate disciplinary action or
                              legal action, or both.
                            </p>
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-sm-1"></div>
                          <div
                            onClick={() => {
                              setShowTermConditionModal(true);
                            }}
                            style={{
                              cursor: "pointer",
                              display: "flex",
                              borderRight: "0.5px solid rgb(141, 184, 233)",
                            }}
                            className="col-sm-4  me-3"
                          >
                            <span className="me-2">
                              <i className="bx bx-check-shield bx-md"></i>
                            </span>
                            <div className="d-flex flex-column text-start">
                              <span className="fw-bold">
                                Read Terms & Conditions
                              </span>
                              <span className="small">
                                Read before Submitting Form
                              </span>
                            </div>
                          </div>
                          <div
                            style={{ cursor: "pointer" }}
                            className="col-sm-6 form-check mb-3"
                          >
                            <Field
                              type="checkbox"
                              name="request_data.is_read_term"
                              id="isReadTerm"
                              className="form-check-input"
                              checked={
                                values.request_data?.is_read_term || false
                              }
                              onChange={() => {
                                setTouched(
                                  { "request_data.is_read_term": true },
                                  false
                                );
                                if (isAgreedTerms) {
                                  setIsAgreedTerms(false);
                                  setFieldValue(
                                    "request_data.is_read_term",
                                    false
                                  );
                                } else {
                                  setIsAgreedTerms(true);
                                  setFieldValue(
                                    "request_data.is_read_term",
                                    true
                                  );
                                }
                              }}
                            />
                            <label
                              htmlFor="isReadTerm"
                              className="form-check-label fw-bold"
                            >
                              I have read and understood the Terms and
                              Conditions
                            </label>
                            {!isAgreedTerms &&
                              touched["request_data.is_read_term"] && (
                                <div className="text-danger">
                                  {errors?.request_data?.is_read_term}
                                </div>
                              )}
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
                      <div className="text-center text-muted">
                        No permissions selected.
                      </div>
                    ) : (
                      <div className="row g-4">
                        <p className="text-muted">
                          Here is the list of permissions selected for your
                          request. These are the permissions that will be
                          included in your submission. Please review them
                          carefully before submitting your request.
                        </p>
                        {selectedModules.map((mod) => (
                          <div
                            key={mod.codename}
                            className="col-12 col-sm-6 col-md-4 col-lg-"
                          >
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
                                    textAlign: "left",
                                  }}
                                >
                                  <ul className="list-group list-group-flush small">
                                    {mod.Permissions.map((perm) => (
                                      <li
                                        key={perm.codename}
                                        className="list-group-item py-1 px-2"
                                      >
                                        <i
                                          className="bx bx-check-shield me-2"
                                          style={{
                                            color: "#696cff",
                                            fontSize: "1.1em",
                                          }}
                                        ></i>
                                        {perm.name}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                {/* Optional: Show count of permissions */}
                                <div className="mt-2 text-end small text-muted">
                                  {mod.Permissions.length} permission
                                  {mod.Permissions.length > 1 ? "s" : ""}
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

      {showTermConditionModal && (
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
          <div
            className="modal-dialog modal-xl"
            id="previewTermConditions"
            role="document"
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Terms and Conditions</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowTermConditionModal(false);
                  }}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                {showTermConditionModal === true && (
                  <div
                    className="col-md-12 mb-4"
                    style={{ minHeight: "500px" }}
                  >
                    <p className="p fw-bold mb-3">
                      Read Carefull and Accept all part before submitting your
                      form
                    </p>
                    <PDFViewer fileUrl="/assets/doc/MNH_ICT_Security_Policy.pdf" />
                  </div>
                )}
                <div className="text-center">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm btn-close-preview m-2"
                    onClick={() => {
                      setShowTermConditionModal(false);
                    }}
                  >
                    <i className="bx bx-check-shield"></i> &nbsp;Continue with
                    Form
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
