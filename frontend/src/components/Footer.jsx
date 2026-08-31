import React from "react";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <strong>Harbor</strong>
          <p>A digital sanctuary for survivors to write, reflect, preserve what matters, and find support on their own terms.</p>
        </div>
        <nav aria-label="Platform">
          <h4>Platform</h4>
          <a href="#stories">Story library</a>
          <a href="#awareness">Awareness hub</a>
          <a href="#healing">Healing hub</a>
          <a href="#support">Support</a>
        </nav>
        <nav aria-label="Private tools">
          <h4>Private tools</h4>
          <a href="#auth">Private account</a>
          <a href="#journal">Journal</a>
          <a href="#vault">Evidence vault</a>
        </nav>
        <nav aria-label="Trust">
          <h4>Trust</h4>
          <a href="#support">Emergency note</a>
        </nav>
      </div>
      <div className="footer-bottom">
        <span>(c) 2026 Harbor</span>
        <span>Harbor is not a crisis service. If you are in immediate danger, contact local emergency services.</span>
      </div>
    </footer>
  );
}
