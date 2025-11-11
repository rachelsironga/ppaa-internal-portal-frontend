import React from "react";
import DOMPurify from "dompurify";

const MarkupViewer = ({ html }) => {
  const clean = React.useMemo(() => DOMPurify.sanitize(html || ""), [html]);
  return (
    <div
      className="markup-viewer"
      style={{ height: "400px" }}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
};

export default MarkupViewer;
