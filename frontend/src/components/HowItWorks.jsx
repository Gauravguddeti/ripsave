import React from "react";

const HOW_STEPS = [
  {
    number: "01",
    title: "Paste",
    desc: "Copy any link from YouTube, TikTok, Instagram, Twitter/X, Facebook, or 1000+ other sites. Paste it in the box above.",
  },
  {
    number: "02",
    title: "Pick",
    desc: "Choose between MP4 video or MP3 audio. Select your preferred quality: 360p, 720p, or crystal-clear 1080p.",
  },
  {
    number: "03",
    title: "Press",
    desc: "Hit the Download button. Your file streams straight to your device — no account needed, no ads, no waiting.",
  },
];

export default function HowItWorks({ sectionRef }) {
  return (
    <section className="how-it-works" ref={sectionRef} id="how-it-works" aria-label="How it works">
      <h2 className="section-heading">How It Works</h2>
      <div className="how-cards">
        {HOW_STEPS.map((step) => (
          <div className="how-card" key={step.number}>
            <span className="how-number">{step.number}</span>
            <h3 className="how-title">{step.title}</h3>
            <p className="how-desc">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
