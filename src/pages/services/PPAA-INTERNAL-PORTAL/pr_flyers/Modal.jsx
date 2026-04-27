import React, { useEffect, useRef, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createUpdatePrFlyer } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";
import { prFlyerYoutubeVideoId } from "../../../../utils/prFlyerVideo";
import "./PrFlyerModal.css";
import "./PrFlyerModal.css";

/** Map API ISO datetime to `datetime-local` value in the browser's local timezone. */
function isoToDatetimeLocalValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

function inferMediaType(row) {
  if (!row) return "image";
  const hasImg = !!(row.image_url || "").trim();
  const hasVid = !!(row.video_url || "").trim();
  if (hasImg && hasVid) return "both";
  if (hasVid && !hasImg) return "video";
  return "image";
}

const validationSchema = Yup.object().shape({
  title: Yup.string().max(255, "Max 255 characters"),
  caption: Yup.string(),
  video_url: Yup.string()
    .max(2048, "Max 2048 characters")
    .nullable()
    .test("video-host", "Use a full YouTube or Instagram post/reel/TV link (https://…).", (val) => {
      if (!val || !String(val).trim()) return true;
      const v = String(val).trim();
      const low = v.toLowerCase();
      if (!low.startsWith("http://") && !low.startsWith("https://")) return false;
      try {
        const u = new URL(v);
        const h = u.hostname.toLowerCase();
        if (h.includes("instagram.com")) {
          return /\/(p|reel|reels|tv)\/[^/]+/i.test(u.pathname || "");
        }
        if (h.includes("youtu.be") || h.includes("youtube.com")) {
          return !!prFlyerYoutubeVideoId(v);
        }
      } catch {
        return false;
      }
      return false;
    }),
  sort_order: Yup.number().min(0, "Must be 0 or greater").integer(),
  visible_until: Yup.string().nullable(),
});

