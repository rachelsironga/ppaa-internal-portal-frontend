import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useSelector } from "react-redux";
import { getMaoniSettings, updateMaoniSettings } from "../../PPAA-MAONI/Queries";
import { isMaoniAdmin, isMaoniReviewer } from "../../../../utils/maoniRoles";

export const MaoniSettingsPage = () => {
  const user = useSelector((state) => state.userReducer?.data);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [escalationDays, setEscalationDays] = useState(3);

  const canManageSettings = Boolean(isMaoniAdmin(user) || isMaoniReviewer(user));

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await getMaoniSettings();
        const value = Number(res?.data?.escalation_days ?? 3);
        if (!cancelled) setEscalationDays(Number.isFinite(value) ? value : 3);
      } catch (e) {
        console.error("Failed to load Maoni settings:", e);
        if (!cancelled) setEscalationDays(3);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    const value = Number(escalationDays);
    if (!Number.isInteger(value) || value < 1 || value > 365) {
      await Swal.fire({
        icon: "warning",
        title: "Invalid value",
        text: "Escalation days must be between 1 and 365.",
      });
      return;
    }
    try {
      setSaving(true);
      const res = await updateMaoniSettings({ escalation_days: value });
      setEscalationDays(Number(res?.data?.escalation_days ?? value));
      await Swal.fire({
        icon: "success",
        title: "Saved",
        text: "Maoni escalation setting updated successfully.",
        timer: 1200,
      });
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "Update failed",
        text: e?.response?.data?.message || "Failed to save Maoni settings.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!canManageSettings) {
    return (
      <div className="w-100 py-4">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <i className="bx bx-lock-alt fs-1 text-warning mb-2"></i>
            <h5>Access denied</h5>
            <p className="text-muted mb-0">You are not allowed to manage Maoni settings.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-100 py-4">
      <div className="card border-0 shadow-sm">
        <div className="card-header border-0" style={{ background: "linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)" }}>
          <h5 className="mb-0 text-primary">
            <i className="bx bx-cog me-2"></i>
            Maoni Settings
          </h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <i className="bx bx-loader-circle bx-spin fs-3 text-primary"></i>
            </div>
          ) : (
            <>
              <div className="mb-3">
                <label className="form-label fw-semibold">Escalation time (days)</label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  className="form-control"
                  value={escalationDays}
                  onChange={(e) => setEscalationDays(e.target.value)}
                />
                <small className="text-muted">
                  If a suggestion stays with handler longer than this value, it is treated as due/overdue for escalation monitoring.
                </small>
              </div>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaoniSettingsPage;
