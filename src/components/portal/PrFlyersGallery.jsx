import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./portalPrFlyersGallery.css";
import { useInternalPortalI18n } from "../../contexts/InternalPortalI18nContext.jsx";
import {
  prFlyerVideoEmbedSrc,
  prFlyerVideoProviderLabel,
  resolvePublicPortalAssetUrl,
} from "../../utils/prFlyerVideo";

function FlyerCard({ flyer, onOpen }) {
  const { t } = useInternalPortalI18n();
  const title = (flyer.title || "").trim();
  const label = title || "Flyer or poster";
  const videoUrl = (flyer.video_url || "").trim();
  const embedSrc = useMemo(() => (videoUrl ? prFlyerVideoEmbedSrc(videoUrl) : null), [videoUrl]);
  const posterSrc = useMemo(() => {
    const raw = (flyer.image_url || "").trim() || (flyer.video_thumb_url || "").trim();
    return resolvePublicPortalAssetUrl(raw);
  }, [flyer.image_url, flyer.video_thumb_url]);
  const hasVideo = !!(videoUrl && embedSrc);
  const provider = hasVideo ? prFlyerVideoProviderLabel(videoUrl) : null;
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [posterSrc]);

  const canOpen = !!(posterSrc && !imgError) || hasVideo;

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (canOpen) onOpen(flyer);
    }
  };

  const handleClick = () => {
    if (canOpen) onOpen(flyer);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className="pr-flyer-card"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={hasVideo ? `Open video: ${label}` : `Open preview: ${label}`}
    >
      <div className="pr-flyer-card__media">
        {posterSrc && !imgError ? (
          <img
            src={posterSrc}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
          />
        ) : hasVideo ? (
          <div className="pr-flyer-card__video-placeholder" aria-hidden>
            <i
              className={
                provider === "Instagram" ? "bx bxl-instagram" : "bx bxl-youtube"
              }
            />
            <span>{provider || "Video"}</span>
          </div>
        ) : (
          <div className="pr-flyer-card__image-fallback" aria-hidden>
            <i className="bx bx-image" />
          </div>
        )}
        <div className="pr-flyer-card__overlay" aria-hidden>
          <span className="pr-flyer-card__chip">
            {hasVideo ? (
              <>
                <i className="bx bx-play-circle" style={{ fontSize: "0.95rem" }} />
                {t("publicPortal.play")}
              </>
            ) : (
              <>
                <i className="bx bx-expand-alt" style={{ fontSize: "0.85rem" }} />
                {t("publicPortal.open")}
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Shared PR flyers / posters gallery for staff dashboard and public portal.
 */
export function PrFlyersGallery({ flyers = [], id, headerRight = null, lift = false, compact = false }) {
  const { t } = useInternalPortalI18n();
  const list = Array.isArray(flyers) ? flyers : [];
  const useMarquee = list.length > 1;
  const marqueeDurationSec = Math.min(90, Math.max(24, list.length * 14));

  const reactId = useId().replace(/:/g, "");
  const modalDomId = `pr-flyer-lightbox-${reactId}`;
  const modalRef = useRef(null);
  const [lightboxFlyer, setLightboxFlyer] = useState(null);

  const lightboxEmbedSrc = useMemo(() => {
    const u = (lightboxFlyer?.video_url || "").trim();
    return u ? prFlyerVideoEmbedSrc(u) : null;
  }, [lightboxFlyer]);

  const lightboxImageSrc = useMemo(() => {
    const raw = (lightboxFlyer?.image_url || "").trim();
    return raw ? resolvePublicPortalAssetUrl(raw) : "";
  }, [lightboxFlyer]);

  const handleOpen = useCallback((flyer) => {
    const poster = resolvePublicPortalAssetUrl(
      (flyer?.image_url || "").trim() || (flyer?.video_thumb_url || "").trim()
    );
    const v = (flyer?.video_url || "").trim();
    const emb = v ? prFlyerVideoEmbedSrc(v) : null;
    if (poster || emb) setLightboxFlyer(flyer);
  }, []);

  useEffect(() => {
    const el = modalRef.current;
    if (!el || !window.bootstrap) return undefined;
    const onHidden = () => setLightboxFlyer(null);
    el.addEventListener("hidden.bs.modal", onHidden);
    return () => {
      el.removeEventListener("hidden.bs.modal", onHidden);
    };
  }, []);

  useEffect(() => {
    const el = modalRef.current;
    if (!el || !window.bootstrap) return;
    if (!window.bootstrap.Modal.getInstance(el)) {
      new window.bootstrap.Modal(el, { backdrop: false, keyboard: true, focus: true });
    }
    const inst = window.bootstrap.Modal.getInstance(el);
    if (lightboxFlyer) inst.show();
    else inst.hide();
  }, [lightboxFlyer]);

  const lbTitle =
    (lightboxFlyer?.title || "").trim() || t("publicPortal.lightboxPoster");
  const lbVideo = (lightboxFlyer?.video_url || "").trim();
  const lbProvider = prFlyerVideoProviderLabel(lbVideo);
  const isInstagramEmbed = lightboxEmbedSrc && lightboxEmbedSrc.includes("instagram.com");

  const lightboxModal = (
    <div
      className="modal fade pr-flyer-lightbox-modal"
      id={modalDomId}
      ref={modalRef}
      tabIndex={-1}
      aria-hidden="true"
      aria-label={lbTitle}
      data-bs-backdrop="false"
      data-bs-keyboard="true"
    >
      <div className="modal-dialog modal-dialog-centered modal-lg pr-flyer-lightbox-modal__dialog">
        <div className="modal-content border-0 pr-flyer-lightbox-modal__content">
          <button
            type="button"
            className="btn-close pr-flyer-lightbox-modal__close"
            data-bs-dismiss="modal"
            aria-label="Close"
          />
          <div className="modal-body text-center pt-2 pr-flyer-lightbox-modal__body">
            {lightboxEmbedSrc ? (
              <div
                className={`pr-flyer-lightbox-modal__iframe-wrap${
                  isInstagramEmbed ? " pr-flyer-lightbox-modal__iframe-wrap--instagram" : ""
                }`}
              >
                <iframe
                  title={lbProvider ? `${lbProvider} video` : "Video"}
                  src={lightboxEmbedSrc}
                  className="pr-flyer-lightbox-modal__iframe"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            ) : lightboxImageSrc ? (
              <div className="pr-flyer-lightbox-modal__media">
                <img
                  src={lightboxImageSrc}
                  alt={lbTitle}
                  className="pr-flyer-lightbox-modal__img img-fluid"
                  loading="eager"
                  decoding="async"
                />
              </div>
            ) : null}
            {lbVideo ? (
              <p className="small text-muted mt-2 mb-0">
                <a href={lbVideo} target="_blank" rel="noopener noreferrer">
                  {lbProvider ? `Open on ${lbProvider}` : "Open video link"}
                </a>
              </p>
            ) : lightboxImageSrc ? (
              <p className="small text-muted mt-2 mb-0">
                <a href={lightboxImageSrc} target="_blank" rel="noopener noreferrer">
                  Open image in new tab
                </a>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      id={id || undefined}
      className={`pr-flyers-gallery card border-0 shadow-lg h-100 w-100 d-flex flex-column${
        lift ? " portal-card-lift" : ""
      }${compact ? " pr-flyers-gallery--narrow" : ""}`}
    >
      <div className="card-header border-0 pr-flyers-gallery__header d-flex justify-content-between align-items-start flex-wrap gap-2 py-3 flex-shrink-0">
        <div className="d-flex align-items-start gap-2 min-w-0 flex-grow-1">
          <span
            className="d-inline-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
            style={{
              width: 38,
              height: 38,
              background: "linear-gradient(135deg, rgba(0,133,63,0.15), rgba(61,166,106,0.12))",
            }}
            aria-hidden
          >
            <i className="bx bx-image" style={{ color: "#00853f", fontSize: "1.25rem" }} />
          </span>
          <div className="min-w-0">
            <h5 className="mb-0 pr-flyers-gallery__title-text" style={{ color: "#00853f", fontWeight: 700 }}>
              {t("publicPortal.prFlyersTitle")}
            </h5>
            <p className="mb-0 text-muted small pr-flyers-gallery__subtitle">
              {t("publicPortal.prFlyersSubtitle")}
            </p>
          </div>
        </div>
        {headerRight ? <div className="d-flex align-items-center gap-2 flex-shrink-0">{headerRight}</div> : null}
      </div>
      <div className="card-body p-3 p-md-4 pr-flyers-gallery__body flex-grow-1 d-flex flex-column">
        {list.length === 0 ? (
          <div className="pr-flyers-gallery__empty flex-grow-1 d-flex flex-column justify-content-center">
            <div className="pr-flyers-gallery__empty-icon">
              <i className="bx bx-image" aria-hidden />
            </div>
            <div className="pr-flyers-gallery__empty-title">
              {t("publicPortal.prFlyersEmptyTitle")}
            </div>
            <p className="pr-flyers-gallery__empty-lead mb-0">
              {t("publicPortal.prFlyersEmptyLead")}
            </p>
          </div>
        ) : useMarquee ? (
          <div
            className="pr-flyers-gallery__marquee flex-grow-1"
            role="region"
            aria-label={t("publicPortal.prFlyersMarqueeAria")}
          >
            <div
              className="pr-flyers-gallery__marquee-track"
              style={{ "--pr-marquee-sec": `${marqueeDurationSec}s` }}
            >
              <div className="pr-flyers-gallery__marquee-group">
                {list.map((flyer) => (
                  <div key={flyer.uid} className="pr-flyers-gallery__marquee-slot">
                    <FlyerCard flyer={flyer} onOpen={handleOpen} />
                  </div>
                ))}
              </div>
              <div className="pr-flyers-gallery__marquee-group pr-flyers-gallery__marquee-group--clone" aria-hidden="true">
                {list.map((flyer) => (
                  <div key={`${flyer.uid}-clone`} className="pr-flyers-gallery__marquee-slot">
                    <FlyerCard flyer={flyer} onOpen={handleOpen} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="pr-flyers-gallery__single flex-grow-1">
            <FlyerCard flyer={list[0]} onOpen={handleOpen} />
          </div>
        )}
      </div>

      {typeof document !== "undefined" ? createPortal(lightboxModal, document.body) : null}
    </div>
  );
}
