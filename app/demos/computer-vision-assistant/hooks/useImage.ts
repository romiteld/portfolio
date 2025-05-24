'use client';

import { useState, useCallback } from 'react';

export interface ImageData {
  url: string;
  file: File | null;
  width: number;
  height: number;
}

export interface UseImageReturn {
  image: ImageData | null;
  loading: boolean;
  error: string | null;
  setImage: (file: File) => Promise<void>;
  clearImage: () => void;
  getBase64: () => string | null;
}

export function useImage(): UseImageReturn {
  const [image, setImageState] = useState<ImageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setImage = useCallback(async (file: File) => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file');
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('Image file must be smaller than 10MB');
      }

      // Create object URL
      const url = URL.createObjectURL(file);

      // Load image to get dimensions
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = url;
      });

      setImageState({
        url,
        file,
        width: img.width,
        height: img.height
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load image');
      setImageState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearImage = useCallback(() => {
    if (image?.url) {
      URL.revokeObjectURL(image.url);
    }
    setImageState(null);
    setError(null);
  }, [image?.url]);

  const getBase64 = useCallback(() => {
    if (!image?.file) return null;

    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(image.file);
    }) as any; // Type assertion to avoid async/await issues
  }, [image?.file]);

  return {
    image,
    loading,
    error,
    setImage,
    clearImage,
    getBase64
  };
}

// Utility function to convert file to base64
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// Utility function to resize image if too large
export async function resizeImage(
  file: File, 
  maxWidth: number = 1024, 
  maxHeight: number = 1024,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      // Resize image
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const resizedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          resolve(resizedFile);
        } else {
          resolve(file); // Fallback to original
        }
      }, file.type, quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
}