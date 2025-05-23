'use client'

import { useState } from 'react'
import ClientOnly from '@/app/components/ClientOnly'

export default function GenerativeAIDemo() {
  const [prompt, setPrompt] = useState('')
  const [type, setType] = useState<'text' | 'image'>('text')
  const [temperature, setTemperature] = useState(1)
  const [size, setSize] = useState('1024x1024')
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/generative-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type, temperature, size })
      })
      const data = await res.json()
      if (data.error) {
        setResult(`Error: ${data.error}`)
      } else if (type === 'text') {
        setResult(data.text)
      } else {
        setResult(data.imageUrl)
      }
    } catch (err) {
      setResult('Failed to generate.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">Generative AI Demo</h1>
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        Enter a prompt to generate text or images using AI.
      </p>
      <div className="flex items-center mb-4 space-x-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as 'text' | 'image')}
          className="border rounded px-2 py-1"
        >
          <option value="text">Text</option>
          <option value="image">Image</option>
        </select>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt..."
          className="flex-1 border rounded px-2 py-1"
        />
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-4 py-1 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>
      {type === 'text' && (
        <div className="mb-4 flex items-center space-x-2">
          <label htmlFor="temperature" className="text-sm whitespace-nowrap">
            Temperature:
          </label>
          <input
            id="temperature"
            type="number"
            min={0}
            max={1}
            step={0.1}
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="border rounded px-2 py-1 w-24"
          />
        </div>
      )}
      {type === 'image' && (
        <div className="mb-4 flex items-center space-x-2">
          <label htmlFor="size" className="text-sm whitespace-nowrap">
            Size:
          </label>
          <select
            id="size"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="1024x1024">1024x1024</option>
            <option value="1792x1024">1792x1024</option>
            <option value="1024x1792">1024x1792</option>
          </select>
        </div>
      )}
      {result && type === 'text' && (
        <div className="whitespace-pre-wrap p-4 border rounded bg-gray-100 dark:bg-gray-800">
          {result}
        </div>
      )}
      {result && type === 'image' && typeof result === 'string' && (
        <div className="mt-4">
          {/* ClientOnly wrapper ensures image is only rendered client-side */}
          <ClientOnly>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={result} alt="Generated" className="max-w-full h-auto" />
          </ClientOnly>
        </div>
      )}
    </div>
  )
}
