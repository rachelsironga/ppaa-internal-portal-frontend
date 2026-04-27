import React, { useState, useEffect, useCallback } from "react";
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

const PERIODIC_FREQUENCIES = ["quarterly", "monthly", "biannual", "annual"];
const AUTO_DEADLINE_FREQUENCIES = ["monthly", "quarterly", "biannual", "annual"];

/** Canonical frequency for validation/UI (matches backend RmsReportType + common aliases). */
const normalizeReportFrequency = (raw) => {
  const s = String(raw || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/_+/g, "-");
  if (
    s === "biannual" ||
    s === "bi-annual" ||
    s === "semi-annual" ||
    s === "semiannual" ||
    s === "half-year" ||
    s === "half-yearly" ||
    s === "halfyear"
  ) {
    return "biannual";
  }
  if (s === "ad-hoc" || s === "adhook" || s === "ad-hook") return "adhoc";
  if (s === "year" || s === "yearly") return "annual";
  if (s === "quarter" || s === "qtr") return "quarterly";
  if (s === "month") return "monthly";
  return s;
};

const getPeriodTypeForFrequency = (frequency) => {
  const f = normalizeReportFrequency(frequency);
  if (f === "quarterly") return "quarter";
  if (f === "monthly") return "month";
  if (f === "biannual") return "biannual";
  if (f === "annual") return "annual";
  return null;
};

const parseFYDateUTC = (iso) => {
  const part = String(iso).split("T")[0];
  const [y, m, d] = part.split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
};

const formatFYDateUTC = (d) => {
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
};

const addDaysUTC = (d, days) => {
  const t = new Date(d.getTime());
  t.setUTCDate(t.getUTCDate() + days);
  return t;
};

/** Equal-length segments over FY (same idea as backend _equal_date_segments). */
const buildEqualSegmentsFromFY = (fy, n, period_type, labels) => {
  if (!fy?.uid || !fy.start_date || !fy.end_date) return [];
  const start = parseFYDateUTC(fy.start_date);
  const end = parseFYDateUTC(fy.end_date);
  if (!start || !end || end < start) return [];
  const totalDays = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
  if (totalDays < 1 || n < 1) return [];
  const data = [];
  for (let i = 0; i < n; i++) {
    const ai = Math.floor((i * totalDays) / n);
    const bi = Math.floor(((i + 1) * totalDays + n - 1) / n);
    if (ai >= bi) continue;
    let segStart = addDaysUTC(start, ai);
    let segEnd = addDaysUTC(start, bi - 1);
    if (segEnd > end) segEnd = end;
    if (segStart > end) break;
    data.push({
      uid: `${fy.uid}-pt-${period_type}-${i + 1}`,
      display_name: labels[i] || `P${i + 1}`,
      start_date: formatFYDateUTC(segStart),
      end_date: formatFYDateUTC(segEnd),
      period_type,
    });
  }
  return data;
};

const buildQuarterPeriodsFromFY = (fy) =>
  buildEqualSegmentsFromFY(fy, 4, "quarter", ["Q1", "Q2", "Q3", "Q4"]);

const buildBiannualPeriodsFromFY = (fy) =>
  buildEqualSegmentsFromFY(fy, 2, "biannual", ["H1", "H2"]);

const buildAnnualPeriodFromFY = (fy) =>
  buildEqualSegmentsFromFY(fy, 1, "annual", ["Annual"]);

const MONTH_ABBR = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Calendar months clipped to FY (same idea as backend _calendar_month_segments). */
const buildMonthlyPeriodsFromFY = (fy) => {
  if (!fy?.uid || !fy.start_date || !fy.end_date) return [];
  const fyStart = parseFYDateUTC(fy.start_date);
  const fyEnd = parseFYDateUTC(fy.end_date);
  if (!fyStart || !fyEnd || fyEnd < fyStart) return [];
  const data = [];
  let cur = new Date(fyStart.getTime());
  while (cur <= fyEnd) {
    const y = cur.getUTCFullYear();
    const m = cur.getUTCMonth();
    const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const monthEnd = new Date(Date.UTC(y, m, lastDay));
    const segEnd = monthEnd > fyEnd ? fyEnd : monthEnd;
    data.push({
      uid: `${fy.uid}-pt-month-${data.length + 1}`,
      display_name: `${MONTH_ABBR[m]} ${y}`,
      start_date: formatFYDateUTC(cur),
      end_date: formatFYDateUTC(segEnd),
      period_type: "month",
    });
    if (segEnd >= fyEnd) break;
    const ny = m === 11 ? y + 1 : y;
    const nm = m === 11 ? 0 : m + 1;
    cur = new Date(Date.UTC(ny, nm, 1));
  }
  return data;
};

