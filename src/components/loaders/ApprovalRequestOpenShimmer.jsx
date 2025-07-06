import React from "react";
import ContentLoader from "react-content-loader";

const ApprovalRequestOpenShimmer = () => (
  <div className="card animate__animated animate__fadeInUp animate__faster">
    <div className="card-body">
      <ContentLoader
        speed={1.2} // Increased speed for a more noticeable shimmer
        width="100%"
        height={700}
        backgroundColor="#f3f3f3"
        foregroundColor="#e0e0e0" // Slightly darker for more contrast
        style={{ width: "100%" }}
      >
        {/* Header Title */}
        <rect x="2%" y="20" rx="4" ry="4" width="300" height="24" />
        <rect x="2%" y="55" rx="3" ry="3" width="200" height="16" />
        {/* Right Buttons (Print & Options) */}
        <rect x="75%" y="20" rx="6" ry="6" width="120" height="36" />
        <rect x="87%" y="20" rx="6" ry="6" width="120" height="36" />
        {/* Requester Detail Card */}
        <rect x="3%" y="100" rx="8" ry="8" width="200" height="24" />
        {/* Requester Detail List */}
        <rect x="4%" y="130" rx="4" ry="4" width="36%" height="18" />
        <rect x="4%" y="160" rx="4" ry="4" width="32%" height="18" />
        <rect x="4%" y="190" rx="4" ry="4" width="34%" height="18" />
        <rect x="4%" y="220" rx="4" ry="4" width="30%" height="18" />
        {/* About Requester Card */}
        <rect x="49%" y="100" rx="8" ry="8" width="200" height="24" />
        {/* About Requester List */}
        <rect x="50%" y="130" rx="4" ry="4" width="40%" height="18" />
        <rect x="50%" y="160" rx="4" ry="4" width="38%" height="18" />
        <rect x="50%" y="190" rx="4" ry="4" width="42%" height="18" />
        <rect x="50%" y="220" rx="4" ry="4" width="36%" height="18" />

        {/* Divider line */}
        <rect x="2%" y="270" rx="6" ry="6" width="96%" height="5" />

        {/* Approval Request Data & Attachments */}
        <rect x="2%" y="310" rx="4" ry="4" width="40%" height="25" />
        <rect x="2%" y="340" rx="4" ry="4" width="50%" height="17" />
        {/* Right Buttons (Print & Options) */}
        <rect x="80%" y="310" rx="6" ry="6" width="20%" height="28" />

        {/* Attachments/Permissions */}
        <rect x="4%" y="370" rx="6" ry="6" width="96%" height="100" />

        {/* Description */}
        <rect x="2%" y="490" rx="4" ry="4" width="200" height="20" />
        <rect x="2%" y="520" rx="3" ry="3" width="96%" height="30" />
        {/* Approval Chain Title */}
        <rect x="2%" y="610" rx="4" ry="4" width="200" height="20" />
        {/* Approval Chain Steps (4 horizontal blocks) */}
        <rect x="2%" y="640" rx="10" ry="10" width="22%" height="80" />
        <rect x="26%" y="640" rx="10" ry="10" width="22%" height="80" />
        <rect x="50%" y="640" rx="10" ry="10" width="22%" height="80" />
        <rect x="74%" y="640" rx="10" ry="10" width="22%" height="80" />
      </ContentLoader>
    </div>
  </div>
);

export default ApprovalRequestOpenShimmer;
