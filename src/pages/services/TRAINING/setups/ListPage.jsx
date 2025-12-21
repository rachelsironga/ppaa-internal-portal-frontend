import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import showToast from "../../../../helpers/ToastHelper";
import "animate.css";
import { useSelector } from "react-redux";
import BreadCumb from "../../../../layouts/BreadCumb";
import { getTrainingSettings } from "./Queries";
import { TrainingSettingsModal } from "./TrainingSettingsModal";
import { hasAccess } from "../../../../hooks/AccessHandler";

export const TrainingSetupsListPage = () => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const user = useSelector((state) => state.userReducer?.data);

    useEffect(() => {
        fetchSettings();
    }, [refreshKey]);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const result = await getTrainingSettings();
            if (result.status === 8000 && result.data) {
                setSettings(result.data);
            } else {
                showToast("Failed to load training settings", "error", "Error");
            }
        } catch (error) {
            console.error("Error loading training settings:", error);
            showToast("Failed to load training settings", "error", "Error");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center mt-5">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <>
            <BreadCumb pageList={["Training", "Setups"]} />

            {/* Organization Settings Card */}
            <div className="card mb-4 shadow-sm animate__animated animate__fadeInDown animate__faster">
                <div className="card-header bg-light">
                    <h5 className="card-title mb-0 fw-bold">
                        <i className="bx bx-building me-2"></i>Organization Settings
                    </h5>
                </div>
                <div className="card-body">
                    {settings ? (
                        <div className="row">
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="text-muted small">Organization Name</label>
                                    <p className="mb-0 fw-bold">{settings.organization_name}</p>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="text-muted small">Status</label>
                                    <p className="mb-0">
                                        {settings.is_active ? (
                                            <span className="badge bg-success">Active</span>
                                        ) : (
                                            <span className="badge bg-secondary">Inactive</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted">No settings configured yet</p>
                    )}
                </div>
            </div>

            {/* Student ID Configuration Card */}
            <div className="card mb-4 shadow-sm animate__animated animate__fadeInDown">
                <div className="card-header bg-light">
                    <h5 className="card-title mb-0 fw-bold">
                        <i className="bx bx-id-card me-2"></i>Student ID Configuration
                    </h5>
                </div>
                <div className="card-body">
                    {settings ? (
                        <div className="row">
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="text-muted small">Prefix</label>
                                    <p className="mb-0 fw-bold">{settings.student_id_prefix}</p>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="text-muted small">Format</label>
                                    <p className="mb-0 fw-bold">
                                        <code>{settings.student_id_format}</code>
                                    </p>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="text-muted small">Current Counter</label>
                                    <p className="mb-0 fw-bold">{settings.student_id_increment_counter}</p>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="text-muted small">Reset Yearly</label>
                                    <p className="mb-0">
                                        {settings.reset_student_counter_yearly ? (
                                            <span className="badge bg-success">Yes</span>
                                        ) : (
                                            <span className="badge bg-secondary">No</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted">No settings configured yet</p>
                    )}
                </div>
            </div>

            {/* Application Reference Configuration Card */}
            <div className="card mb-4 shadow-sm animate__animated animate__fadeInDown">
                <div className="card-header bg-light">
                    <h5 className="card-title mb-0 fw-bold">
                        <i className="bx bx-file me-2"></i>Application Reference Configuration
                    </h5>
                </div>
                <div className="card-body">
                    {settings ? (
                        <div className="row">
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="text-muted small">Prefix</label>
                                    <p className="mb-0 fw-bold">{settings.application_ref_prefix}</p>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="text-muted small">Format</label>
                                    <p className="mb-0 fw-bold">
                                        <code>{settings.application_ref_format}</code>
                                    </p>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="text-muted small">Current Counter</label>
                                    <p className="mb-0 fw-bold">{settings.application_ref_counter}</p>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="text-muted small">Reset Yearly</label>
                                    <p className="mb-0">
                                        {settings.reset_application_counter_yearly ? (
                                            <span className="badge bg-success">Yes</span>
                                        ) : (
                                            <span className="badge bg-secondary">No</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted">No settings configured yet</p>
                    )}
                </div>
            </div>

            {/* Certificate Configuration Card */}
            <div className="card mb-4 shadow-sm animate__animated animate__fadeInDown">
                <div className="card-header bg-light">
                    <h5 className="card-title mb-0 fw-bold">
                        <i className="bx bx-award me-2"></i>Certificate Configuration
                    </h5>
                </div>
                <div className="card-body">
                    {settings ? (
                        <div className="row">
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="text-muted small">Prefix</label>
                                    <p className="mb-0 fw-bold">{settings.certificate_number_prefix}</p>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="text-muted small">Format</label>
                                    <p className="mb-0 fw-bold">
                                        <code>{settings.certificate_number_format}</code>
                                    </p>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="text-muted small">Current Counter</label>
                                    <p className="mb-0 fw-bold">{settings.certificate_counter}</p>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="text-muted small">Validity (Years)</label>
                                    <p className="mb-0 fw-bold">{settings.certificate_validity_years}</p>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="text-muted small">Reset Yearly</label>
                                    <p className="mb-0">
                                        {settings.reset_certificate_counter_yearly ? (
                                            <span className="badge bg-success">Yes</span>
                                        ) : (
                                            <span className="badge bg-secondary">No</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted">No settings configured yet</p>
                    )}
                </div>
            </div>

            {/* Training Schedule Card */}
            <div className="card mb-4 shadow-sm animate__animated animate__fadeInDown">
                <div className="card-header bg-light">
                    <h5 className="card-title mb-0 fw-bold">
                        <i className="bx bx-time me-2"></i>Training Schedule
                    </h5>
                </div>
                <div className="card-body">
                    {settings ? (
                        <div className="row">
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="text-muted small">Hours Per Week</label>
                                    <p className="mb-0 fw-bold">{settings.training_hours_per_week}h</p>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="text-muted small">Days Per Week</label>
                                    <p className="mb-0 fw-bold">{settings.training_days_per_week} days</p>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="text-muted small">Standard Duration</label>
                                    <p className="mb-0 fw-bold">
                                        {settings.standard_training_duration}{" "}
                                        {settings.standard_training_duration_unit_display}
                                    </p>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="text-muted small">Min Training Days</label>
                                    <p className="mb-0 fw-bold">{settings.min_training_days} days</p>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="text-muted small">Max Training Days</label>
                                    <p className="mb-0 fw-bold">{settings.max_training_days} days</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted">No settings configured yet</p>
                    )}
                </div>
            </div>

            {/* Compliance & Notifications Card */}
            <div className="card mb-4 shadow-sm animate__animated animate__fadeInDown">
                <div className="card-header bg-light">
                    <h5 className="card-title mb-0 fw-bold">
                        <i className="bx bx-check-circle me-2"></i>Compliance & Notifications
                    </h5>
                </div>
                <div className="card-body">
                    {settings ? (
                        <div className="row">
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="text-muted small">Minimum Attendance %</label>
                                    <p className="mb-0 fw-bold">{settings.minimum_attendance_percentage}%</p>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="text-muted small">Days Before Reminder</label>
                                    <p className="mb-0 fw-bold">{settings.days_before_training_reminder} days</p>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="text-muted small">Require Supervisor Approval</label>
                                    <p className="mb-0">
                                        {settings.require_supervisor_approval ? (
                                            <span className="badge bg-success">Yes</span>
                                        ) : (
                                            <span className="badge bg-secondary">No</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="text-muted small">Notify on Completion</label>
                                    <p className="mb-0">
                                        {settings.notify_on_completion ? (
                                            <span className="badge bg-success">Yes</span>
                                        ) : (
                                            <span className="badge bg-secondary">No</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="text-muted small">Allow Overlapping Departments</label>
                                    <p className="mb-0">
                                        {settings.allow_overlapping_departments ? (
                                            <span className="badge bg-success">Yes</span>
                                        ) : (
                                            <span className="badge bg-secondary">No</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted">No settings configured yet</p>
                    )}
                </div>
            </div>

            {/* Last Updated Card */}
            <div className="card shadow-sm animate__animated animate__fadeInUp">
                <div className="card-body">
                    {settings ? (
                        <div className="row">
                            <div className="col-md-6">
                                <p className="text-muted small mb-1">Last Modified</p>
                                <p className="fw-bold mb-0">
                                    {new Date(settings.updated_at).toLocaleString()}
                                </p>
                            </div>
                            <div className="col-md-6">
                                <p className="text-muted small mb-1">Modified By</p>
                                <p className="fw-bold mb-0">
                                    {settings.updated_by_details?.first_name}{" "}
                                    {settings.updated_by_details?.last_name} (
                                    {settings.updated_by_details?.email})
                                </p>
                            </div>
                        </div>
                    ) : null}

                    {hasAccess(user, [["change_trainingsetting"]]) && (
                        <button
                            className="btn btn-primary mt-3"
                            data-bs-toggle="modal"
                            data-bs-target="#trainingSettingsModal"
                        >
                            <i className="bx bx-edit me-2"></i>Edit Settings
                        </button>
                    )}
                </div>
            </div>

            {/* Modal */}
            <TrainingSettingsModal
                settings={settings}
                onSuccess={() => setRefreshKey((prev) => prev + 1)}
            />
        </>
    );
};
