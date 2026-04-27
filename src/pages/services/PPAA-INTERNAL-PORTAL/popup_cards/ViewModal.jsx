import React, { useEffect } from "react";

/**
 * Read-only preview of a popup card as it appears on the portal (Daily Motivation).
 */
const PopupCardViewModal = ({ card, onClose }) => {
  useEffect(() => {
    const modalEl = document.getElementById("popupCardViewModal");
    if (!modalEl) return;
    const handleHidden = () => onClose?.();
    modalEl.addEventListener("hidden.bs.modal", handleHidden);
    return () => modalEl.removeEventListener("hidden.bs.modal", handleHidden);
  }, [onClose]);

  if (!card) return null;

  const quote = (card.motivational_quote && card.motivational_quote.trim()) || card.default_motivational_quote || "";
  const gratitude = (card.gratitude_message && card.gratitude_message.trim()) || card.default_gratitude_message || "";
  const hasContent = quote || gratitude || card.es_image_url;

  if (!hasContent) {
    return (
      <div
        className="modal fade"
        id="popupCardViewModal"
        tabIndex="-1"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Popup Card Preview</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
            </div>
            <div className="modal-body text-center text-muted py-4">
              <i className="bx bx-message-square-detail fs-1 d-block mb-2" />
              <p className="mb-0">This card has no quote, gratitude message, or image yet.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="modal fade"
      id="popupCardViewModal"
      tabIndex="-1"
      aria-hidden="true"
      aria-labelledby="popupCardViewModalLabel"
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "420px" }}>
        <div className="modal-content overflow-hidden" style={{ borderRadius: "20px", border: "none", boxShadow: "0 12px 48px rgba(99, 102, 241, 0.18)" }}>
          <div className="modal-header border-0 pb-0" style={{ background: "linear-gradient(135deg, #b9d9b7 0%, #3da66a 42%, #00853f 100%)", color: "#fff" }}>
            <h5 className="modal-title d-flex align-items-center gap-2" id="popupCardViewModalLabel">
              <i className="bx bx-bulb" style={{ fontSize: "1.2rem" }} />
              Daily Motivation – Preview
            </h5>
            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close" />
          </div>
          <div className="modal-body pt-3">
            {/* ES Image */}
            {card.es_image_url && (
              <div className="d-flex justify-content-center mb-3">
                <div
                  style={{
                    width: "88px",
                    height: "88px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "3px solid rgba(99, 102, 241, 0.35)",
                    boxShadow: "0 4px 20px rgba(99, 102, 241, 0.2)",
                    background: "#f3f4f6",
                  }}
                >
                  <img
                    src={card.es_image_url}
                    alt="Executive Secretary"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                </div>
              </div>
            )}
            {card.es_image_url && (quote || gratitude) && (
              <p className="text-center small fw-semibold text-primary mb-2" style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}>
                From Executive Secretary
              </p>
            )}
            {/* Quote */}
            {quote && (
              <div
                className="mb-3"
                style={{
                  paddingLeft: "18px",
                  borderLeft: "3px solid rgba(99, 102, 241, 0.4)",
                  borderRadius: "0 4px 4px 0",
                  background: "linear-gradient(90deg, rgba(99, 102, 241, 0.06) 0%, transparent 100%)",
                  paddingTop: "8px",
                  paddingBottom: "8px",
                  paddingRight: "8px",
                }}
              >
                <p className="mb-0 fst-italic text-body" style={{ lineHeight: 1.65, fontSize: "0.95rem" }}>
                  &ldquo;{quote}&rdquo;
                </p>
              </div>
            )}
            {/* Gratitude */}
            {gratitude && (
              <p className="mb-2 text-body" style={{ lineHeight: 1.6, fontSize: "0.875rem", color: "#4b5563" }}>
                {gratitude}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopupCardViewModal;
