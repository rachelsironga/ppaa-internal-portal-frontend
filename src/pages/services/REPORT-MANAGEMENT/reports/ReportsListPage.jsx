import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import BreadCumb from "../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import ReportModal from "./ReportModal";
import { 
  deleteReport, 
  STATUS_OPTIONS, 
  PRIORITY_OPTIONS, 
  DEADLINE_STATE_OPTIONS,
  SCOPE_OPTIONS,
  getFinancialYears,
  getReportTypes,
  getReportCategories,
  getDepartments,
  getReports,
} from "../Queries";
import { formatDate } from "../../../../helpers/DateFormater";
import showToast from "../../../../helpers/ToastHelper";
import {
  canChangeRmsReport,
  canCreateRmsReport,
  canDeleteRmsReport,
} from "../../../../utils/rmsReportPermissions";
import Swal from "sweetalert2";
import "animate.css";

const normalizeListReportFrequency = (raw) => {
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
  if (s === "year" || s === "yearly") return "annual";
  if (s === "quarter" || s === "qtr") return "quarterly";
  if (s === "month") return "monthly";
  if (s === "ad-hoc" || s === "adhook" || s === "ad-hook") return "adhoc";
  return s;
};

const ReportsListPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useSelector((state) => state.userReducer?.data);
  const [showModal, setShowModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [financialYears, setFinancialYears] = useState([]);
  const [reportTypes, setReportTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [defaultFinancialYearUid, setDefaultFinancialYearUid] = useState(null);
  const [filtersReady, setFiltersReady] = useState(false);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      const [fyRes, typesRes, catsRes, depsRes] = await Promise.all([
        getFinancialYears(),
        getReportTypes(),
        getReportCategories(),
        getDepartments(),
      ]);
      
      if (fyRes.status === 8000) {
        const fyData = fyRes.data || [];
        setFinancialYears(fyData);

        const queryFinancialYearUid = searchParams.get("financial_year_uid");
        if (queryFinancialYearUid) {
          setDefaultFinancialYearUid(queryFinancialYearUid);
        } else {
          const today = new Date();
          const currentFy =
            fyData.find((fy) => {
              const start = fy?.start_date ? new Date(fy.start_date) : null;
              const end = fy?.end_date ? new Date(fy.end_date) : null;
              return start && end && today >= start && today <= end;
            }) ||
            fyData.find((fy) => fy.is_current) ||
            null;

          setDefaultFinancialYearUid(currentFy?.uid || null);
        }
      }
      if (typesRes.status === 8000) setReportTypes(typesRes.data || []);
      if (catsRes.status === 8000) setCategories(catsRes.data || []);
      if (depsRes.status === 8000) setDepartments(depsRes.data || []);
    } catch (error) {
      console.error("Error fetching filter options:", error);
    } finally {
      setFiltersReady(true);
    }
  };

  const handleRefresh = () => setRefreshKey(prev => prev + 1);

  const handleEdit = async (report) => {
    try {
      // Row data from list is lightweight; fetch full detail so selects pre-populate
      const res = await getReports({ uid: report.uid });
      if (res.status === 8000 && res.data) {
        setSelectedReport(res.data);
      } else {
        setSelectedReport(report);
      }
    } catch (e) {
      setSelectedReport(report);
    }
    setShowModal(true);
  };

  const handleDelete = async (report) => {
    const result = await Swal.fire({
      title: "Delete Report?",
      html: `Are you sure you want to delete <strong>${report.title}</strong>?<br/>This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      showClass: { popup: "animate__animated animate__fadeInDown" },
      hideClass: { popup: "animate__animated animate__fadeOutUp" },
    });

    if (result.isConfirmed) {
      try {
        const response = await deleteReport(report.uid);
        if (response.status === 8000) {
          showToast("Report deleted successfully", "success");
          handleRefresh();
        } else {
          showToast(response.message || "Failed to delete report", "error");
        }
      } catch (error) {
        showToast("Failed to delete report", "error");
      }
    }
  };

  const formatReportTitle = (title) => {
    if (!title || typeof title !== "string") return "";
    return title.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getStatusBadge = (status) => {
    const option = STATUS_OPTIONS.find(o => o.value === status);
    return (
      <span className={`badge bg-label-${option?.color || 'secondary'}`}>
        {option?.label || status}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const option = PRIORITY_OPTIONS.find(o => o.value === priority);
    const icons = { low: 'bx-down-arrow', medium: 'bx-minus', high: 'bx-up-arrow', critical: 'bx-error' };
    return (
      <span className={`badge bg-label-${option?.color || 'secondary'}`}>
        <i className={`bx ${icons[priority] || ''} me-1`}></i>
        {option?.label || priority}
      </span>
    );
  };

  const getDeadlineStateBadge = (state, daysUntil) => {
    const option = DEADLINE_STATE_OPTIONS.find(o => o.value === state);
    const daysText = state === 'completed' 
      ? '' 
      : state === 'overdue' 
        ? `(${Math.abs(daysUntil)}d overdue)` 
        : `(${daysUntil}d left)`;
    
    return (
      <span className={`badge bg-${option?.color || 'secondary'}`}>
        <i className={`bx ${option?.icon || 'bx-help-circle'} me-1`}></i>
        {option?.label || state} {daysText}
      </span>
    );
  };

  const columns = [
    {
      key: "SN",
      label: "SN",
      style: { width: "50px" },
    },
    {
      key: "reference_number",
      label: "Report Code",
      style: { width: "140px" },
      render: (row) => (
        <span className="badge bg-primary fw-bold px-3 py-2" style={{ fontSize: '0.85rem' }}>
          {row.reference_number}
        </span>
      ),
    },
    {
      key: "title",
      label: "Report Title",
      render: (row) => (
        <div>
          <div className="fw-semibold text-dark" title={formatReportTitle(row.title)}>
            {formatReportTitle(row.title)?.length > 50
              ? `${formatReportTitle(row.title).substring(0, 50).toUpperCase()}...`
              : formatReportTitle(row.title).toUpperCase()}
          </div>
          <div className="d-flex flex-wrap gap-2 align-items-center mt-1">
            <small className="text-muted">{(row.report_type_name || "").toUpperCase()}</small>
            {(() => {
              const nf = normalizeListReportFrequency(row.report_type_frequency);
              const isPeriodicFreq = [
                "quarterly",
                "biannual",
                "monthly",
                "annual",
                "adhoc",
              ].includes(nf);
              if (!isPeriodicFreq || !(Number(row.period_total_count || 0) > 0)) return null;
              const totalPeriods = Number(row.period_total_count || 0);
              const pendingPeriods = Number(row.period_pending_count || 0);
              const showPendingBadge = pendingPeriods > 0 || totalPeriods > 1;
              return (
                <>
                  <span className="badge bg-label-success" title="Submitted implementation periods">
                    <i className="bx bx-check-circle me-1"></i>
                    {row.period_done_count || 0} done
                  </span>
                  {showPendingBadge && (
                    <span className="badge bg-label-warning" title="Remaining implementation periods">
                      <i className="bx bx-time-five me-1"></i>
                      {row.period_pending_count || 0} pending
                    </span>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      ),
    },
    {
      key: "department_name",
      label: "Department",
      render: (row) => (
        <span className="text-primary fw-medium text-uppercase small">
        {row.department_name || row.directory_name || '-'}
      </span>
      ),
    },
    {
      key: "deadline_date",
      label: "Deadline",
      render: (row) => {
        const deadlineOption = DEADLINE_STATE_OPTIONS.find(o => o.value === row.deadline_state);
        return (
          <div>
            <div className="fw-medium">{formatDate(row.deadline_date)}</div>
            <span className={`badge bg-${deadlineOption?.color || 'secondary'}`} style={{ fontSize: '0.7rem' }}>
              {deadlineOption?.label || row.deadline_state}
            </span>
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const statusOption = STATUS_OPTIONS.find(o => o.value === row.status);
        return (
          <span className={`badge bg-label-${statusOption?.color || 'secondary'} px-3 py-2`}>
            {statusOption?.label || row.status}
          </span>
        );
      },
    },
    {
      key: "progress_percentage",
      label: "Progress",
      style: { width: "100px" },
      render: (row) => {
        const isPeriodic = [
          "quarterly",
          "biannual",
          "monthly",
          "annual",
          "adhoc",
        ].includes(normalizeListReportFrequency(row.report_type_frequency));
        const doneCount = Number(row.period_done_count || 0);
        const totalCount = Number(row.period_total_count || 0);
        const effectiveProgressPercentage =
          isPeriodic && totalCount > 0
            ? Math.round((doneCount / totalCount) * 100)
            : Number(row.progress_percentage || 0);
        const progressColor = effectiveProgressPercentage === 100 ? 'success' : effectiveProgressPercentage >= 50 ? 'primary' : 'warning';
        return (
          <div>
            <div className="d-flex justify-content-between mb-1">
              <small className="fw-medium">{effectiveProgressPercentage}%</small>
            </div>
            <div className="progress" style={{ height: '6px' }}>
              <div className={`progress-bar bg-${progressColor}`} style={{ width: `${effectiveProgressPercentage}%` }}></div>
            </div>
          </div>
        );
      },
    },
    {
      key: "actions",
      label: "",
      style: { width: "60px" },
      render: (row) => (
        <div className="dropdown">
          <button
            className="btn btn-sm btn-icon btn-outline-secondary rounded-circle"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
            onClick={(e) => e.stopPropagation()}
          >
            <i className="bx bx-dots-vertical-rounded fs-5"></i>
          </button>
          <ul className="dropdown-menu dropdown-menu-end shadow-sm">
            <li>
              <button
                className="dropdown-item d-flex align-items-center"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/report-management/reports/${row.uid}`);
                }}
              >
                <i className="bx bx-show me-2 text-primary"></i>
                View Details
              </button>
            </li>
            {row.status !== "submitted" && canChangeRmsReport(user) && (
              <li>
                <button
                  className="dropdown-item d-flex align-items-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(row);
                  }}
                >
                  <i className="bx bx-edit me-2 text-info"></i>
                  Edit Report
                </button>
              </li>
            )}
            {canDeleteRmsReport(user) && (
              <>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button
                    className="dropdown-item d-flex align-items-center text-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(row);
                    }}
                  >
                    <i className="bx bx-trash me-2"></i>
                    Delete Report
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      ),
    },
  ];

  const filterGroups = [
    {
      key: "status",
      label: "Status",
      options: STATUS_OPTIONS.map(o => ({ value: o.value, label: o.label })),
    },
    {
      key: "priority",
      label: "Priority",
      options: PRIORITY_OPTIONS.map(o => ({ value: o.value, label: o.label })),
    },
    {
      key: "deadline_state",
      label: "Deadline State",
      options: DEADLINE_STATE_OPTIONS.map(o => ({ value: o.value, label: o.label })),
    },
    {
      key: "scope",
      label: "Scope",
      options: SCOPE_OPTIONS.map(o => ({ value: o.value, label: o.label })),
    },
    {
      key: "financial_year_uid",
      label: "Financial Year",
      options: financialYears.map(fy => ({ value: fy.uid, label: fy.name })),
    },
    {
      key: "report_type_uid",
      label: "Report Type",
      options: reportTypes.map(rt => ({ value: rt.uid, label: rt.name })),
    },
    {
      key: "category_uid",
      label: "Category",
      options: categories.map(cat => ({ value: cat.uid, label: cat.name })),
    },
    {
      key: "department_uid",
      label: "Department",
      options: departments.map((department) => ({
        value: department.uid,
        label: department.code ? `${department.code} - ${department.name}` : department.name,
      })),
    },
  ];

  const getInitialFilters = () => {
    const filters = {};
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const deadline_state = searchParams.get('deadline_state');
    const scope = searchParams.get('scope');
    const financial_year_uid = searchParams.get('financial_year_uid') || defaultFinancialYearUid;
    const report_type_uid = searchParams.get('report_type_uid');
    const category_uid = searchParams.get('category_uid');
    const department_uid = searchParams.get('department_uid');
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (deadline_state) filters.deadline_state = deadline_state;
    if (scope) filters.scope = scope;
    if (financial_year_uid) filters.financial_year_uid = financial_year_uid;
    if (report_type_uid) filters.report_type_uid = report_type_uid;
    if (category_uid) filters.category_uid = category_uid;
    if (department_uid) filters.department_uid = department_uid;
    else {
      const directory_uid = searchParams.get('directory_uid') || searchParams.get('directorate_uid');
      if (directory_uid) filters.department_uid = directory_uid;
    }
    return filters;
  };

  return (
    <div className="w-100">
      <BreadCumb pageList={["Report Management System (RMS)", "Reports"]} />

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
          <div>
            <h5 className="mb-0">
              <i className="bx bx-file me-2 text-primary"></i>
              All Reports
            </h5>
            <small className="text-muted">Manage and track all PPAA reports</small>
          </div>
          {canCreateRmsReport(user) && (
            <button
              className="btn btn-primary"
              onClick={() => {
                setSelectedReport(null);
                setShowModal(true);
              }}
            >
              <i className="bx bx-plus me-1"></i>
              New Report
            </button>
          )}
        </div>
        <div className="card-body p-0">
          {filtersReady && (
            <PaginatedTable
              key={`${refreshKey}-${defaultFinancialYearUid || 'all'}`}
              fetchPath="/api/reports/reports-grouped"
              isFullPath={true}
              columns={columns}
              filterGroups={filterGroups}
              initialFilters={getInitialFilters()}
              clearFiltersOnEmpty={false}
              searchPlaceholder="Search by title or reference..."
              rowClassName={(row) => {
                if (row.deadline_state === 'overdue') return 'table-danger bg-opacity-10';
                if (row.deadline_state === 'due_today') return 'table-warning bg-opacity-10';
                return '';
              }}
            />
          )}
        </div>
      </div>

      {showModal && (
        <ReportModal
          show={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedReport(null);
          }}
          onSuccess={(created) => {
            // List defaults to "current" FY; new rows are hidden if the modal used a different FY.
            if (created?.financial_year?.uid) {
              setDefaultFinancialYearUid(created.financial_year.uid);
            }
            setShowModal(false);
            setSelectedReport(null);
            handleRefresh();
          }}
          report={selectedReport}
        />
      )}
    </div>
  );
};

export default ReportsListPage;
