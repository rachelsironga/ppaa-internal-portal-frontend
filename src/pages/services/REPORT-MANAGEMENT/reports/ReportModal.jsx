import React, { useState, useEffect } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter, Row, Col, Progress } from "reactstrap";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Select from "react-select";
import { 
  createReport, 
  updateReport,
  getFinancialYears,
  getReportTypes,
  getReportCategories,
  getStakeholders,
  getFinancialPeriods,
  getUserProfileInfo,
  PRIORITY_OPTIONS,
  SCOPE_OPTIONS,
} from "../Queries";
import showToast from "../../../../helpers/ToastHelper";
import Swal from "sweetalert2";

const formatValidationErrors = (errors) => {
  if (!errors || typeof errors !== 'object') return '';
  const errorMessages = [];
  Object.keys(errors).forEach(field => {
    const fieldErrors = Array.isArray(errors[field]) ? errors[field] : [errors[field]];
    const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    fieldErrors.forEach(error => {
      errorMessages.push(`<li><strong>${fieldName}:</strong> ${error}</li>`);
    });
  });
  return `<ul style="text-align: left; margin: 0; padding-left: 20px;">${errorMessages.join('')}</ul>`;
};

const PERIODIC_FREQUENCIES = ['quarterly', 'monthly', 'biannual'];
const AUTO_DEADLINE_FREQUENCIES = ['monthly', 'quarterly', 'biannual', 'annual'];

const getPeriodTypeForFrequency = (frequency) => {
  if (frequency === 'quarterly') return 'quarter';
  if (frequency === 'monthly') return 'month';
  if (frequency === 'biannual') return 'biannual';
  return null;
};

const resolveCurrentFinancialYear = (years = []) => {
  const today = new Date();
  return (
    years.find((fy) => {
      const start = fy?.start_date ? new Date(fy.start_date) : null;
      const end = fy?.end_date ? new Date(fy.end_date) : null;
      return start && end && today >= start && today <= end;
    }) ||
    years.find((fy) => fy.is_current) ||
    null
  );
};

const addDaysToDateString = (dateString, daysToAdd = 0) => {
  if (!dateString) return "";
  const dt = new Date(dateString);
  if (Number.isNaN(dt.getTime())) return "";
  dt.setDate(dt.getDate() + Number(daysToAdd || 0));
  return dt.toISOString().split("T")[0];
};

const STEPS = [
  { id: 1, title: "Basic Info", icon: "bx-file", description: "Report title and type" },
  { id: 2, title: "Timeline", icon: "bx-calendar", description: "Period and deadline" },
  { id: 3, title: "Assignment", icon: "bx-user-plus", description: "Scope and stakeholders" },
];

