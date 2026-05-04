import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createUpdateTarget, getObjectives, getTargets, getSpismPerformanceOfficers } from "../Queries";
import showToast from "../../../../helpers/ToastHelper";
import { useNavigate } from "react-router-dom";
import { spismCan } from "../../../../utils/spismPermissions";

const TargetModal = ({
  selectedTarget,
  setSelectedTarget,
  tableRefresh,
  setTableRefresh,
  preselectedObjectiveUid = null,
  preselectedObjectiveTitle = null,
  onSuccess = null,
  modalId = "targetModal",
}) => {
  const user = useSelector((state) => state.userReducer?.data);
  const canSaveTarget = selectedTarget?.uid
    ? spismCan(user, "can_edit_spism_target")
    : spismCan(user, "can_add_spism_target");
  const navigate = useNavigate();
  const [objectives, setObjectives] = useState([]);
  const [objectivesLoading, setObjectivesLoading] = useState(false);
  const [officers, setOfficers] = useState([]);
  const [officersLoading, setOfficersLoading] = useState(false);
  const [step, setStep] = useState(0); // 0=Target, 1=KPI, 2=Assign officer

  const isPreselected = Boolean(preselectedObjectiveUid);

  useEffect(() => {
    if (isPreselected) {
      setObjectives([]);
      return;
    }
    setObjectivesLoading(true);
    getObjectives({})
      .then((res) => {
        const data = res?.data ?? res?.results ?? res;
        const list = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
        setObjectives(Array.isArray(list) ? list : []);
      })
      .catch(() => setObjectives([]))
      .finally(() => setObjectivesLoading(false));
  }, [isPreselected]);

  useEffect(() => {
    setOfficersLoading(true);
    getSpismPerformanceOfficers({})
      .then((res) => {
        const data = res?.data ?? res?.results ?? res;
        const list = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
        setOfficers(Array.isArray(list) ? list : []);
      })
      .catch(() => setOfficers([]))
      .finally(() => setOfficersLoading(false));
  }, []);

  const initialValues = {
    objective: selectedTarget?.objective_uid ?? selectedTarget?.objective ?? preselectedObjectiveUid ?? "",
    title: selectedTarget?.title ?? "",
    description: selectedTarget?.description ?? "",
    weight: selectedTarget?.weight ?? "",
    planned_value: selectedTarget?.planned_value ?? "",
    responsible_officer_id: selectedTarget?.responsible_officer_id ?? "",
    kpi_name: selectedTarget?.kpi_name ?? "",
    // derive a simple unit type for UX: number vs percent
    kpi_unit_type: selectedTarget?.kpi_unit === "%" ? "PERCENT" : "NUMBER",
    kpi_planned_value: selectedTarget?.kpi_planned_value ?? "",
    kpi_direction: selectedTarget?.kpi_direction ?? "INCREASE",
  };

  const validationSchema = Yup.object().shape({
    ...(step === 0
      ? {
          objective: isPreselected ? Yup.string() : Yup.string().required("Objective is required"),
          title: Yup.string().trim().required("Title is required"),
          weight: Yup.number().min(0.01).max(100).required("Weight % is required"),
        }
      : {}),
    ...(step === 2
      ? {
          responsible_officer_id: Yup.number()
            .typeError("Responsible officer is required")
            .required("Responsible officer is required"),
        }
      : {}),
  });

  const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
    try {
      const objectiveUid = isPreselected ? preselectedObjectiveUid : values.objective;
      if (!objectiveUid) {
        setErrors({ objective: "Objective is required" });
        setSubmitting(false);
        return;
      }
      const newWeight = Number(values.weight);
      if (Number.isNaN(newWeight) || newWeight <= 0) {
        setErrors({ weight: "Weight % is required and must be greater than 0" });
        setSubmitting(false);
        return;
      }
      // Check total weight of targets in this objective does not exceed 100%
      let existingTargets = [];
      try {
        const res = await getTargets({ objective: objectiveUid });
        const data = res?.data ?? res?.results ?? res;
        existingTargets = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
        if (!Array.isArray(existingTargets)) existingTargets = [];
      } catch (_) {
        existingTargets = [];
      }
      const otherTargets = existingTargets.filter((t) => t.uid !== selectedTarget?.uid);
      const otherSum = otherTargets.reduce((sum, t) => sum + (Number(t.weight) || 0), 0);
      const totalWeight = otherSum + newWeight;
      if (totalWeight > 100) {
        const message =
          "Total weight of targets in this objective must not exceed 100%. " +
          `Currently the total would be ${totalWeight.toFixed(1)}%. Please adjust so the sum equals 100%.`;
        showToast(message, "warning", "Weight limit");
        setErrors({ weight: message });
        setSubmitting(false);
        return;
      }
      const payload = {
        ...(selectedTarget?.uid && { uid: selectedTarget.uid }),
        objective: objectiveUid,
        title: values.title.trim(),
        description: values.description?.trim() || null,
        weight: Number(values.weight),
        planned_value: values.planned_value ? Number(values.planned_value) : null,
        responsible_officer_id: values.responsible_officer_id ? Number(values.responsible_officer_id) : null,
        kpi_name: values.kpi_name?.trim() || "",
        kpi_source_type: values.kpi_source_type || "DERIVED",
        // store a simple, consistent unit text based on selected type
        kpi_unit: values.kpi_unit_type === "PERCENT" ? "%" : "number",
        // Direct KPI needs an annual target; Activity-driven KPI does not.
        kpi_planned_value:
          values.kpi_source_type === "DIRECT" && values.kpi_planned_value
            ? Number(values.kpi_planned_value)
            : null,
        kpi_direction: values.kpi_direction || "INCREASE",
        kpi_calculation_method:
          values.kpi_source_type === "DIRECT"
            ? values.kpi_calculation_method ||
              (values.kpi_unit_type === "PERCENT" ? "AVERAGE" : "CUMULATIVE")
            : values.kpi_calculation_method || "CUMULATIVE",
      };
      const result = await createUpdateTarget(payload);
      if (result?.status === 200 || result?.status === 8000) {
        showToast(selectedTarget ? "Target updated successfully" : "Target created successfully", "success", "Done");
        setTableRefresh?.((prev) => prev + 1);
        handleClose();
        resetForm();
        setSelectedTarget?.(null);
        onSuccess?.();
      } else if (result?.status === 8002) {
        showToast(result?.message || "Validation failed", "warning", "Validation");
        setErrors(result?.data || {});
      } else {
        showToast(result?.message || "Save failed", "warning", "Error");
      }
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to save target", "error", "Error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    const el = document.getElementById(modalId);
    const modal = window.bootstrap?.Modal?.getInstance(el);
    if (modal) modal.hide();
    setSelectedTarget?.(null);
  };

  useEffect(() => {
    // Reset step whenever modal target changes
    setStep(0);
  }, [selectedTarget?.uid, modalId]);

  useEffect(() => {
    const el = document.getElementById(modalId);
    if (!el) return;
    const onHidden = () => setSelectedTarget?.(null);
    el.addEventListener("hidden.bs.modal", onHidden);
    return () => el.removeEventListener("hidden.bs.modal", onHidden);
  }, [modalId]);

  return (
    <div
      className="modal modal-slide-in"
      id={modalId}
      tabIndex="-1"
      aria-hidden="true"
      data-bs-backdrop="static"
      data-bs-keyboard="false"
    >
      <div
        className="modal-dialog modal-lg"
        role="document"
        style={{ height: "calc(100vh - 3.5rem)" }}
      >
        <div className="modal-content" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <div className="modal-header">
            <h5 className="modal-title">
              {selectedTarget ? "Edit" : "Add"} Target {isPreselected && preselectedObjectiveTitle && (
                <span className="text-muted fw-normal small">(under {preselectedObjectiveTitle})</span>
              )}
            </h5>
            <button type="button" className="btn-close" onClick={handleClose} aria-label="Close" />
          </div>
          <div className="px-4 pt-3 pb-3 border-bottom bg-light">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div className="d-flex align-items-center flex-wrap w-100" style={{ position: "relative" }}>
                {/* Connector line behind the step circles */}
                <div
                  style={{
                    position: "absolute",
                    left: "70px",
                    right: "70px",
                    top: "19px",
                    height: "2px",
                    background: "#e5e7eb",
                    zIndex: 0,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: "70px",
                    top: "19px",
                    height: "2px",
                    width: `${(step / 2) * 100}%`,
                    background: "#00853f",
                    zIndex: 0,
                  }}
                />
                <div className="d-flex align-items-center justify-content-between w-100" style={{ zIndex: 1 }}>
                  {[
                    { idx: 0, label: "Target", icon: "bx-target-lock" },
                    { idx: 1, label: "KPI", icon: "bx-line-chart" },
                    { idx: 2, label: "Assign", icon: "bx-user-check" },
                  ].map((s, i, arr) => {
                    const isActive = step === s.idx;
                    const isDone = step > s.idx;
                    return (
                      <div key={s.idx} className="d-flex align-items-center">
                        <div
                          className="d-flex flex-column align-items-center"
                          style={{ minWidth: "120px" }}
                        >
                          <div
                            className={`rounded-circle d-flex align-items-center justify-content-center ${
                              isActive || isDone ? "bg-primary text-white" : "bg-white text-muted"
                            }`}
                            style={{
                              width: "38px",
                              height: "38px",
                              border: `2px solid ${isActive || isDone ? "#00853f" : "#e5e7eb"}`,
                              boxShadow: isActive ? "0 6px 18px rgba(105,108,255,0.25)" : "none",
                            }}
                          >
                            <i className={`bx ${isDone ? "bx-check" : s.icon}`} />
                          </div>
                          <small
                            className={`mt-1 fw-medium ${
                              isActive || isDone ? "text-primary" : "text-muted"
                            }`}
                            style={{ fontSize: "12px" }}
                          >
                            {s.label}
                          </small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            enableReinitialize
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, values, validateForm, setTouched, setFieldValue }) => (
              <Form>
                <div className="modal-body p-3 p-md-4" style={{ overflowY: "auto", flex: "1 1 auto" }}>
                  {step === 0 && (
                    <div className="card shadow-sm border-0">
                      <div className="card-body p-3 p-md-4">
                        <div className="row g-3">
                          {!isPreselected && (
                            <div className="col-12">
                              <label className="form-label">Objective *</label>
                              <Field
                                as="select"
                                name="objective"
                                className="form-select"
                                disabled={objectivesLoading}
                              >
                                <option value="">Select objective</option>
                                {objectives.map((o) => (
                                  <option key={o.uid} value={o.uid}>
                                    {o.title} {o.financial_year ? `(${o.financial_year})` : ""}
                                  </option>
                                ))}
                              </Field>
                              <ErrorMessage name="objective" component="div" className="text-danger small" />
                            </div>
                          )}

                          {isPreselected && preselectedObjectiveTitle && (
                            <div className="col-12">
                              <div className="alert alert-light border mb-0 small">
                                <strong>Objective:</strong> {preselectedObjectiveTitle}
                              </div>
                            </div>
                          )}

                          <div className="col-12">
                            <label className="form-label">Title *</label>
                            <Field name="title" className="form-control" placeholder="Target title" />
                            <ErrorMessage name="title" component="div" className="text-danger small" />
                          </div>

                          <div className="col-12">
                            <label className="form-label">Description</label>
                            <Field
                              as="textarea"
                              name="description"
                              className="form-control"
                              rows={3}
                              placeholder="Optional"
                            />
                          </div>

                          <div className="col-12 col-md-6">
                            <label className="form-label">Weight % *</label>
                            <Field
                              name="weight"
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              className="form-control"
                              placeholder="e.g. 25"
                            />
                            <ErrorMessage name="weight" component="div" className="text-danger small" />
                            <small className="text-muted d-block mt-1">
                              Sum of all target weights in this objective must equal 100%.
                            </small>
                          </div>

                          <div className="col-12 col-md-6">
                            <label className="form-label">Planned value</label>
                            <Field
                              name="planned_value"
                              type="number"
                              step="any"
                              min="0"
                              className="form-control"
                              placeholder="Optional"
                            />
                          </div>
                        </div>
                    </div>
                  </div>
                  )}

                  {step === 1 && (
                    <div className="card shadow-sm border-0">
                      <div className="card-body p-3 p-md-4">
                        <div className="row g-3">
                          <div className="col-12">
                            <label className="form-label">KPI mode</label>
                            <div className="row g-2">
                              <div className="col-12 col-md-6">
                                <button
                                  type="button"
                                  className={`btn w-100 text-start ${
                                    values.kpi_source_type === "DIRECT" ? "btn-primary" : "btn-outline-primary"
                                  }`}
                                  onClick={() => {
                                    setFieldValue("kpi_source_type", "DIRECT");
                                    if (!values.kpi_calculation_method) {
                                      setFieldValue(
                                        "kpi_calculation_method",
                                        values.kpi_unit_type === "PERCENT" ? "AVERAGE" : "CUMULATIVE"
                                      );
                                    }
                                  }}
                                >
                                  <div className="d-flex align-items-start justify-content-between gap-2">
                                    <div>
                                      <div className="fw-semibold">
                                        <i className="bx bx-edit me-1" /> Direct KPI
                                      </div>
                                      <div className="small">
                                        Enter quarterly KPI actuals and compute progress to the annual target.
                                      </div>
                                    </div>
                                    {values.kpi_source_type === "DIRECT" && (
                                      <span className="badge bg-white text-primary border">Selected</span>
                                    )}
                                  </div>
                                </button>
                              </div>

                              <div className="col-12 col-md-6">
                                <button
                                  type="button"
                                  className={`btn w-100 text-start ${
                                    values.kpi_source_type === "DERIVED" ? "btn-primary" : "btn-outline-primary"
                                  }`}
                                  onClick={() => setFieldValue("kpi_source_type", "DERIVED")}
                                >
                                  <div className="d-flex align-items-start justify-content-between gap-2">
                                    <div>
                                      <div className="fw-semibold">
                                        <i className="bx bx-cog me-1" /> Activity-Driven KPI
                                      </div>
                                      <div className="small">
                                        KPI performance is derived from approved activity implementation progress.
                                      </div>
                                    </div>
                                    {values.kpi_source_type === "DERIVED" && (
                                      <span className="badge bg-white text-primary border">Selected</span>
                                    )}
                                  </div>
                                </button>
                              </div>
                            </div>
                            <div className="mt-2">
                              <ErrorMessage name="kpi_source_type" component="div" className="text-danger small" />
                            </div>
                          </div>

                          <div className="col-12 col-md-6">
                            <label className="form-label">KPI name</label>
                            <Field
                              name="kpi_name"
                              className="form-control"
                              placeholder="e.g. Number of cases resolved"
                            />
                            <ErrorMessage name="kpi_name" component="div" className="text-danger small" />
                          </div>

                          {values.kpi_source_type === "DIRECT" ? (
                            <>
                              <div className="col-12 col-md-6">
                                <label className="form-label">KPI unit</label>
                                <Field as="select" name="kpi_unit_type" className="form-select">
                                  <option value="NUMBER">Number</option>
                                  <option value="PERCENT">Percent (%)</option>
                                </Field>
                                <small className="text-muted d-block mt-1">
                                  {values.kpi_unit_type === "PERCENT"
                                    ? "Use percentage values, e.g. 80 for 80%."
                                    : "Use absolute numbers, e.g. 120 cases."}
                                </small>
                              </div>

                              <div className="col-12 col-md-6">
                                <label className="form-label">Annual KPI target</label>
                                <Field
                                  name="kpi_planned_value"
                                  type="number"
                                  step="any"
                                  min="0"
                                  className="form-control"
                                  placeholder="Required"
                                />
                                <ErrorMessage name="kpi_planned_value" component="div" className="text-danger small" />
                              </div>

                              <div className="col-12 col-md-6">
                                <label className="form-label">Calculation method</label>
                                <Field as="select" name="kpi_calculation_method" className="form-select">
                                  <option value="CUMULATIVE">Cumulative</option>
                                  <option value="AVERAGE">Average</option>
                                </Field>
                                <ErrorMessage name="kpi_calculation_method" component="div" className="text-danger small" />
                              </div>

                              <div className="col-12 col-md-6">
                                <label className="form-label">KPI direction</label>
                                <Field as="select" name="kpi_direction" className="form-select">
                                  <option value="INCREASE">Higher is better</option>
                                  <option value="DECREASE">Lower is better</option>
                                </Field>
                                <ErrorMessage name="kpi_direction" component="div" className="text-danger small" />
                              </div>

                              <div className="col-12">
                                <div className="alert alert-light border mb-0">
                                  <strong>Direct KPI:</strong> Quarterly KPI actuals will be entered in KPI Actuals.
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-primary ms-2"
                                    onClick={() => navigate("/performance-dashboard/kpi-actuals")}
                                  >
                                    Open KPI Actuals
                                  </button>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="col-12">
                              <div className="alert alert-info mb-0">
                                <strong>Activity-Driven KPI:</strong> No quarterly KPI actual entry is needed. KPI progress is derived from approved activity implementation.
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="card shadow-sm border-0">
                      <div className="card-body p-3 p-md-4">
                        <div className="mb-3">
                          <label className="form-label">Responsible Head (SPISM Performance Officer) *</label>
                          <Field as="select" name="responsible_officer_id" className="form-select" disabled={officersLoading}>
                            <option value="">{officersLoading ? "Loading..." : "Select officer"}</option>
                            {officers.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.label || u.full_name || u.username || u.id}
                              </option>
                            ))}
                          </Field>
                          <ErrorMessage name="responsible_officer_id" component="div" className="text-danger small" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div className="d-flex gap-2 flex-wrap me-auto">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setStep((s) => Math.max(0, s - 1))}
                      disabled={step === 0}
                      style={step === 0 ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
                    >
                      Back
                    </button>
                  </div>

                  <div className="d-flex gap-2 flex-wrap justify-content-end ms-auto">
                    <button
                      type="button"
                      className="btn btn-label-secondary"
                      onClick={handleClose}
                      data-bs-dismiss="modal"
                    >
                      Cancel
                    </button>

                    {step < 2 ? (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={async () => {
                          const errors = await validateForm();
                          const stepFields =
                            step === 0
                              ? ["objective", "title", "weight"]
                              : step === 1
                                ? ["kpi_source_type", "kpi_name", "kpi_planned_value", "kpi_calculation_method", "kpi_direction"]
                                : ["responsible_officer_id"];
                          const hasStepErrors = stepFields.some((f) => errors?.[f]);
                          if (hasStepErrors) {
                            const touched = {};
                            stepFields.forEach((f) => {
                              touched[f] = true;
                            });
                            setTouched(touched, true);
                            return;
                          }
                          setStep((s) => Math.min(2, s + 1));
                        }}
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSubmitting || !canSaveTarget}
                        title={!canSaveTarget ? "No permission to save targets" : undefined}
                      >
                        {isSubmitting ? "Saving..." : selectedTarget ? "Update target" : "Create target"}
                      </button>
                    )}
                  </div>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default TargetModal;
