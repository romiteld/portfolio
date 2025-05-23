"use client";

import { useState } from "react";
import DocumentLibrary from "./DocumentLibrary";

export default function EnhancedRAGDemo() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<{ content: string; score: number }[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);

  const askQuestion = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer(null);
    setSources(null);
    setStep(1);
    setTimeout(() => setStep(2), 600);

    try {
      const res = await fetch("/api/enhanced-rag-langchain/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      setStep(3);

      if (res.ok) {
        const data = await res.json();
        setAnswer(data.answer || "No answer generated.");
        setSources(Array.isArray(data.sources) ? data.sources : null);
        setStep(4);
      } else {
        setAnswer("Error retrieving answer.");
      }
    } catch (err) {
      console.error(err);
      setAnswer("Error communicating with API.");
    } finally {
      setLoading(false);
      setTimeout(() => setStep(0), 500);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Enhanced RAG Demo</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-300">
        Ask a question and see how LangChain retrieves relevant context before
        answering.
      </p>
      <DocumentLibrary />
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
      {step > 0 && (
        <div className="flex space-x-2 text-sm">
          <span className={step >= 1 ? "font-semibold" : ""}>Embedding</span>
          <span>→</span>
          <span className={step >= 2 ? "font-semibold" : ""}>Vector search</span>
          <span>→</span>
          <span className={step >= 3 ? "font-semibold" : ""}>Chunk selection</span>
          <span>→</span>
          <span className={step >= 4 ? "font-semibold" : ""}>Answer</span>
        </div>
      )}
      {answer && (
        <div className="border rounded p-4 bg-neutral-50 dark:bg-neutral-800 space-y-2">
          <p>{answer}</p>
          {sources && (
            <div>
              <p className="font-semibold">Retrieved Context:</p>
              <ul className="space-y-2">
                {sources.map((src: any, idx) => (
                  <li key={idx} className="border rounded p-2 text-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        Similarity: {(src.score * 100).toFixed(1)}%
                      </span>
                      {src.metadata?.title && (
                        <span className="text-xs text-neutral-500">
                          From: {src.metadata.title}
                        </span>
                      )}
                    </div>
                    <p className="text-neutral-700 dark:text-neutral-300">{src.content}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
