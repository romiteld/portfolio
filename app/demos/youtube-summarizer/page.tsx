"use client";

import { useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function YouTubeSummarizerPage() {
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");

  const handleSummarize = async () => {
    if (!videoUrl) return;
    setLoading(true);
    setError("");
    setSummary("");
    try {
      const res = await fetch("/api/youtube/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl })
      });
      const data = await res.json();
      if (res.ok) {
        setSummary(data.summary);
      } else {
        setError(data.error || "Failed to summarize video");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to summarize video");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">YouTube Summarizer &amp; Insights</h1>
      <input
        type="text"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        placeholder="Enter YouTube video URL"
        className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent mb-4"
      />
      <button
        onClick={handleSummarize}
        disabled={loading}
        className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
      >
        {loading ? <LoadingSpinner size="small" /> : "Summarize"}
      </button>
      {error && <p className="text-red-500 mt-4">{error}</p>}
      {summary && (
        <pre className="whitespace-pre-wrap mt-4 bg-gray-100 dark:bg-gray-800 p-4 rounded">
          {summary}
        </pre>
      )}
    </div>
  );
}
