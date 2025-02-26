"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  PlayIcon, 
  PauseIcon, 
  SkipForwardIcon, 
  SkipBackIcon, 
  VolumeIcon, 
  Volume2Icon, 
  Volume1Icon, 
  VolumeXIcon,
  LoaderIcon,
  Wand2Icon
} from "lucide-react"

// Types for different voice options
type VoiceGender = "male" | "female"
type VoiceStyle = "neutral" | "cheerful" | "serious" | "professional"
type VoiceAccent = "american" | "british" | "australian" | "indian"

interface Voice {
  id: string
  name: string
  gender: VoiceGender
  style: VoiceStyle
  accent: VoiceAccent
}

// Sample voice options
const voices: Voice[] = [
  { id: "v1", name: "Michael", gender: "male", style: "professional", accent: "american" },
  { id: "v2", name: "Emma", gender: "female", style: "neutral", accent: "british" },
  { id: "v3", name: "James", gender: "male", style: "serious", accent: "british" },
  { id: "v4", name: "Sarah", gender: "female", style: "cheerful", accent: "american" },
  { id: "v5", name: "Alex", gender: "male", style: "neutral", accent: "australian" },
  { id: "v6", name: "Priya", gender: "female", style: "professional", accent: "indian" },
]

// Sample presets for quick prompts
const presetTexts = [
  "Welcome to our product showcase! Today, I'm excited to introduce our latest innovation.",
  "Breaking news: Scientists have made a groundbreaking discovery in renewable energy technology.",
  "Once upon a time, in a land far away, there lived a wise old wizard who guarded a powerful secret.",
  "Thank you for calling customer support. Your call is important to us. Please stay on the line.",
  "The weather forecast for today shows sunny skies with a high of 75 degrees and a gentle breeze.",
]

