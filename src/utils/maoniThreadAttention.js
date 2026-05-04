/** Normalizes legacy Maoni workflow status strings (matches handler dashboard). */
export const normalizeMaoniWorkflowStatus = (status) => {
  const raw = String(status || "").toUpperCase();
  const legacy = {
    PENDING_REVIEW: "UNDER_HANDLER_REVIEW",
    UNDER_CONSIDERATION: "ESCALATED_TO_REVIEWER",
    APPROVED: "CLOSED_APPROVED",
    IMPLEMENTED: "CLOSED_APPROVED",
    REJECTED: "CLOSED_REJECTED",
  };
  return legacy[raw] || raw;
};

const CLOSED = new Set(["CLOSED_APPROVED", "CLOSED_REJECTED"]);

/**
 * True when the suggestion has at least one thread comment and the latest comment
 * was not authored by `currentUserId` (someone else spoke last — handler should open the thread).
 */
export const maoniSuggestionHasUnhandledThreadMessage = (suggestion, currentUserId) => {
  if (suggestion == null || currentUserId == null) return false;
  const st = normalizeMaoniWorkflowStatus(suggestion.status);
  if (st === "DRAFT" || CLOSED.has(st)) return false;
  const comments = Number(suggestion.comment_count ?? 0);
  if (comments < 1) return false;
  const lastBy = suggestion.last_comment_by_id;
  if (lastBy == null) return true;
  return Number(lastBy) !== Number(currentUserId);
};

/** User-facing summary line for the attention banner (reusable copy). */
export const buildMaoniNewThreadSummaryMessage = (count) => {
  const n = Number(count) || 0;
  if (n <= 0) return "";
  if (n === 1) {
    return "There is 1 suggestion with new messages in the communication thread. Open it to respond.";
  }
  return `There are ${n} suggestions with new messages in their threads. Open one below to respond.`;
};

const REVIEWER_ATTENTION_STATUSES = new Set([
  "ESCALATED_TO_REVIEWER",
  "HANDLER_RESPONDED_TO_REVIEWER",
]);

/**
 * Executive / reviewer queue: escalated or handler→reviewer threads where someone else
 * posted last (handler, contributor, or workflow) so the reviewer should open the suggestion.
 */
export const maoniSuggestionNeedsReviewerAttention = (suggestion, currentUserId) => {
  if (suggestion == null || currentUserId == null) return false;
  const st = normalizeMaoniWorkflowStatus(suggestion.status);
  if (!REVIEWER_ATTENTION_STATUSES.has(st) || CLOSED.has(st)) return false;
  const comments = Number(suggestion.comment_count ?? 0);
  if (comments < 1) return false;
  const lastBy = suggestion.last_comment_by_id;
  if (lastBy == null) return true;
  return Number(lastBy) !== Number(currentUserId);
};

/** Summary line for the executive (reviewer) dashboard attention banner. */
export const buildMaoniReviewerAttentionSummary = (count) => {
  const n = Number(count) || 0;
  if (n <= 0) return "";
  if (n === 1) {
    return "One suggestion in your reviewer queue has new activity — open it to read messages and respond.";
  }
  return `${n} suggestions in your reviewer queue have new messages. Open one below to respond.`;
};
