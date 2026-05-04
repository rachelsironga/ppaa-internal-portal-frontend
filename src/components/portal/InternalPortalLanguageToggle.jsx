import React from "react";
import { useInternalPortalI18n } from "../../contexts/InternalPortalI18nContext.jsx";

/**
 * EN / SW switch for the internal portal. Used in the top navbar and on the staff dashboard
 * so language is easy to find (navbar can be crowded or off-screen on small widths).
 */
export function InternalPortalLanguageToggle({
  className = "",
  showLabel = false,
}) {
  const { locale, setLocale, t } = useInternalPortalI18n();

  return (
    <div
      className={`d-flex align-items-center gap-2 ${className}`.trim()}
    >
      {showLabel ? (
        <span className="text-muted small mb-0">{t("nav.language")}</span>
      ) : null}
      <div
        className="d-flex align-items-stretch internal-portal-lang-toggle"
        role="group"
        aria-label={t("nav.language")}
      >
        <button
          type="button"
          className={`btn btn-sm px-2 ${
            locale === "en" ? "btn-primary" : "btn-outline-secondary"
          }`}
          onClick={() => setLocale("en")}
          title={t("nav.english")}
          aria-label={t("nav.english")}
          aria-pressed={locale === "en"}
          style={{
            fontWeight: 700,
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
          }}
        >
          EN
        </button>
        <button
          type="button"
          className={`btn btn-sm px-2 ${
            locale === "sw" ? "btn-primary" : "btn-outline-secondary"
          }`}
          onClick={() => setLocale("sw")}
          title={t("nav.swahili")}
          aria-label={t("nav.swahili")}
          aria-pressed={locale === "sw"}
          style={{
            fontWeight: 700,
            marginLeft: -1,
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
          }}
        >
          SW
        </button>
      </div>
    </div>
  );
}
