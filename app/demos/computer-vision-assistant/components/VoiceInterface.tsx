"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface VoiceInterfaceProps {
  onImageAnalysisRequest?: () => void;
  imageAnalysisResult?: any;
}

export default function VoiceInterface({ onImageAnalysisRequest, imageAnalysisResult }: VoiceInterfaceProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const responseContainerRef = useRef<HTMLDivElement>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        
        recognitionRef.current.onresult = (event: any) => {
          const transcriptResult = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('');
          
          setTranscript(transcriptResult);
        };
        
        recognitionRef.current.onend = () => {
          if (isListening) {
            processVoiceInput();
          }
          setIsListening(false);
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          if (event.error === 'no-speech') {
            // Handle no speech detected
            setIsListening(false);
            // Optional: Provide feedback to user
            setResponse("I didn't hear anything. Please try again.");
          } else {
            setIsListening(false);
          }
        };
      } else {
        console.error("Speech Recognition API not supported");
      }

      // Initialize audio element for speech synthesis
      audioRef.current = new Audio();
      audioRef.current.onended = () => {
        setIsPlaying(false);
      };
      
      // Clean up on unmount
      return () => {
        if (recognitionRef.current) {
          recognitionRef.current.abort();
        }
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
        }
      };
    }
  }, []);

  // Start/stop listening
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript("");
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  // Process voice input after recognition ends
  const processVoiceInput = async () => {
    if (!transcript.trim() || isLoading) return;
    
    // Check for image analysis keywords
    const imageAnalysisKeywords = [
      'what is this', 'what do you see', 'identify this', 'analyze this', 
      'what am i showing you', 'what is in front of me', 'what is that', 
      'can you tell me what this is', 'describe this', 'recognize this',
      'solve this', 'calculate', 'what is the answer'
    ];
    
    const isImageAnalysisRequest = imageAnalysisKeywords.some(keyword => 
      transcript.toLowerCase().includes(keyword)
    );
    
    if (isImageAnalysisRequest && onImageAnalysisRequest) {
      onImageAnalysisRequest();
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Send the transcript to your voice assistant API
      const response = await fetch("/api/voice-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          query: transcript,
          imageAnalysisResult: imageAnalysisResult // Pass image analysis results if available
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to get response");
      }
      
      const data = await response.json();
      setResponse(data.text);
      
      // Generate speech using Gemini TTS
      await generateSpeech(data.text);
    } catch (error) {
      console.error("Error processing voice input:", error);
      setResponse("I'm sorry, I couldn't process your request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Generate speech using Gemini text-to-speech API
  const generateSpeech = async (text: string) => {
    try {
      const response = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate speech");
      }
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioSrc(audioUrl);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error generating speech:", error);
    }
  };

  // Scroll to bottom of response container when new responses come in
  useEffect(() => {
    if (responseContainerRef.current) {
      responseContainerRef.current.scrollTop = responseContainerRef.current.scrollHeight;
    }
  }, [response]);

  return (
    <div className="flex flex-col">
      <div className="relative mb-4">
        <div className="flex">
          <button
            onClick={toggleListening}
            disabled={isLoading}
            className={`h-12 w-12 rounded-full flex items-center justify-center ${
              isListening
                ? 'bg-red-600 animate-pulse'
                : 'bg-blue-600 hover:bg-blue-700'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={isListening ? "Stop listening" : "Start listening"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 1a5 5 0 0 0-5 5v1h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a6 6 0 1 1 12 0v6a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h1V6a5 5 0 0 0-5-5z"/>
            </svg>
          </button>
          <div className="flex-1 ml-3">
            <div className={`h-12 px-4 rounded-md flex items-center ${
              isListening
                ? 'bg-gray-700 border border-blue-500'
                : 'bg-gray-700'
            }`}>
              {transcript ? (
                <p className="text-gray-200">{transcript}</p>
              ) : (
                <p className="text-gray-500">
                  {isListening ? 'Listening...' : 'Click the microphone button and ask a question'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div 
        ref={responseContainerRef}
        className="bg-gray-700 rounded-md p-4 h-48 overflow-y-auto"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="flex items-center">
              <div className="animate-pulse flex space-x-1">
                <div className="h-2.5 w-2.5 bg-blue-500 rounded-full"></div>
                <div className="h-2.5 w-2.5 bg-blue-500 rounded-full"></div>
                <div className="h-2.5 w-2.5 bg-blue-500 rounded-full"></div>
              </div>
              <span className="ml-3">Processing your request...</span>
            </div>
          </div>
        ) : response ? (
          <div className="text-gray-200">
            <p>{response}</p>
          </div>
        ) : (
          <div className="text-gray-500 flex flex-col items-center justify-center h-full text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16" className="mb-3">
              <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"/>
              <path d="M10 8a2 2 0 1 1-4 0V3a2 2 0 1 1 4 0v5zM8 0a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V3a3 3 0 0 0-3-3z"/>
            </svg>
            <p>Responses from the voice assistant will appear here</p>
            <p className="mt-2 text-sm">Try asking about what's in the camera view</p>
          </div>
        )}
      </div>
      
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-400 mb-2">Example Commands:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gray-700 hover:bg-gray-600 p-2 rounded text-sm text-left"
            onClick={() => {
              setTranscript("What do you see in the camera?");
              setTimeout(() => processVoiceInput(), 500);
            }}
          >
            "What do you see in the camera?"
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gray-700 hover:bg-gray-600 p-2 rounded text-sm text-left"
            onClick={() => {
              setTranscript("Solve this math problem");
              setTimeout(() => processVoiceInput(), 500);
            }}
          >
            "Solve this math problem"
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gray-700 hover:bg-gray-600 p-2 rounded text-sm text-left"
            onClick={() => {
              setTranscript("What is this object?");
              setTimeout(() => processVoiceInput(), 500);
            }}
          >
            "What is this object?"
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gray-700 hover:bg-gray-600 p-2 rounded text-sm text-left"
            onClick={() => {
              setTranscript("Tell me about what you're seeing");
              setTimeout(() => processVoiceInput(), 500);
            }}
          >
            "Tell me about what you're seeing"
          </motion.button>
        </div>
      </div>
      
      {/* Hidden audio element for speech synthesis */}
      {audioSrc && <audio src={audioSrc} ref={audioRef} className="hidden" />}
    </div>
  );
}