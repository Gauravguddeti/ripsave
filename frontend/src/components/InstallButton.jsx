import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";

/**
 * PWA Install Button.
 * Captures the beforeinstallprompt event and shows a custom install CTA.
 * Hides itself if the app is already installed (standalone mode) or
 * after the user installs / dismisses.
 */
export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Already running as installed PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!visible) return null;

  return (
    <button
      className="install-btn"
      onClick={handleInstall}
      data-testid="install-button"
      aria-label="Install RipSave app"
    >
      <Download size={15} strokeWidth={3} />
      Install App
    </button>
  );
}
