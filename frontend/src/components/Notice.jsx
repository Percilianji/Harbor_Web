import React from "react";

export default function Notice({ tone = "", title, children }) {
  return (
    <div className={`notice ${tone}`}>
      <strong>{title}</strong>
      {children && <p>{children}</p>}
    </div>
  );
}
