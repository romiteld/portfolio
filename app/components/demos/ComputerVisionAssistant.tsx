"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Eye, Upload, Image as ImageIcon, Loader2 } from "lucide-react"

export default function ComputerVisionAssistant() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Placeholder analysis results
  const fakePredictions = [
    {
      label: "Mountain landscape",
      confidence: 0.96,
      description: "A scenic mountain range with snow-capped peaks against a clear blue sky."
    },
    {
      label: "Pine trees",
      confidence: 0.91,
      description: "Evergreen pine trees visible in the foreground."
    },
    {
      label: "Lake",
      confidence: 0.85,
      description: "A calm lake reflecting the mountain scenery."
    },
    {
      label: "Outdoor nature scene",
      confidence: 0.98,
      description: "Natural wilderness landscape with no visible human structures."
    }
  ]

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string)
      setAnalysis(null)
      analyzeImage()
    }
    reader.readAsDataURL(file)
  }

  const analyzeImage = () => {
    setIsAnalyzing(true)
    // Simulate API call delay
    setTimeout(() => {
      // Format the fake predictions as a string
      const analysisText = fakePredictions
        .map(pred => `${pred.label} (${(pred.confidence * 100).toFixed(1)}%): ${pred.description}`)
        .join("\n\n")
      
      setAnalysis(analysisText)
      setIsAnalyzing(false)
    }, 2000)
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex flex-col space-y-6 max-w-4xl mx-auto p-6 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-md">
      <div className="flex items-center space-x-2 text-primary-600 dark:text-primary-400">
        <Eye className="w-6 h-6" />
        <h2 className="text-2xl font-bold">Computer Vision Assistant</h2>
      </div>
      
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20" 
            : "border-neutral-300 dark:border-neutral-700"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleChange}
          aria-label="Upload image"
        />
        
        {selectedImage ? (
          <div className="space-y-4">
            <div className="relative max-h-80 overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={selectedImage} 
                alt="Uploaded image" 
                className="mx-auto max-h-80 object-contain"
              />
            </div>
            <button
              onClick={handleButtonClick}
              className="inline-flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors"
              aria-label="Upload different image"
            >
              <Upload className="w-4 h-4 mr-2" />
              <span>Upload different image</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <ImageIcon className="mx-auto h-16 w-16 text-neutral-400" />
            <p className="text-neutral-600 dark:text-neutral-400">
              Drag and drop an image, or click to upload
            </p>
            <button
              onClick={handleButtonClick}
              className="inline-flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors"
              aria-label="Upload image"
            >
              <Upload className="w-4 h-4 mr-2" />
              <span>Upload Image</span>
            </button>
          </div>
        )}
      </div>
      
      {selectedImage && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-neutral-100 dark:bg-neutral-900 rounded-lg p-6"
        >
          <h3 className="text-xl font-semibold mb-4">Analysis Results</h3>
          
          {isAnalyzing ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              <span className="ml-3 text-neutral-600 dark:text-neutral-400">
                Analyzing image...
              </span>
            </div>
          ) : analysis ? (
            <div className="space-y-4">
              <div className="space-y-2">
                {analysis.split("\n\n").map((prediction, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-neutral-800 p-3 rounded-md shadow-sm"
                  >
                    {prediction}
                  </motion.div>
                ))}
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                Note: This is a demo with pre-defined results. In a real implementation, image analysis would be performed by a computer vision model.
              </p>
            </div>
          ) : null}
        </motion.div>
      )}
    </div>
  )
} 