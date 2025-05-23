"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";

export default function VoiceInterface() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [autoListen, setAutoListen] = useState(true);
  const [useVoiceResponse, setUseVoiceResponse] = useState(true);
  const [temporaryTranscript, setTemporaryTranscript] = useState("");
  const [permissionState, setPermissionState] = useState<'granted'|'denied'|'prompt'|'unknown'>('unknown');
  const [isPremiumVoice, setIsPremiumVoice] = useState(false);
  const recognitionRef = useRef<any>(null);
  const responseContainerRef = useRef<HTMLDivElement>(null);
  const listeningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  // Main speech function using Gemini text-to-speech for premium voice quality
  const speak = async (text: string) => {
    // Split the text into sentences so we can add pauses
    const sentences = text.split(/(?<=[.!?])\s+/);
    
    try {
      // Stop recognition while speaking to prevent feedback loop
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log("Error stopping recognition before speaking:", e);
        }
      }
      
      // Cancel any ongoing browser speech
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      
      // Set a visual indicator that the system is speaking
      document.body.classList.add('ai-is-speaking');
      
      console.log('Generating Gemini TTS premium voice...');

      // Call our API endpoint that interfaces with Gemini TTS
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error('Gemini TTS API error:', error);
        throw new Error(`Speech generation failed: ${error}`);
      }
      
      // Create an audio blob from the response
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      setIsPremiumVoice(true);
      
      // Handle audio events
      audio.onplay = () => {
        console.log('Premium audio started playing');
      };
      
      audio.onended = () => {
        console.log('Premium audio finished playing');
        // Clean up
        URL.revokeObjectURL(audioUrl);
        document.body.classList.remove('ai-is-speaking');
        
        // Resume listening after a short delay if auto-listen is enabled
        if (autoListen) {
          setTimeout(() => {
            if (recognitionRef.current) {
              try {
                recognitionRef.current.start();
                console.log("Restarted recognition after speech ended");
              } catch (e) {
                console.log("Error restarting recognition:", e);
              }
            }
          }, 700); // Delay before resuming listening
        }
      };
      
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        document.body.classList.remove('ai-is-speaking');
        setIsPremiumVoice(false);
        // Fall back to browser speech on audio error
        fallbackSpeak(text);
      };
      
      // Play the audio
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error('Audio play error:', err);
          setIsPremiumVoice(false);
          fallbackSpeak(text);
        });
      }
    } catch (error) {
      console.error('Error with Gemini voice synthesis:', error);
      setIsPremiumVoice(false);
      // Fall back to browser speech if Gemini TTS fails
      fallbackSpeak(text);
    }
  };
  
  // Fallback to browser speech synthesis if Gemini TTS fails
  const fallbackSpeak = (text: string) => {
    console.log('Falling back to browser speech synthesis');
    
    if ('speechSynthesis' in window) {
      // Stop recognition while speaking to prevent feedback loop
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors if not currently recognizing
        }
      }
      
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      // Set a visual indicator that the system is speaking
      document.body.classList.add('ai-is-speaking');
      
      // Split the text into sentences for better pauses
      const sentences = text.split(/(?<=[.!?])\s+/);
      let currentIndex = 0;
      
      // Function to speak the next sentence with a pause between sentences
      const speakNextSentence = () => {
        if (currentIndex < sentences.length) {
          const sentence = sentences[currentIndex];
          currentIndex++;
          
          const utterance = new SpeechSynthesisUtterance(sentence);
          
          // Get available voices
          const voices = window.speechSynthesis.getVoices();
          
          // Try to find a good quality voice
          const preferredVoice = voices.find(voice => 
            voice.name.includes('Google') && voice.name.includes('Female') ||
            voice.name.includes('Samantha') ||
            voice.name.includes('Microsoft') && voice.name.includes('Zira')
          );
          
          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }
          
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          
          // When this sentence ends, speak the next one or finish
          utterance.onend = () => {
            // If this is the last sentence
            if (currentIndex >= sentences.length) {
              document.body.classList.remove('ai-is-speaking');
              
              // Resume listening after a short delay if auto-listen is enabled
              if (autoListen) {
                setTimeout(() => {
                  if (recognitionRef.current) {
                    try {
                      recognitionRef.current.start();
                      console.log("Restarted recognition after speech ended");
                    } catch (e) {
                      console.log("Error restarting recognition:", e);
                    }
                  }
                }, 700); // Delay before resuming listening
              }
            } else {
              // Slight pause between sentences
              setTimeout(speakNextSentence, 300);
            }
          };
          
          window.speechSynthesis.speak(utterance);
        }
      };
      
      // Start speaking the first sentence
      speakNextSentence();
    } else {
      console.error('Speech synthesis not supported in this browser');
      document.body.classList.remove('ai-is-speaking');
    }
  };

  // Function to start speech recognition with improved error handling
  const startListening = () => {
    if (isListening || !recognitionRef.current) return;
    
    // Reset any ongoing speech synthesis to avoid conflicts
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    // Clear any speaking indicators
    document.body.classList.remove('ai-is-speaking');
    
    try {
      // Start the recognition
      recognitionRef.current.start();
      setIsListening(true);
      console.log('Speech recognition started successfully');
      retryCountRef.current = 0; // Reset retry counter on successful start
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        setIsSupported(false);
        setPermissionState('denied');
      }
      setIsListening(false);
    }
  };
  
  // Function to stop speech recognition
  const stopListening = () => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
      setIsListening(false);
      console.log('Speech recognition stopped by user');
    } catch (error) {
      console.error("Error stopping speech recognition:", error);
    }
  };

  // Handle direct greetings with a friendly response
  const handleGreeting = (text: string) => {
    const greetingPattern = /^(hi|hello|hey|greetings|howdy)(?![a-z])/i;
    
    if (greetingPattern.test(text.trim())) {
      console.log("Greeting detected:", text);
      setIsLoading(true);
      
      // Randomize greeting responses for variety
      const greetings = [
        "Hello! How can I help you analyze what's in your camera view?",
        "Hi there! I'm ready to describe what I see in your camera.",
        "Hey! Ask me to analyze what's in your camera view.",
        "Greetings! I can help describe what your camera is seeing. What would you like to know?"
      ];
      
      const response = greetings[Math.floor(Math.random() * greetings.length)];
      
      // Simulate a small delay for natural feel
      setTimeout(() => {
        setResponse(response);
        
        // Ensure the response container scrolls to the bottom
        if (responseContainerRef.current) {
          responseContainerRef.current.scrollTop = responseContainerRef.current.scrollHeight;
        }
        
        if (useVoiceResponse) {
          speak(response);
        }
        
        setTranscript("");
        setIsLoading(false);
      }, 600);
      
      return true;
    }
    
    return false;
  };

  // Submit the transcribed text to the voice assistant API
  const submitQueryWithText = async (text: string) => {
    if (!text.trim() || isLoading) return;
    
    // Check for greetings first
    if (handleGreeting(text.trim())) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/voice-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: text }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to get response");
      }
      
      const data = await response.json();
      setResponse(data.response);
      
      // Ensure the response container scrolls to the bottom
      if (responseContainerRef.current) {
        responseContainerRef.current.scrollTop = responseContainerRef.current.scrollHeight;
      }
      
      if (useVoiceResponse) {
        speak(data.response);
      }
      
      setTranscript("");
    } catch (error) {
      console.error("Error processing voice query:", error);
      setResponse("I'm sorry, I couldn't process your request. Please try again.");
      
      if (useVoiceResponse) {
        speak("I'm sorry, I couldn't process your request. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Submit the current transcript
  const submitQuery = () => {
    if (transcript) {
      submitQueryWithText(transcript);
    }
  };
  
  // Check for microphone permissions on component mount
  useEffect(() => {
    const checkMicrophonePermission = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setPermissionState(permissionStatus.state as 'granted'|'denied'|'prompt');
          
          // Listen for permission changes
          permissionStatus.onchange = () => {
            setPermissionState(permissionStatus.state as 'granted'|'denied'|'prompt');
            
            if (permissionStatus.state === 'granted') {
              setIsSupported(true);
            } else if (permissionStatus.state === 'denied') {
              setIsSupported(false);
            }
          };
        }
      } catch (error) {
        console.log('Permissions API not supported or error:', error);
      }
    };
    
    checkMicrophonePermission();
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    // Load SpeechRecognition API
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event: any) => {
        const latest = event.results[event.results.length - 1];
        const transcriptResult = latest[0].transcript;
        
        // Check if body has the ai-is-speaking class - if so, this might be feedback
        // from the AI's own voice being picked up by the microphone
        if (document.body.classList.contains('ai-is-speaking')) {
          console.log('AI is currently speaking, ignoring speech input to prevent feedback');
          return;
        }
        
        setTemporaryTranscript(transcriptResult);
        
        // If final result and significant pause detected or statement finished
        if (latest.isFinal && (
          transcriptResult.trim().endsWith(".") || 
          transcriptResult.trim().endsWith("?") || 
          transcriptResult.trim().endsWith("!") ||
          transcriptResult.trim().length > 5 // Trigger on shorter phrases
        )) {
          console.log('Final speech result detected:', transcriptResult);
          setTranscript(transcriptResult);
          
          // Clear any existing timeout
          if (listeningTimeoutRef.current) {
            clearTimeout(listeningTimeoutRef.current);
          }
          
          // Set timeout to process the query after a short pause
          listeningTimeoutRef.current = setTimeout(() => {
            // Stop listening before submitting to prevent feedback loops
            if (recognitionRef.current) {
              try {
                recognitionRef.current.stop();
              } catch (e) {
                // Ignore errors if already stopped
              }
            }
            
            submitQueryWithText(transcriptResult);
            setTemporaryTranscript("");
          }, 500); // Shorter delay for better responsiveness
        }
      };
      
      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
        
        // Resume listening after a short delay if auto-listen is enabled
        // and we're not currently speaking
        if (autoListen && !document.body.classList.contains('ai-is-speaking')) {
          setTimeout(() => {
            console.log('Auto-restarting speech recognition');
            startListening();
          }, 300);
        }
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        
        if (event.error === 'not-allowed') {
          setIsSupported(false);
          console.error('Microphone access was denied');
        } else if (event.error === 'no-speech') {
          // No speech detected - don't show this as an error, just log it
          console.log('No speech detected, continuing to listen');
          
          // Don't set isListening to false for no-speech errors
          // Just restart if auto-listen is enabled
          if (autoListen && !document.body.classList.contains('ai-is-speaking')) {
            // Increment retry counter
            retryCountRef.current += 1;
            
            // If we've had too many no-speech errors in a row, wait longer before retrying
            const retryDelay = retryCountRef.current > 3 ? 1500 : 300;
            
            setTimeout(() => {
              if (recognitionRef.current) {
                try {
                  recognitionRef.current.start();
                  console.log('Restarted recognition after no-speech error');
                } catch (e) {
                  console.log('Error restarting after no-speech:', e);
                }
              }
            }, retryDelay);
          }
          return; // Don't set isListening to false for no-speech errors
        } else if (event.error === 'aborted' || event.error === 'network') {
          // Handle network issues and aborted recognition
          console.log(`Recognition ${event.error}, will restart if auto-listen enabled`);
          
          if (autoListen && !document.body.classList.contains('ai-is-speaking')) {
            setTimeout(() => startListening(), 1000);
          }
        }
        
        // Only set listening to false for non-no-speech errors
        if (event.error !== 'no-speech') {
          setIsListening(false);
        }
      };
      
      // Start listening automatically after component mounts
      if (autoListen) {
        setTimeout(() => {
          startListening();
        }, 1000);
      }
    } else {
      setIsSupported(false);
    }
    
    return () => {
      if (listeningTimeoutRef.current) {
        clearTimeout(listeningTimeoutRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors when stopping
        }
      }
    };
  }, [autoListen]);

  // Request microphone permission explicitly
  const requestMicrophonePermission = async () => {
    try {
      // Try to access the microphone to trigger a permission request
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // If we get here, permission was granted
      setIsSupported(true);
      setPermissionState('granted');
      
      // Stop the stream after getting permission
      stream.getTracks().forEach(track => track.stop());
      
      // Start listening if auto-listen is enabled
      if (autoListen) {
        setTimeout(() => startListening(), 500);
      }
      
      return true;
    } catch (error) {
      console.error('Microphone permission error:', error);
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        setIsSupported(false);
        setPermissionState('denied');
      }
      return false;
    }
  };
  
  // Toggle auto-listen mode
  const toggleAutoListen = () => {
    const newAutoListen = !autoListen;
    setAutoListen(newAutoListen);
    
    if (newAutoListen && !isListening && !isLoading) {
      startListening();
    } else if (!newAutoListen && isListening) {
      stopListening();
    }
  };
  
  // Toggle voice response mode
  const toggleVoiceResponse = () => {
    setUseVoiceResponse(!useVoiceResponse);
  };
  
  // Scroll to bottom of response container when new responses come in
  useEffect(() => {
    if (responseContainerRef.current) {
      responseContainerRef.current.scrollTop = responseContainerRef.current.scrollHeight;
    }
  }, [response]);

  // Add CSS for AI speaking indication
  useEffect(() => {
    // Add CSS rule for the AI speaking state
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .ai-is-speaking .microphone-indicator {
        color: #ff4b4b !important;
        animation: pulse 1.5s infinite;
      }
      
      @keyframes pulse {
        0% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
        100% {
          opacity: 1;
        }
      }
      
      .premium-voice-badge {
        position: absolute;
        top: -6px;
        right: -6px;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
        font-size: 8px;
        font-weight: bold;
        padding: 3px 6px;
        border-radius: 6px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        opacity: 0;
        transform: scale(0.8);
        transition: opacity 0.3s, transform 0.3s;
      }
      
      .premium-voice-active .premium-voice-badge {
        opacity: 1;
        transform: scale(1);
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      // Remove the style element
      document.head.removeChild(styleElement);
      // Remove the class if component unmounts while speaking
      document.body.classList.remove('ai-is-speaking');
    };
  }, []);

  return (
    <div className="flex flex-col" data-component-name="VoiceInterface">
      {!isSupported ? (
        <div className="bg-red-900 bg-opacity-30 p-4 rounded-md text-red-300 mb-4" data-component-name="VoiceInterface">
          <h3 className="font-medium mb-2">Microphone Access Required</h3>
          <p className="text-sm mb-3">
            This demo requires access to your microphone to enable voice interaction. Please enable microphone access in your browser settings.
          </p>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={requestMicrophonePermission}
              className="mt-3 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-all duration-150 ease-in-out"
              data-component-name="VoiceInterface"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-3 px-2" data-component-name="VoiceInterface">
            <div className="flex items-center space-x-2" data-component-name="VoiceInterface">
              <Switch 
                id="auto-listen"
                checked={autoListen}
                onCheckedChange={toggleAutoListen}
              />
              <label htmlFor="auto-listen" className="text-sm text-gray-300" data-component-name="VoiceInterface">
                Auto-listen
              </label>
            </div>
            <div className="flex items-center space-x-2" data-component-name="VoiceInterface">
              <Switch 
                id="voice-response"
                checked={useVoiceResponse}
                onCheckedChange={toggleVoiceResponse}
              />
              <label htmlFor="voice-response" className="text-sm text-gray-300" data-component-name="VoiceInterface">
                Voice responses
              </label>
            </div>
          </div>
          
          <div className="relative mb-4" data-component-name="VoiceInterface">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`${isPremiumVoice ? 'premium-voice-active' : ''} relative w-full h-12 rounded-full bg-gradient-to-r ${
                isListening 
                  ? 'from-blue-600 to-blue-500 shadow-lg shadow-blue-600/20' 
                  : 'from-gray-700 to-gray-600'
              } flex items-center justify-center transition-all duration-300`}
              onClick={isListening ? stopListening : startListening}
              data-component-name="VoiceInterface"
            >
              <span 
                className={`microphone-indicator ${isListening ? 'text-white' : 'text-gray-300'}`}
                data-component-name="VoiceInterface"
              >
                {isListening ? 'Listening...' : 'Tap to speak'}
              </span>
              <span className="premium-voice-badge">Premium Voice</span>
            </motion.button>
            <p className="text-xs text-gray-500 text-center mt-1" data-component-name="VoiceInterface">
              {temporaryTranscript || transcript || 
              (isListening ? "Speak now..." : "Press the button to start speaking")}
            </p>
            <p className="text-xs text-blue-400 text-center mt-1" data-component-name="VoiceInterface">
              {isPremiumVoice ? "Premium Voice Active" : 
               (useVoiceResponse ? "Voice responses on" : "Text-only responses")}
            </p>
          </div>
          
          <div 
            ref={responseContainerRef}
            className="bg-gray-700 rounded-md p-4 h-48 overflow-y-auto relative"
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
                  setTranscript("What objects do you see?");
                  setTimeout(() => submitQuery(), 500);
                }}
              >
                "What objects do you see?"
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gray-700 hover:bg-gray-600 p-2 rounded text-sm text-left"
                onClick={() => {
                  setTranscript("Is there any text in this image?");
                  setTimeout(() => submitQuery(), 500);
                }}
              >
                "Is there any text in this image?"
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gray-700 hover:bg-gray-600 p-2 rounded text-sm text-left"
                onClick={() => {
                  setTranscript("Describe what's in the camera view");
                  setTimeout(() => submitQuery(), 500);
                }}
              >
                "Describe what's in the camera view"
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gray-700 hover:bg-gray-600 p-2 rounded text-sm text-left"
                onClick={() => {
                  setTranscript("Are there any people in this image?");
                  setTimeout(() => submitQuery(), 500);
                }}
              >
                "Are there any people in this image?"
              </motion.button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
