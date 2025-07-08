'use client';

import React from 'react';

interface ReferenceImage {
  name: string;
  url: string;
  type: 'character_part' | 'texture' | 'accessory';
}

interface ReferenceImageDisplayProps {
  images: ReferenceImage[];
  targetSlot?: string;
}

export default function ReferenceImageDisplay({ images, targetSlot }: ReferenceImageDisplayProps) {
  const bodyPartImages = images.filter(img => !img.url.startsWith('data:'));
  const userImages = images.filter(img => img.url.startsWith('data:'));

  if (images.length === 0) {
    return (
      <div className="p-4 border rounded-lg" style={{ backgroundColor: 'var(--select-bg)', borderColor: 'var(--select-border)' }}>
        <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
          ⚠️ No reference images found for generation
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg space-y-4" style={{ backgroundColor: 'var(--select-bg)', borderColor: 'var(--select-border)' }}>
      <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
        🔍 Reference Images Selected for Generation:
      </div>
      
      {targetSlot && (
        <div className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
          🎯 Target body part: <strong>{targetSlot}</strong>
        </div>
      )}

      {/* Body Part Images */}
      {bodyPartImages.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            📁 Body Part Reference:
          </div>
          {bodyPartImages.map((img, index) => (
            <div key={index} className="flex items-center space-x-3 p-2 rounded" style={{ backgroundColor: 'var(--background)' }}>
              <img 
                src={img.url} 
                alt={img.name}
                className="w-16 h-16 object-cover rounded border"
                style={{ borderColor: 'var(--select-border)' }}
                onError={(e) => {
                  console.error('❌ Failed to load body part image:', img.url);
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
                onLoad={() => {
                  console.log('✅ Successfully loaded body part image:', img.name);
                }}
              />
              <div className="flex-1">
                <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  {img.name}
                </div>
                <div className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.6 }}>
                  For proportions and positioning
                </div>
                <div className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
                  {img.url}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* User Uploaded Images */}
      {userImages.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            📤 User Aesthetic References:
          </div>
          <div className="grid grid-cols-2 gap-2">
            {userImages.map((img, index) => (
              <div key={index} className="space-y-1">
                <img 
                  src={img.url} 
                  alt={img.name}
                  className="w-full h-24 object-cover rounded border"
                  style={{ borderColor: 'var(--select-border)' }}
                  onError={(e) => {
                    console.error('❌ Failed to load user image:', img.name);
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                  onLoad={() => {
                    console.log('✅ Successfully loaded user image:', img.name);
                  }}
                />
                <div className="text-xs" style={{ color: 'var(--foreground)' }}>
                  {img.name}
                </div>
                <div className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.6 }}>
                  For art style and aesthetics ({Math.round(img.url.length / 1000)}KB)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.6 }}>
        💡 These images will be sent to GPT-image-1 to provide context for generating your request.
      </div>
    </div>
  );
} 