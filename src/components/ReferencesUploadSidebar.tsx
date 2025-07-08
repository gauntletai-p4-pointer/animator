'use client';

import React, { useState, useRef, useEffect } from 'react';

interface UploadedImage {
  id: string;
  name: string;
  url: string;
  file: File;
}

interface ReferencesUploadSidebarProps {
  className?: string;
}

export default function ReferencesUploadSidebar({ className }: ReferencesUploadSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load persisted images from localStorage on mount
  useEffect(() => {
    const savedImages = localStorage.getItem('visual-references');
    if (savedImages) {
      try {
        const parsedImages = JSON.parse(savedImages);
        setUploadedImages(parsedImages);
      } catch (error) {
        console.error('Error loading saved images:', error);
      }
    }
  }, []);

  // Save images to localStorage whenever uploadedImages changes
  useEffect(() => {
    localStorage.setItem('visual-references', JSON.stringify(uploadedImages));
  }, [uploadedImages]);

  /**
   * Handle file selection from input or drag drop
   */
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    );

    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const newImage: UploadedImage = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          url: url,
          file: file
        };

        setUploadedImages(prev => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });
  };

  /**
   * Handle drag over event
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  /**
   * Handle drag leave event
   */
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  /**
   * Handle drop event
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  /**
   * Handle file input change
   */
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  /**
   * Remove an uploaded image
   */
  const removeImage = (id: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id));
  };

  /**
   * Open file dialog
   */
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`fixed left-0 top-0 h-full transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} z-10 ${className}`}>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute right-0 top-1/2 translate-x-full -translate-y-1/2 px-2 py-4 rounded-r-md transition-colors"
        style={{
          backgroundColor: 'var(--button-bg)',
          color: 'var(--button-text)',
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
          className={`transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`}
        >
          <path d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
        </svg>
      </button>

      {/* Sidebar content */}
      <div 
        className="h-full w-80 flex flex-col"
        style={{
          backgroundColor: 'var(--background)',
          borderRight: '1px solid var(--select-border)',
        }}
      >
        {/* Header */}
        <div 
          className="px-4 py-3 border-b"
          style={{
            borderColor: 'var(--select-border)',
          }}
        >
          <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            Visual References
          </h3>
          <p className="text-sm mt-1" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
            Drag your aesthetic references here
          </p>
        </div>

        {/* Upload area */}
        <div className="p-4">
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
              isDragOver ? 'border-blue-500 bg-blue-50' : ''
            }`}
            style={{
              borderColor: isDragOver ? 'var(--button-bg)' : 'var(--select-border)',
              backgroundColor: isDragOver ? 'var(--button-bg)' : 'transparent',
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={openFileDialog}
          >
            <div className="space-y-2">
              <svg
                className="mx-auto h-12 w-12"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                style={{ color: 'var(--foreground)', opacity: 0.5 }}
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                <span className="font-medium">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* Uploaded images grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            {uploadedImages.map((image) => (
              <div
                key={image.id}
                className="relative group aspect-square"
              >
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-full object-cover rounded-lg"
                  style={{
                    border: '1px solid var(--select-border)',
                  }}
                />
                <button
                  onClick={() => removeImage(image.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    backgroundColor: 'var(--button-bg)',
                    color: 'var(--button-text)',
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="currentColor"
                  >
                    <path d="M11.354 3.646a.5.5 0 0 1 0 .708L7.707 8l3.647 3.646a.5.5 0 0 1-.708.708L7 8.707l-3.646 3.647a.5.5 0 0 1-.708-.708L6.293 8 2.646 4.354a.5.5 0 1 1 .708-.708L7 7.293l3.646-3.647a.5.5 0 0 1 .708 0z"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 