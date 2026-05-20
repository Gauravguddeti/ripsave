import React, { useRef } from "react";
import { Link2 } from "lucide-react";
import { toast } from "sonner";
import {
  FaYoutube,
  FaTiktok,
  FaInstagram,
  FaXTwitter,
  FaFacebook,
} from "react-icons/fa6";

export default function UrlInputCard({ url, setUrl, onFetch, isLoading }) {
  const inputRef = useRef(null);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text.trim());
      toast.success("Link pasted ✓");
      inputRef.current?.focus();
    } catch {
      toast.error("Clipboard access denied — paste manually.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) {
      toast.error("Please enter a URL first.");
      return;
    }
    onFetch(url.trim());
  };

  return (
    <section className="url-card" aria-label="URL input">
      <form onSubmit={handleSubmit} className="url-form">
        <div className="url-input-row">
          <span className="url-input-icon" aria-hidden="true">
            <Link2 size={20} strokeWidth={2.5} />
          </span>
          <input
            ref={inputRef}
            id="url-input"
            data-testid="url-input"
            type="url"
            placeholder="Paste a YouTube, TikTok, Instagram link…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="url-input"
            autoComplete="off"
            spellCheck={false}
            aria-label="Social media URL"
          />
          <button
            type="button"
            className="paste-btn"
            onClick={handlePaste}
            data-testid="paste-button"
            aria-label="Paste from clipboard"
          >
            Paste
          </button>
          <button
            type="submit"
            className="fetch-btn"
            disabled={isLoading}
            data-testid="fetch-button"
            aria-label="Fetch video info"
          >
            {isLoading ? (
              <span className="spinner" aria-hidden="true" />
            ) : (
              "Fetch →"
            )}
          </button>
        </div>
      </form>

      <div className="platform-row" aria-label="Supported platforms">
        <span className="platform-label">Works with:</span>
        <FaYoutube className="platform-icon yt" title="YouTube" />
        <FaTiktok className="platform-icon tt" title="TikTok" />
        <FaInstagram className="platform-icon ig" title="Instagram" />
        <FaXTwitter className="platform-icon tw" title="Twitter / X" />
        <FaFacebook className="platform-icon fb" title="Facebook" />
        <span className="platform-more">+ 1000 more</span>
      </div>
    </section>
  );
}
