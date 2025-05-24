import React, { useState, useEffect, useRef } from "react";
import { gsap } from 'gsap';
import { RefreshCw } from 'lucide-react';
import Image from "next/image";

interface ImageGalleryProps {
  images: string[];
}

export default function ImageGallery({ images }: ImageGalleryProps) {
  const itemsPerPage = 50;
  const [page, setPage] = useState(0);
  // mode can be 'all', 'even', or 'odd'
  const [mode, setMode] = useState<"all" | "even" | "odd">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [loadedImages, setLoadedImages] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 50;
  const containerRef = useRef<HTMLDivElement>(null);

  const startIndex = page * itemsPerPage;
  const currentImages = images.slice(startIndex, startIndex + itemsPerPage);

  // Filter images based on mode if necessary
  const displayedImages =
    mode === "all"
      ? currentImages
      : currentImages.filter((_, index) =>
          mode === "even" ? index % 2 === 0 : index % 2 !== 0
        );

  // Handler to go to the next page. Resets to first page if end reached.
  const nextPage = () => {
    if (startIndex + itemsPerPage < images.length) {
      setPage(page + 1);
    } else {
      setPage(0);
    }
  };

  // Handler to toggle mode between all -> even -> odd -> all
  const toggleMode = () => {
    setMode((prev) => (prev === "even" ? "odd" : prev === "odd" ? "all" : "even"));
  };

  // Modify the image fetching logic
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch(`/api/photos?page=${currentPage}&pageSize=${pageSize}`);
        const data = await response.json();
        
        if (data.length === 0) {
          setHasMore(false);
          return;
        }
        
        // Shuffle new images before adding to the list
        const shuffled = data.sort(() => Math.random() - 0.5);
        setLoadedImages(prev => [...prev, ...shuffled]);
        
      } catch (error) {
        console.error('Error fetching images:', error);
      }
    };

    if (hasMore) {
      fetchImages();
    }
  }, [currentPage, hasMore]);

  // Add GSAP animation for new images
  useEffect(() => {
    if (loadedImages.length > 0) {
      const elements = containerRef.current?.querySelectorAll('.image-item') ?? [];
      
      gsap.fromTo(elements, 
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.05,
          duration: 0.8,
          ease: "power2.out",
          overwrite: true
        }
      );
    }
  }, [loadedImages]);

  // Add scroll handler for infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && hasMore) {
        setCurrentPage(prev => prev + 1);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore]);

  // Add shuffle button handler
  const handleShuffle = () => {
    setCurrentPage(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <button 
        onClick={handleShuffle}
        className="fixed bottom-8 right-8 z-50 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all"
      >
        Shuffle Images <RefreshCw className="inline ml-2" size={18} />
      </button>
      
      <div 
        ref={containerRef}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4"
      >
        {loadedImages.map((image, index) => (
          <div 
            key={`${image}-${index}`}
            className="image-item opacity-0 transform relative aspect-square"
          >
            <Image
              src={`/photos/${image}`}
              alt={`Gallery image ${index + 1}`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover w-full h-full"
              quality={85}
              loading={index < 4 ? "eager" : "lazy"}
              placeholder="blur"
              blurDataURL={`data:image/svg+xml;base64,...`}
            />
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="text-center py-8">
          <div className="animate-pulse">Loading more images...</div>
        </div>
      )}
    </div>
  );
} 