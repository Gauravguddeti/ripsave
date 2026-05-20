import React from "react";

export default function Footer() {
  return (
    <footer className="footer" aria-label="Site footer">
      <p className="footer-text">
        © {new Date().getFullYear()} RipSave — For personal use only. Respect content creators and copyright laws. This tool uses yt-dlp.
      </p>
      <span className="footer-badge" aria-label="Powered by yt-dlp">
        Powered by yt-dlp
      </span>
    </footer>
  );
}
