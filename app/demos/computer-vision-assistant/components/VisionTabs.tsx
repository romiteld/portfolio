'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Eye, Scissors, Paintbrush, FileText } from 'lucide-react';
import { ImageData } from '../hooks/useImage';
import { DetectionOverlay } from './DetectionOverlay';
import { SegmentationOverlay } from './SegmentationOverlay';
import { InpaintBrush } from './InpaintBrush';
import { Loader } from './Loader';

interface VisionTabsProps {
  image: ImageData | null;
}

export function VisionTabs({ image }: VisionTabsProps) {
  const [activeTab, setActiveTab] = useState('caption');
  
  // Caption state
  const [caption, setCaption] = useState('');
  const [captionLoading, setCaptionLoading] = useState(false);
  const [captionStream, setCaptionStream] = useState('');
  
  // Detection state
  const [detectPrompt, setDetectPrompt] = useState('');
  const [confidence, setConfidence] = useState([0.3]);
  const [detections, setDetections] = useState([]);
  const [detectLoading, setDetectLoading] = useState(false);
  
  // Segmentation state
  const [segmentMode, setSegmentMode] = useState('default');
  const [opacity, setOpacity] = useState([0.6]);
  const [segments, setSegments] = useState([]);
  const [segmentLoading, setSegmentLoading] = useState(false);
  
  // Inpaint state
  const [inpaintPrompt, setInpaintPrompt] = useState('');
  const [brushSize, setBrushSize] = useState([20]);
  const [inpaintedImage, setInpaintedImage] = useState<string | null>(null);
  const [inpaintLoading, setInpaintLoading] = useState(false);
  
  // Chat state
  const [chatMessage, setChatMessage] = useState('');
  const [conversation, setConversation] = useState<Array<{role: string, content: string}>>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatStream, setChatStream] = useState('');

  // Clear results when image changes
  useEffect(() => {
    setCaption('');
    setCaptionStream('');
    setDetections([]);
    setSegments([]);
    setInpaintedImage(null);
    setConversation([]);
  }, [image]);

  const getImageBase64 = async () => {
    if (!image?.file) return null;
    
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(image.file);
    });
  };

  const handleCaption = async (streaming = false) => {
    if (!image) return;
    
    setCaptionLoading(true);
    setCaptionStream('');
    setCaption('');
    
    try {
      const imageBase64 = await getImageBase64();
      
      const response = await fetch('/api/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64, stream: streaming })
      });
      
      if (streaming) {
        const reader = response.body?.getReader();
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = new TextDecoder().decode(value);
            setCaptionStream(prev => prev + chunk);
          }
        }
      } else {
        const result = await response.json();
        if (result.error) throw new Error(result.error);
        setCaption(result.caption);
      }
    } catch (error) {
      console.error('Caption error:', error);
      setCaption('Failed to generate caption');
    } finally {
      setCaptionLoading(false);
    }
  };

  const handleDetect = async () => {
    if (!image || !detectPrompt.trim()) return;
    
    setDetectLoading(true);
    setDetections([]);
    
    try {
      const imageBase64 = await getImageBase64();
      
      const response = await fetch('/api/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: imageBase64, 
          prompt: detectPrompt,
          confidence: confidence[0]
        })
      });
      
      const result = await response.json();
      if (result.error) throw new Error(result.error);
      setDetections(result.detections || []);
    } catch (error) {
      console.error('Detection error:', error);
    } finally {
      setDetectLoading(false);
    }
  };

  const handleSegment = async () => {
    if (!image) return;
    
    setSegmentLoading(true);
    setSegments([]);
    
    try {
      const imageBase64 = await getImageBase64();
      
      const response = await fetch('/api/segment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: imageBase64,
          mode: segmentMode,
          threshold: 0.5
        })
      });
      
      const result = await response.json();
      if (result.error) throw new Error(result.error);
      setSegments(result.segments || []);
    } catch (error) {
      console.error('Segmentation error:', error);
    } finally {
      setSegmentLoading(false);
    }
  };

  const handleInpaint = async (maskData: string) => {
    if (!image || !maskData) return;
    
    setInpaintLoading(true);
    
    try {
      const imageBase64 = await getImageBase64();
      
      const response = await fetch('/api/inpaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: imageBase64,
          mask: maskData,
          prompt: inpaintPrompt || 'high quality, detailed'
        })
      });
      
      const result = await response.json();
      if (result.error) throw new Error(result.error);
      setInpaintedImage(result.inpainted_image);
    } catch (error) {
      console.error('Inpainting error:', error);
    } finally {
      setInpaintLoading(false);
    }
  };

  const handleChat = async () => {
    if (!image || !chatMessage.trim()) return;
    
    setChatLoading(true);
    setChatStream('');
    
    try {
      const imageBase64 = await getImageBase64();
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: imageBase64,
          message: chatMessage,
          conversation,
          stream: true
        })
      });
      
      // Add user message immediately
      setConversation(prev => [...prev, { role: 'user', content: chatMessage }]);
      setChatMessage('');
      
      const reader = response.body?.getReader();
      if (reader) {
        let assistantResponse = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = new TextDecoder().decode(value);
          assistantResponse += chunk;
          setChatStream(assistantResponse);
        }
        
        // Add complete assistant response
        setConversation(prev => [...prev, { role: 'assistant', content: assistantResponse }]);
        setChatStream('');
      }
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setChatLoading(false);
    }
  };

  if (!image) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500 dark:text-gray-400">
            Upload an image to start using computer vision features
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="caption" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Caption
        </TabsTrigger>
        <TabsTrigger value="detect" className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Detect
        </TabsTrigger>
        <TabsTrigger value="segment" className="flex items-center gap-2">
          <Scissors className="w-4 h-4" />
          Segment
        </TabsTrigger>
        <TabsTrigger value="inpaint" className="flex items-center gap-2">
          <Paintbrush className="w-4 h-4" />
          Inpaint
        </TabsTrigger>
        <TabsTrigger value="chat" className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Chat
        </TabsTrigger>
      </TabsList>

      <TabsContent value="caption" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Image Captioning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={() => handleCaption(false)} disabled={captionLoading}>
                Generate Caption
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleCaption(true)} 
                disabled={captionLoading}
              >
                Stream Caption
              </Button>
            </div>
            
            {captionLoading && <Loader />}
            
            {(caption || captionStream) && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm font-medium mb-2">Caption:</p>
                <p>{captionStream || caption}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="detect" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Object Detection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="detect-prompt">Detection Prompt</Label>
              <Input
                id="detect-prompt"
                placeholder="What to detect (e.g., 'person', 'car', 'dog')"
                value={detectPrompt}
                onChange={(e) => setDetectPrompt(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Confidence Threshold: {confidence[0]}</Label>
              <Slider
                value={confidence}
                onValueChange={setConfidence}
                max={1}
                min={0.1}
                step={0.1}
              />
            </div>
            
            <Button onClick={handleDetect} disabled={detectLoading || !detectPrompt.trim()}>
              Detect Objects
            </Button>
            
            {detectLoading && <Loader />}
            
            {detections.length > 0 && (
              <DetectionOverlay 
                image={image} 
                detections={detections}
              />
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="segment" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Image Segmentation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Segmentation Mode</Label>
              <Select value={segmentMode} onValueChange={setSegmentMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">SAM 2.1 (Default)</SelectItem>
                  <SelectItem value="hq">HQ-SAM (High Quality)</SelectItem>
                  <SelectItem value="fast">FastSAM (Fast)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Mask Opacity: {opacity[0]}</Label>
              <Slider
                value={opacity}
                onValueChange={setOpacity}
                max={1}
                min={0.1}
                step={0.1}
              />
            </div>
            
            <Button onClick={handleSegment} disabled={segmentLoading}>
              Segment Image
            </Button>
            
            {segmentLoading && <Loader />}
            
            {segments.length > 0 && (
              <SegmentationOverlay 
                image={image} 
                segments={segments}
                opacity={opacity[0]}
              />
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="inpaint" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Image Inpainting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inpaint-prompt">Inpainting Prompt (Optional)</Label>
              <Input
                id="inpaint-prompt"
                placeholder="Describe what to paint in the masked area"
                value={inpaintPrompt}
                onChange={(e) => setInpaintPrompt(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Brush Size: {brushSize[0]}px</Label>
              <Slider
                value={brushSize}
                onValueChange={setBrushSize}
                max={50}
                min={5}
                step={5}
              />
            </div>
            
            <InpaintBrush
              image={image}
              brushSize={brushSize[0]}
              onApply={handleInpaint}
              loading={inpaintLoading}
            />
            
            {inpaintedImage && (
              <div className="space-y-2">
                <Label>Inpainted Result</Label>
                <img 
                  src={inpaintedImage} 
                  alt="Inpainted result"
                  className="w-full rounded-lg border"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="chat" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Visual Chat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-64 overflow-y-auto border rounded-lg p-4 space-y-2">
              {conversation.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-2 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              
              {chatStream && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                    {chatStream}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Textarea
                placeholder="Ask a question about the image..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleChat();
                  }
                }}
                rows={2}
              />
              <Button 
                onClick={handleChat} 
                disabled={chatLoading || !chatMessage.trim()}
                className="self-end"
              >
                Send
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}