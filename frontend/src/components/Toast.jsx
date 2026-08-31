import React, { useEffect } from "react";

export default function Toast({ message, onDone }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(onDone, 3200);
    return () => window.clearTimeout(timer);
  }, [message, onDone]);

  return (
    <div className={`toast ${message ? "visible" : ""}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}
