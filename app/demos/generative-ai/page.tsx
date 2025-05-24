'use client'

import { useState } from 'react'
import ClientOnly from '@/app/components/ClientOnly'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Skeleton } from '@/components/ui/skeleton'

export default function GenerativeAIDemo() {
  const [prompt, setPrompt] = useState('')
  const [type, setType] = useState<'text' | 'image'>('text')
  const [temperature, setTemperature] = useState(1)
  const [maxTokens, setMaxTokens] = useState(200)
  const [size, setSize] = useState('1024x1024')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<
    { id: number; type: 'text' | 'image'; prompt: string; result: string }[]
  >([])

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/generative-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          type,
          temperature,
          size,
          negativePrompt,
          maxTokens
        })
      })
      const data = await res.json()
      if (data.error) {
        setResult(`Error: ${data.error}`)
      } else if (type === 'text') {
        setResult(data.text)
        setHistory((h) => [
          { id: Date.now(), type, prompt, result: data.text },
          ...h
        ])
      } else {
        setResult(data.imageUrl)
        setHistory((h) => [
          { id: Date.now(), type, prompt, result: data.imageUrl },
          ...h
        ])
      }
    } catch (err) {
      setResult('Failed to generate.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 grid md:grid-cols-2 gap-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Generative AI Demo</h1>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Enter a prompt to generate text or images using AI.
        </p>
        <Tabs
          defaultValue="text"
          value={type}
          onValueChange={(v) => setType(v as 'text' | 'image')}
        >
          <TabsList className="mb-4">
            <TabsTrigger value="text">Text Generation</TabsTrigger>
            <TabsTrigger value="image">Image Generation</TabsTrigger>
          </TabsList>
          <TabsContent value="text">
            <div className="space-y-4">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt..."
              />
              <div className="space-y-2">
                <label className="text-sm">Temperature: {temperature}</label>
                <Slider
                  min={0}
                  max={1}
                  step={0.1}
                  value={[temperature]}
                  onValueChange={(v) => setTemperature(v[0])}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm">Max Length: {maxTokens}</label>
                <Slider
                  min={50}
                  max={800}
                  step={50}
                  value={[maxTokens]}
                  onValueChange={(v) => setMaxTokens(v[0])}
                />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="image">
            <div className="space-y-4">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image..."
              />
              <Input
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="What to avoid"
              />
              <div>
                <label htmlFor="size" className="text-sm">Size:</label>
                <select
                  id="size"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="border rounded px-2 py-1 ml-2"
                >
                  <option value="1024x1024">1024x1024</option>
                  <option value="1792x1024">1792x1024</option>
                  <option value="1024x1792">1024x1792</option>
                </select>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>

      <div>
        {loading && <Skeleton className="w-full h-48" />}
        {result && type === 'text' && (
          <div className="whitespace-pre-wrap p-4 border rounded bg-gray-100 dark:bg-gray-800">
            {result}
          </div>
        )}
        {result && type === 'image' && typeof result === 'string' && (
          <div className="mt-4">
            <ClientOnly>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result} alt="Generated" className="max-w-full h-auto" />
            </ClientOnly>
          </div>
        )}

        {history.length > 0 && (
          <div className="mt-6">
            <h2 className="font-semibold mb-2">History</h2>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {history.map((h) => (
                <div key={h.id} className="p-2 border rounded">
                  <div className="text-xs mb-1 text-muted-foreground">
                    {h.type.toUpperCase()} - {h.prompt}
                  </div>
                  {h.type === 'text' ? (
                    <div className="text-sm line-clamp-3">{h.result}</div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={h.result} alt="history" className="max-h-32" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
