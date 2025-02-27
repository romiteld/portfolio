import React from 'react';
import ImageGallery from '../components/ImageGallery';

// Create a dummy set of image URLs
const dummyImages = Array.from({ length: 200 }, (_, i) => `https://picsum.photos/seed/${i}/300/200`);

export default function GalleryPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Image Gallery</h1>
      <ImageGallery images={dummyImages} />
    </div>
  );
} 