import React, { useState, useCallback } from "react";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import BreadCumb from "../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import { formatDate } from "../../../../helpers/DateFormater";
import { hasAccess } from "../../../../hooks/AccessHandler";
import showToast from "../../../../helpers/ToastHelper";
import PrFlyerModal from "./Modal";
import { deletePrFlyer } from "./Queries";
import { normalizePublicPortalAssetUrl } from "../../../../helpers/publicPortalAssetUrl";

export const PrFlyerPage = () => {
  const [selectedObj, setSelectedObj] = useState(null);
  const [tableRefresh, setTableRefresh] = useState(0);
  const user = useSelector((state) => state.userReducer?.data);
  const canAddFlyer = hasAccess(user, ["can_add_pr_flyer"]);
  const canEditFlyer = hasAccess(user, ["can_edit_pr_flyer"]);
  const canDeleteFlyer = hasAccess(user, ["can_delete_pr_flyer"]);
  const canAddOrEditFlyer = canAddFlyer || canEditFlyer;
  const canManageGallery = canAddOrEditFlyer || canDeleteFlyer;
  const isFlyerGalleryViewOnly =
    hasAccess(user, ["can_view_pr_flyer"]) && !canManageGallery;

  const openModal = (row) => {
    setSelectedObj(row ?? null);
    const el = document.getElementById("prFlyerModal");
    if (el && window.bootstrap) {
      const modal = new window.bootstrap.Modal(el);
      modal.show();
    }
  };

  const confirmDeleteFlyer = useCallback(
    async (row) => {
      if (!row?.uid) return;
      const title = (row.title || "").trim() || "this item";
      const { isConfirmed } = await Swal.fire({
        title: "Remove flyer or poster?",
        text: `${title} will be removed from the gallery and dashboards.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Yes, delete",
        cancelButtonText: "Cancel",
      });
      if (!isConfirmed) return;
      try {
        const result = await deletePrFlyer(row.uid);
        if (result?.status === 200 || result?.status === 8000) {
          showToast("Flyer or poster removed", "success", "Deleted");
          setTableRefresh((n) => n + 1);
          if (selectedObj?.uid === row.uid) {
            setSelectedObj(null);
            const el = document.getElementById("prFlyerModal");
            const inst = el && window.bootstrap?.Modal?.getInstance(el);
            if (inst) inst.hide();
          }
        } else {
          showToast(result?.message || "Could not delete", "warning", "Failed");
        }
      } catch {
        showToast("Delete failed. Try again or check your connection.", "danger", "Error");
      }
    },
    [selectedObj],
  );

  return (
    <>
      <BreadCumb pageList={["Internal Portal", "Flyers & posters gallery"]} />
      {isFlyerGalleryViewOnly ? (
        <div className="alert alert-info mb-3" role="alert">
          You can open this page because you have <strong>view</strong> access to the flyers gallery,
          but your account does not include <strong>add</strong>, <strong>edit</strong>, or{" "}
          <strong>delete</strong> permissions, so the Add button and row actions are hidden. Ask an
          administrator to assign the PR gallery role or permissions if you need to manage gallery items.
        </div>
      ) : null}
      <PaginatedTable
        fetchPath="/internal-portal/pr-flyers"
        title="Flyers & posters gallery"
        tableLayoutFixed
        filters={[
          { value: "ALL", label: "All" },
          { value: "ACTIVE", label: "Active" },
          { value: "INACTIVE", label: "Inactive" },
        ]}
        filterSelected={["ALL"]}
        columns={[
          {
            key: "SN",
            label: "SN",
            style: { width: "56px", minWidth: "56px", maxWidth: "56px" },
            className: "text-center align-middle",
          },
          {
            key: "thumb",
            label: "Preview",
            style: { width: "100px", minWidth: "100px", maxWidth: "100px" },
            className: "text-center align-middle",
            render: (row) => {
              const thumb = normalizePublicPortalAssetUrl(
                row.image_url || row.video_thumb_url
              );
              if (thumb) {
                return (
                  <img
                    src={thumb}
                    alt=""
                    style={{ width: "72px", height: "72px", objectFit: "cover", borderRadius: "8px" }}
                  />
                );
              }
              if ((row.video_url || "").trim()) {
                return (
                  <span className="badge bg-label-info text-wrap" style={{ maxWidth: "96px" }}>
                    Video
                  </span>
                );
              }
              return <span className="text-muted small">—</span>;
            },
          },
          {
            key: "title",
            label: "Title",
            className: "align-middle",
            render: (row) => (
              <span className="fw-semibold text-truncate d-inline-block" style={{ maxWidth: "280px" }} title={row.title}>
                {(row.title || "").trim() || "—"}
              </span>
            ),
          },
          {
            key: "sort_order",
            label: "Order",
            style: { width: "88px" },
            className: "text-center align-middle",
          },
          {
            key: "visible_until",
            label: "Show until",
            style: { width: "168px", whiteSpace: "nowrap" },
            className: "text-center align-middle",
            render: (row) => {
              if (!row.visible_until) {
                return <span className="text-muted small">No end</span>;
              }
              const end = new Date(row.visible_until);
              const ended = !Number.isNaN(end.getTime()) && end < new Date();
              return (
                <span className="small text-muted">
                  {formatDate(row.visible_until, "DD/MM/YYYY HH:mm")}
                  {ended ? (
                    <span className="badge bg-label-warning ms-1">Ended</span>
                  ) : null}
                </span>
              );
            },
          },
          {
            key: "is_active",
            label: "Active",
            style: { width: "88px" },
            className: "text-center align-middle",
            render: (row) => (
              <span className={row.is_active ? "badge bg-label-success" : "badge bg-label-secondary"}>
                {row.is_active ? "Yes" : "No"}
              </span>
            ),
          },
          {
            key: "updated_at",
            label: "Updated",
            style: { width: "140px", whiteSpace: "nowrap" },
            className: "text-center align-middle",
            render: (row) => (
              <span className="text-muted small">{row.updated_at ? formatDate(row.updated_at, "DD/MM/YYYY HH:mm") : "—"}</span>
            ),
          },
          {
            key: "actions",
            label: "Actions",
            style: { width: "200px", minWidth: "200px" },
            className: "text-center align-middle",
            render: (row) =>
              canEditFlyer || canDeleteFlyer ? (
                <div
                  className="d-flex flex-wrap justify-content-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {canEditFlyer ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => openModal(row)}
                    >
                      <i className="bx bx-edit-alt me-1"></i>
                      Edit
                    </button>
                  ) : null}
                  {canDeleteFlyer ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => confirmDeleteFlyer(row)}
                    >
                      <i className="bx bx-trash me-1"></i>
                      Delete
                    </button>
                  ) : null}
                </div>
              ) : null,
          },
        ]}
        buttons={[
          ...(canAddOrEditFlyer
            ? [
                {
                  label: "Upload media",
                  render: () => (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm ms-auto me-1"
                      data-bs-toggle="modal"
                      data-bs-target="#prFlyerModal"
                      onClick={() => setSelectedObj(null)}
                    >
                      <i className="bx bx-upload me-1"></i>
                      Upload media
                    </button>
                  ),
                },
              ]
            : []),
        ]}
        onSelect={(row) => {
          if (canEditFlyer) {
            setSelectedObj(row);
            openModal(row);
          }
        }}
        isRefresh={tableRefresh}
      />
      <PrFlyerModal
        selectedObj={selectedObj}
        setSelectedObj={setSelectedObj}
        setTableRefresh={setTableRefresh}
        canDeleteFlyer={canDeleteFlyer}
        onDeleteFlyer={confirmDeleteFlyer}
      />
    </>
  );
};
