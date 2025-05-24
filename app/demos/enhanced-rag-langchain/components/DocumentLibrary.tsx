"use client";

import { useState } from "react";
import { FileText, File } from "lucide-react";

interface Doc {
  id: number;
  name: string;
  type: string;
  size: number; // KB
  date: string;
  content: string;
}

const docs: Doc[] = [
  {
    id: 1,
    name: "LangChain Intro.txt",
    type: "txt",
    size: 1,
    date: "2024-05-18",
    content: "LangChain is a framework for building applications with language models."
  },
  {
    id: 2,
    name: "RAG Overview.txt",
    type: "txt",
    size: 1,
    date: "2024-05-18",
    content: "Retrieval-augmented generation (RAG) combines information retrieval with text generation."
  },
  {
    id: 3,
    name: "Demo Info.txt",
    type: "txt",
    size: 1,
    date: "2024-05-18",
    content: "This demo uses an in-memory vector store with OpenAI embeddings."
  }
];

export default function DocumentLibrary() {
  const [query, setQuery] = useState(""");

  const filtered = docs.filter((d) =>
    d.name.toLowerCase().includes(query.toLowerCase()) ||
    d.content.toLowerCase().includes(query.toLowerCase())
  );

  const iconForType = (type: string) => {
    switch (type) {
      case "txt":
      case "md":
        return <FileText className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  return (
    <div className="border rounded p-4 space-y-3 bg-neutral-50 dark:bg-neutral-900">
      <h2 className="text-lg font-semibold">Document Library</h2>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search documents"
        className="w-full border rounded px-2 py-1 dark:bg-neutral-800"
      />
      <ul className="space-y-2 text-sm">
        {filtered.map((doc) => (
          <li key={doc.id} className="flex items-center space-x-2 group">
            {iconForType(doc.type)}
            <span className="font-medium relative">
              {doc.name}
              <span className="absolute left-0 top-full mt-1 z-10 hidden group-hover:block p-2 rounded bg-white dark:bg-neutral-700 shadow text-xs w-48">
                {doc.content}
              </span>
            </span>
            <span className="text-neutral-500 text-xs">{doc.size}KB</span>
            <span className="ml-auto text-neutral-500 text-xs">{doc.date}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
