'use client';

import { useState } from 'react';

interface GeneratedImageDisplayProps {
  imageUrl: string;
  description: string;
  revisedPrompt?: string;
  rewrittenPrompt?: string;
  itemType?: string;
  color?: string;
  hasTransparency?: boolean;
  onClose?: () => void;
}

/**
 * Temporary component to display generated images from DALL-E
 * This will be replaced with proper integration into the Spine2D system later
 */
export default function GeneratedImageDisplay({ 
  imageUrl, 
  description, 
  revisedPrompt, 
  rewrittenPrompt,
  itemType, 
  color,
  hasTransparency,
  onClose 
}: GeneratedImageDisplayProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => {
    console.log('🖼️ GeneratedImageDisplay: Image loaded successfully');
    setImageLoaded(true);
  };

  const handleImageError = () => {
    console.error('❌ GeneratedImageDisplay: Error loading image');
    setImageError(true);
  };

  return (
    <div 
      className="border rounded-lg p-4 mb-4 max-w-md mx-auto"
      style={{
        backgroundColor: 'var(--select-bg)',
        borderColor: 'var(--select-border)',
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
          Generated Image
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-sm px-2 py-1 rounded hover:opacity-75"
            style={{
              backgroundColor: 'var(--button-bg)',
              color: 'var(--button-text)',
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Image Details */}
      <div className="mb-3 text-sm" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
        {itemType && (
          <div className="mb-1">
            <span className="font-medium">Type:</span> {itemType}
          </div>
        )}
        {color && (
          <div className="mb-1">
            <span className="font-medium">Color:</span> {color}
          </div>
        )}
        <div className="mb-1">
          <span className="font-medium">Description:</span> {description}
        </div>
      </div>

      {/* Image Display */}
      <div className="relative mb-3">
        {!imageLoaded && !imageError && (
          <div 
            className="flex items-center justify-center h-32 rounded border-2 border-dashed"
            style={{ borderColor: 'var(--select-border)' }}
          >
            <div className="text-center">
              <div className="animate-pulse text-sm" style={{ color: 'var(--foreground)', opacity: 0.6 }}>
                Loading image...
              </div>
            </div>
          </div>
        )}
        
        {imageError && (
          <div 
            className="flex items-center justify-center h-32 rounded border-2 border-dashed"
            style={{ borderColor: 'var(--select-border)' }}
          >
            <div className="text-center">
              <div className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.6 }}>
                Failed to load image
              </div>
            </div>
          </div>
        )}
        
        <img
          src={imageUrl}
          alt={description}
          className={`w-full h-auto rounded border transition-opacity ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ borderColor: 'var(--select-border)' }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </div>

      {/* Rewritten Prompt */}
      {rewrittenPrompt && (
        <div className="text-xs mb-2" style={{ color: 'var(--foreground)', opacity: 0.6 }}>
          <div className="font-medium mb-1">Rewritten Prompt:</div>
          <div className="italic">{rewrittenPrompt}</div>
        </div>
      )}

      {/* Revised Prompt */}
      {revisedPrompt && (
        <div className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.6 }}>
          <div className="font-medium mb-1">GPT-image-1 Analysis:</div>
          <div className="italic">{revisedPrompt}</div>
        </div>
      )}

      {/* Transparency Status */}
      {hasTransparency && (
        <div 
          className="mt-3 p-2 rounded text-xs text-center"
          style={{ 
            backgroundColor: 'var(--success-bg, #22c55e)', 
            color: 'var(--success-text, #ffffff)',
            opacity: 0.9 
          }}
        >
          🎭 Background removed - Ready for character application!
        </div>
      )}
      
      {/* Generation Notice */}
      <div 
        className="mt-3 p-2 rounded text-xs text-center"
        style={{ 
          backgroundColor: 'var(--button-bg)', 
          color: 'var(--button-text)',
          opacity: 0.8 
        }}
      >
        Generated with GPT-image-1 {hasTransparency ? '+ Background Removal' : ''}
      </div>
    </div>
  );
} 