const ReportModal = ({ show, onClose, onSuccess, report }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [financialYears, setFinancialYears] = useState([]);
  const [reportTypes, setReportTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stakeholders, setStakeholders] = useState([]);
  const [financialPeriods, setFinancialPeriods] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const isEditMode = !!report?.uid;
  const totalSteps = STEPS.length;

  const getReportTypeOptions = () => {
    // Ensure currently selected value is visible even if list is filtered (e.g., inactive type)
    const opts = [...(reportTypes || [])];
    const current = report?.report_type;
    if (current?.uid && !opts.some((t) => t.uid === current.uid)) {
      opts.unshift(current);
    }
    return opts;
  };

  const getCategoryOptions = () => {
    const opts = [...(categories || [])];
    const current = report?.category;
    if (current?.uid && !opts.some((c) => c.uid === current.uid)) {
      opts.unshift(current);
    }
    return opts;
  };

  useEffect(() => {
    if (show) {
      fetchOptions();
      setCurrentStep(1);
    }
  }, [show]);

  useEffect(() => {
    if (!show || !report?.uid) return;
    const fyUid = report?.financial_year?.uid;
    const reportTypeUid = report?.report_type?.uid;
    if (fyUid && reportTypeUid) {
      loadFinancialPeriods(fyUid, reportTypeUid);
    }
  }, [show, report?.uid, report?.financial_year?.uid, report?.report_type?.uid, reportTypes.length]);

  const fetchOptions = async () => {
    setLoadingOptions(true);
    try {
      const [fyRes, typesRes, catsRes, stakeholdersRes, profileRes] = await Promise.all([
        getFinancialYears(),
        getReportTypes(),
        getReportCategories(),
        getStakeholders(),
        getUserProfileInfo(),
      ]);
      
      if (fyRes.status === 8000) setFinancialYears(fyRes.data || []);
      if (typesRes.status === 8000) setReportTypes(typesRes.data || []);
      if (catsRes.status === 8000) setCategories(catsRes.data || []);
      if (stakeholdersRes.status === 8000) setStakeholders(stakeholdersRes.data || []);
      if (profileRes.status === 8000) setUserProfile(profileRes.data);
    } catch (error) {
      console.error("Error fetching options:", error);
      showToast("Failed to load form options", "error");
    } finally {
      setLoadingOptions(false);
    }
  };

  const loadFinancialPeriods = async (fyUid, reportTypeUid) => {
    if (!fyUid) {
      setFinancialPeriods([]);
      return;
    }
    try {
      const selectedType =
        getSelectedReportType(reportTypeUid) ||
        (report?.report_type?.uid === reportTypeUid ? report.report_type : null);
      const periodType = getPeriodTypeForFrequency(selectedType?.frequency);
      const res = await getFinancialPeriods({
        financial_year_uid: fyUid,
        period_type: periodType || undefined,
      });
      if (res.status === 8000) setFinancialPeriods(res.data || []);
      else setFinancialPeriods([]);
    } catch (e) {
      setFinancialPeriods([]);
    }
  };

  const getSelectedReportType = (reportTypeUid) => {
    return reportTypes.find(t => t.uid === reportTypeUid);
  };

  const getSelectedFinancialYear = (fyUid) => {
    return financialYears.find(fy => fy.uid === fyUid);
  };

  const currentFinancialYear = resolveCurrentFinancialYear(financialYears);

  const isPeriodic = (reportTypeUid) => {
    const selectedType = getSelectedReportType(reportTypeUid);
    return selectedType && PERIODIC_FREQUENCIES.includes(selectedType.frequency);
  };

  const isAutoDeadlineType = (reportTypeUid) => {
    const selectedType = getSelectedReportType(reportTypeUid);
    return selectedType && AUTO_DEADLINE_FREQUENCIES.includes(selectedType.frequency);
  };

  const getComputedDeadline = ({ reportTypeUid, financialYearUid, financialPeriodUid }) => {
    const selectedType = getSelectedReportType(reportTypeUid);
    if (!selectedType || !AUTO_DEADLINE_FREQUENCIES.includes(selectedType.frequency)) return "";

    const days = Number(selectedType.submission_deadline_days || 0);

    if (selectedType.frequency === "annual") {
      const fy = getSelectedFinancialYear(financialYearUid);
      return addDaysToDateString(fy?.end_date, days);
    }

    const period = (financialPeriods || []).find((p) => p.uid === financialPeriodUid);
    return addDaysToDateString(period?.end_date, days);
  };

  const validationSchema = Yup.object().shape({
    title: Yup.string()
      .min(5, "Title must be at least 5 characters")
      .required("Title is required"),
    report_type_uid: Yup.string().required("Report type is required"),
    financial_year_uid: Yup.string().required("Financial year is required"),
    financial_period_uids: Yup.array().when(['report_type_uid'], {
      is: (report_type_uid) => {
        const t = getSelectedReportType(report_type_uid);
        return !isEditMode && t?.frequency === 'quarterly';
      },
      then: (schema) => schema.min(1, "Select at least one period"),
    }),
    financial_period_uid: Yup.string().when(['report_type_uid'], {
      is: (report_type_uid) => {
        const t = getSelectedReportType(report_type_uid);
        // Semi-Annual must be selected one at a time
        return isPeriodic(report_type_uid) && !( !isEditMode && t?.frequency === 'quarterly');
      },
      then: (schema) => schema.required("Period is required"),
    }),
    deadline_date: Yup.date().when(['report_type_uid'], {
      is: (report_type_uid) => !(!isEditMode && isAutoDeadlineType(report_type_uid)),
      then: (schema) => schema.required("Deadline is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
    scope: Yup.string().required("Scope is required"),
    priority: Yup.string().required("Priority is required"),
    stakeholder_uid: Yup.string().when('scope', {
      is: 'external',
      then: (schema) => schema.test(
        'stakeholder-required',
        'Stakeholder or custom stakeholder name is required for external reports',
        function(value) {
          return value || this.parent.other_stakeholder_name;
        }
      ),
    }),
  });

  const stepValidations = {
    1: ['title', 'report_type_uid'],
    2: ['financial_year_uid', 'deadline_date', 'priority'],
    3: ['scope'],
  };

  const validateStep = (values, errors, step) => {
    if (step === 2) {
      const baseOk =
        !!values.financial_year_uid &&
        !!values.priority &&
        !errors.financial_year_uid &&
        !errors.priority;

      if (!baseOk) return false;
      if (!isEditMode && isAutoDeadlineType(values.report_type_uid)) {
        const selectedType = getSelectedReportType(values.report_type_uid);
        if (selectedType?.frequency === "quarterly") {
          return Array.isArray(values.financial_period_uids) && values.financial_period_uids.length > 0 && !errors.financial_period_uids;
        }
        if (selectedType?.frequency === "annual") {
          return !!values.financial_year_uid;
        }
        return !!values.financial_period_uid && !errors.financial_period_uid;
      }
      return !!values.deadline_date && !errors.deadline_date;
    }

    const fieldsToValidate = stepValidations[step];
    return fieldsToValidate.every((field) => values[field] && !errors[field]);
  };

  const initialValues = {
    title: report?.title || "",
    report_type_uid: report?.report_type?.uid || "",
    category_uid: report?.category?.uid || "",
    financial_year_uid: report?.financial_year?.uid || currentFinancialYear?.uid || "",
    financial_period_uid: report?.financial_period?.uid || "",
    financial_period_uids: report?.financial_period?.uid ? [report.financial_period.uid] : [],
    deadline_date: report?.deadline_date || "",
    scope: report?.scope || "",
    priority: report?.priority || "medium",
    stakeholder_uid: report?.stakeholder?.uid || "",
    other_stakeholder_name: report?.other_stakeholder_name || "",
    description: report?.description || "",
    notes: report?.notes || "",
    attachment: null,
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    setLoading(true);
    try {
      // Check if user has department assigned (required for creating reports)
      if (!isEditMode && !userProfile?.department) {
        Swal.fire({
          title: "No Department Assigned",
          text: "Your profile does not have a department assigned. Please contact the administrator.",
          icon: "error",
          confirmButtonColor: "#d33",
        });
        setLoading(false);
        return;
      }

      const data = { ...values };
      const selectedType = getSelectedReportType(values.report_type_uid);

      // Ad-hoc safety defaults: ensure required non-periodic fields are always present.
      if (!data.scope) data.scope = "internal";
      if (!data.priority) data.priority = "medium";
      if (!data.financial_year_uid) {
        data.financial_year_uid = currentFinancialYear?.uid || financialYears?.[0]?.uid || "";
      }
      
      if (!data.stakeholder_uid) delete data.stakeholder_uid;
      if (!data.category_uid) delete data.category_uid;
      if (!isEditMode && isAutoDeadlineType(values.report_type_uid)) {
        delete data.deadline_date;
      }
      // Quarterly (create): allow multiple quarters
      if (!isEditMode && selectedType?.frequency === 'quarterly') {
        delete data.financial_period_uid;
        if (!data.financial_period_uids || data.financial_period_uids.length === 0) {
          delete data.financial_period_uids;
        }
      } else if (selectedType?.frequency === "adhoc") {
        delete data.financial_period_uid;
        delete data.financial_period_uids;
      } else {
        delete data.financial_period_uids;
        if (!data.financial_period_uid) delete data.financial_period_uid;
      }
      delete data.financial_period_deadlines;
      delete data.financial_period_deadlines_json;
      if (!data.other_stakeholder_name) delete data.other_stakeholder_name;
      if (!data.attachment) delete data.attachment;
      
      let response;
      if (isEditMode) {
        response = await updateReport(report.uid, data);
      } else {
        response = await createReport(data);
      }

      if (response.status === 8000) {
        showToast(
          isEditMode ? "Report updated successfully" : "Report created successfully",
          "success"
        );
        onSuccess();
      } else if (response.status === 8002 && response.data) {
        Swal.fire({
          title: "Validation Error",
          html: formatValidationErrors(response.data),
          icon: "warning",
          confirmButtonColor: "#3085d6",
        });
      } else {
        Swal.fire({
          title: "Error",
          text: response.message || "Operation failed",
          icon: "error",
          confirmButtonColor: "#d33",
        });
      }
    } catch (error) {
      console.error("Error saving report:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to save report. Please try again.",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const nextStep = (values, errors, touched, setTouched) => {
    let fieldsToValidate = stepValidations[currentStep];
    const newTouched = { ...touched };
    fieldsToValidate.forEach(field => { newTouched[field] = true; });
    setTouched(newTouched);

    if (validateStep(values, errors, currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const goToStep = (step, values, errors) => {
    for (let i = 1; i < step; i++) {
      if (!validateStep(values, errors, i)) {
        return;
      }
    }
    setCurrentStep(step);
  };

  const renderStepIndicator = (values, errors) => (
    <div className="step-indicator mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        {STEPS.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const isClickable = step.id === 1 || validateStep(values, errors, step.id - 1);
          
          return (
            <div key={step.id} className="d-flex align-items-center flex-grow-1">
              <div
                className={`step-circle d-flex align-items-center justify-content-center rounded-circle ${
                  isActive ? 'bg-primary text-white' : 
                  isCompleted ? 'bg-success text-white' : 'bg-light text-muted'
                } ${isClickable ? 'cursor-pointer' : ''}`}
                style={{ 
                  width: '45px', 
                  height: '45px', 
                  minWidth: '45px',
                  transition: 'all 0.3s ease',
                  cursor: isClickable ? 'pointer' : 'default'
                }}
                onClick={() => isClickable && goToStep(step.id, values, errors)}
              >
                {isCompleted ? (
                  <i className="bx bx-check fs-4"></i>
                ) : (
                  <i className={`bx ${step.icon} fs-5`}></i>
                )}
              </div>
              <div className="ms-2 d-none d-md-block">
                <div className={`fw-semibold small ${isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-muted'}`}>
                  {step.title}
                </div>
                <div className="text-muted" style={{ fontSize: '11px' }}>{step.description}</div>
              </div>
              {index < STEPS.length - 1 && (
                <div 
                  className={`flex-grow-1 mx-2 ${isCompleted ? 'bg-success' : 'bg-light'}`} 
                  style={{ height: '3px', borderRadius: '2px' }}
                ></div>
              )}
            </div>
          );
        })}
      </div>
      <Progress 
        value={(currentStep / totalSteps) * 100} 
        className="mb-0" 
        style={{ height: '4px' }}
        color={currentStep === totalSteps ? 'success' : 'primary'}
      />
    </div>
  );

  const renderStep1 = (values, errors, touched, setFieldValue) => (
    <div className="step-content">
      <div className="text-center mb-4">
        <div className="avatar avatar-lg bg-label-primary rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
          <i className="bx bx-file fs-2"></i>
        </div>
        <h5 className="mb-1">Basic Information</h5>
        <p className="text-muted small mb-0">Enter the report title and select its type</p>
      </div>

      <Row className="g-3">
        <Col md={12}>
          <label className="form-label fw-medium">
            Report Title <span className="text-danger">*</span>
          </label>
          <Field
            name="title"
            type="text"
            className={`form-control form-control-lg ${errors.title && touched.title ? 'is-invalid' : ''}`}
            placeholder="Enter a descriptive report title"
          />
          <ErrorMessage name="title" component="div" className="invalid-feedback" />
          <small className="text-muted">Give your report a clear, descriptive title</small>
        </Col>

        <Col md={6}>
          <label className="form-label fw-medium">
            Report Type <span className="text-danger">*</span>
          </label>
          <Field
            as="select"
            name="report_type_uid"
            className={`form-select form-select-lg ${errors.report_type_uid && touched.report_type_uid ? 'is-invalid' : ''}`}
            onChange={(e) => {
              const reportTypeUid = e.target.value;
              setFieldValue("report_type_uid", reportTypeUid);
              // Reset period selections when type changes
              setFieldValue("financial_period_uid", "");
              setFieldValue("financial_period_uids", []);
              if (!values.financial_year_uid && currentFinancialYear?.uid) {
                setFieldValue("financial_year_uid", currentFinancialYear.uid);
              }
              // Reload periods if FY already selected
              if (values.financial_year_uid || currentFinancialYear?.uid) {
                loadFinancialPeriods(values.financial_year_uid || currentFinancialYear.uid, reportTypeUid);
              }
            }}
          >
            <option value="">Select report type</option>
            {getReportTypeOptions().map(type => (
              <option key={type.uid} value={type.uid}>
                {type.name} ({type.frequency_display || type.frequency})
              </option>
            ))}
          </Field>
          <ErrorMessage name="report_type_uid" component="div" className="invalid-feedback" />
          {values.report_type_uid && (
            <small className="text-info">
              <i className="bx bx-info-circle me-1"></i>
              {getSelectedReportType(values.report_type_uid)?.frequency_display || 'Regular'} report
            </small>
          )}
        </Col>

        <Col md={6}>
          <label className="form-label fw-medium">Category</label>
          <Field as="select" name="category_uid" className="form-select form-select-lg">
            <option value="">Select category (optional)</option>
            {getCategoryOptions().map(cat => (
              <option key={cat.uid} value={cat.uid}>
                {cat.name}
              </option>
            ))}
          </Field>
          <small className="text-muted">Optional: Categorize your report</small>
        </Col>
      </Row>
    </div>
  );

  const renderStep2 = (values, errors, touched, setFieldValue) => (
    <div className="step-content">
      <div className="text-center mb-4">
        <div className="avatar avatar-lg bg-label-info rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
          <i className="bx bx-calendar fs-2"></i>
        </div>
        <h5 className="mb-1">Timeline & Period</h5>
        <p className="text-muted small mb-0">Set the financial period and deadline</p>
      </div>

      <Row className="g-3">
        <Col md={isPeriodic(values.report_type_uid) ? 6 : 12}>
          <label className="form-label fw-medium">
            Financial Year <span className="text-danger">*</span>
          </label>
          <Field
            as="select"
            name="financial_year_uid"
            className={`form-select form-select-lg ${errors.financial_year_uid && touched.financial_year_uid ? 'is-invalid' : ''}`}
            onChange={async (e) => {
              const fyUid = e.target.value;
              setFieldValue('financial_year_uid', fyUid);
              setFieldValue('financial_period_uid', '');
              setFieldValue('financial_period_uids', []);

              await loadFinancialPeriods(fyUid, values.report_type_uid);
            }}
          >
            <option value="">Select financial year</option>
            {financialYears.map(fy => (
              <option key={fy.uid} value={fy.uid}>
                {fy.name} {fy.is_current && "⭐ (Current)"}
              </option>
            ))}
          </Field>
          <ErrorMessage name="financial_year_uid" component="div" className="invalid-feedback" />
        </Col>

        {isPeriodic(values.report_type_uid) && values.financial_year_uid && (
          <Col md={6}>
            <label className="form-label fw-medium">
              <i className="bx bx-calendar-event me-1 text-primary"></i>
              {getSelectedReportType(values.report_type_uid)?.frequency === 'quarterly' ? 'Quarter' : 
               getSelectedReportType(values.report_type_uid)?.frequency === 'biannual' ? 'Half Year' : 'Period'}
            </label>
            {(!isEditMode && getSelectedReportType(values.report_type_uid)?.frequency === 'quarterly') ? (
              <>
                <Select
                  isMulti
                  options={(financialPeriods || []).map(p => ({
                    value: p.uid,
                    label: `${p.display_name} (${p.start_date} - ${p.end_date})`,
                  }))}
                  value={(financialPeriods || [])
                    .filter(p => (values.financial_period_uids || []).includes(p.uid))
                    .map(p => ({ value: p.uid, label: `${p.display_name} (${p.start_date} - ${p.end_date})` }))}
                  onChange={(selected) => {
                    const selectedUids = (selected || []).map(o => o.value);
                    setFieldValue('financial_period_uids', selectedUids);
                  }}
                  classNamePrefix="react-select"
                  placeholder="Select one or more quarters..."
                  styles={{
                    menu: (base) => ({ ...base, zIndex: 99999 }),
                    control: (base) => ({ ...base, minHeight: "46px" }),
                  }}
                />
                <small className="text-muted">Select one or more quarters.</small>
              </>
            ) : (
              <>
                <Field
                  as="select"
                  name="financial_period_uid"
                  className={`form-select form-select-lg ${errors.financial_period_uid && touched.financial_period_uid ? 'is-invalid' : ''}`}
                >
                  <option value="">Select period</option>
                  {(financialPeriods || []).map(p => (
                    <option key={p.uid} value={p.uid}>
                      {p.display_name} ({p.start_date} - {p.end_date})
                    </option>
                  ))}
                </Field>
                <ErrorMessage name="financial_period_uid" component="div" className="invalid-feedback" />
                {!isEditMode && getSelectedReportType(values.report_type_uid)?.frequency === 'biannual' && (
                  <small className="text-muted">Select only one half-year at a time.</small>
                )}
              </>
            )}
          </Col>
        )}

        <Col md={6}>
          {!isEditMode && isAutoDeadlineType(values.report_type_uid) ? (
            <>
              <label className="form-label fw-medium">Computed Submission Deadline</label>
              {getSelectedReportType(values.report_type_uid)?.frequency === "quarterly" ? (
                <div className="alert alert-info mb-0">
                  <div className="fw-semibold mb-2">Deadlines will be computed automatically</div>
                  {(financialPeriods || [])
                    .filter((p) => (values.financial_period_uids || []).includes(p.uid))
                    .map((p) => (
                      <div key={p.uid} className="small mb-1">
                        <strong>{p.display_name}:</strong> {getComputedDeadline({
                          reportTypeUid: values.report_type_uid,
                          financialYearUid: values.financial_year_uid,
                          financialPeriodUid: p.uid,
                        }) || "Select period"}
                      </div>
                    ))}
                  {(!values.financial_period_uids || values.financial_period_uids.length === 0) && (
                    <div className="small text-muted">Select one or more quarters to preview deadlines.</div>
                  )}
                </div>
              ) : (
                <div className="alert alert-info mb-0">
                  <div className="fw-semibold">
                    {getComputedDeadline({
                      reportTypeUid: values.report_type_uid,
                      financialYearUid: values.financial_year_uid,
                      financialPeriodUid: values.financial_period_uid,
                    }) || "Select the required period/year to preview the deadline"}
                  </div>
                  <small className="text-muted">
                    This deadline is computed from the selected reporting period end date plus the report type setting.
                  </small>
                </div>
              )}
            </>
          ) : (
            <>
              <label className="form-label fw-medium">
                Deadline Date <span className="text-danger">*</span>
              </label>
              <Field
                name="deadline_date"
                type="date"
                className={`form-control form-control-lg ${errors.deadline_date && touched.deadline_date ? 'is-invalid' : ''}`}
              />
              <ErrorMessage name="deadline_date" component="div" className="invalid-feedback" />
            </>
          )}
        </Col>

        <Col md={6}>
          <label className="form-label fw-medium">
            Priority <span className="text-danger">*</span>
          </label>
          <Field
            as="select"
            name="priority"
            className={`form-select form-select-lg ${errors.priority && touched.priority ? 'is-invalid' : ''}`}
          >
            {PRIORITY_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Field>
          <ErrorMessage name="priority" component="div" className="invalid-feedback" />
        </Col>

        {values.priority && (
          <Col md={12}>
            <div className={`alert alert-${
              values.priority === 'critical' ? 'danger' :
              values.priority === 'high' ? 'warning' :
              values.priority === 'medium' ? 'info' : 'secondary'
            } mb-0 d-flex align-items-center`}>
              <i className={`bx ${
                values.priority === 'critical' ? 'bx-error-circle' :
                values.priority === 'high' ? 'bx-up-arrow-alt' :
                values.priority === 'medium' ? 'bx-minus' : 'bx-down-arrow-alt'
              } me-2 fs-5`}></i>
              <span>
                {values.priority === 'critical' ? 'Critical priority - Requires immediate attention' :
                 values.priority === 'high' ? 'High priority - Should be completed soon' :
                 values.priority === 'medium' ? 'Medium priority - Standard timeline' : 
                 'Low priority - Can be scheduled flexibly'}
              </span>
            </div>
          </Col>
        )}
      </Row>
    </div>
  );

  const renderStep3 = (values, errors, touched, setFieldValue) => (
    <div className="step-content">
      <div className="text-center mb-4">
        <div className="avatar avatar-lg bg-label-warning rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
          <i className="bx bx-user-plus fs-2"></i>
        </div>
        <h5 className="mb-1">Scope & Assignment</h5>
        <p className="text-muted small mb-0">Define report scope and assign stakeholders</p>
      </div>

      <Row className="g-3">
        <Col md={12}>
          <label className="form-label fw-medium">
            Report Scope <span className="text-danger">*</span>
          </label>
          <div className="d-flex gap-3">
            {SCOPE_OPTIONS.map(option => (
              <div 
                key={option.value} 
                className={`flex-fill p-3 rounded-3 border-2 cursor-pointer ${
                  values.scope === option.value ? 'border-primary bg-label-primary' : 'border bg-light'
                }`}
                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                onClick={() => setFieldValue('scope', option.value)}
              >
                <div className="d-flex align-items-center">
                  <Field
                    type="radio"
                    name="scope"
                    value={option.value}
                    id={`scope-${option.value}`}
                    className="form-check-input me-3"
                    style={{ width: '20px', height: '20px' }}
                  />
                  <div>
                    <label className="form-check-label fw-semibold mb-0" htmlFor={`scope-${option.value}`}>
                      <i className={`bx ${option.value === 'internal' ? 'bx-home' : 'bx-globe'} me-2`}></i>
                      {option.label}
                    </label>
                    <p className="text-muted small mb-0 mt-1">
                      {option.value === 'internal' ? 'For internal organization use' : 'Shared with external stakeholders'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <ErrorMessage name="scope" component="div" className="invalid-feedback d-block" />
        </Col>

        {/* Department Info - Auto-filled from User Profile (Read-only) */}
        <Col md={12}>
          <div className="card bg-light border-0 mb-0">
            <div className="card-body py-3">
              <div className="d-flex align-items-center">
                <div className="avatar avatar-md bg-primary rounded-circle me-3 d-flex align-items-center justify-content-center">
                  <i className="bx bx-buildings text-white fs-4"></i>
                </div>
                <div className="flex-grow-1">
                  <label className="text-muted small d-block mb-1">
                    <i className="bx bx-lock-alt me-1"></i>
                    Department (Auto-assigned from your profile)
                  </label>
                  {userProfile?.department ? (
                    <div>
                      <h6 className="mb-0 text-primary" style={{ textTransform: 'uppercase' }}>
                        {userProfile.department.name}
                      </h6>
                      <small className="text-muted">
                        Code: <strong>{userProfile.department.code}</strong>
                      </small>
                    </div>
                  ) : (
                    <div className="text-danger">
                      <i className="bx bx-error-circle me-1"></i>
                      No department assigned to your profile. Please contact administrator.
                    </div>
                  )}
                </div>
                <div>
                  <span className="badge bg-success">
                    <i className="bx bx-check-circle me-1"></i>
                    Auto-assigned
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Col>

        {values.scope === 'external' && (
          <>
            <Col md={12}>
              <div className="alert alert-info mb-3">
                <i className="bx bx-info-circle me-2"></i>
                External reports require a stakeholder. Select from the list or enter a custom name.
              </div>
            </Col>
            <Col md={6}>
              <label className="form-label fw-medium">Select Stakeholder</label>
              <Field as="select" name="stakeholder_uid" className="form-select form-select-lg">
                <option value="">Select stakeholder</option>
                {stakeholders.map(stakeholder => (
                  <option key={stakeholder.uid} value={stakeholder.uid}>
                    {stakeholder.name} ({stakeholder.organization_type_display || stakeholder.organization_type})
                  </option>
                ))}
              </Field>
            </Col>
            <Col md={6}>
              <label className="form-label fw-medium">Or Enter Custom Stakeholder</label>
              <Field
                name="other_stakeholder_name"
                type="text"
                className="form-control form-control-lg"
                placeholder="Enter stakeholder name if not in list"
              />
            </Col>
          </>
        )}
      </Row>
    </div>
  );

  // Details step removed (description/notes/attachment/summary)
  return (
    <Modal isOpen={show} toggle={onClose} size="lg" backdrop="static" centered>
      <ModalHeader toggle={onClose} className="bg-primary text-white" close={<button type="button" className="btn-close btn-close-white" onClick={onClose}></button>}>
        <span className="text-white">
          <i className={`bx ${isEditMode ? 'bx-edit' : 'bx-plus-circle'} me-2`}></i>
          {isEditMode ? "Edit Report" : "Create New Report"}
        </span>
      </ModalHeader>
      
      {loadingOptions ? (
        <ModalBody className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading form options...</p>
        </ModalBody>
      ) : (
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={(values, helpers) => {
            // Prevent accidental form submission before the final step
            if (currentStep < totalSteps) {
              helpers.setSubmitting(false);
              return;
            }
            return handleSubmit(values, helpers);
          }}
          enableReinitialize
        >
          {({ values, setFieldValue, isSubmitting, errors, touched, setTouched }) => (
            <Form
              onKeyDown={(e) => {
                if (e.key === "Enter" && currentStep < totalSteps) {
                  const tag = (e.target?.tagName || "").toLowerCase();
                  const type = (e.target?.type || "").toLowerCase();
                  const allowEnter = tag === "textarea" || type === "button";
                  if (!allowEnter) {
                    e.preventDefault();
                  }
                }
              }}
            >
              <ModalBody style={{ minHeight: '450px' }}>
                {renderStepIndicator(values, errors)}
                
                <div className="step-content-wrapper">
                  {currentStep === 1 && renderStep1(values, errors, touched, setFieldValue)}
                  {currentStep === 2 && renderStep2(values, errors, touched, setFieldValue)}
                  {currentStep === 3 && renderStep3(values, errors, touched, setFieldValue)}
                  
                </div>
              </ModalBody>
              
              <ModalFooter className="d-flex justify-content-between">
                <div>
                  {currentStep > 1 && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={prevStep}
                      disabled={loading}
                    >
                      <i className="bx bx-chevron-left me-1"></i>
                      Previous
                    </button>
                  )}
                </div>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  
                  {currentStep < totalSteps ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => nextStep(values, errors, touched, setTouched)}
                    >
                      Next
                      <i className="bx bx-chevron-right ms-1"></i>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="btn btn-success"
                      disabled={loading || isSubmitting}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="bx bx-check me-1"></i>
                          {isEditMode ? "Update Report" : "Create Report"}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </ModalFooter>
            </Form>
          )}
        </Formik>
      )}
    </Modal>
  );
};

export default ReportModal;
