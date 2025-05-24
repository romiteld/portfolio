"use client";

import { useState, useEffect } from "react";
import { FileText, File, Upload, Trash2 } from "lucide-react";

interface Doc {
  id: string;
  title: string;
  content: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

const defaultDocs = [
  {
    title: "LangChain Introduction",
    content: "LangChain is a framework for building applications with language models. It provides tools and abstractions to work with LLMs, manage prompts, chain multiple calls together, and integrate with external data sources."
  },
  {
    title: "RAG Overview",
    content: "Retrieval-augmented generation (RAG) combines information retrieval with text generation. It enhances LLM responses by first retrieving relevant information from a knowledge base, then using that context to generate more accurate and grounded answers."
  },
  {
    title: "Vector Embeddings",
    content: "Vector embeddings are numerical representations of text that capture semantic meaning. Similar texts have similar embeddings, enabling semantic search. This demo now uses Supabase with pgvector for efficient vector similarity search."
  }
];

export default function DocumentLibrary() {
  const [query, setQuery] = useState("");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadContent, setUploadContent] = useState("");
  const [showUploadForm, setShowUploadForm] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/enhanced-rag-langchain/documents");
      if (res.ok) {
        const data = await res.json();
        setDocs(data.documents);
        
        // If no documents exist, upload the default ones
        if (data.documents.length === 0) {
          await uploadDefaultDocuments();
        }
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const uploadDefaultDocuments = async () => {
    for (const doc of defaultDocs) {
      await uploadDocument(doc.title, doc.content, { type: "default" });
    }
    await fetchDocuments();
  };

  const uploadDocument = async (title: string, content: string, metadata?: any) => {
    try {
      const res = await fetch("/api/enhanced-rag-langchain/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, metadata }),
      });
      
      if (!res.ok) {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      throw error;
    }
  };

  const handleUpload = async () => {
    if (!uploadTitle.trim() || !uploadContent.trim()) return;
    
    setUploading(true);
    try {
      await uploadDocument(uploadTitle, uploadContent, { type: "user" });
      await fetchDocuments();
      setUploadTitle("");
      setUploadContent("");
      setShowUploadForm(false);
    } catch (error) {
      alert("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    
    try {
      const res = await fetch(`/api/enhanced-rag-langchain/documents?id=${id}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        await fetchDocuments();
      }
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const filtered = docs.filter((d) =>
    d.title.toLowerCase().includes(query.toLowerCase()) ||
    d.content.toLowerCase().includes(query.toLowerCase())
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="border rounded p-4 space-y-3 bg-neutral-50 dark:bg-neutral-900">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Document Library</h2>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
        >
          <Upload className="w-4 h-4" />
          Upload
        </button>
      </div>
      
      {showUploadForm && (
        <div className="border rounded p-3 space-y-2 bg-white dark:bg-neutral-800">
          <input
            type="text"
            value={uploadTitle}
            onChange={(e) => setUploadTitle(e.target.value)}
            placeholder="Document title"
            className="w-full border rounded px-2 py-1 dark:bg-neutral-900"
          />
          <textarea
            value={uploadContent}
            onChange={(e) => setUploadContent(e.target.value)}
            placeholder="Document content"
            rows={4}
            className="w-full border rounded px-2 py-1 dark:bg-neutral-900"
          />
          <div className="flex gap-2">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Add Document"}
            </button>
            <button
              onClick={() => {
                setShowUploadForm(false);
                setUploadTitle("");
                setUploadContent("");
              }}
              className="px-3 py-1 bg-gray-600 text-white rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search documents"
        className="w-full border rounded px-2 py-1 dark:bg-neutral-800"
      />
      
      {loading ? (
        <p className="text-sm text-neutral-500">Loading documents...</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {filtered.length === 0 ? (
            <li className="text-neutral-500">No documents found</li>
          ) : (
            filtered.map((doc) => (
              <li key={doc.id} className="flex items-center space-x-2 group hover:bg-neutral-100 dark:hover:bg-neutral-800 p-2 rounded">
                <FileText className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate relative">
                    {doc.title}
                    <span className="absolute left-0 top-full mt-1 z-10 hidden group-hover:block p-2 rounded bg-white dark:bg-neutral-700 shadow text-xs w-64 max-h-32 overflow-y-auto">
                      {doc.content}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-500">
                    {formatDate(doc.created_at)}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                  title="Delete document"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
