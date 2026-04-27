import React, { useState, useEffect, useCallback } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../../../helpers/ToastHelper";
import FormikSelect from "../../../../components/ui-templates/form-components/FormikSelect";
import { createApplication, updateApplication } from "./Queries";
import FormWizard from "react-form-wizard-component";
import "react-form-wizard-component/dist/style.css";

const validationSchema = Yup.object().shape({
    student_uid: Yup.string().required("Student is required"),
    application_number: Yup.string().nullable(),
    placement_type: Yup.string().required("Placement Type is required"),
    category: Yup.string().required("Category is required"),
    from_date: Yup.date().required("Start Date is required"),
    to_date: Yup.date().required("End Date is required"),
    duration: Yup.number().nullable(),
    campus: Yup.string().required("Campus is required"),
    departments: Yup.array().min(1, "Select at least one department"),
    expected_amount: Yup.number().required("Amount is required").positive(),
    currency: Yup.string().required("Currency is required"),
});

export const ApplicationModal = ({ application = null, onSuccess, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [backendErrors, setBackendErrors] = useState({});
    const [tabsError, setTabsError] = useState([false, false, false, false, false]);
    const [isValidTab, setIsValidTab] = useState([false, false, false, false, false]);
    const [isFirstTabChange, setIsFirstTabChange] = useState(true);
    const [tabIndex, setTabIndex] = useState(0);
    const [selectedDepartments, setSelectedDepartments] = useState([]);

    useEffect(() => {
        setTabIndex(0);
        setTabsError([false, false, false, false, false]);
        setIsValidTab([false, false, false, false, false]);
        setIsFirstTabChange(true);
        setBackendErrors({});
        // Initialize selectedDepartments from existing application data
        if (application?.department_details?.length > 0) {
            setSelectedDepartments(
                application.department_details.map(dept => ({
                    value: dept.uid,
                    label: dept.name
                }))
            );
        } else {
            setSelectedDepartments([]);
        }
    }, [application]);

    const initialValues = {
        student_uid: application?.student?.uid || application?.student_uid || "",
        application_number: application?.application_number || "",
        placement_type: application?.placement_type || "",
        category: application?.category || "",
        from_date: application?.from_date || "",
        to_date: application?.to_date || "",
        duration: application?.duration || "",
        campus: application?.campus || "",
        departments: application?.department_uids || [],
        expected_amount: application?.expected_amount || "",
        currency: application?.currency_uid || application?.currency?.uid || "",
        supporting_letter: null,
    };

    const placementTypeOptions = [
        { value: 'EL', label: 'Elective' },
        { value: 'PT', label: 'Practical Training' },
        { value: 'PG', label: 'Postgraduate' },
    ];

    const categoryOptions = [
        { value: 'CL', label: 'Clinical' },
        { value: 'NL', label: 'Non-clinical' },
    ];

    const campusOptions = [
        { value: 'UP', label: 'Upanga' },
        { value: 'ML', label: 'Mloganzila' },
        { value: 'BO', label: 'Both' },
    ];

    const defaultFilters = { page: 1, page_size: 100, paginated: true };

    const validateTab = useCallback(async (values, setFieldError, setTouched) => {
        try {
            if (tabIndex === 1) {
                await validationSchema.validateAt("student_uid", values);
            }
            if (tabIndex === 2) {
                await validationSchema.validateAt("placement_type", values);
                await validationSchema.validateAt("category", values);
                await validationSchema.validateAt("from_date", values);
                await validationSchema.validateAt("to_date", values);
            }
            if (tabIndex === 3) {
                await validationSchema.validateAt("campus", values);
                await validationSchema.validateAt("departments", values);
            }
            if (tabIndex === 4) {
                await validationSchema.validateAt("expected_amount", values);
                await validationSchema.validateAt("currency", values);
            }
            if (tabIndex === 5) {
                // Review tab - no specific validation needed
                return true;
            }
            return true;
        } catch (err) {
            if (err.path && err.message) {
                setTouched({ [err.path]: true }, false);
                setFieldError(err.path, err.message);
            }
            return false;
        }
    }, [tabIndex]);

    const tabChanged = useCallback(
        async (
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

            setTimeout(() => {
                if (isValid) {
                    setIsValidTab((prev) => {
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
                        handleSubmit(values, { setSubmitting, resetForm, setErrors, setTouched });
                    } else {
                        handleNext();
                    }
                } else {
                    setIsValidTab((prev) => {
                        const updated = [...prev];
                        updated[tabIndex - 1] = false;
                        return updated;
                    });
                    setTabsError((prev) => {
                        const updated = [...prev];
                        updated[tabIndex - 1] = true;
                        return updated;
                    });
                }
            }, 0);

            return isValid;
        },
        [tabIndex, isFirstTabChange, validateTab]
    );

    const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
        setLoading(true);
        setBackendErrors({});

        try {
            // Ensure departments is always an array
            const departments = Array.isArray(values.departments)
                ? values.departments
                : (values.departments ? [values.departments] : []);

            // Check if we have a file to upload
            const hasFile = values.supporting_letter instanceof File;

            let payload;
            if (hasFile) {
                // Use FormData for file uploads
                payload = new FormData();
                payload.append('student_uid', values.student_uid);
                if (values.application_number) payload.append('application_number', values.application_number);
                payload.append('placement_type', values.placement_type);
                payload.append('category', values.category);
                payload.append('from_date', values.from_date);
                payload.append('to_date', values.to_date);
                if (values.duration) payload.append('duration', values.duration);
                payload.append('campus', values.campus);
                payload.append('expected_amount', values.expected_amount);
                payload.append('currency_uid', values.currency);
                departments.forEach((dept) => {
                    payload.append('departments', dept);
                });
                payload.append('supporting_letter', values.supporting_letter);
            } else {
                // Use JSON for regular data
                payload = {
                    student_uid: values.student_uid,
                    placement_type: values.placement_type,
                    category: values.category,
                    from_date: values.from_date,
                    to_date: values.to_date,
                    campus: values.campus,
                    expected_amount: values.expected_amount,
                    currency_uid: values.currency,
                    departments: departments,
                };
                if (values.application_number) payload.application_number = values.application_number;
                if (values.duration) payload.duration = values.duration;
            }

            let result;
            if (application?.uid) {
                result = await updateApplication(application.uid, payload);
                showToast("Application updated successfully", "success", "Complete");
            } else {
                result = await createApplication(payload);
                showToast("Application created successfully", "success", "Complete");
            }

            handleClose();
            resetForm();
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error("Error saving application:", err);

            if (err.response?.data?.status === 8002 && err.response?.data?.data) {
                setBackendErrors(err.response.data.data);
                setErrors(err.response.data.data);
                showToast("Please fix validation errors", "error", "Validation Failed");
            } else {
                const errorMessage = err.response?.data?.message || "Failed to save application";
                showToast(errorMessage, "error", "Failed");
            }
        } finally {
            setLoading(false);
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setIsFirstTabChange(true);
        setTabIndex(0);
        setTabsError([false, false, false, false, false]);
        setIsValidTab([false, false, false, false, false]);
        setBackendErrors({});
        setSelectedDepartments([]);
        const modalElement = document.getElementById("applicationModal");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) modalInstance.hide();
        if (onClose) onClose();
    };

    const calculateDuration = (fromDate, toDate) => {
        if (fromDate && toDate) {
            const start = new Date(fromDate);
            const end = new Date(toDate);
            const diffTime = Math.abs(end - start);
            const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
            return diffWeeks;
        }
        return null;
    };

    const calculateEndDate = (fromDate, weeks) => {
        if (fromDate && weeks) {
            const start = new Date(fromDate);
            const end = new Date(start.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
            return end.toISOString().split('T')[0];
        }
        return null;
    };

    return (
        <div
            className="modal modal-slide-in"
            id="applicationModal"
            tabIndex="-1"
            data-bs-backdrop="static"
            data-bs-keyboard="false"
        >
            <div className="modal-dialog modal-xl" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="bx bx-file-blank me-2"></i>
                            {application ? "Update Application" : "Create New Application"}
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
                                    color="#00853f"
                                    stepSize="xs"
                                    onTabChange={({ prevIndex, nextIndex }) => {
                                        setTimeout(() => setTabIndex(nextIndex), 0);
                                    }}
                                    backButtonTemplate={(handlePrevious) => (
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-primary"
                                            style={{ width: "100px" }}
                                            onClick={handlePrevious}
                                        >
                                            <i className="bx bx-left-arrow-alt"></i> Back
                                        </button>
                                    )}
                                    nextButtonTemplate={(handleNext) => (
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-primary"
                                            style={{ width: "100px", marginLeft: "auto" }}
                                            onClick={async () =>
                                                await tabChanged(
                                                    { handleNext },
                                                    values,
                                                    setSubmitting,
                                                    resetForm,
                                                    setErrors,
                                                    setFieldError,
                                                    setTouched,
                                                    5
                                                )
                                            }
                                        >
                                            Next <i className="bx bx-right-arrow-alt"></i>
                                        </button>
                                    )}
                                    finishButtonTemplate={(handleNext) => (
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-primary"
                                            style={{ width: "150px", marginLeft: "auto" }}
                                            disabled={isSubmitting || loading}
                                            onClick={async () =>
                                                await tabChanged(
                                                    { handleNext },
                                                    values,
                                                    setSubmitting,
                                                    resetForm,
                                                    setErrors,
                                                    setFieldError,
                                                    setTouched,
                                                    5
                                                )
                                            }
                                        >
                                            {isSubmitting || loading ? (
                                                <>
                                                    <i className="bx bx-loader-alt bx-spin"></i> Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bx bx-save"></i> {application ? "Update" : "Save"}
                                                </>
                                            )}
                                        </button>
                                    )}
                                >
                                    {/* Step 1: Student Information */}
                                    <FormWizard.TabContent
                                        title="Student"
                                        icon="bx bx-user"
                                        showErrorOnTab={tabsError[0]}
                                    >
                                        <div className="row text-start">
                                            <FormikSelect
                                                name="student_uid"
                                                label="Student *"
                                                url="/api/training/students"
                                                isFullPath={true}
                                                filters={defaultFilters}
                                                mapOption={(item) => ({
                                                    value: item?.uid,
                                                    label: `${item?.first_name} ${item?.last_name} (${item?.student_id})`,
                                                })}
                                                placeholder="Select Student..."
                                                containerClass="col-md-12 mb-3"
                                                isRequired={true}
                                            />
                                            <div className="col-md-12 mb-3">
                                                <label htmlFor="application_number" className="form-label">Application Number</label>
                                                <Field
                                                    type="text"
                                                    name="application_number"
                                                    className="form-control"
                                                    placeholder="e.g., APP-2025-001"
                                                />
                                            </div>
                                        </div>
                                    </FormWizard.TabContent>

                                    {/* Step 2: Placement Details */}
                                    <FormWizard.TabContent
                                        title="Placement"
                                        icon="bx bx-briefcase"
                                        isValid={isValidTab[0]}
                                        showErrorOnTab={tabsError[1]}
                                    >
                                        <div className="row text-start">
                                            <div className="col-md-6 mb-3">
                                                <label htmlFor="placement_type" className="form-label">Placement Type *</label>
                                                <Field as="select" name="placement_type" className="form-select">
                                                    <option value="">-- Select --</option>
                                                    {placementTypeOptions.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </Field>
                                                <ErrorMessage name="placement_type" component="div" className="text-danger" />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label htmlFor="category" className="form-label">Category *</label>
                                                <Field as="select" name="category" className="form-select">
                                                    <option value="">-- Select --</option>
                                                    {categoryOptions.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </Field>
                                                <ErrorMessage name="category" component="div" className="text-danger" />
                                            </div>
                                        </div>
                                        <div className="row text-start">
                                            <div className="col-md-4 mb-3">
                                                <label htmlFor="from_date" className="form-label">Start Date *</label>
                                                <Field
                                                    type="date"
                                                    name="from_date"
                                                    className="form-control"
                                                    onChange={(e) => {
                                                        setFieldValue("from_date", e.target.value);
                                                        const duration = calculateDuration(e.target.value, values.to_date);
                                                        if (duration !== null) {
                                                            setFieldValue("duration", duration);
                                                        }
                                                    }}
                                                />
                                                <ErrorMessage name="from_date" component="div" className="text-danger" />
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <label htmlFor="to_date" className="form-label">End Date *</label>
                                                <Field
                                                    type="date"
                                                    name="to_date"
                                                    className="form-control"
                                                    onChange={(e) => {
                                                        setFieldValue("to_date", e.target.value);
                                                        const duration = calculateDuration(values.from_date, e.target.value);
                                                        if (duration !== null) {
                                                            setFieldValue("duration", duration);
                                                        }
                                                    }}
                                                />
                                                <ErrorMessage name="to_date" component="div" className="text-danger" />
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <label htmlFor="duration" className="form-label">Duration (weeks)</label>
                                                <Field
                                                    type="number"
                                                    name="duration"
                                                    className="form-control"
                                                    placeholder="Auto-calculated"
                                                    min="1"
                                                    max="52"
                                                    onChange={(e) => {
                                                        setFieldValue("duration", e.target.value);
                                                        const endDate = calculateEndDate(values.from_date, e.target.value);
                                                        if (endDate !== null) {
                                                            setFieldValue("to_date", endDate);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </FormWizard.TabContent>

                                    {/* Step 3: Location & Department */}
                                    <FormWizard.TabContent
                                        title="Location"
                                        icon="bx bx-map"
                                        isValid={isValidTab[1]}
                                        showErrorOnTab={tabsError[2]}
                                    >
                                        <div className="row text-start">
                                            <div className="col-md-6 mb-3">
                                                <label htmlFor="campus" className="form-label">Campus *</label>
                                                <Field as="select" name="campus" className="form-select">
                                                    <option value="">-- Select --</option>
                                                    {campusOptions.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </Field>
                                                <ErrorMessage name="campus" component="div" className="text-danger" />
                                            </div>
                                            <FormikSelect
                                                name="departments"
                                                label="Departments *"
                                                url="/user/departments"
                                                isFullPath={true}
                                                filters={defaultFilters}
                                                mapOption={(item) => ({
                                                    value: item?.uid || item?.id,
                                                    label: item?.name,
                                                })}
                                                placeholder="Select Departments..."
                                                containerClass="col-md-6 mb-3"
                                                isMulti={true}
                                                onSelectObject={(selected) => {
                                                    setSelectedDepartments(Array.isArray(selected) ? selected : []);
                                                }}
                                            />
                                        </div>
                                    </FormWizard.TabContent>

                                    {/* Step 4: Financial Information */}
                                    <FormWizard.TabContent
                                        title="Financial"
                                        icon="bx bx-money"
                                        isValid={isValidTab[2]}
                                        showErrorOnTab={tabsError[3]}
                                    >
                                        <div className="row text-start">
                                            <div className="col-md-6 mb-3">
                                                <label htmlFor="expected_amount" className="form-label">Expected Amount *</label>
                                                <Field
                                                    type="number"
                                                    name="expected_amount"
                                                    className="form-control"
                                                    placeholder="0.00"
                                                    step="0.01"
                                                    min="0"
                                                />
                                                <ErrorMessage name="expected_amount" component="div" className="text-danger" />
                                            </div>
                                            <FormikSelect
                                                name="currency"
                                                label="Currency *"
                                                url="/currencies"
                                                isFullPath={false}
                                                filters={defaultFilters}
                                                mapOption={(item) => ({
                                                    value: item?.uid,
                                                    label: `${item?.code} - ${item?.name}`,
                                                })}
                                                placeholder="Select Currency..."
                                                containerClass="col-md-6 mb-3"
                                                isRequired={true}
                                            />
                                        </div>
                                    </FormWizard.TabContent>

                                    {/* Step 5: Review & Summary */}
                                    <FormWizard.TabContent
                                        title="Review"
                                        icon="bx bx-check"
                                        isValid={isValidTab[3]}
                                        showErrorOnTab={tabsError[4]}
                                    >
                                        <div className="row text-start">
                                            <div className="col-md-12">
                                                <div className="alert alert-info">
                                                    <h6 className="mb-3"><i className="bx bx-info-circle me-2"></i>Application Summary</h6>
                                                    <div className="row g-3">
                                                        <div className="col-md-6">
                                                            <small><strong>Placement Type:</strong></small>
                                                            <p>{placementTypeOptions.find(o => o.value === values.placement_type)?.label || 'Not selected'}</p>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <small><strong>Category:</strong></small>
                                                            <p>{categoryOptions.find(o => o.value === values.category)?.label || 'Not selected'}</p>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <small><strong>Campus:</strong></small>
                                                            <p>{campusOptions.find(o => o.value === values.campus)?.label || 'Not selected'}</p>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <small><strong>Duration:</strong></small>
                                                            <p>{values.duration ? `${values.duration} weeks` : 'Not set'}</p>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <small><strong>Start Date:</strong></small>
                                                            <p>{values.from_date || 'Not set'}</p>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <small><strong>End Date:</strong></small>
                                                            <p>{values.to_date || 'Not set'}</p>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <small><strong>Expected Amount:</strong></small>
                                                            <p>{values.expected_amount ? `${values.expected_amount}` : '0.00'}</p>
                                                        </div>
                                                        <div className="col-md-12">
                                                            <small><strong>Departments:</strong></small>
                                                            <p>{selectedDepartments && selectedDepartments.length > 0 
                                                                ? selectedDepartments.map(d => d.label).join(', ') 
                                                                : 'No departments selected'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </FormWizard.TabContent>
                                </FormWizard>

                                {backendErrors && Object.keys(backendErrors).length > 0 && (
                                    <div className="alert alert-danger mx-3">
                                        {Object.entries(backendErrors).map(([field, messages]) => (
                                            <div key={field}>
                                                <strong>{field.replace(/_/g, ' ')}:</strong> {Array.isArray(messages) ? messages.join(', ') : messages}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <style dangerouslySetInnerHTML={{
                                    __html: `
                                    .form-control, .form-select {
                                        height: 36px;
                                        padding: 0.375rem 0.75rem;
                                        font-size: 1rem;
                                    }
                                    .form-label {
                                        text-align: start !important;
                                    }
                                    .wizard-card-footer {
                                        display: flex;
                                        justify-content: space-between;
                                        align-items: center;
                                        padding: 2rem 2.5rem;
                                        width: 100%;
                                    }
                                `}} />
                            </Form>
                        )}
                    </Formik>
                </div>
            </div>
        </div>
    );
};
