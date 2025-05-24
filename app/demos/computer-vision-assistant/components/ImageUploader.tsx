'use client';

import { useCallback, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ImageData } from '../hooks/useImage';

interface ImageUploaderProps {
  image: ImageData | null;
  loading: boolean;
  error: string | null;
  onImageSelect: (file: File) => void;
  onClearImage: () => void;
  className?: string;
}

export function ImageUploader({
  image,
  loading,
  error,
  onImageSelect,
  onClearImage,
  className = ''
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
  }, [onImageSelect]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageSelect(file);
    }
  }, [onImageSelect]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <Card className={`relative ${className}`}>
      {!image ? (
        <div
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={openFileDialog}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            )}
            
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {loading ? 'Loading image...' : 'Upload an image'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Drag and drop or click to select
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Supports PNG, JPG, WebP • Max 10MB
              </p>
            </div>
            
            <Button 
              variant="outline" 
              disabled={loading}
              className="mt-4"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose Image
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <img
            src={image.url}
            alt="Uploaded image"
            className="w-full h-auto rounded-lg"
            style={{ maxHeight: '400px', objectFit: 'contain' }}
          />
          
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={onClearImage}
          >
            <X className="w-4 h-4" />
          </Button>
          
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
            {image.width} × {image.height}
          </div>
        </div>
      )}
      
      {error && (
        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
    </Card>
  );
}