import React, { useState, useEffect, useRef, useCallback } from "react";
import { Toaster, toast } from "sonner";
import "./index.css";

import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import UrlInputCard from "./components/UrlInputCard";
import MediaCard from "./components/MediaCard";
import DownloadCard from "./components/DownloadCard";
import HowItWorks from "./components/HowItWorks";
import RecentRips from "./components/RecentRips";
import Footer from "./components/Footer";

import { fetchInfo, saveHistoryRemote, getHistoryRemote, clearHistoryRemote } from "./api/ripsave";

// ---------------------------------------------------------------------------
// localStorage helpers (max 20 items)
// ---------------------------------------------------------------------------

const LS_KEY = "ripsave_history";

function loadLocalHistory() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocalHistory(items) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items.slice(0, 20)));
  } catch {}
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const [url, setUrl] = useState("");
  const [videoInfo, setVideoInfo] = useState(null);
  const [format, setFormat] = useState("mp4");
  const [quality, setQuality] = useState("1080p");
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState(loadLocalHistory);

  const howItWorksRef = useRef(null);

  // Sync remote history on mount (best-effort)
  useEffect(() => {
    getHistoryRemote().then((remote) => {
      if (remote && remote.length > 0) {
        const merged = mergeHistory(loadLocalHistory(), remote);
        setHistory(merged);
        saveLocalHistory(merged);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------------------------------------------------------------
  // Handle Web Share Target — when user shares a URL to the app from
  // their phone's share sheet, the URL is passed as a query parameter.
  // Auto-fill and auto-fetch immediately.
  // -------------------------------------------------------------------------
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // manifest share_target sends: ?url=...&text=...&title=...
    const sharedUrl = params.get("url") || params.get("text");

    if (sharedUrl) {
      const cleaned = sharedUrl.trim();
      if (/^https?:\/\//i.test(cleaned)) {
        setUrl(cleaned);
        // Clean the URL bar so refreshing doesn't re-trigger
        window.history.replaceState({}, document.title, "/");
        // Auto-fetch after state is set
        setTimeout(() => handleFetch(cleaned), 100);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function mergeHistory(local, remote) {
    const seen = new Set(local.map((i) => i.url + i.downloaded_at));
    const merged = [...local];
    for (const item of remote) {
      const key = item.url + item.downloaded_at;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    }
    return merged.sort((a, b) =>
      (b.downloaded_at || "").localeCompare(a.downloaded_at || "")
    );
  }

  // Handle fetch
  const handleFetch = useCallback(async (inputUrl) => {
    setIsLoading(true);
    setVideoInfo(null);

    try {
      const info = await fetchInfo(inputUrl);
      setVideoInfo(info);

      // Auto-select highest available quality
      const quals = info.available_qualities ?? ["360p", "720p", "1080p"];
      setQuality(quals[quals.length - 1]);
      setFormat("mp4");

      toast.success("Loaded! Pick a quality and download.");
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to fetch video info.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle download event from DownloadCard
  const handleDownload = useCallback(
    (fmt, qual) => {
      if (!videoInfo) return;

      const item = {
        url: videoInfo.webpage_url || url,
        title: videoInfo.title,
        thumbnail: videoInfo.thumbnail,
        format: fmt,
        quality: qual,
        downloaded_at: new Date().toISOString(),
      };

      // Update localStorage
      const updated = [item, ...history].slice(0, 20);
      setHistory(updated);
      saveLocalHistory(updated);

      // Best-effort server save (non-blocking)
      saveHistoryRemote({
        url: item.url,
        title: item.title,
        thumbnail: item.thumbnail,
        format: fmt,
        quality: qual,
      });
    },
    [videoInfo, url, history]
  );

  // Clear history
  const handleClearHistory = useCallback(() => {
    setHistory([]);
    saveLocalHistory([]);
    clearHistoryRemote();
    toast.success("History cleared.");
  }, []);

  // Scroll to How it works
  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#0a0a0a",
            color: "#fff",
            border: "2px solid #0a0a0a",
            borderRadius: 0,
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontWeight: 600,
            fontSize: "0.875rem",
          },
        }}
      />

      <div className="app">
        <Header onHowItWorksClick={scrollToHowItWorks} />
        <HeroSection />
        <UrlInputCard
          url={url}
          setUrl={setUrl}
          onFetch={handleFetch}
          isLoading={isLoading}
        />

        {/* Result section */}
        {videoInfo && (
          <section
            className="result-section"
            aria-label="Download options"
            data-testid="result-section"
          >
            <div className="result-grid">
              <MediaCard info={videoInfo} />
              <DownloadCard
                info={videoInfo}
                format={format}
                setFormat={setFormat}
                quality={quality}
                setQuality={setQuality}
                onDownload={handleDownload}
              />
            </div>
          </section>
        )}

        <HowItWorks sectionRef={howItWorksRef} />
        <RecentRips history={history} onClear={handleClearHistory} />
        <Footer />
      </div>
    </>
  );
}
