"use client";

import { useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function YouTubeSummarizerPage() {
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [insights, setInsights] = useState<string[]>([]);
  const [info, setInfo] = useState<any>(null);
  const [error, setError] = useState("");

  const handleSummarize = async () => {
    if (!videoUrl) return;
    setLoading(true);
    setError("");
    setSummary("");
    setInsights([]);
    setInfo(null);
    try {
      const res = await fetch("/api/youtube/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl })
      });
      const data = await res.json();
      if (res.ok) {
        setSummary(data.summary);
        setInsights(data.insights || []);
        setInfo(data.info || null);
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
      {info && (
        <div className="flex items-start mt-6">
          {info.thumbnail_url && (
            <img
              src={info.thumbnail_url}
              alt={info.title}
              className="w-40 h-24 object-cover mr-4 rounded"
            />
          )}
          <div>
            <h2 className="text-lg font-semibold">{info.title}</h2>
            {info.author_name && (
              <p className="text-sm text-gray-500">by {info.author_name}</p>
            )}
          </div>
        </div>
      )}
      {summary && (
        <div className="mt-4 bg-gray-100 dark:bg-gray-800 p-4 rounded">
          <p className="whitespace-pre-wrap">{summary}</p>
          {insights.length > 0 && (
            <ul className="list-disc list-inside mt-4">
              {insights.map((insight, idx) => (
                <li key={idx}>{insight}</li>
              ))}
            </ul>
          )}
          <button
            className="mt-2 text-sm text-blue-600 hover:underline"
            onClick={() => navigator.clipboard.writeText(summary)}
          >
            Copy Summary
          </button>
        </div>
      )}
    </div>
  );
}
