import React from "react";
import { Download, Music, Video } from "lucide-react";
import { toast } from "sonner";
import BrutalistSlider from "./BrutalistSlider";
import { buildDownloadUrl } from "../api/ripsave";

const MP4_QUALITIES = ["360p", "720p", "1080p"];
const MP3_BITRATES  = ["128k", "192k", "320k"];

const MP3_LABELS = {
  "128k": "128 kbps",
  "192k": "192 kbps",
  "320k": "320 kbps",
};

export default function DownloadCard({
  info,
  format,
  setFormat,
  quality,
  setQuality,
  onDownload,
}) {
  const handleDownload = () => {
    if (!info) return;

    const downloadUrl = buildDownloadUrl(info.webpage_url || "", format, quality);

    // Programmatic download via hidden anchor
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "";
    a.setAttribute("data-testid", "download-anchor");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    const label =
      format === "mp3"
        ? `MP3 · ${MP3_LABELS[quality] || quality}`
        : `MP4 · ${quality}`;

    toast.success(`Preparing ${label}… Download starting!`);
    onDownload(format, quality);
  };

  // Switch format and reset quality to the best default for that format
  const handleSetFormat = (fmt) => {
    setFormat(fmt);
    if (fmt === "mp3") {
      setQuality("192k");
    } else {
      const quals = info?.available_qualities ?? MP4_QUALITIES;
      setQuality(quals[quals.length - 1]);
    }
  };

  const mp4Steps = info?.available_qualities ?? MP4_QUALITIES;

  const downloadLabel =
    format === "mp3"
      ? `Download MP3 · ${MP3_LABELS[quality] || quality}`
      : `Download MP4 · ${quality}`;

  return (
    <div className="download-card">
      {/* Format toggle */}
      <div>
        <p className="section-label">Format</p>
        <div className="format-toggle" role="group" aria-label="Select format">
          <button
            type="button"
            className={`format-btn ${format === "mp4" ? "active" : ""}`}
            onClick={() => handleSetFormat("mp4")}
            data-testid="format-toggle-mp4"
            aria-pressed={format === "mp4"}
          >
            <Video size={16} strokeWidth={2.5} />
            MP4
          </button>
          <button
            type="button"
            className={`format-btn ${format === "mp3" ? "active" : ""}`}
            onClick={() => handleSetFormat("mp3")}
            data-testid="format-toggle-mp3"
            aria-pressed={format === "mp3"}
          >
            <Music size={16} strokeWidth={2.5} />
            MP3
          </button>
        </div>
      </div>

      {/* Quality section — different slider per format */}
      <div className="quality-section">
        <div className="quality-display">
          <p className="quality-display-label">
            {format === "mp3" ? "Bitrate" : "Quality"}
          </p>
          <span
            className="quality-display-value"
            data-testid="selected-quality"
            aria-live="polite"
          >
            {format === "mp3" ? (MP3_LABELS[quality] || quality) : quality}
          </span>
        </div>

        {format === "mp4" ? (
          <BrutalistSlider
            quality={quality}
            onChange={setQuality}
            steps={mp4Steps}
          />
        ) : (
          <BrutalistSlider
            quality={quality}
            onChange={setQuality}
            steps={MP3_BITRATES}
            labels={MP3_LABELS}
            testIdPrefix="quality-step-mp3"
          />
        )}
      </div>

      {/* Download button */}
      <button
        type="button"
        className="download-btn"
        onClick={handleDownload}
        data-testid="download-button"
        aria-label={downloadLabel}
      >
        <Download size={20} strokeWidth={2.5} />
        {downloadLabel}
      </button>
    </div>
  );
}
