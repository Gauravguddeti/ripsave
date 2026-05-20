import React from "react";

const DEFAULT_STEPS = ["360p", "720p", "1080p"];

/**
 * BrutalistSlider
 * @param {string}   quality       - Currently selected value (must be in steps[])
 * @param {Function} onChange      - Called with new value when step changes
 * @param {string[]} steps         - Array of step values e.g. ["360p","720p","1080p"] or ["128k","192k","320k"]
 * @param {Object}   labels        - Optional map of value → display label e.g. {"128k": "128 kbps"}
 * @param {string}   testIdPrefix  - Prefix for data-testid on step buttons (default: "quality-step")
 */
export default function BrutalistSlider({
  quality,
  onChange,
  steps = DEFAULT_STEPS,
  labels = {},
  testIdPrefix = "quality-step",
}) {
  const idx = Math.max(0, steps.indexOf(quality));
  const pct = steps.length > 1 ? (idx / (steps.length - 1)) * 100 : 100;

  const handleSliderChange = (e) => {
    onChange(steps[parseInt(e.target.value, 10)]);
  };

  return (
    <div className="slider-container" aria-label="Quality slider">
      <div className="slider-track-wrap">
        <div
          className="slider-fill"
          style={{ width: `${pct}%` }}
          aria-hidden="true"
        />
        <input
          type="range"
          min={0}
          max={steps.length - 1}
          step={1}
          value={idx}
          onChange={handleSliderChange}
          className="brutalist-slider"
          data-testid="quality-slider"
          aria-label="Quality selector"
          aria-valuetext={labels[quality] || quality}
        />
      </div>

      {/* Step labels */}
      <div className="slider-labels" role="group" aria-label="Quality presets">
        {steps.map((step) => (
          <button
            key={step}
            type="button"
            className={`slider-label-btn ${quality === step ? "active" : ""}`}
            onClick={() => onChange(step)}
            data-testid={`${testIdPrefix}-${step}`}
            aria-pressed={quality === step}
          >
            {labels[step] || step}
          </button>
        ))}
      </div>
    </div>
  );
}
