import axios from "axios";

const BASE = (process.env.REACT_APP_BACKEND_URL || "http://localhost:8001") + "/api";

const api = axios.create({ baseURL: BASE, timeout: 60000 });

/**
 * Fetch video/audio metadata for a given URL.
 * @param {string} url - The social media URL to look up
 * @returns {Promise<Object>} Video info object
 */
export const fetchInfo = (url) =>
  api.post("/info", { url }).then((r) => r.data);

/**
 * Build the streaming download URL for a media item.
 * @param {string} url - Source URL
 * @param {"mp4"|"mp3"} format
 * @param {"360p"|"720p"|"1080p"|"audio"} quality
 * @returns {string} Full download URL
 */
export const buildDownloadUrl = (url, format, quality) => {
  const params = new URLSearchParams({ url, format, quality });
  return `${BASE}/download?${params.toString()}`;
};

/**
 * Save a history item to the server.
 * Non-blocking — errors are swallowed intentionally.
 */
export const saveHistoryRemote = async (item) => {
  try {
    await api.post("/history", item);
  } catch (_) {
    // best-effort
  }
};

/**
 * Fetch all history items from server.
 * @returns {Promise<Array>}
 */
export const getHistoryRemote = () =>
  api.get("/history").then((r) => r.data).catch(() => []);

/**
 * Clear all history on server.
 * @returns {Promise<void>}
 */
export const clearHistoryRemote = () =>
  api.delete("/history").catch(() => {});