/** When step 2 mounts, load periods (create flow often never fires FY onChange). */
function ReportPeriodSync({ financialYearUid, reportTypeUid, syncFn }) {
  useEffect(() => {
    if (financialYearUid && reportTypeUid) syncFn(financialYearUid, reportTypeUid);
  }, [financialYearUid, reportTypeUid, syncFn]);
  return null;
}

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

/** Select value: not a real stakeholder UID — shows the custom name field when chosen */
const STAKEHOLDER_OTHER_VALUE = "__ppaa_stakeholder_other__";

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
      // Use allSettled so one missing endpoint (e.g. user-profile 404) does not block
      // report types, categories, and stakeholders from loading.
      const settled = await Promise.allSettled([
        getFinancialYears(),
        getReportTypes(),
        getReportCategories(),
        getStakeholders(),
        getUserProfileInfo(),
      ]);

      const unwrap = (result) =>
        result.status === "fulfilled"
          ? result.value
          : { status: null, data: null };

      const [fyRes, typesRes, catsRes, stakeholdersRes, profileRes] = settled.map(unwrap);

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

  const getSelectedReportType = (reportTypeUid) => {
    return reportTypes.find(t => t.uid === reportTypeUid);
  };

  const freqOf = (reportTypeUid) =>
    normalizeReportFrequency(getSelectedReportType(reportTypeUid)?.frequency);

  /** Create flow: quarterly + bi-annual use multi-select (`financial_period_uids`). */
  const usesMultiPeriodSelection = (reportTypeUid) =>
    !isEditMode &&
    (freqOf(reportTypeUid) === "quarterly" || freqOf(reportTypeUid) === "biannual");

  const loadFinancialPeriods = useCallback(
    async (fyUid, reportTypeUid) => {
      if (!fyUid) {
        setFinancialPeriods([]);
        return;
      }
      try {
        const selectedType =
          reportTypes.find((t) => t.uid === reportTypeUid) ||
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
    },
    [reportTypes, report]
  );

  /** Derive periods from FY when API is empty (same reliability as quarterly for all periodic types). */
  const getPeriodicOptions = (values) => {
    const selectedType = getSelectedReportType(values.report_type_uid);
    const freq = normalizeReportFrequency(selectedType?.frequency);
    const fy = financialYears.find((f) => f.uid === values.financial_year_uid);
    if (!fy?.start_date || !fy?.end_date) return financialPeriods || [];
    if (freq === "quarterly") {
      const built = buildQuarterPeriodsFromFY(fy);
      if (built.length > 0) return built;
    } else if (freq === "biannual") {
      const built = buildBiannualPeriodsFromFY(fy);
      if (built.length > 0) return built;
    } else if (freq === "monthly") {
      const built = buildMonthlyPeriodsFromFY(fy);
      if (built.length > 0) return built;
    } else if (freq === "annual") {
      const built = buildAnnualPeriodFromFY(fy);
      if (built.length > 0) return built;
    }
    return financialPeriods || [];
  };

  const getSelectedFinancialYear = (fyUid) => {
    return financialYears.find(fy => fy.uid === fyUid);
  };

  const currentFinancialYear = resolveCurrentFinancialYear(financialYears);

  const isPeriodic = (reportTypeUid) => {
    const selectedType = getSelectedReportType(reportTypeUid);
    const f = normalizeReportFrequency(selectedType?.frequency);
    return selectedType && PERIODIC_FREQUENCIES.includes(f);
  };

  const isAutoDeadlineType = (reportTypeUid) => {
    const selectedType = getSelectedReportType(reportTypeUid);
    const f = normalizeReportFrequency(selectedType?.frequency);
    return selectedType && AUTO_DEADLINE_FREQUENCIES.includes(f);
  };

  const getComputedDeadline = ({
    reportTypeUid,
    financialYearUid,
    financialPeriodUid,
    values: formValues,
  }) => {
    const selectedType = getSelectedReportType(reportTypeUid);
    const freq = normalizeReportFrequency(selectedType?.frequency);
    if (!selectedType || !AUTO_DEADLINE_FREQUENCIES.includes(freq)) return "";

    const days = Number(selectedType.submission_deadline_days || 0);

    if (freq === "annual") {
      const fy = getSelectedFinancialYear(financialYearUid);
      return addDaysToDateString(fy?.end_date, days);
    }

    const opts =
      formValues != null ? getPeriodicOptions(formValues) : financialPeriods || [];
    const period = opts.find((p) => p.uid === financialPeriodUid);
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
        const f = normalizeReportFrequency(t?.frequency);
        return !isEditMode && (f === "quarterly" || f === "biannual");
      },
      then: (schema) => schema.min(1, "Select at least one period"),
    }),
    financial_period_uid: Yup.string().when(['report_type_uid'], {
      is: (report_type_uid) => {
        const t = getSelectedReportType(report_type_uid);
        const f = normalizeReportFrequency(t?.frequency);
        return (
          isPeriodic(report_type_uid) &&
          !(!isEditMode && (f === "quarterly" || f === "biannual"))
        );
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
    stakeholder_uid: Yup.string().when("scope", {
      is: (scope) => String(scope || "").toLowerCase() === "external",
      then: (schema) =>
        schema.test(
          "external-stakeholder",
          "Select a stakeholder from the list, or choose Other and enter a name",
          function (value) {
            const name = String(this.parent.other_stakeholder_name || "").trim();
            const v = String(value || "").trim();
            if (!v) return false;
            if (v === STAKEHOLDER_OTHER_VALUE) return name.length >= 2;
            return true;
          }
        ),
      otherwise: (schema) => schema.notRequired().nullable(),
    }),
    other_stakeholder_name: Yup.string().when(["scope", "stakeholder_uid"], {
      is: (scope, uid) =>
        String(scope || "").toLowerCase() === "external" &&
        String(uid || "") === STAKEHOLDER_OTHER_VALUE,
      then: (schema) =>
        schema
          .trim()
          .required("Enter the stakeholder name")
          .min(2, "Name should be at least 2 characters"),
      otherwise: (schema) => schema.notRequired().nullable(),
    }),
  });

  const stepValidations = {
    1: ['title', 'report_type_uid'],
    2: ['financial_year_uid', 'deadline_date', 'priority'],
    3: ['scope'],
  };

  const validateStep = (values, errors, step) => {
    if (step === 3) {
      if (!values.scope || errors.scope) return false;
      if (String(values.scope).toLowerCase() !== "external") return true;
      const uid = String(values.stakeholder_uid || "").trim();
      const other = String(values.other_stakeholder_name || "").trim();
      if (!uid) return false;
      if (uid === STAKEHOLDER_OTHER_VALUE) {
        return other.length >= 2 && !errors.other_stakeholder_name;
      }
      return !errors.stakeholder_uid;
    }
    if (step === 2) {
      const baseOk =
        !!values.financial_year_uid &&
        !!values.priority &&
        !errors.financial_year_uid &&
        !errors.priority;

      if (!baseOk) return false;
      if (!isEditMode && isAutoDeadlineType(values.report_type_uid)) {
        const selectedType = getSelectedReportType(values.report_type_uid);
        const sf = normalizeReportFrequency(selectedType?.frequency);
        if (sf === "quarterly" || sf === "biannual") {
          return Array.isArray(values.financial_period_uids) && values.financial_period_uids.length > 0 && !errors.financial_period_uids;
        }
        if (sf === "annual") {
          return (
            !!values.financial_year_uid &&
            !!values.financial_period_uid &&
            !errors.financial_period_uid
          );
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
    stakeholder_uid:
      report?.stakeholder?.uid ||
      (report?.other_stakeholder_name ? STAKEHOLDER_OTHER_VALUE : ""),
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
      
      if (data.scope !== "external") {
        delete data.stakeholder_uid;
        delete data.other_stakeholder_name;
      } else if (data.stakeholder_uid === STAKEHOLDER_OTHER_VALUE) {
        delete data.stakeholder_uid;
      } else if (data.stakeholder_uid) {
        delete data.other_stakeholder_name;
      }
      if (!data.stakeholder_uid) delete data.stakeholder_uid;
      if (!data.category_uid) delete data.category_uid;
      if (!isEditMode && isAutoDeadlineType(values.report_type_uid)) {
        delete data.deadline_date;
      }
      // Quarterly / bi-annual (create): multiple periods via financial_period_uids
      const nf = normalizeReportFrequency(selectedType?.frequency);
      if (!isEditMode && (nf === "quarterly" || nf === "biannual")) {
        delete data.financial_period_uid;
        if (!data.financial_period_uids || data.financial_period_uids.length === 0) {
          delete data.financial_period_uids;
        }
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

      const apiStatus = Number(response?.status);
      if (apiStatus === 8000) {
        showToast(
          isEditMode ? "Report updated successfully" : "Report created successfully",
          "success"
        );
        if (typeof onSuccess === "function") {
          onSuccess(response?.data ?? null);
        }
      } else if (apiStatus === 8002 && response.data) {
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

  const renderStep2 = (values, errors, touched, setFieldValue) => {
    const periodList = getPeriodicOptions(values);
    const multiPeriod = usesMultiPeriodSelection(values.report_type_uid);
    const fStep = freqOf(values.report_type_uid);
    return (
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
              {freqOf(values.report_type_uid) === "quarterly"
                ? "Quarter"
                : freqOf(values.report_type_uid) === "biannual"
                  ? "Half year"
                  : freqOf(values.report_type_uid) === "monthly"
                    ? "Month"
                    : freqOf(values.report_type_uid) === "annual"
                      ? "Annual period"
                      : "Period"}
            </label>
            {multiPeriod ? (
              <div className="d-flex flex-column gap-2">
                <Select
                  isMulti
                  options={periodList.map((p) => ({
                    value: p.uid,
                    label: `${p.display_name} (${p.start_date} - ${p.end_date})`,
                  }))}
                  value={periodList
                    .filter((p) => (values.financial_period_uids || []).includes(p.uid))
                    .map((p) => ({
                      value: p.uid,
                      label: `${p.display_name} (${p.start_date} - ${p.end_date})`,
                    }))}
                  onChange={(selected) => {
                    const selectedUids = (selected || []).map((o) => o.value);
                    setFieldValue("financial_period_uids", selectedUids);
                  }}
                  classNamePrefix="react-select"
                  placeholder={
                    fStep === "biannual"
                      ? "Select one or more half-years (H1, H2)..."
                      : "Select one or more quarters..."
                  }
                  styles={{
                    menu: (base) => ({ ...base, zIndex: 99999 }),
                    control: (base) => ({ ...base, minHeight: "46px" }),
                  }}
                />
                <div className="d-flex flex-wrap align-items-center gap-2 justify-content-start">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary flex-shrink-0"
                    disabled={periodList.length === 0}
                    onClick={() =>
                      setFieldValue(
                        "financial_period_uids",
                        periodList.map((p) => p.uid)
                      )
                    }
                  >
                    {fStep === "biannual"
                      ? "Select all (H1–H2)"
                      : "Select all (Q1–Q4)"}
                  </button>
                  <small className="text-muted lh-sm mb-0 flex-grow-1" style={{ minWidth: "10rem" }}>
                    {fStep === "biannual"
                      ? "Choose H1, H2, or both below, or add both half-years at once."
                      : "Choose Q1–Q4 below, or add every quarter at once."}
                  </small>
                </div>
                <ErrorMessage
                  name="financial_period_uids"
                  component="div"
                  className="text-danger small d-block"
                />
              </div>
            ) : (
              <>
                <Field
                  as="select"
                  name="financial_period_uid"
                  className={`form-select form-select-lg ${errors.financial_period_uid && touched.financial_period_uid ? 'is-invalid' : ''}`}
                >
                  <option value="">Select period</option>
                  {periodList.map((p) => (
                    <option key={p.uid} value={p.uid}>
                      {p.display_name} ({p.start_date} - {p.end_date})
                    </option>
                  ))}
                </Field>
                <ErrorMessage name="financial_period_uid" component="div" className="invalid-feedback" />
              </>
            )}
          </Col>
        )}

        <Col md={6}>
          {!isEditMode && isAutoDeadlineType(values.report_type_uid) ? (
            <>
              <label className="form-label fw-medium">Computed Submission Deadline</label>
              {multiPeriod ? (
                <div className="alert alert-info mb-0">
                  <div className="fw-semibold mb-2">Deadlines will be computed automatically</div>
                  {periodList
                    .filter((p) => (values.financial_period_uids || []).includes(p.uid))
                    .map((p) => (
                      <div key={p.uid} className="small mb-1">
                        <strong>{p.display_name}:</strong>{" "}
                        {getComputedDeadline({
                          reportTypeUid: values.report_type_uid,
                          financialYearUid: values.financial_year_uid,
                          financialPeriodUid: p.uid,
                          values,
                        }) || "Select period"}
                      </div>
                    ))}
                  {(!values.financial_period_uids || values.financial_period_uids.length === 0) && (
                    <div className="small text-muted">
                      {fStep === "biannual"
                        ? "Select one or more half-years to preview deadlines."
                        : "Select one or more quarters to preview deadlines."}
                    </div>
                  )}
                </div>
              ) : (
                <div className="alert alert-info mb-0">
                  <div className="fw-semibold">
                    {getComputedDeadline({
                      reportTypeUid: values.report_type_uid,
                      financialYearUid: values.financial_year_uid,
                      financialPeriodUid: values.financial_period_uid,
                      values,
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
  };

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
                onClick={() => {
                  setFieldValue('scope', option.value);
                  if (option.value === 'internal') {
                    setFieldValue('stakeholder_uid', '');
                    setFieldValue('other_stakeholder_name', '');
                  }
                }}
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

        {values.scope === "external" && (
          <>
            <Col md={12}>
              <div className="alert alert-info mb-3">
                <i className="bx bx-info-circle me-2"></i>
                Select the stakeholder this report is sent to. If they are not in the list, choose{" "}
                <strong>Other</strong> and enter their name below.
              </div>
            </Col>
            {stakeholders.length === 0 && (
              <Col md={12}>
                <div className="alert alert-warning mb-0">
                  <i className="bx bx-error-circle me-2"></i>
                  No stakeholders are configured yet. Choose <strong>Other</strong> and enter the
                  organization name (at least 2 characters) to register this external report.
                </div>
              </Col>
            )}
            <Col md={12}>
              <label className="form-label fw-medium">
                Select stakeholder <span className="text-danger">*</span>
              </label>
              <Field name="stakeholder_uid">
                {({ field, form }) => (
                  <select
                    {...field}
                    id={field.name}
                    className={`form-select form-select-lg ${
                      errors.stakeholder_uid && touched.stakeholder_uid ? "is-invalid" : ""
                    }`}
                    onChange={(e) => {
                      field.onChange(e);
                      const v = e.target.value;
                      if (v !== STAKEHOLDER_OTHER_VALUE) {
                        form.setFieldValue("other_stakeholder_name", "");
                      }
                      form.setFieldTouched("stakeholder_uid", true, false);
                      form.setFieldTouched("other_stakeholder_name", true, false);
                      setTimeout(() => {
                        form.validateField("stakeholder_uid");
                        form.validateField("other_stakeholder_name");
                      }, 0);
                    }}
                  >
                    <option value="">Select stakeholder</option>
                    {stakeholders.map((stakeholder) => (
                      <option key={stakeholder.uid} value={String(stakeholder.uid)}>
                        {stakeholder.name} ({stakeholder.organization_type_display || stakeholder.organization_type})
                      </option>
                    ))}
                    <option value={STAKEHOLDER_OTHER_VALUE}>Other (enter name manually)</option>
                  </select>
                )}
              </Field>
              <ErrorMessage
                name="stakeholder_uid"
                component="div"
                className="invalid-feedback d-block"
              />
            </Col>
            {values.stakeholder_uid === STAKEHOLDER_OTHER_VALUE && (
              <Col md={12}>
                <label className="form-label fw-medium">
                  Enter custom stakeholder <span className="text-danger">*</span>
                </label>
                <Field
                  name="other_stakeholder_name"
                  type="text"
                  className={`form-control form-control-lg ${
                    errors.other_stakeholder_name && touched.other_stakeholder_name ? "is-invalid" : ""
                  }`}
                  placeholder='Enter stakeholder name if not in list'
                  autoComplete="organization"
                />
                <ErrorMessage
                  name="other_stakeholder_name"
                  component="div"
                  className="invalid-feedback d-block"
                />
              </Col>
            )}
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
          {({
            values,
            setFieldValue,
            isSubmitting,
            errors,
            touched,
            setTouched,
            submitForm,
          }) => (
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
                {currentStep === 2 && (
                  <ReportPeriodSync
                    financialYearUid={values.financial_year_uid}
                    reportTypeUid={values.report_type_uid}
                    syncFn={loadFinancialPeriods}
                  />
                )}
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
                      type="button"
                      className="btn btn-success"
                      disabled={loading || isSubmitting}
                      onClick={async () => {
                        setTouched({
                          ...touched,
                          scope: true,
                          stakeholder_uid: true,
                          other_stakeholder_name: true,
                        });
                        await submitForm();
                      }}
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
