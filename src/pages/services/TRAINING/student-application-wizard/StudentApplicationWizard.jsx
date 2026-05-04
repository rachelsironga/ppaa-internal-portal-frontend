import React, { useState, useCallback } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Swal from "sweetalert2";
import showToast from "../../../../helpers/ToastHelper";
import FormikSelect from "../../../../components/ui-templates/form-components/FormikSelect";
import FormWizard from "react-form-wizard-component";
import "react-form-wizard-component/dist/style.css";
import { createStudent } from "../students/Queries";
import { createApplication } from "../applications/Queries";

const validationSchema = Yup.object().shape({
    // Student Information
    first_name: Yup.string().required("First name is required").min(2, "Too short"),
    last_name: Yup.string().required("Last name is required").min(2, "Too short"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    primary_phone: Yup.string().required("Phone is required"),
    sex: Yup.string().required("Sex is required"),
    student_id: Yup.string().required("Student ID is required"),
    nationality: Yup.string().nullable(),

    // Application Information
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

export const StudentApplicationWizard = () => {
    const [loading, setLoading] = useState(false);
    const [backendErrors, setBackendErrors] = useState({});
    const [tabsError, setTabsError] = useState([false, false, false, false, false, false]);
    const [isValidTab, setIsValidTab] = useState([false, false, false, false, false, false]);
    const [isFirstTabChange, setIsFirstTabChange] = useState(true);
    const [tabIndex, setTabIndex] = useState(0);

    const initialValues = {
        // Student Information
        first_name: "",
        middle_name: "",
        last_name: "",
        email: "",
        primary_phone: "",
        secondary_phone: "",
        sex: "",
        student_id: "",
        id_type: "",
        nationality: "",
        type: "",
        are_you_currently_studying: false,
        institution_uid: "",
        bio: "",
        profile_picture: null,
        copy_of_id: null,

        // Application Information
        placement_type: "",
        category: "",
        from_date: "",
        to_date: "",
        duration: "",
        campus: "",
        departments: [],
        expected_amount: "",
        currency: "",
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

    const validateTab = useCallback(async (values, setFieldError, setTouched) => {
        try {
            if (tabIndex === 1) {
                await validationSchema.validateAt("first_name", values);
                await validationSchema.validateAt("last_name", values);
                await validationSchema.validateAt("email", values);
                await validationSchema.validateAt("primary_phone", values);
                await validationSchema.validateAt("sex", values);
                await validationSchema.validateAt("student_id", values);
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
            if (tabIndex === 5 || tabIndex === 6) {
                // Review tabs - no specific validation needed
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
            // Step 1: Create Student
            const studentFormData = new FormData();

            const studentFields = [
                'first_name', 'middle_name', 'last_name', 'email', 'primary_phone',
                'secondary_phone', 'sex', 'student_id', 'id_type', 'are_you_currently_studying', 'bio'
            ];

            studentFields.forEach(field => {
                if (values[field] !== null && values[field] !== undefined && values[field] !== '') {
                    studentFormData.append(field, values[field]);
                }
            });

            if (values.nationality) {
                studentFormData.append('nationality_uid', values.nationality);
            }

            if (values.institution_uid) {
                studentFormData.append('institution_uid', values.institution_uid);
            }

            if (values.profile_picture instanceof File) {
                studentFormData.append('profile_picture', values.profile_picture);
            }

            if (values.copy_of_id instanceof File) {
                studentFormData.append('copy_of_id', values.copy_of_id);
            }

            const studentResult = await createStudent(studentFormData);
            const studentUid = studentResult?.uid || studentResult?.data?.uid;

            if (!studentUid) {
                throw new Error('Failed to create student - no UID returned');
            }

            showToast("Student created successfully", "success", "Complete");

            // Step 2: Create Application with the new student UID
            const departments = Array.isArray(values.departments)
                ? values.departments
                : (values.departments ? [values.departments] : []);

            const applicationFormData = new FormData();
            applicationFormData.append('student_uid', studentUid);
            applicationFormData.append('placement_type', values.placement_type);
            applicationFormData.append('category', values.category);
            applicationFormData.append('from_date', values.from_date);
            applicationFormData.append('to_date', values.to_date);
            applicationFormData.append('duration', values.duration || '');
            applicationFormData.append('campus', values.campus);
            applicationFormData.append('expected_amount', values.expected_amount);
            applicationFormData.append('currency', values.currency);

            if (departments && departments.length > 0) {
                departments.forEach((dept, index) => {
                    applicationFormData.append(`departments[${index}]`, dept);
                });
            }

            if (values.supporting_letter instanceof File) {
                applicationFormData.append('supporting_letter', values.supporting_letter);
            }

            const applicationResult = await createApplication(applicationFormData);
            showToast("Application created successfully", "success", "Complete");

            // Show success message
            await Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Student and Application created successfully',
                confirmButtonText: 'View Dashboard',
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = '/training/dashboard';
                }
            });

            resetForm();
        } catch (err) {
            console.error("Error saving student/application:", err);

            if (err.response?.data?.status === 8002 && err.response?.data?.data) {
                setBackendErrors(err.response.data.data);
                setErrors(err.response.data.data);
                showToast("Please fix validation errors", "error", "Validation Failed");
            } else {
                const errorMessage = err.response?.data?.message || err.message || "Failed to save student/application";
                showToast(errorMessage, "error", "Failed");
            }
        } finally {
            setLoading(false);
            setSubmitting(false);
        }
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
        <div className="container-fluid">
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="card-title">
                                <i className="bx bx-user-plus me-2"></i>
                                Student & Training Application Wizard
                            </h5>
                            <small className="text-muted">
                                Create a new student and apply for training in one streamlined process
                            </small>
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
                                touched
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
                                                className="btn btn-sm btn-outline-primary"
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
                                                        6
                                                    )
                                                }
                                            >
                                                Next <i className="bx bx-right-arrow-alt"></i>
                                            </button>
                                        )}
                                        finishButtonTemplate={(handleNext) => (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-success"
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
                                                        6
                                                    )
                                                }
                                            >
                                                {isSubmitting || loading ? (
                                                    <>
                                                        <i className="bx bx-loader-alt bx-spin"></i> Submitting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="bx bx-save"></i> Submit
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    >
                                        {/* Step 1: Personal Information */}
                                        <FormWizard.TabContent
                                            title="Personal"
                                            icon="bx bx-user"
                                            showErrorOnTab={tabsError[0]}
                                        >
                                            <div className="row text-start">
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label">First Name *</label>
                                                    <Field
                                                        as="input"
                                                        type="text"
                                                        name="first_name"
                                                        className={`form-control ${errors.first_name && touched.first_name ? 'is-invalid' : ''}`}
                                                        placeholder="Gianna"
                                                    />
                                                    <ErrorMessage name="first_name" component="div" className="text-danger" />
                                                </div>

                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label">Last Name *</label>
                                                    <Field
                                                        as="input"
                                                        type="text"
                                                        name="last_name"
                                                        className={`form-control ${errors.last_name && touched.last_name ? 'is-invalid' : ''}`}
                                                        placeholder="Doe"
                                                    />
                                                    <ErrorMessage name="last_name" component="div" className="text-danger" />
                                                </div>
                                            </div>

                                            <div className="row text-start">
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label">Middle Name</label>
                                                    <Field
                                                        as="input"
                                                        type="text"
                                                        name="middle_name"
                                                        className="form-control"
                                                        placeholder="M."
                                                    />
                                                </div>

                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label">Sex *</label>
                                                    <Field
                                                        as="select"
                                                        name="sex"
                                                        className={`form-select ${errors.sex && touched.sex ? 'is-invalid' : ''}`}
                                                    >
                                                        <option value="">-- Select --</option>
                                                        <option value="M">Male</option>
                                                        <option value="F">Female</option>
                                                    </Field>
                                                    <ErrorMessage name="sex" component="div" className="text-danger" />
                                                </div>
                                            </div>

                                            <div className="row text-start">
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label">Email *</label>
                                                    <Field
                                                        as="input"
                                                        type="email"
                                                        name="email"
                                                        className={`form-control ${errors.email && touched.email ? 'is-invalid' : ''}`}
                                                        placeholder="gianna@example.com"
                                                    />
                                                    <ErrorMessage name="email" component="div" className="text-danger" />
                                                </div>

                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label">Primary Phone *</label>
                                                    <Field
                                                        as="input"
                                                        type="tel"
                                                        name="primary_phone"
                                                        className={`form-control ${errors.primary_phone && touched.primary_phone ? 'is-invalid' : ''}`}
                                                        placeholder="+255..."
                                                    />
                                                    <ErrorMessage name="primary_phone" component="div" className="text-danger" />
                                                </div>
                                            </div>

                                            <div className="row text-start">
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label">Secondary Phone</label>
                                                    <Field
                                                        as="input"
                                                        type="tel"
                                                        name="secondary_phone"
                                                        className="form-control"
                                                        placeholder="+255..."
                                                    />
                                                </div>

                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label">Student ID *</label>
                                                    <Field
                                                        as="input"
                                                        type="text"
                                                        name="student_id"
                                                        className={`form-control ${errors.student_id && touched.student_id ? 'is-invalid' : ''}`}
                                                        placeholder="STU-2024-001"
                                                    />
                                                    <ErrorMessage name="student_id" component="div" className="text-danger" />
                                                </div>
                                            </div>

                                            <div className="row text-start">
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label">ID Type</label>
                                                    <Field
                                                        as="select"
                                                        name="id_type"
                                                        className="form-select"
                                                    >
                                                        <option value="">-- Select --</option>
                                                        <option value="P">Passport</option>
                                                        <option value="N">National ID</option>
                                                        <option value="V">Voter ID</option>
                                                        <option value="O">Other</option>
                                                    </Field>
                                                </div>

                                                <FormikSelect
                                                    name="nationality"
                                                    label="Nationality"
                                                    url="/user/countries"
                                                    isFullPath={true}
                                                    staticOptions={[]}
                                                    mapOption={(item) => ({
                                                        value: item?.uid || item?.id,
                                                        label: item?.name,
                                                        ...item
                                                    })}
                                                    placeholder="Select Nationality..."
                                                    containerClass="col-md-6 mb-3"
                                                    onSelectObject={(selected) => {
                                                        if (selected?.name?.toLowerCase() === 'tanzania') {
                                                            setFieldValue('type', 'LC');
                                                        } else if (selected) {
                                                            setFieldValue('type', 'F');
                                                        }
                                                    }}
                                                />
                                            </div>

                                            {/* ID Document Copy - Only if ID Type selected */}
                                            {values.id_type && (
                                                <div className="row text-start">
                                                    <div className="col-md-12 mb-3">
                                                        <label className="form-label">ID Document Copy</label>
                                                        <input
                                                            type="file"
                                                            name="copy_of_id"
                                                            className="form-control"
                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                            onChange={(e) => {
                                                                const file = e.currentTarget.files[0];
                                                                if (file) {
                                                                    setFieldValue('copy_of_id', file);
                                                                }
                                                            }}
                                                        />
                                                        <small className="text-muted">Accepted formats: PDF, JPG, PNG (max 5MB)</small>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Profile Picture */}
                                            <div className="row text-start">
                                                <div className="col-md-12 mb-3">
                                                    <label className="form-label">Profile Picture</label>
                                                    <input
                                                        type="file"
                                                        name="profile_picture"
                                                        className="form-control"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const file = e.currentTarget.files[0];
                                                            if (file) {
                                                                setFieldValue('profile_picture', file);
                                                            }
                                                        }}
                                                    />
                                                    <small className="text-muted">Accepted formats: JPG, PNG, GIF</small>
                                                </div>
                                            </div>


                                            <div className="row text-start">
                                                <div className="col-md-6 mb-3">
                                                    <div className="form-check">
                                                        <Field
                                                            as="input"
                                                            type="checkbox"
                                                            name="are_you_currently_studying"
                                                            className="form-check-input"
                                                            id="currentlyStudying"
                                                        />
                                                        <label className="form-check-label" htmlFor="currentlyStudying">
                                                            Currently Studying
                                                        </label>
                                                    </div>
                                                </div>
                                                {/* Institution - Only visible if Currently Studying is checked */}
                                                {values.are_you_currently_studying && (
                                                    <FormikSelect
                                                        name="institution_uid"
                                                        label="Current Institution/University"
                                                        url="/api/training/institutions"
                                                        isFullPath={true}
                                                        filters={{ page: 1, page_size: 50, paginated: true }}
                                                        mapOption={(item) => ({
                                                            value: item?.uid,
                                                            label: item?.name,
                                                        })}
                                                        placeholder="Select Institution..."
                                                        containerClass="col-md-6 mb-3"
                                                        isRequired={false}
                                                    />
                                                )}
                                            </div>

                                            {/* Bio */}
                                            <div className="row text-start">
                                                <div className="col-md-12 mb-3">
                                                    <label className="form-label">Bio</label>
                                                    <Field
                                                        as="textarea"
                                                        name="bio"
                                                        className="form-control"
                                                        placeholder="Brief biography..."
                                                        rows="3"
                                                    />
                                                    <small className="text-muted d-block mt-1">
                                                        Note: Only letters, numbers, spaces, hyphens, periods, commas, question marks, exclamation marks, and parentheses are allowed.
                                                    </small>
                                                    <ErrorMessage name="bio" component="div" className="text-danger" />
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
                                                    <Field as="select" name="placement_type" className={`form-select ${errors.placement_type && touched.placement_type ? 'is-invalid' : ''}`}>
                                                        <option value="">-- Select --</option>
                                                        {placementTypeOptions.map(opt => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </Field>
                                                    <ErrorMessage name="placement_type" component="div" className="text-danger" />
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label htmlFor="category" className="form-label">Category *</label>
                                                    <Field as="select" name="category" className={`form-select ${errors.category && touched.category ? 'is-invalid' : ''}`}>
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
                                                        className={`form-control ${errors.from_date && touched.from_date ? 'is-invalid' : ''}`}
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
                                                        className={`form-control ${errors.to_date && touched.to_date ? 'is-invalid' : ''}`}
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
                                                    <Field as="select" name="campus" className={`form-select ${errors.campus && touched.campus ? 'is-invalid' : ''}`}>
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
                                                    filters={{ page: 1, page_size: 50, paginated: true }}
                                                    mapOption={(item) => ({
                                                        value: item?.uid,
                                                        label: item?.name,
                                                    })}
                                                    placeholder="Select Departments..."
                                                    containerClass="col-md-6 mb-3"
                                                    isMultiple={true}
                                                    isRequired={true}
                                                />
                                            </div>
                                        </FormWizard.TabContent>

                                        {/* Step 4: Financial Information */}
                                        <FormWizard.TabContent
                                            title="Financial"
                                            icon="bx bx-dollar"
                                            isValid={isValidTab[2]}
                                            showErrorOnTab={tabsError[3]}
                                        >
                                            <div className="row text-start">
                                                <div className="col-md-6 mb-3">
                                                    <label htmlFor="expected_amount" className="form-label">Expected Amount *</label>
                                                    <Field
                                                        type="number"
                                                        name="expected_amount"
                                                        className={`form-control ${errors.expected_amount && touched.expected_amount ? 'is-invalid' : ''}`}
                                                        placeholder="0.00"
                                                        step="0.01"
                                                        min="0"
                                                    />
                                                    <ErrorMessage name="expected_amount" component="div" className="text-danger" />
                                                </div>
                                                <FormikSelect
                                                    name="currency"
                                                    label="Currency *"
                                                    url="/user/currencies"
                                                    isFullPath={true}
                                                    filters={{ page: 1, page_size: 50, paginated: true }}
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

                                        {/* Step 5: Student Summary */}
                                        <FormWizard.TabContent
                                            title="Student"
                                            icon="bx bx-check-circle"
                                            isValid={isValidTab[3]}
                                            showErrorOnTab={tabsError[4]}
                                        >
                                            <div className="row text-start">
                                                <div className="col-md-12">
                                                    <div className="alert alert-info">
                                                        <h6 className="mb-3"><i className="bx bx-user me-2"></i>Student Information Summary</h6>
                                                        <div className="row g-3">
                                                            <div className="col-md-6">
                                                                <small><strong>Name:</strong></small>
                                                                <p>{values.first_name} {values.middle_name} {values.last_name}</p>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <small><strong>Email:</strong></small>
                                                                <p>{values.email}</p>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <small><strong>Phone:</strong></small>
                                                                <p>{values.primary_phone}</p>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <small><strong>Student ID:</strong></small>
                                                                <p>{values.student_id}</p>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <small><strong>Sex:</strong></small>
                                                                <p>{values.sex === 'M' ? 'Male' : values.sex === 'F' ? 'Female' : 'Not specified'}</p>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <small><strong>Status:</strong></small>
                                                                <p>{values.are_you_currently_studying ? 'Currently Studying' : 'Not Studying'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </FormWizard.TabContent>

                                        {/* Step 6: Application Review */}
                                        <FormWizard.TabContent
                                            title="Review"
                                            icon="bx bx-check"
                                            isValid={isValidTab[4]}
                                            showErrorOnTab={tabsError[5]}
                                        >
                                            <div className="row text-start">
                                                <div className="col-md-12">
                                                    <div className="alert alert-warning mb-3">
                                                        <i className="bx bx-info-circle me-2"></i>
                                                        <strong>Review all information before submitting</strong>
                                                    </div>

                                                    <div className="alert alert-info">
                                                        <h6 className="mb-3"><i className="bx bx-file-blank me-2"></i>Application Summary</h6>
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
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </FormWizard.TabContent>
                                    </FormWizard>

                                    {backendErrors && Object.keys(backendErrors).length > 0 && (
                                        <div className="alert alert-danger mx-3 mt-3">
                                            <strong>Validation Errors:</strong>
                                            {Object.entries(backendErrors).map(([field, messages]) => (
                                                <div key={field}>
                                                    <small>
                                                        <strong>{field.replace(/_/g, ' ')}:</strong>{' '}
                                                        {Array.isArray(messages) ? messages.join(', ') : messages}
                                                    </small>
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
        </div>
    );
};
