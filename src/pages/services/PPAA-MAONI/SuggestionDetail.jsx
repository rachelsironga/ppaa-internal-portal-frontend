import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import {
  getSuggestion,
  replyToSuggestion,
  getSuggestionForPrint,
} from "./Queries";
import { formatDate } from "../../../helpers/DateFormater";
import LinearIndeterminate from "../../../LinearIndeterminate";

// Strip HTML but keep paragraph/line breaks by turning block elements into newlines
const stripHtml = (html) => {
  if (!html) return "";
  const tmp = document.createElement("DIV");
  let s = html
    .replace(/<\/p>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n");
  tmp.innerHTML = s;
  const text = tmp.textContent || tmp.innerText || "";
  return text.replace(/\n{3,}/g, "\n\n").trim();
};

const SuggestionDetail = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.userReducer?.data);
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  const isHR =
    user?.groups?.some((role) => role?.toLowerCase() === "hr") ||
    user?.is_superuser;
  const isAdmin =
    user?.groups?.some((role) => String(role).toLowerCase() === "admin") ||
    user?.is_superuser;
  const fromDashboard =
    (isHR || isAdmin) && location?.state?.fromDashboard === true;

  const goBackToList = () => {
    if (fromDashboard) {
      navigate("/ppaa-maoni/dashboard", {
        state: { activeTab: location.state?.returnTab || "contributions" },
      });
    } else {
      navigate("/ppaa-maoni/suggestions");
    }
  };

  useEffect(() => {
    fetchSuggestion();
  }, [uid]);

  const fetchSuggestion = async () => {
    try {
      setLoading(true);
      const response = await getSuggestion(uid);
      if (response.status === 8000 || response.status === 200) {
        setSuggestion(response.data || response);
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || error.message || "Failed to load suggestion",
      }).then(() => {
        if (fromDashboard) {
          navigate("/ppaa-maoni/dashboard", {
            state: { activeTab: location.state?.returnTab || "contributions" },
          });
        } else {
          navigate("/ppaa-maoni/suggestions");
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (parentCommentUid = null) => {
    if (!replyText.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: "Please enter a reply",
      });
      return;
    }

    try {
      setSubmittingReply(true);
      const response = await replyToSuggestion(uid, replyText, parentCommentUid);
      if (response.status === 8000 || response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: response.message || "Reply sent successfully",
          timer: 1500,
        });
        setReplyText("");
        setReplyingTo(null);
        fetchSuggestion(); // Refresh to get new reply
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to send reply",
      });
    } finally {
      setSubmittingReply(false);
    }
  };

  const handlePrint = async () => {
    try {
      const response = await getSuggestionForPrint(uid);
      if (response.status === 8000 || response.status === 200) {
        const data = response.data || response;
        
        // Create print window
        const printWindow = window.open("", "_blank");
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Suggestion - ${data.title}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
                .meta { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px; }
                .meta-item { margin: 5px 0; }
                .content { margin: 20px 0; line-height: 1.6; }
                .comment { margin: 20px 0; padding: 15px; border-left: 4px solid #007bff; background: #f9f9f9; }
                .comment-header { font-weight: bold; color: #007bff; margin-bottom: 10px; }
                .comment-reply { margin-left: 30px; margin-top: 10px; border-left-color: #28a745; }
                .hr-reply { border-left-color: #dc3545; }
                hr { margin: 30px 0; }
              </style>
            </head>
            <body>
              <h1>${data.title}</h1>
              <div class="meta">
                <div class="meta-item"><strong>Submitted by:</strong> ${data.submitted_by_name || "Anonymous"}</div>
                <div class="meta-item"><strong>Date:</strong> ${formatDate(data.submitted_at || data.created_at)}</div>
                <div class="meta-item"><strong>Status:</strong> ${data.status}</div>
                <div class="meta-item"><strong>Priority:</strong> ${data.priority}</div>
              </div>
              <div class="content">
                <h3>Description</h3>
                <p>${data.description.replace(/\n/g, "<br>")}</p>
              </div>
              <hr>
              <h2>Replies (${data.all_comments?.length || 0})</h2>
              ${(data.all_comments || []).map((comment) => `
                <div class="comment ${comment.is_hr_reply ? "hr-reply" : ""}">
                  <div class="comment-header">
                    ${comment.is_hr_reply ? "👤 HR: " : ""}${comment.commented_by_name} - ${formatDate(comment.created_at)}
                  </div>
                  <div>${comment.comment.replace(/\n/g, "<br>")}</div>
                </div>
              `).join("")}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to load suggestion for printing",
      });
    }
  };

  const renderComment = (comment, level = 0) => {
    return (
      <div
        key={comment.uid}
        className={`mb-3 ${level > 0 ? "ms-4 border-start border-3 ps-3" : ""}`}
        style={{
          borderLeftColor: comment.is_hr_reply ? "#dc3545" : "#007bff",
        }}
      >
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <strong className={comment.is_hr_reply ? "text-danger" : "text-primary"}>
              {comment.is_hr_reply && "👤 HR: "}
              {comment.commented_by_name}
            </strong>
            <small className="text-muted ms-2">
              {formatDate(comment.created_at)}
            </small>
          </div>
        </div>
        <p className="mb-2">{comment.comment}</p>
        <button
          className="btn btn-sm btn-outline-primary"
          onClick={() => {
            setReplyingTo(comment.uid);
            setReplyText("");
          }}
        >
          <i className="bi bi-reply me-1"></i>
          Reply
        </button>
        {replyingTo === comment.uid && (
          <div className="mt-3">
            <textarea
              className="form-control mb-2"
              rows="3"
              placeholder="Write your reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            <div>
              <button
                className="btn btn-sm btn-primary me-2"
                onClick={() => handleReply(comment.uid)}
                disabled={submittingReply}
              >
                Send
              </button>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyText("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3">
            {comment.replies.map((reply) => renderComment(reply, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <LinearIndeterminate />;
  }

  if (!suggestion) {
    return null;
  }

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-lg-8">
          <div className="card shadow mb-4">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h4 className="mb-0 text-white">{suggestion.title}</h4>
              {isHR && (
                <button
                  className="btn btn-light btn-sm"
                  onClick={handlePrint}
                >
                  <i className="bi bi-printer me-2"></i>
                  Print
                </button>
              )}
            </div>
            <div className="card-body mt-3">
              <div className="mb-3">
                <div className="d-flex flex-wrap gap-2 mb-3">
                  <span className="badge bg-primary">
                    {suggestion.status?.replace("_", " ")}
                  </span>
                  <span className="badge bg-warning text-dark">
                    {suggestion.priority}
                  </span>
                  <span className="badge bg-light text-dark">
                    <i className="bi bi-chat-dots me-1"></i>
                    {suggestion.comment_count || 0} replies
                  </span>
                </div>
                <div className="text-muted small">
                  <i className="bi bi-person me-1"></i>
                  <strong>Submitted by:</strong> {suggestion.submitted_by_name || "Anonymous"}
                  <span className="ms-3">
                    <i className="bi bi-calendar me-1"></i>
                    {formatDate(suggestion.submitted_at || suggestion.created_at)}
                  </span>
                </div>
              </div>
              <hr />
              <div>
                <h5>Description</h5>
                <p style={{ whiteSpace: "pre-wrap" }}>
                  {stripHtml(suggestion.description)}
                </p>
              </div>
            </div>
          </div>

          {/* Replies Section */}
          <div className="card shadow">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-chat-dots me-2"></i>
                Replies ({suggestion.comment_count || 0})
              </h5>
            </div>
            <div className="card-body">
              {suggestion.comments && suggestion.comments.length > 0 ? (
                suggestion.comments.map((comment) => renderComment(comment))
              ) : (
                <p className="text-muted">No replies yet.</p>
              )}

              {/* Add Reply Form */}
              {!replyingTo && (
                <div className="mt-4 pt-3 border-top">
                  <h6>Add a Reply</h6>
                  <textarea
                    className="form-control mb-2"
                    rows="4"
                    placeholder="Write your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={() => handleReply()}
                    disabled={submittingReply || !replyText.trim()}
                  >
                    {submittingReply ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                        ></span>
                        Sending...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send me-2"></i>
                        Send Reply
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card shadow">
            <div className="card-header">
              <h6 className="mb-0">Actions</h6>
            </div>
            <div className="card-body">
              <button
                className="btn btn-secondary w-100 mb-2"
                onClick={goBackToList}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Back to List
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuggestionDetail;
