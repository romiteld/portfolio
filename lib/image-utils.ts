export class ImageUtils {
  // Convert File to base64
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix if present
        const base64Data = base64.split(',')[1] || base64;
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Convert base64 to Blob
  static base64ToBlob(base64: string, mimeType: string = 'image/jpeg'): Blob {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: mimeType });
  }

  // Convert URL to base64
  static async urlToBase64(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          const base64Data = base64.split(',')[1] || base64;
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      throw new Error('Failed to convert URL to base64');
    }
  }

  // Resize image to max dimensions while maintaining aspect ratio
  static async resizeImage(
    base64: string,
    maxWidth: number,
    maxHeight: number,
    quality: number = 0.9
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        let { width, height } = img;
        
        // Calculate new dimensions
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          if (width > height) {
            width = maxWidth;
            height = width / aspectRatio;
          } else {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        const resizedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(resizedBase64.split(',')[1]);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = `data:image/jpeg;base64,${base64}`;
    });
  }

  // Get image dimensions
  static async getImageDimensions(base64: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = `data:image/jpeg;base64,${base64}`;
    });
  }

  // Calculate file size from base64
  static calculateBase64Size(base64: string): number {
    // Remove data URL prefix if present
    const base64Data = base64.split(',')[1] || base64;
    // Calculate approximate file size
    const padding = (base64Data.match(/=/g) || []).length;
    return Math.floor((base64Data.length * 3) / 4) - padding;
  }

  // Format file size
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Create thumbnail
  static async createThumbnail(
    base64: string,
    thumbnailSize: number = 200
  ): Promise<string> {
    return this.resizeImage(base64, thumbnailSize, thumbnailSize, 0.8);
  }

  // Extract dominant colors from image
  static async extractColors(base64: string, count: number = 5): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Use smaller canvas for performance
        const sampleSize = 100;
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

        const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
        const pixels = imageData.data;
        const colorMap = new Map<string, number>();

        // Sample pixels
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const rgb = `rgb(${r},${g},${b})`;
          colorMap.set(rgb, (colorMap.get(rgb) || 0) + 1);
        }

        // Sort by frequency and get top colors
        const sortedColors = Array.from(colorMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, count)
          .map(([color]) => color);

        resolve(sortedColors);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = `data:image/jpeg;base64,${base64}`;
    });
  }

  // Apply canvas filter
  static async applyFilter(
    base64: string,
    filter: 'grayscale' | 'sepia' | 'blur' | 'brightness' | 'contrast',
    value: number = 1
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;

        // Apply filter
        switch (filter) {
          case 'grayscale':
            ctx.filter = `grayscale(${value})`;
            break;
          case 'sepia':
            ctx.filter = `sepia(${value})`;
            break;
          case 'blur':
            ctx.filter = `blur(${value}px)`;
            break;
          case 'brightness':
            ctx.filter = `brightness(${value})`;
            break;
          case 'contrast':
            ctx.filter = `contrast(${value})`;
            break;
        }

        ctx.drawImage(img, 0, 0);
        const filteredBase64 = canvas.toDataURL('image/jpeg', 0.9);
        resolve(filteredBase64.split(',')[1]);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = `data:image/jpeg;base64,${base64}`;
    });
  }

  // Create image mask from points
  static createMaskFromPoints(
    width: number,
    height: number,
    points: { x: number; y: number }[],
    brushSize: number = 20
  ): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    canvas.width = width;
    canvas.height = height;

    // Fill with black background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    // Draw white circles at points
    ctx.fillStyle = 'white';
    points.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, brushSize, 0, Math.PI * 2);
      ctx.fill();
    });

    return canvas.toDataURL('image/png').split(',')[1];
  }
}