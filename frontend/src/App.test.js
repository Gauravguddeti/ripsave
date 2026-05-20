import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

// Mock axios/api before importing App
jest.mock("./api/ripsave", () => ({
  fetchInfo: jest.fn(),
  buildDownloadUrl: jest.fn(() => "http://test/api/download?url=test"),
  saveHistoryRemote: jest.fn(),
  getHistoryRemote: jest.fn(),
  clearHistoryRemote: jest.fn(),
}));

// Mock sonner
jest.mock("sonner", () => ({
  Toaster: () => null,
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

import App from "./App";
import { fetchInfo, getHistoryRemote, clearHistoryRemote, buildDownloadUrl, saveHistoryRemote } from "./api/ripsave";

// Mock clipboard
Object.assign(navigator, {
  clipboard: {
    readText: jest.fn(() => Promise.resolve("https://www.youtube.com/watch?v=test")),
    writeText: jest.fn(),
  },
});

// Set default mock implementations before each test
beforeEach(() => {
  jest.clearAllMocks();
  // Re-apply mock implementations after clear
  getHistoryRemote.mockResolvedValue([]);
  clearHistoryRemote.mockResolvedValue(undefined);
  saveHistoryRemote.mockResolvedValue(undefined);
  buildDownloadUrl.mockReturnValue("http://test/api/download?url=test");
  navigator.clipboard.readText.mockResolvedValue("https://www.youtube.com/watch?v=test");
});

const MOCK_INFO = {
  id: "test123",
  title: "Test Video Title — Sample",
  thumbnail: "https://i.ytimg.com/vi/test/hqdefault.jpg",
  duration: 245,
  uploader: "Test Channel",
  webpage_url: "https://www.youtube.com/watch?v=test",
  extractor: "youtube",
  available_qualities: ["360p", "720p", "1080p"],
  is_audio_supported: true,
};

// -----------------------------------------------------------------------
// 1. Hero section loads
// -----------------------------------------------------------------------
test("hero section renders headline", () => {
  render(<App />);
  expect(screen.getByText("RIP.")).toBeInTheDocument();
  expect(screen.getByText("SAVE.")).toBeInTheDocument();
  expect(screen.getByText("SHARE.")).toBeInTheDocument();
});

// -----------------------------------------------------------------------
// 2. URL input renders with correct testids
// -----------------------------------------------------------------------
test("url input and buttons render", () => {
  render(<App />);
  expect(screen.getByTestId("url-input")).toBeInTheDocument();
  expect(screen.getByTestId("paste-button")).toBeInTheDocument();
  expect(screen.getByTestId("fetch-button")).toBeInTheDocument();
});

// -----------------------------------------------------------------------
// 3. Paste button reads clipboard
// -----------------------------------------------------------------------
test("paste button fills input from clipboard", async () => {
  render(<App />);
  const pasteBtn = screen.getByTestId("paste-button");
  await act(async () => {
    fireEvent.click(pasteBtn);
  });
  await waitFor(() => {
    expect(screen.getByTestId("url-input")).toHaveValue(
      "https://www.youtube.com/watch?v=test"
    );
  });
});

// -----------------------------------------------------------------------
// 4. Fetch flow shows result section
// -----------------------------------------------------------------------
test("fetch shows result section with media info", async () => {
  fetchInfo.mockResolvedValueOnce(MOCK_INFO);
  render(<App />);

  // Set URL and submit
  await userEvent.type(screen.getByTestId("url-input"), "https://www.youtube.com/watch?v=test");
  await act(async () => {
    fireEvent.click(screen.getByTestId("fetch-button"));
  });

  await waitFor(() => {
    expect(screen.getByTestId("result-section")).toBeInTheDocument();
  });

  // Title should appear
  expect(screen.getByText(/Test Video Title/i)).toBeInTheDocument();
});

// -----------------------------------------------------------------------
// 5. MP3 toggle hides quality slider
// -----------------------------------------------------------------------
test("MP3 toggle hides quality slider", async () => {
  fetchInfo.mockResolvedValueOnce(MOCK_INFO);
  render(<App />);

  await userEvent.type(screen.getByTestId("url-input"), "https://www.youtube.com/watch?v=test");
  await act(async () => {
    fireEvent.click(screen.getByTestId("fetch-button"));
  });

  await waitFor(() => {
    expect(screen.getByTestId("result-section")).toBeInTheDocument();
  });

  // MP4 is default — slider should be visible
  expect(screen.getByTestId("quality-slider")).toBeInTheDocument();

  // Switch to MP3
  fireEvent.click(screen.getByTestId("format-toggle-mp3"));

  // Slider should disappear
  expect(screen.queryByTestId("quality-slider")).not.toBeInTheDocument();
});

// -----------------------------------------------------------------------
// 6. MP4 toggle shows quality slider
// -----------------------------------------------------------------------
test("MP4 toggle shows quality slider", async () => {
  fetchInfo.mockResolvedValueOnce(MOCK_INFO);
  render(<App />);

  await userEvent.type(screen.getByTestId("url-input"), "https://www.youtube.com/watch?v=test");
  await act(async () => {
    fireEvent.click(screen.getByTestId("fetch-button"));
  });

  await waitFor(() => screen.getByTestId("result-section"));

  // Switch to MP3 then back to MP4
  fireEvent.click(screen.getByTestId("format-toggle-mp3"));
  fireEvent.click(screen.getByTestId("format-toggle-mp4"));
  expect(screen.getByTestId("quality-slider")).toBeInTheDocument();
});

// -----------------------------------------------------------------------
// 7. Quality step labels update selected quality
// -----------------------------------------------------------------------
test("clicking quality step label updates selected quality display", async () => {
  fetchInfo.mockResolvedValueOnce(MOCK_INFO);
  render(<App />);

  await userEvent.type(screen.getByTestId("url-input"), "https://www.youtube.com/watch?v=test");
  await act(async () => {
    fireEvent.click(screen.getByTestId("fetch-button"));
  });

  await waitFor(() => screen.getByTestId("result-section"));

  // Click 360p label
  fireEvent.click(screen.getByTestId("quality-step-360p"));
  await waitFor(() => {
    expect(screen.getByTestId("selected-quality")).toHaveTextContent("360p");
  });

  // Click 1080p label
  fireEvent.click(screen.getByTestId("quality-step-1080p"));
  await waitFor(() => {
    expect(screen.getByTestId("selected-quality")).toHaveTextContent("1080p");
  });
});

// -----------------------------------------------------------------------
// 8. Download button adds history entry
// -----------------------------------------------------------------------
test("download button adds item to recent rips", async () => {
  fetchInfo.mockResolvedValueOnce(MOCK_INFO);
  render(<App />);

  await userEvent.type(screen.getByTestId("url-input"), "https://www.youtube.com/watch?v=test");
  await act(async () => {
    fireEvent.click(screen.getByTestId("fetch-button"));
  });

  await waitFor(() => screen.getByTestId("result-section"));

  // Click download
  await act(async () => {
    fireEvent.click(screen.getByTestId("download-button"));
  });

  // History should show the item
  await waitFor(() => {
    expect(screen.getByTestId("history-item-0")).toBeInTheDocument();
  });
});

// -----------------------------------------------------------------------
// 9. Clear history button works
// -----------------------------------------------------------------------
test("clear history button removes all items", async () => {
  fetchInfo.mockResolvedValueOnce(MOCK_INFO);
  render(<App />);

  await userEvent.type(screen.getByTestId("url-input"), "https://www.youtube.com/watch?v=test");
  await act(async () => {
    fireEvent.click(screen.getByTestId("fetch-button"));
  });

  await waitFor(() => screen.getByTestId("result-section"));

  // Add item to history
  await act(async () => {
    fireEvent.click(screen.getByTestId("download-button"));
  });

  await waitFor(() => screen.getByTestId("clear-history-button"));

  // Clear
  fireEvent.click(screen.getByTestId("clear-history-button"));

  await waitFor(() => {
    expect(screen.queryByTestId("history-item-0")).not.toBeInTheDocument();
  });
});
