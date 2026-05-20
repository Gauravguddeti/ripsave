import React from "react";
import { Download } from "lucide-react";
import InstallButton from "./InstallButton";

export default function Header({ onHowItWorksClick }) {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo-box" aria-label="RipSave logo">
          <Download size={20} color="#fff" strokeWidth={3} />
        </div>
        <div className="header-brand">
          <span className="wordmark">RIPSAVE</span>
          <span className="tagline">No fluff. Just files.</span>
        </div>
      </div>

      <div className="header-right">
        <InstallButton />
        <button
          className="how-it-works-btn"
          onClick={onHowItWorksClick}
          data-testid="how-it-works-btn"
        >
          How it works ↓
        </button>
      </div>
    </header>
  );
}
