"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

function extractVideoId(url: string): string | null {
  const regExp = /(?:v=|youtu\.be\/|\/embed\/)([\w-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

export default function YouTubeSummarizerPage() {
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [insights, setInsights] = useState<string[]>([]);
  const [info, setInfo] = useState<any>(null);
  const [error, setError] = useState("");
  const [length, setLength] = useState("standard");
  const [style, setStyle] = useState("paragraph");

  useEffect(() => {
    if (!videoUrl) {
      setInfo(null);
      return;
    }
    const controller = new AbortController();
    fetch(`/api/youtube/info?videoUrl=${encodeURIComponent(videoUrl)}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setInfo(data))
      .catch((err) => {
        if (err.name !== "AbortError") console.error(err);
      });
    return () => controller.abort();
  }, [videoUrl]);

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
        body: JSON.stringify({ videoUrl, length, style })
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
      <div className="flex gap-4 mb-4">
        <Select value={length} onValueChange={setLength}>
          <SelectTrigger className="w-1/2">
            <SelectValue placeholder="Length" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="quick">Quick</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="detailed">Detailed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={style} onValueChange={setStyle}>
          <SelectTrigger className="w-1/2">
            <SelectValue placeholder="Style" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="paragraph">Paragraph</SelectItem>
            <SelectItem value="bullets">Bullets</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <button
        onClick={handleSummarize}
        disabled={loading}
        className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
      >
        {loading ? <LoadingSpinner size="small" /> : "Summarize"}
      </button>
      {error && <p className="text-red-500 mt-4">{error}</p>}
      {info && (
        <div className="mt-6 flex flex-col items-start gap-4">
          <div className="flex items-start">
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
          {videoUrl && (
            <iframe
              src={`https://www.youtube.com/embed/${extractVideoId(videoUrl)}`}
              className="w-full aspect-video rounded"
              allowFullScreen
            />
          )}
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
