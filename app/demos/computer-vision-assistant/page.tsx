"use client"

import { useState, useRef, useCallback } from "react"
import { ArrowLeft, Upload, Camera, Image as ImageIcon, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import "./computerVision.css"

export default function ComputerVisionAssistantPage() {
  const [image, setImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [results, setResults] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImage(event.target?.result as string)
        setResults(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const analyzeImage = useCallback(() => {
    if (!image) return
    
    setIsAnalyzing(true)
    
    // Simulate API call with timeout
    setTimeout(() => {
      // Mock results
      setResults({
        objects: [
          { name: "Person", confidence: 0.98, boundingBox: { x: 120, y: 50, width: 200, height: 350 } },
          { name: "Laptop", confidence: 0.95, boundingBox: { x: 400, y: 200, width: 150, height: 100 } }
        ],
        description: "A person sitting at a desk working on a laptop in what appears to be a home office environment.",
        tags: ["person", "laptop", "desk", "indoor", "office"],
        sentiment: "Neutral",
        colors: ["#2a3b4c", "#a7b8c9", "#d4e5f6"]
      })
      setIsAnalyzing(false)
    }, 2000)
  }, [image])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/demos" className="inline-flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Demos
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-2">Computer Vision Assistant</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Upload an image to analyze its content using advanced AI vision models.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-4">Image Input</h2>
          
          {!image ? (
            <div 
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF up to 10MB</p>
              <input  
                type="file" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                accept="image/*"
                aria-label="Upload image"
              />
            </div>
          ) : (
            <div className="relative">
              <div className="relative aspect-video overflow-hidden rounded-lg mb-4">
                <Image 
                  src={image} 
                  alt="Uploaded image" 
                  fill
                  className="object-contain"
                />
              </div>
              <div className="flex justify-between">
                <button 
                  className="text-red-600 hover:text-red-800 text-sm"
                  onClick={() => setImage(null)}
                >
                  Remove
                </button>
                <button 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                  onClick={analyzeImage}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 inline animate-spin" />
                      Analyzing...
                    </>
                  ) : 'Analyze Image'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
          
          {!image ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <ImageIcon className="mx-auto h-12 w-12 opacity-30" />
              <p className="mt-2">Upload an image to see analysis results</p>
            </div>
          ) : isAnalyzing ? (
            <div className="text-center py-12">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
              <p className="mt-4 text-gray-600 dark:text-gray-300">Analyzing your image...</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">This may take a few moments</p>
            </div>
          ) : results ? (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Description</h3>
                <p className="text-gray-600 dark:text-gray-300">{results.description}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Objects Detected</h3>
                <ul className="space-y-2">
                  {results.objects.map((obj: any, i: number) => (
                    <li key={i} className="flex justify-between items-center">
                      <span>{obj.name}</span>
                      <span className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                        {Math.round(obj.confidence * 100)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {results.tags.map((tag: string, i: number) => (
                    <span key={i} className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>Click "Analyze Image" to process</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">About This Demo</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          This Computer Vision Assistant demonstrates how AI can analyze and interpret visual data. 
          In a production environment, this would connect to advanced vision models like:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300">
          <li>Object detection and recognition</li>
          <li>Scene understanding and description</li>
          <li>Facial recognition and emotion detection</li>
          <li>Text extraction from images (OCR)</li>
          <li>Visual question answering</li>
        </ul>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Note: This is a demonstration with simulated results. In a real implementation, 
          the analysis would be performed by models like GPT-4 Vision, CLIP, or specialized computer vision models.
        </p>
      </div>
    </div>
  )
} 