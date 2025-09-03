// Accordion.js
import React from "react";

const TextSignature = ({ text = "" }) => {
  const safeText = String(text).trim(); // ensure it's a string

  return (
    <span
      style={{
        fontFamily:
          "'Pacifico', cursive, 'Brush Script MT', 'Segoe Script', sansSerif",
        fontWeight: 100,
        letterSpacing: "2px",
        display: "inline-block",
        marginTop: "3px",
        marginBottom: "10px",
        fontSize: "20px",
      }}
    >
      {safeText
        .split(" ")
        .filter(Boolean) // remove empty entries
        .map((n, i, arr) =>
          i < arr.length - 1 && n[0]
            ? n[0].toLowerCase() + "."
            : n.toLowerCase()
        )
        .join("")}
    </span>
  );
};

export default TextSignature;
