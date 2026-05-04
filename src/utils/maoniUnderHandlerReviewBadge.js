/**
 * Shared sleek teal pill styling for UNDER_HANDLER_REVIEW across Maoni list, dashboard, and detail.
 * Use as: className={`badge ${maoniUnderHandlerReviewBadgeClasses} ...`}
 */
export const maoniUnderHandlerReviewBadgeClasses =
  "rounded-pill border-0 align-middle maoni-under-handler-review-badge";

export function getMaoniUnderHandlerReviewBadgeStyle(extra = {}) {
  return {
    background: "linear-gradient(180deg, #0e7490 0%, #164e63 100%)",
    color: "#ecfeff",
    fontWeight: 700,
    letterSpacing: "0.06em",
    fontSize: "0.7rem",
    padding: "0.4rem 0.65rem",
    boxShadow: "0 1px 3px rgba(8, 51, 68, 0.4)",
    ...extra,
  };
}
