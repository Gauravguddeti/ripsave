import React from "react";
import { ExternalLink } from "lucide-react";

function formatDate(isoString) {
  try {
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function RecentRips({ history, onClear }) {
  return (
    <section className="recent-rips" aria-label="Recent downloads">
      <div className="rips-header">
        <h2 className="section-heading" style={{ marginBottom: 0 }}>
          Recent Rips
        </h2>
        {history.length > 0 && (
          <button
            type="button"
            className="clear-btn"
            onClick={onClear}
            data-testid="clear-history-button"
            aria-label="Clear all history"
          >
            Clear All
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="empty-history" aria-live="polite">
          No downloads yet — paste a link above to get started.
        </div>
      ) : (
        <ul className="rips-list">
          {history.map((item, idx) => (
            <li
              key={`${item.url}-${idx}`}
              className="rip-item"
              data-testid={`history-item-${idx}`}
            >
              {item.thumbnail ? (
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="rip-thumb"
                  loading="lazy"
                />
              ) : (
                <div className="rip-thumb-placeholder" aria-hidden="true" />
              )}

              <div className="rip-info">
                <p className="rip-title" title={item.title}>
                  {item.title}
                </p>
                <p className="rip-meta">
                  <span>{item.format?.toUpperCase()}</span>
                  {item.quality && item.quality !== "audio" && (
                    <span>{item.quality}</span>
                  )}
                  {item.downloaded_at && (
                    <span>{formatDate(item.downloaded_at)}</span>
                  )}
                </p>
              </div>

              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rip-open-btn"
                data-testid={`history-open-${idx}`}
                aria-label={`Open source for ${item.title}`}
              >
                <ExternalLink size={13} strokeWidth={2.5} />
                Open
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
