import React, { useMemo } from "react";
import { buildMaoniNewThreadSummaryMessage } from "../../utils/maoniThreadAttention";

const truncate = (text, max = 72) => {
  const s = String(text || "").replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
};

/**
 * Prominent, pulsing callout for Maoni dashboards when thread replies need attention.
 *
 * @param {Array<{ uid: string, title?: string }>} items
 * @param {(uid: string) => void} onOpenSuggestion — navigate or route change
 * @param {number} [maxRows=6] — how many suggestion rows to list before "+N more"
 * @param {string} [title] — heading override (default: handler-oriented copy)
 * @param {string} [summary] — paragraph override (default: derived from count)
 * @param {string} [overflowNote] — text under the list when more than maxRows (default: department queue hint)
 */
const MaoniThreadAttentionBanner = ({
  items = [],
  onOpenSuggestion,
  maxRows = 6,
  title,
  summary: summaryProp,
  overflowNote,
}) => {
  const summary = useMemo(() => {
    if (typeof summaryProp === "string" && summaryProp.trim()) return summaryProp.trim();
    return buildMaoniNewThreadSummaryMessage(items.length);
  }, [summaryProp, items.length]);
  const heading = title?.trim() || "New thread messages";
  const visible = items.slice(0, maxRows);
  const overflow = Math.max(0, items.length - visible.length);

  if (!items.length || typeof onOpenSuggestion !== "function") return null;

  return (
    <div className="maoni-thread-attention-root position-relative">
      <div
        className="maoni-thread-attention-card border-0 rounded-3 shadow-sm text-start w-100 overflow-hidden"
        style={{
          background: "linear-gradient(125deg, #ecfdf5 0%, #dbeafe 45%, #fef9c3 100%)",
        }}
      >
        <div className="d-flex flex-wrap align-items-start gap-3 p-3 p-md-4">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 maoni-thread-attention-icon-wrap"
            style={{
              width: "3rem",
              height: "3rem",
              background: "linear-gradient(145deg, #22c55e 0%, #15803d 100%)",
              color: "#fff",
              boxShadow: "0 6px 18px rgba(22, 163, 74, 0.35)",
            }}
          >
            <i className="bx bx-message-rounded-dots" style={{ fontSize: "1.65rem" }} aria-hidden />
          </div>
          <div className="flex-grow-1 min-w-0">
            <div className="d-flex flex-wrap align-items-baseline justify-content-between gap-2 mb-2">
              <h6 className="mb-0 fw-bold text-dark text-uppercase" style={{ letterSpacing: "0.04em" }}>
                {heading}
              </h6>
              <span className="badge rounded-pill bg-danger text-white px-2">{items.length}</span>
            </div>
            <p className="small text-secondary mb-3 mb-md-2">{summary}</p>
            <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
              {visible.map((s) => (
                <li key={s.uid}>
                  <button
                    type="button"
                    className="btn btn-light btn-sm text-start w-100 rounded-2 border maoni-thread-attention-row d-flex align-items-center justify-content-between gap-2 py-2 px-3"
                    onClick={() => onOpenSuggestion(s.uid)}
                  >
                    <span className="min-w-0 text-truncate fw-semibold text-dark">
                      {truncate(s.title || "Suggestion", 90)}
                    </span>
                    <i className="bx bx-chevron-right text-success flex-shrink-0" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
            {overflow > 0 ? (
              <p className="small text-muted mb-0 mt-2">
                {overflowNote?.trim() ||
                  `+${overflow} more in your department — use the queue tables to find them.`}
              </p>
            ) : null}
          </div>
        </div>
      </div>
      <style>{`
        .maoni-thread-attention-root {
          --maoni-attention-glow: rgba(34, 197, 94, 0.55);
        }
        .maoni-thread-attention-card {
          animation: maoniAttentionPulse 2.1s ease-in-out infinite;
          box-shadow: 0 0 0 0 var(--maoni-attention-glow);
        }
        @keyframes maoniAttentionPulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.35), 0 0.35rem 1rem rgba(15, 23, 42, 0.08);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(34, 197, 94, 0), 0 0.5rem 1.25rem rgba(15, 23, 42, 0.12);
          }
        }
        .maoni-thread-attention-icon-wrap {
          animation: maoniAttentionNod 2.1s ease-in-out infinite;
        }
        @keyframes maoniAttentionNod {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-2px);
          }
        }
        .maoni-thread-attention-row:hover {
          border-color: #22c55e !important;
          background: #f0fdf4 !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .maoni-thread-attention-card,
          .maoni-thread-attention-icon-wrap {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default MaoniThreadAttentionBanner;
