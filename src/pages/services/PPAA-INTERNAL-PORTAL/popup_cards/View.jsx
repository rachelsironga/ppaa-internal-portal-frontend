import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import BreadCumb from "../../../../layouts/BreadCumb";
import PopupCardModal from "./Modal";
import { hasAccess } from "../../../../hooks/AccessHandler";
import { getPopupCardsList } from "./Queries";

export const PopupCardPage = () => {
  const [selectedObj, setSelectedObj] = useState(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [popupCard, setPopupCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(1); // 1 = content, 2 = preview
  const user = useSelector((state) => state.userReducer?.data);

  const canManagePopupCard =
    hasAccess(user, ["can_add_popup_card"]) || hasAccess(user, ["can_change_popup_card"]);

  const scrollToSection = (sectionId) => {
    if (typeof document === "undefined") return;
    const target = document.getElementById(sectionId);
    if (!target) return;
    const navbarOffset = 80;
    const rect = target.getBoundingClientRect();
    const offsetTop = rect.top + window.pageYOffset - navbarOffset;
    window.scrollTo({ top: offsetTop, behavior: "smooth" });
  };

  // Fetch the single popup card (first record only)
  useEffect(() => {
    const fetchPopupCard = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await getPopupCardsList({
          pagination: { page: 1, page_size: 1 },
        });

        const list = res?.data?.results || res?.data || [];
        const firstItem = Array.isArray(list) ? list[0] : list;
        setPopupCard(firstItem || null);
      } catch (e) {
        console.error("Failed to load popup card:", e);
        setError("Failed to load popup card configuration. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPopupCard();
  }, [refreshCounter]);

  const openEditModal = () => {
    // If we already have a popup card, edit it; otherwise create a new one
    setSelectedObj(popupCard || null);
    const modalElement = document.getElementById("popupCardModal");
    if (modalElement && window.bootstrap) {
      const modal = new window.bootstrap.Modal(modalElement);
      modal.show();
    }
  };

  return (
    <>
      <BreadCumb pageList={["Internal Portal", "Popup Card"]} />
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-xl-12 col-lg-12">
            {/* Edit mode banner */}
            <div className="card border-0 mb-3 shadow-sm">
              <div className="card-body d-flex align-items-center gap-3 py-3">
                <div
                  className="d-flex align-items-center justify-content-center rounded-circle"
                  style={{
                    width: 40,
                    height: 40,
                    background:
                      "linear-gradient(135deg, rgba(0,133,63,0.15) 0%, rgba(61,166,106,0.15) 100%)",
                  }}
                >
                  <i className="bx bx-info-circle" style={{ color: "#00853f", fontSize: "1.4rem" }}></i>
                </div>
                <div>
                  <h6 className="mb-1" style={{ fontWeight: 600 }}>
                    Popup Card Configuration
                  </h6>
                  <p className="mb-0 text-muted" style={{ fontSize: "0.875rem" }}>
                    Only <strong>one</strong> popup card is used on the portal. Updating it will replace the
                    existing content shown to users.
                  </p>
                </div>
              </div>
            </div>

            {/* Step header (1: Content, 2: Preview) */}
            <div className="card border-0 shadow-sm mb-4">
              <div
                className="card-header border-0"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(0,133,63,0.08) 0%, rgba(61,166,106,0.08) 100%)",
                }}
              >
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                  <div className="d-flex align-items-center gap-4">
                    <div
                      className="d-flex align-items-center gap-2"
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        setActiveStep(1);
                        scrollToSection("popup-content-section");
                      }}
                    >
                      <span
                        className="rounded-circle d-inline-flex align-items-center justify-content-center"
                        style={{
                          width: 28,
                          height: 28,
                          backgroundColor: activeStep === 1 ? "#00853f" : "#e8f5e9",
                          color: activeStep === 1 ? "white" : "#4f46e5",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                        }}
                      >
                        1
                      </span>
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>Popup Content</div>
                        <small className="text-muted">Quote, gratitude message &amp; ES image</small>
                      </div>
                    </div>
                    <i className="bx bx-chevrons-right text-muted"></i>
                    <div
                      className="d-flex align-items-center gap-2"
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        setActiveStep(2);
                        scrollToSection("popup-preview-section");
                      }}
                    >
                      <span
                        className="rounded-circle d-inline-flex align-items-center justify-content-center"
                        style={{
                          width: 28,
                          height: 28,
                          backgroundColor: activeStep === 2 ? "#00853f" : "#e8f5e9",
                          color: activeStep === 2 ? "white" : "#4f46e5",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                        }}
                      >
                        2
                      </span>
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>Preview</div>
                        <small className="text-muted">How staff will see the popup</small>
                      </div>
                    </div>
                  </div>
                  {canManagePopupCard && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm animate__animated animate__fadeInRight animate__slow"
                      onClick={openEditModal}
                    >
                      <i className="bx bx-edit-alt me-1"></i>
                      {popupCard ? "Edit Popup Card" : "Create Popup Card"}
                    </button>
                  )}
                </div>
              </div>

              <div className="card-body">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2 mb-0 text-muted">Loading popup card configuration...</p>
                  </div>
                ) : error ? (
                  <div className="alert alert-danger mb-0" role="alert">
                    {error}
                  </div>
                ) : (
                  <>
                    {activeStep === 1 && (
                      <div className="row g-4 align-items-start" style={{ marginTop: "20px" }}>
                        {/* Description / instructions */}
                        <div className="col-md-5" id="popup-content-section">
                          <h6 className="mb-2" style={{ fontWeight: 600 }}>
                            How this popup is used
                          </h6>
                          <p className="text-muted mb-2" style={{ fontSize: "0.9rem" }}>
                            This card appears as a floating &ldquo;Daily Motivation&rdquo; popup on the public
                            portal. Use it to share a short quote and a gratitude message from the Executive
                            Secretary.
                          </p>
                          <ul
                            className="text-muted mb-3"
                            style={{ fontSize: "0.9rem", paddingLeft: "1.25rem" }}
                          >
                            <li>Only one popup card is active at any time.</li>
                            <li>You can update the text or image at any moment.</li>
                            <li>Changes are reflected on the portal immediately after saving.</li>
                          </ul>
                          {canManagePopupCard && (
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm"
                              onClick={openEditModal}
                            >
                              <i className="bx bx-pencil me-1"></i>
                              {popupCard ? "Update content" : "Create popup card"}
                            </button>
                          )}
                        </div>

                        {/* Live-style preview (side-by-side) */}
                        <div className="col-md-7" id="popup-preview-section">
                          <div
                            className="p-3 p-md-4 rounded-3 animate__animated animate__fadeInRight"
                            style={{
                              background:
                                "linear-gradient(165deg, #ffffff 0%, #fafbff 50%, #f5f3ff 100%)",
                              border: "1px solid rgba(99,102,241,0.18)",
                              boxShadow: "0 10px 30px rgba(15,23,42,0.10)",
                              position: "relative",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                position: "absolute",
                                inset: 0,
                                background:
                                  "radial-gradient(circle at top left, rgba(0,133,63,0.18), transparent 55%), radial-gradient(circle at bottom right, rgba(61,166,106,0.18), transparent 55%)",
                                opacity: 0.6,
                                pointerEvents: "none",
                              }}
                            ></div>

                            <div style={{ position: "relative" }}>
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <div className="d-flex align-items-center gap-2">
                                  <i
                                    className="bx bx-bulb"
                                    style={{ color: "#00853f", fontSize: "1.4rem" }}
                                  ></i>
                                  <span
                                    style={{
                                      fontSize: "0.9rem",
                                      fontWeight: 600,
                                      letterSpacing: "0.04em",
                                      textTransform: "uppercase",
                                      color: "#4b5563",
                                    }}
                                  >
                                    Daily Motivation Preview
                                  </span>
                                </div>
                                <span
                                  className="badge bg-light text-dark"
                                  style={{ fontSize: "0.7rem", textTransform: "uppercase" }}
                                >
                                  Public portal
                                </span>
                              </div>

                              {popupCard ? (
                                <>
                                  {popupCard.es_image_url && (
                                    <div className="d-flex justify-content-center mb-3">
                                      <div
                                        style={{
                                          width: 80,
                                          height: 80,
                                          borderRadius: "50%",
                                          overflow: "hidden",
                                          border: "3px solid rgba(99,102,241,0.4)",
                                          boxShadow: "0 6px 18px rgba(99,102,241,0.3)",
                                          backgroundColor: "#f3f4f6",
                                        }}
                                      >
                                        <img
                                          src={popupCard.es_image_url}
                                          alt="Executive Secretary"
                                          style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                          }}
                                          onError={(e) => {
                                            e.target.style.display = "none";
                                          }}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {popupCard.motivational_quote && (
                                    <div
                                      className="mb-2 px-3 py-2 rounded-3"
                                      style={{
                                        borderLeft: "3px solid rgba(99,102,241,0.6)",
                                        background:
                                          "linear-gradient(90deg, rgba(99,102,241,0.08) 0%, transparent 100%)",
                                      }}
                                    >
                                      <p
                                        className="mb-0"
                                        style={{
                                          lineHeight: 1.7,
                                          fontSize: "0.95rem",
                                          color: "#111827",
                                          fontStyle: "italic",
                                          fontWeight: 500,
                                        }}
                                      >
                                        &ldquo;{popupCard.motivational_quote}&rdquo;
                                      </p>
                                    </div>
                                  )}

                                  {popupCard.gratitude_message && (
                                    <p
                                      className="mb-0 mt-2"
                                      style={{
                                        lineHeight: 1.6,
                                        fontSize: "0.875rem",
                                        color: "#4b5563",
                                      }}
                                    >
                                      {popupCard.gratitude_message}
                                    </p>
                                  )}
                                </>
                              ) : (
                                <div className="text-center py-3">
                                  <i
                                    className="bx bx-notification"
                                    style={{ fontSize: "2rem", color: "#9ca3af" }}
                                  ></i>
                                  <p className="mt-2 mb-1 text-muted">
                                    No popup card has been configured yet.
                                  </p>
                                  {canManagePopupCard && (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-primary"
                                      onClick={openEditModal}
                                    >
                                      <i className="bx bx-plus me-1"></i>
                                      Create popup card
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeStep === 2 && (
                      <div
                        className="row justify-content-center"
                        style={{ marginTop: "20px" }}
                        id="popup-preview-section"
                      >
                        <div className="col-xl-6 col-lg-7 col-md-8">
                          <div
                            className="p-3 p-md-4 rounded-3 animate__animated animate__fadeInUp"
                            style={{
                              background:
                                "linear-gradient(165deg, #ffffff 0%, #fafbff 50%, #f5f3ff 100%)",
                              border: "1px solid rgba(99,102,241,0.18)",
                              boxShadow: "0 16px 40px rgba(15,23,42,0.14)",
                              position: "relative",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                position: "absolute",
                                inset: 0,
                                background:
                                  "radial-gradient(circle at top left, rgba(0,133,63,0.22), transparent 55%), radial-gradient(circle at bottom right, rgba(61,166,106,0.22), transparent 55%)",
                                opacity: 0.7,
                                pointerEvents: "none",
                              }}
                            ></div>

                            <div style={{ position: "relative" }}>
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <div className="d-flex align-items-center gap-2">
                                  <i
                                    className="bx bx-bulb"
                                    style={{ color: "#00853f", fontSize: "1.6rem" }}
                                  ></i>
                                  <span
                                    style={{
                                      fontSize: "1rem",
                                      fontWeight: 700,
                                      letterSpacing: "0.06em",
                                      textTransform: "uppercase",
                                      color: "#374151",
                                    }}
                                  >
                                    Live Popup Preview
                                  </span>
                                </div>
                                <span
                                  className="badge bg-light text-dark"
                                  style={{ fontSize: "0.7rem", textTransform: "uppercase" }}
                                >
                                  Public portal
                                </span>
                              </div>

                              {popupCard ? (
                                <>
                                  {popupCard.es_image_url && (
                                    <div className="d-flex justify-content-center mb-3">
                                      <div
                                        style={{
                                          width: 96,
                                          height: 96,
                                          borderRadius: "50%",
                                          overflow: "hidden",
                                          border: "3px solid rgba(99,102,241,0.5)",
                                          boxShadow: "0 10px 26px rgba(99,102,241,0.35)",
                                          backgroundColor: "#f3f4f6",
                                        }}
                                      >
                                        <img
                                          src={popupCard.es_image_url}
                                          alt="Executive Secretary"
                                          style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                          }}
                                          onError={(e) => {
                                            e.target.style.display = "none";
                                          }}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {popupCard.motivational_quote && (
                                    <div
                                      className="mb-3 px-3 py-2 rounded-3"
                                      style={{
                                        borderLeft: "3px solid rgba(99,102,241,0.7)",
                                        background:
                                          "linear-gradient(90deg, rgba(99,102,241,0.12) 0%, transparent 100%)",
                                      }}
                                    >
                                      <p
                                        className="mb-0"
                                        style={{
                                          lineHeight: 1.8,
                                          fontSize: "1rem",
                                          color: "#111827",
                                          fontStyle: "italic",
                                          fontWeight: 500,
                                        }}
                                      >
                                        &ldquo;{popupCard.motivational_quote}&rdquo;
                                      </p>
                                    </div>
                                  )}

                                  {popupCard.gratitude_message && (
                                    <p
                                      className="mb-0"
                                      style={{
                                        lineHeight: 1.7,
                                        fontSize: "0.95rem",
                                        color: "#374151",
                                      }}
                                    >
                                      {popupCard.gratitude_message}
                                    </p>
                                  )}
                                </>
                              ) : (
                                <div className="text-center py-4">
                                  <i
                                    className="bx bx-notification"
                                    style={{ fontSize: "2.2rem", color: "#9ca3af" }}
                                  ></i>
                                  <p className="mt-2 mb-1 text-muted">
                                    No popup card has been configured yet.
                                  </p>
                                  {canManagePopupCard && (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-primary"
                                      onClick={openEditModal}
                                    >
                                      <i className="bx bx-plus me-1"></i>
                                      Create popup card
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <PopupCardModal
        selectedObj={selectedObj}
        setSelectedObj={setSelectedObj}
        tableRefresh={refreshCounter}
        setTableRefresh={setRefreshCounter}
      />
    </>
  );
};
