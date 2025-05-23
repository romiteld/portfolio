"use client";

import { useState } from "react";

export default function EnhancedRAGDemo() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);

  const askQuestion = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer(null);
    setSources(null);

    try {
      const res = await fetch("/api/enhanced-rag-langchain/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (res.ok) {
        const data = await res.json();
        setAnswer(data.answer || "No answer generated.");
        setSources(Array.isArray(data.sources) ? data.sources : null);
      } else {
        setAnswer("Error retrieving answer.");
      }
    } catch (err) {
      console.error(err);
      setAnswer("Error communicating with API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Enhanced RAG Demo</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-300">
        Ask a question and see how LangChain retrieves relevant context before
        answering.
      </p>
      <div className="flex space-x-2">
        <input
          type="text"
          className="flex-1 border rounded px-3 py-2 dark:bg-neutral-800"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter your question"
        />
        <button
          onClick={askQuestion}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {loading ? "Asking..." : "Ask"}
        </button>
      </div>
      {answer && (
        <div className="border rounded p-4 bg-neutral-50 dark:bg-neutral-800 space-y-2">
          <p>{answer}</p>
          {sources && (
            <div>
              <p className="font-semibold">Retrieved Context:</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                {sources.map((src, idx) => (
                  <li key={idx}>{src}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