const PrFlyerModal = ({
  selectedObj,
  setSelectedObj,
  setTableRefresh,
  canDeleteFlyer = false,
  onDeleteFlyer,
}) => {
  const [imageBase64, setImageBase64] = useState("");
  const [imageFileName, setImageFileName] = useState("");
  const [mediaType, setMediaType] = useState("image");
  const fileInputRef = useRef(null);

  const isCreate = selectedObj === null;

  const initialValues = {
    title: selectedObj?.title || "",
    caption: selectedObj?.caption || "",
    video_url: selectedObj?.video_url || "",
    sort_order: selectedObj?.sort_order ?? 0,
    visible_until: isoToDatetimeLocalValue(selectedObj?.visible_until),
    is_active: selectedObj?.is_active !== undefined ? selectedObj.is_active : true,
  };

  useEffect(() => {
    setImageBase64("");
    setImageFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setMediaType(inferMediaType(selectedObj));
  }, [selectedObj]);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (!file) {
      setImageBase64("");
      setImageFileName("");
      return;
    }
    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file", "warning", "Invalid file");
      event.target.value = "";
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      showToast("Image must be 8MB or smaller", "warning", "File too large");
      event.target.value = "";
      return;
    }
    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleClose = () => {
    const modalElement = document.getElementById("prFlyerModal");
    const modalInstance = window.bootstrap?.Modal?.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
    setSelectedObj(null);
    setImageBase64("");
    setImageFileName("");
    setMediaType("image");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onMediaTypeChange = (next, setFieldValue) => {
    setMediaType(next);
    if (next === "image" && isCreate) {
      setFieldValue("video_url", "");
    }
    if (next === "video") {
      setImageBase64("");
      setImageFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    const modalElement = document.getElementById("prFlyerModal");
    if (!modalElement) return;

    const handleHidden = () => {
      setSelectedObj(null);
      setImageBase64("");
      setImageFileName("");
      setMediaType("image");
      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    modalElement.addEventListener("hidden.bs.modal", handleHidden);
    return () => {
      modalElement.removeEventListener("hidden.bs.modal", handleHidden);
    };
  }, [setSelectedObj]);

  const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
    try {
      const vUrlRaw = (values.video_url || "").trim();
      const hadStoredImage = !!(selectedObj?.image_url || "").trim();
      const hadStoredVideo = !!(selectedObj?.video_url || "").trim();

      if (selectedObj) {
        values.uid = selectedObj.uid;
      }

      let finalVideo = vUrlRaw;
      if (!selectedObj) {
        finalVideo = mediaType === "video" ? vUrlRaw : "";
      } else if (mediaType === "image") {
        finalVideo = (selectedObj.video_url || "").trim();
      } else {
        finalVideo = vUrlRaw;
      }

      const uploadingImage = !!imageBase64 && (mediaType === "image" || mediaType === "both");
      const finalHasImage = hadStoredImage || uploadingImage;

      if (!selectedObj) {
        if (mediaType === "image" && !imageBase64) {
          showToast("Choose a poster image file.", "warning", "Image required");
          setSubmitting(false);
          return;
        }
        if (mediaType === "video" && !vUrlRaw) {
          showToast("Paste a YouTube or Instagram video link.", "warning", "Video link required");
          setSubmitting(false);
          return;
        }
      } else if (!finalHasImage && !finalVideo) {
        showToast("Each item needs a poster image or a YouTube/Instagram video link.", "warning", "Media required");
        setSubmitting(false);
        return;
      } else if (mediaType === "image" && !finalHasImage) {
        showToast("Add a poster image file.", "warning", "Image required");
        setSubmitting(false);
        return;
      } else if (mediaType === "video" && !finalVideo) {
        showToast("Paste a YouTube or Instagram video link.", "warning", "Video link required");
        setSubmitting(false);
        return;
      } else if (mediaType === "both") {
        if (!finalHasImage) {
          showToast("Add a poster image (or replace the current one).", "warning", "Image required");
          setSubmitting(false);
          return;
        }
        if (!finalVideo) {
          showToast("Paste a YouTube or Instagram video link.", "warning", "Video link required");
          setSubmitting(false);
          return;
        }
      }

      const vu = (values.visible_until || "").trim();
      const visibleUntilIso = vu ? new Date(vu).toISOString() : null;

      const payload = {
        title: (values.title || "").trim(),
        caption: (values.caption || "").trim(),
        video_url: finalVideo,
        visible_until: visibleUntilIso,
        is_active: Boolean(values.is_active),
      };
      if (selectedObj) {
        payload.uid = selectedObj.uid;
        const so = values.sort_order;
        payload.sort_order =
          so === "" || so === null || so === undefined ? 0 : Number(so);
      }
      if (uploadingImage) {
        payload.image_base64 = imageBase64;
        payload.image_name = imageFileName;
      }

      const result = await createUpdatePrFlyer(payload);

      if (result.status === 200 || result.status === 8000) {
        showToast("Flyer or poster saved", "success", "Saved");
        setTableRefresh((prev) => prev + 1);
        handleClose();
        resetForm();
      } else if (result.status === 8002) {
        showToast(result.message || "Validation failed", "warning", "Validation");
        if (result.data) setErrors(result.data);
      } else {
        showToast(result.message || "Could not save", "warning", "Failed");
      }
    } catch {
      showToast("Something went wrong while saving", "danger", "Error");
    } finally {
      setSubmitting(false);
    }
  };

  const showImageBlock = mediaType === "image" || mediaType === "both";
  const showVideoBlock = mediaType === "video" || mediaType === "both";

  return (
    <div
      className="modal modal-slide-in pr-flyer-modal-root"
      id="prFlyerModal"
      tabIndex="-1"
      aria-labelledby="prFlyerModalLabel"
      aria-hidden="true"
      data-bs-backdrop="static"
      data-bs-keyboard="false"
    >
      <div
        className="modal-dialog modal-lg modal-dialog-centered pr-flyer-modal-dialog my-2 my-md-3"
        role="document"
        style={{ maxWidth: "min(50rem, calc(100vw - 1.5rem))" }}
      >
        <div className="modal-content pr-flyer-modal-content">
          <div className="modal-header pr-flyer-modal-header border-0">
            <div className="d-flex align-items-center min-w-0 pe-4">
              <i className="bx bx-image-add flex-shrink-0 me-2" style={{ fontSize: "1.65rem", opacity: 0.95 }} aria-hidden />
              <h5 className="modal-title text-white mb-0 text-truncate" id="prFlyerModalLabel">
                {selectedObj === null ? "Create New" : "Update"} Flyer, Poster, or Video
              </h5>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <Formik
            enableReinitialize
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, setFieldValue }) => (
              <Form className="pr-flyer-modal__form">
                <div className="modal-body pr-flyer-modal">
                  <section className="pr-flyer-modal__section">
                    <span className="pr-flyer-modal__section-title">Basic details</span>
                    <div className="pr-flyer-modal__field">
                      <label className="form-label" htmlFor="prFlyerTitle">
                        Title (optional)
                      </label>
                      <Field
                        id="prFlyerTitle"
                        type="text"
                        name="title"
                        className="form-control"
                        placeholder="e.g. Karume Day 2026"
                      />
                      <ErrorMessage name="title" component="div" className="text-danger small mt-1" />
                    </div>
                    <div className="pr-flyer-modal__field">
                      <label className="form-label" htmlFor="prFlyerCaption">
                        Caption (optional)
                      </label>
                      <Field
                        id="prFlyerCaption"
                        as="textarea"
                        name="caption"
                        className="form-control"
                        rows={2}
                        placeholder="Short description for accessibility"
                      />
                      <ErrorMessage name="caption" component="div" className="text-danger small mt-1" />
                    </div>
                  </section>

                  <section className="pr-flyer-modal__section">
                    <span className="pr-flyer-modal__section-title">Schedule</span>
                    <div className="pr-flyer-modal__field">
                      <label className="form-label" htmlFor="prFlyerVisibleUntil">
                        Show on dashboards until
                      </label>
                      <Field
                        id="prFlyerVisibleUntil"
                        type="datetime-local"
                        name="visible_until"
                        className="form-control pr-flyer-modal__datetime"
                      />
                      <ErrorMessage name="visible_until" component="div" className="text-danger small mt-1" />
                      <small className="pr-flyer-modal__help">
                        Optional. After this date and time, the item is removed from staff and public dashboards (uses
                        your device&apos;s local time). Leave empty to keep showing until you deactivate it or clear
                        this field when editing.
                      </small>
                    </div>
                  </section>

                  {selectedObj ? (
                    <section className="pr-flyer-modal__section">
                      <span className="pr-flyer-modal__section-title">Gallery settings</span>
                      <div className="row g-3 align-items-end">
                        <div className="col-12 col-sm-6 col-lg-5">
                          <label className="form-label" htmlFor="prFlyerSortOrder">
                            Display order
                          </label>
                          <Field
                            id="prFlyerSortOrder"
                            type="number"
                            name="sort_order"
                            className="form-control"
                            min={0}
                            style={{ maxWidth: "12rem" }}
                          />
                          <ErrorMessage name="sort_order" component="div" className="text-danger small mt-1" />
                          <small className="pr-flyer-modal__help">Lower numbers appear first.</small>
                        </div>
                        <div className="col-12 col-sm-6 col-lg-7">
                          <div className="form-check d-flex align-items-start gap-2 pr-flyer-modal__status-row">
                            <Field
                              type="checkbox"
                              name="is_active"
                              className="form-check-input flex-shrink-0"
                              id="prFlyerActive"
                            />
                            <label className="form-check-label mb-0" htmlFor="prFlyerActive">
                              Active (visible on dashboards)
                            </label>
                          </div>
                        </div>
                      </div>
                    </section>
                  ) : (
                    <section className="pr-flyer-modal__section">
                      <span className="pr-flyer-modal__section-title">Gallery</span>
                      <div className="row g-3 align-items-center">
                        <div className="col-12 col-lg-8">
                          <p className="pr-flyer-modal__help mb-0">
                            New items are placed at the end of the gallery automatically; you can change order when
                            editing.
                          </p>
                        </div>
                        <div className="col-12 col-lg-4">
                          <div className="form-check d-flex align-items-start gap-2 pr-flyer-modal__status-row">
                            <Field
                              type="checkbox"
                              name="is_active"
                              className="form-check-input flex-shrink-0"
                              id="prFlyerActive"
                            />
                            <label className="form-check-label mb-0" htmlFor="prFlyerActive">
                              Active (visible on dashboards)
                            </label>
                          </div>
                        </div>
                      </div>
                    </section>
                  )}

                  <section className="pr-flyer-modal__section">
                    <span className="pr-flyer-modal__section-title">
                      {isCreate ? "What are you adding?" : "What do you want to edit?"}
                    </span>
                    <div
                      className={`pr-flyer-modal__options${isCreate ? " pr-flyer-modal__options--create" : ""}`}
                      role="radiogroup"
                      aria-label={isCreate ? "Type of media to add" : "Part of the item to edit"}
                    >
                      {isCreate ? (
                        <>
                          <label
                            className={`pr-flyer-modal__option${mediaType === "image" ? " pr-flyer-modal__option--active" : ""}`}
                            htmlFor="prFlyerMediaImage"
                          >
                            <input
                              className="form-check-input pr-flyer-modal__option-input"
                              type="radio"
                              name="prFlyerMediaType"
                              id="prFlyerMediaImage"
                              checked={mediaType === "image"}
                              onChange={() => onMediaTypeChange("image", setFieldValue)}
                            />
                            <span className="pr-flyer-modal__option-body">
                              <span className="pr-flyer-modal__option-title">Poster image</span>
                              <span className="pr-flyer-modal__option-hint">
                                Upload a PNG, JPG, or WebP file (max 8MB).
                              </span>
                            </span>
                          </label>
                          <label
                            className={`pr-flyer-modal__option${mediaType === "video" ? " pr-flyer-modal__option--active" : ""}`}
                            htmlFor="prFlyerMediaVideo"
                          >
                            <input
                              className="form-check-input pr-flyer-modal__option-input"
                              type="radio"
                              name="prFlyerMediaType"
                              id="prFlyerMediaVideo"
                              checked={mediaType === "video"}
                              onChange={() => onMediaTypeChange("video", setFieldValue)}
                            />
                            <span className="pr-flyer-modal__option-body">
                              <span className="pr-flyer-modal__option-title">Video link</span>
                              <span className="pr-flyer-modal__option-hint">
                                YouTube or Instagram post, reel, or TV URL.
                              </span>
                            </span>
                          </label>
                        </>
                      ) : (
                        <>
                          <label
                            className={`pr-flyer-modal__option${mediaType === "image" ? " pr-flyer-modal__option--active" : ""}`}
                            htmlFor="prFlyerMediaImageEdit"
                          >
                            <input
                              className="form-check-input pr-flyer-modal__option-input"
                              type="radio"
                              name="prFlyerMediaType"
                              id="prFlyerMediaImageEdit"
                              checked={mediaType === "image"}
                              onChange={() => onMediaTypeChange("image", setFieldValue)}
                            />
                            <span className="pr-flyer-modal__option-body">
                              <span className="pr-flyer-modal__option-title">Poster image only</span>
                              <span className="pr-flyer-modal__option-hint">Video link stays unchanged.</span>
                            </span>
                          </label>
                          <label
                            className={`pr-flyer-modal__option${mediaType === "video" ? " pr-flyer-modal__option--active" : ""}`}
                            htmlFor="prFlyerMediaVideoEdit"
                          >
                            <input
                              className="form-check-input pr-flyer-modal__option-input"
                              type="radio"
                              name="prFlyerMediaType"
                              id="prFlyerMediaVideoEdit"
                              checked={mediaType === "video"}
                              onChange={() => onMediaTypeChange("video", setFieldValue)}
                            />
                            <span className="pr-flyer-modal__option-body">
                              <span className="pr-flyer-modal__option-title">Video link only</span>
                              <span className="pr-flyer-modal__option-hint">Poster file stays unchanged.</span>
                            </span>
                          </label>
                          <label
                            className={`pr-flyer-modal__option${mediaType === "both" ? " pr-flyer-modal__option--active" : ""}`}
                            htmlFor="prFlyerMediaBothEdit"
                          >
                            <input
                              className="form-check-input pr-flyer-modal__option-input"
                              type="radio"
                              name="prFlyerMediaType"
                              id="prFlyerMediaBothEdit"
                              checked={mediaType === "both"}
                              onChange={() => onMediaTypeChange("both", setFieldValue)}
                            />
                            <span className="pr-flyer-modal__option-body">
                              <span className="pr-flyer-modal__option-title">Image and video</span>
                              <span className="pr-flyer-modal__option-hint">Update poster and/or video link.</span>
                            </span>
                          </label>
                        </>
                      )}
                    </div>
                    <small className="pr-flyer-modal__help mt-2 mb-0">
                      {isCreate
                        ? "Choose one option. You can add the other type later by editing the item."
                        : "Poster only and Video only keep the other field unchanged. Use Image and video to change both."}
                    </small>
                  </section>

                  {(showVideoBlock || showImageBlock) && (
                    <section className="pr-flyer-modal__section">
                      <span className="pr-flyer-modal__section-title">Media</span>
                      <div className="pr-flyer-modal__media-panel">
                        {showVideoBlock ? (
                          <div className="pr-flyer-modal__field">
                            <label className="form-label" htmlFor="prFlyerVideoUrl">
                              Video link
                              {selectedObj ? (
                                <span className="text-muted fw-normal"> — YouTube / Instagram</span>
                              ) : null}
                            </label>
                            <Field
                              id="prFlyerVideoUrl"
                              type="text"
                              name="video_url"
                              className="form-control"
                              inputMode="url"
                              autoComplete="off"
                              placeholder="https://www.youtube.com/watch?v=… or https://www.instagram.com/reel/…"
                            />
                            <ErrorMessage name="video_url" component="div" className="text-danger small mt-1" />
                            <small className="pr-flyer-modal__help">
                              Paste a public <strong>YouTube</strong> or <strong>Instagram</strong> post, reel, or TV
                              URL.
                            </small>
                          </div>
                        ) : null}

                        {showImageBlock ? (
                          <div
                            className={`pr-flyer-modal__field${showVideoBlock ? " pr-flyer-modal__media-panel-follow" : ""}`}
                          >
                            <label className="form-label" htmlFor="prFlyerImageFile">
                              Poster image
                              {selectedObj ? (
                                <span className="text-muted fw-normal"> — optional, replaces current</span>
                              ) : null}
                            </label>
                            <input
                              ref={fileInputRef}
                              id="prFlyerImageFile"
                              type="file"
                              className="form-control"
                              accept="image/*"
                              onChange={handleImageChange}
                            />
                            <small className="pr-flyer-modal__help">
                              PNG, JPG, or WebP. Max 8MB. Square posters work best.
                            </small>
                            {imageFileName && imageBase64 ? (
                              <small className="text-info d-block mt-2 mb-0">
                                <i className="bx bx-check-circle me-1" aria-hidden="true"></i>
                                Selected: {imageFileName}
                              </small>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </section>
                  )}
                </div>
                <div className="modal-footer pr-flyer-modal__footer d-flex flex-wrap align-items-center gap-2 justify-content-between">
                  <div className="d-flex flex-wrap gap-2">
                    {selectedObj && canDeleteFlyer && typeof onDeleteFlyer === "function" ? (
                      <button
                        type="button"
                        className="btn btn-outline-danger"
                        disabled={isSubmitting}
                        onClick={() => onDeleteFlyer(selectedObj)}
                      >
                        <i className="bx bx-trash me-1" aria-hidden="true"></i>
                        Delete
                      </button>
                    ) : null}
                  </div>
                  <div className="d-flex flex-wrap gap-2 ms-auto">
                    <button
                      type="button"
                      className="btn btn-label-secondary"
                      onClick={handleClose}
                      data-bs-dismiss="modal"
                    >
                      Close
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                      {isSubmitting ? "Saving..." : "Save"}
                    </button>
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

export default PrFlyerModal;
