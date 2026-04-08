import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BreadCumb from "../../../../layouts/BreadCumb";
import { getPopupCardsList, deletePopupCard } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";
import { formatDate } from "../../../../helpers/DateFormater";
import ReactLoading from "react-loading";
import PopupCardModal from "./Modal";
import Swal from "sweetalert2";
import { useSelector } from "react-redux";
import { hasAccess } from "../../../../hooks/AccessHandler";

export const PopupCardOpenPage = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.userReducer?.data);
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailRefresh, setDetailRefresh] = useState(0);

  const fetchCard = async () => {
    setLoading(true);
    try {
      const result = await getPopupCardsList({ uid });
      const data = result?.data !== undefined ? result.data : result;
      if (data && typeof data === "object" && (data.uid || data.motivational_quote != null)) {
        setCard(data);
      } else {
        setCard(null);
        showToast("Unable to fetch popup card", "warning", "Fetch Failed");
      }
    } catch (err) {
      setCard(null);
      showToast("Unable to fetch popup card", "danger", "Failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCard();
  }, [uid, detailRefresh]);

  const handleDelete = async () => {
    try {
      const confirmation = await Swal.fire({
        title: "Are you sure?",
        text: "You are about to delete this popup card. This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        cancelButtonColor: "#aaa",
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel",
      });

      if (confirmation.isConfirmed) {
        const result = await deletePopupCard(uid);
        if (result?.status === 200 || result?.status === 8000) {
          Swal.fire("Deleted!", "The popup card has been deleted.", "success");
          navigate("/ppaa-internal-portal/popup-cards");
        } else {
          Swal.fire("Error!", result?.message || "Failed to delete popup card", "error");
        }
      }
    } catch (error) {
      Swal.fire("Error!", "Unable to delete. Please try again.", "error");
    }
  };

  const quote = (card?.motivational_quote && card.motivational_quote.trim()) ? card.motivational_quote : (card?.default_motivational_quote || "");
  const gratitude = (card?.gratitude_message && card.gratitude_message.trim()) ? card.gratitude_message : (card?.default_gratitude_message || "");
  const hasContent = quote || gratitude || card?.es_image_url;

  const canEdit = hasAccess(user, ["can_edit_popup_card"]);
  const canDelete = hasAccess(user, ["can_delete_popup_card"]);

  if (loading) {
    return (
      <>
        <BreadCumb pageList={["Internal Portal", "Popup Card", "View"]} />
        <div className="card">
          <div className="card-body text-center py-5">
            <ReactLoading type="cylon" color="#696cff" height={30} width={50} />
            <h6 className="text-muted mt-2">Loading popup card...</h6>
          </div>
        </div>
      </>
    );
  }

  if (!card) {
    return (
      <>
        <BreadCumb pageList={["Internal Portal", "Popup Card", "View"]} />
        <div className="card">
          <div className="card-body">
            <div className="alert alert-warning text-center">
              <p className="mb-0">Popup card not found or you don't have access.</p>
              <button
                type="button"
                className="btn btn-primary btn-sm mt-3"
                onClick={() => navigate("/ppaa-internal-portal/popup-cards")}
              >
                <i className="bx bx-arrow-back me-1" /> Back to Popup Cards
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <BreadCumb pageList={["Internal Portal", "Popup Card", "View"]} />

      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-8">
              <div className="d-flex align-items-center gap-3">
                <div className="flex-shrink-0">
                  <span className="avatar avatar-xl rounded bg-label-primary">
                    <i className="bx bx-bulb bx-lg" />
                  </span>
                </div>
                <div>
                  <h4 className="mb-1 fw-bold">Daily Motivation – Popup Card</h4>
                  <small className="text-muted">
                    Created {formatDate(card.created_at, "DD/MM/YYYY HH:mm")}
                    {card.updated_at && ` · Updated ${formatDate(card.updated_at, "DD/MM/YYYY HH:mm")}`}
                  </small>
                </div>
              </div>
            </div>
            <div className="col-md-4 text-end">
              {canEdit && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm me-2"
                  data-bs-toggle="modal"
                  data-bs-target="#popupCardModal"
                  onClick={() => {}}
                >
                  <i className="bx bx-edit me-1" /> Edit
                </button>
              )}
              {canDelete && (
                <button type="button" className="btn btn-danger btn-sm me-2" onClick={handleDelete}>
                  <i className="bx bx-trash me-1" /> Delete
                </button>
              )}
              <button
                type="button"
                className="btn btn-label-secondary btn-sm"
                onClick={() => navigate("/ppaa-internal-portal/popup-cards")}
              >
                <i className="bx bx-arrow-back me-1" /> Back
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-header">
          <h5 className="mb-0">Uploaded data (as shown on portal)</h5>
        </div>
        <div className="card-body">
          {!hasContent ? (
            <p className="text-muted mb-0">No quote, gratitude message, or image set yet. Use Edit to add content.</p>
          ) : (
            <div className="row">
              <div className="col-lg-8 mx-auto">
                <div className="border rounded-3 p-4" style={{ background: "linear-gradient(165deg, #fafbff 0%, #f5f3ff 100%)" }}>
                  {card.es_image_url && (
                    <div className="text-center mb-3">
                      <div
                        className="d-inline-block rounded-circle overflow-hidden border border-primary"
                        style={{ width: "88px", height: "88px", borderWidth: "3px !important" }}
                      >
                        <img
                          src={card.es_image_url}
                          alt="ES"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                      </div>
                      {(quote || gratitude) && (
                        <p className="small fw-semibold text-primary mb-2 mt-2">From Executive Secretary</p>
                      )}
                    </div>
                  )}
                  {quote && (
                    <div className="mb-3 ps-3 border-start border-3 border-primary">
                      <p className="mb-0 fst-italic text-body" style={{ lineHeight: 1.65 }}>
                        &ldquo;{quote}&rdquo;
                      </p>
                    </div>
                  )}
                  {gratitude && (
                    <p className="mb-0 text-body" style={{ lineHeight: 1.6, color: "#4b5563" }}>
                      {gratitude}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <PopupCardModal
        selectedObj={card}
        setSelectedObj={(v) => v != null && setCard(v)}
        tableRefresh={detailRefresh}
        setTableRefresh={setDetailRefresh}
      />
    </>
  );
};
