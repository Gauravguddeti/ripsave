import React from "react";
import { ExternalLink, Clock, User } from "lucide-react";

function formatDuration(seconds) {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function MediaCard({ info }) {
  const duration = formatDuration(info.duration);

  return (
    <div className="media-card" aria-label="Video info">
      {/* Thumbnail */}
      <div className="thumbnail-wrap">
        {info.thumbnail ? (
          <img
            src={info.thumbnail}
            alt={info.title}
            className="thumbnail-img"
          />
        ) : (
          <div className="thumbnail-placeholder">
            <span>No preview</span>
          </div>
        )}
        {duration && (
          <span className="duration-badge" aria-label={`Duration: ${duration}`}>
            <Clock size={11} strokeWidth={2.5} />
            {duration}
          </span>
        )}
      </div>

      {/* Metadata */}
      <div className="media-meta">
        <h2 className="media-title" title={info.title}>
          {info.title}
        </h2>
        {info.uploader && (
          <p className="media-uploader">
            <User size={13} strokeWidth={2} />
            {info.uploader}
          </p>
        )}
        {info.webpage_url && (
          <a
            href={info.webpage_url}
            target="_blank"
            rel="noopener noreferrer"
            className="source-link"
            data-testid="source-link"
          >
            Source <ExternalLink size={13} strokeWidth={2} />
          </a>
        )}
      </div>
    </div>
  );
}
