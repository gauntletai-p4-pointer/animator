'use client';

import React, { useState } from 'react';

interface ReferenceImage {
  id: string;
  url: string;
  file: File;
}

interface ReferenceImagesProps {
  onImagesChange?: (images: ReferenceImage[]) => void;
}

export default function ReferenceImages({ onImagesChange }: ReferenceImagesProps) {
  const [images, setImages] = useState<ReferenceImage[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: ReferenceImage[] = [];
    
    Array.from(files).forEach((file) => {
      const id = `ref-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      const url = URL.createObjectURL(file);
      newImages.push({ id, url, file });
    });

    const updatedImages = [...images, ...newImages];
    setImages(updatedImages);
    onImagesChange?.(updatedImages);
  };

  const handleRemoveImage = (id: string) => {
    const imageToRemove = images.find(img => img.id === id);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.url);
    }
    
    const updatedImages = images.filter(img => img.id !== id);
    setImages(updatedImages);
    onImagesChange?.(updatedImages);
  };

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
        Reference Images
      </h2>
      
      <div className="mb-4">
        <label className="block w-full">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
          <div 
            className="px-4 py-2 text-sm font-medium rounded-md text-center cursor-pointer transition-colors"
            style={{
              backgroundColor: 'var(--button-bg)',
              color: 'var(--button-text)',
              border: '2px dashed var(--select-border)'
            }}
          >
            Click to upload reference images
          </div>
        </label>
      </div>

      {images.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative group"
              onMouseEnter={() => setHoveredId(image.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt="Reference"
                className="w-full h-32 object-cover rounded-md"
                style={{
                  border: '1px solid var(--select-border)'
                }}
              />
              
              {hoveredId === image.id && (
                <button
                  onClick={() => handleRemoveImage(image.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                  title="Remove image"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <p className="text-sm text-center py-4" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
          No reference images uploaded yet
        </p>
      )}
    </div>
  );
}