export default function TextToAudioGenerator() {
  const [inputText, setInputText] = useState("")
  const [selectedVoice, setSelectedVoice] = useState<Voice>(voices[0])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioGenerated, setAudioGenerated] = useState(false)
  const [volume, setVolume] = useState(75)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState(1)

  // Generate audio (simulation)
  const handleGenerateAudio = () => {
    if (!inputText.trim()) return
    
    setIsGenerating(true)
    
    // Simulate audio generation delay
    setTimeout(() => {
      // Calculate a realistic duration based on word count
      // Average speaking rate is about 150 words per minute
      const wordCount = inputText.split(/\s+/).length
      const calculatedDuration = Math.max(3, Math.min(30, (wordCount / 150) * 60))
      
      setDuration(calculatedDuration)
      setCurrentTime(0)
      setIsGenerating(false)
      setAudioGenerated(true)
    }, 2000)
  }

  // Toggle play/pause
  const togglePlayPause = () => {
    if (!audioGenerated) return
    setIsPlaying(!isPlaying)
  }

  // Calculate progress percentage for the audio progress bar
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0
  
  // Update progress bar while playing (simulation)
  if (isPlaying && audioGenerated) {
    setTimeout(() => {
      if (currentTime < duration) {
        setCurrentTime(prev => Math.min(prev + 0.1, duration))
      } else {
        setIsPlaying(false)
        setCurrentTime(0)
      }
    }, 100 / speed)
  }

  // Handle seeking in the audio progress bar
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioGenerated) return
    const seekTime = parseFloat(e.target.value)
    setCurrentTime(seekTime)
  }

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseInt(e.target.value))
  }
  
  // Choose a preset text
  const handlePresetClick = (text: string) => {
    setInputText(text)
  }
  
  // Skip forward 5 seconds
  const handleSkipForward = () => {
    if (!audioGenerated) return
    setCurrentTime(prev => Math.min(prev + 5, duration))
  }
  
  // Skip backward 5 seconds
  const handleSkipBackward = () => {
    if (!audioGenerated) return
    setCurrentTime(prev => Math.max(prev - 5, 0))
  }
  
  // Format time in MM:SS
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60)
    const seconds = Math.floor(timeInSeconds % 60)
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
  }
  
  // Function to get volume icon based on volume level
  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeXIcon size={18} />
    if (volume < 33) return <VolumeIcon size={18} />
    if (volume < 66) return <Volume1Icon size={18} />
    return <Volume2Icon size={18} />
  }
  
  // Change playback speed
  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed)
  }

  return (
    <div className="p-6 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-md">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Wand2Icon className="mr-2 text-primary-500" size={20} />
          Text-to-Speech Generator
        </h3>
        
        {/* Text input */}
        <div className="mb-4">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter the text you want to convert to speech..."
            className="w-full p-3 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-neutral-700 resize-none h-32"
            disabled={isGenerating}
          />
          
          {/* Character count */}
          <div className="text-xs text-right mt-1 text-neutral-500 dark:text-neutral-400">
            {inputText.length} characters
          </div>
        </div>
        
        {/* Preset options */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Try these examples:</h4>
          <div className="flex flex-wrap gap-2">
            {presetTexts.map((text, index) => (
              <button
                key={index}
                onClick={() => handlePresetClick(text)}
                className="text-xs bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 px-3 py-1 rounded-full"
              >
                {text.substring(0, 25)}...
              </button>
            ))}
          </div>
        </div>
        
        {/* Voice selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select a voice:</label>
            <select
              value={selectedVoice.id}
              onChange={(e) => {
                const voice = voices.find(v => v.id === e.target.value)
                if (voice) setSelectedVoice(voice)
              }}
              className="w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-neutral-700"
              disabled={isGenerating}
              aria-label="Select voice"
              id="voice-select"
            >
              {voices.map(voice => (
                <option key={voice.id} value={voice.id}>
                  {voice.name} ({voice.accent}, {voice.style})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Speech Rate:</label>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => handleSpeedChange(0.5)} 
                className={`px-2 py-1 rounded-md text-xs ${speed === 0.5 ? 'bg-primary-500 text-white' : 'bg-neutral-200 dark:bg-neutral-700'}`}
              >
                0.5x
              </button>
              <button 
                onClick={() => handleSpeedChange(0.75)} 
                className={`px-2 py-1 rounded-md text-xs ${speed === 0.75 ? 'bg-primary-500 text-white' : 'bg-neutral-200 dark:bg-neutral-700'}`}
              >
                0.75x
              </button>
              <button 
                onClick={() => handleSpeedChange(1)} 
                className={`px-2 py-1 rounded-md text-xs ${speed === 1 ? 'bg-primary-500 text-white' : 'bg-neutral-200 dark:bg-neutral-700'}`}
              >
                1x
              </button>
              <button 
                onClick={() => handleSpeedChange(1.5)} 
                className={`px-2 py-1 rounded-md text-xs ${speed === 1.5 ? 'bg-primary-500 text-white' : 'bg-neutral-200 dark:bg-neutral-700'}`}
              >
                1.5x
              </button>
              <button 
                onClick={() => handleSpeedChange(2)} 
                className={`px-2 py-1 rounded-md text-xs ${speed === 2 ? 'bg-primary-500 text-white' : 'bg-neutral-200 dark:bg-neutral-700'}`}
              >
                2x
              </button>
            </div>
          </div>
        </div>
        
        {/* Generate button */}
        <button
          onClick={handleGenerateAudio}
          disabled={isGenerating || !inputText.trim()}
          className="w-full bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isGenerating ? (
            <>
              <LoaderIcon className="animate-spin mr-2" size={20} />
              Generating Audio...
            </>
          ) : (
            <>
              <Wand2Icon className="mr-2" size={20} />
              Generate Audio with {selectedVoice.name}
            </>
          )}
        </button>
      </div>
      
      {/* Audio player */}
      <div className={`bg-neutral-100 dark:bg-neutral-900 rounded-lg p-4 transition-opacity duration-300 ${audioGenerated ? 'opacity-100' : 'opacity-50'}`}>
        <div className="flex flex-col space-y-4">
          {/* Voice info */}
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium">Voice:</span> {selectedVoice.name}
            </div>
            <div className="text-sm">
              <span className="font-medium">Style:</span> {selectedVoice.style}
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="relative w-full">
            <input
              type="range"
              min={0}
              max={duration}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              disabled={!audioGenerated}
              className="w-full h-2 bg-neutral-300 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
              aria-label="Audio position"
            />
            
            {/* Time indicators */}
            <div className="flex justify-between text-xs mt-1 text-neutral-500 dark:text-neutral-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Volume control */}
              <div className="flex items-center space-x-1">
                <button 
                  onClick={() => setVolume(volume === 0 ? 75 : 0)}
                  className="text-neutral-500 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400"
                  aria-label={volume === 0 ? "Unmute" : "Mute"}
                >
                  {getVolumeIcon()}
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                  aria-label="Volume control"
                />
              </div>
            </div>
            
            {/* Playback controls */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSkipBackward}
                disabled={!audioGenerated}
                className="text-neutral-700 dark:text-neutral-300 hover:text-primary-500 dark:hover:text-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Skip backward 5 seconds"
              >
                <SkipBackIcon size={20} />
              </button>
              
              <button
                onClick={togglePlayPause}
                disabled={!audioGenerated}
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  audioGenerated ? 'bg-primary-500 text-white' : 'bg-neutral-300 dark:bg-neutral-700'
                }`}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
              </button>
              
              <button
                onClick={handleSkipForward}
                disabled={!audioGenerated}
                className="text-neutral-700 dark:text-neutral-300 hover:text-primary-500 dark:hover:text-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Skip forward 5 seconds"
              >
                <SkipForwardIcon size={20} />
              </button>
            </div>
            
            <div>
              <span className="text-xs px-2 py-1 bg-neutral-200 dark:bg-neutral-700 rounded-md">
                {speed}x
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
        <p>
          <strong>About this demo:</strong> This simulates a text-to-speech generation system. 
          In a real implementation, this would use neural text-to-speech models to generate natural-sounding voices.
        </p>
      </div>
    </div>
  )
} 