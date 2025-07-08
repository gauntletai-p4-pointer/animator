'use client';

import SpineAnimator from '@/components/SpineAnimator';
import ThemeToggle from '@/components/ThemeToggle';
import ReferenceImages from '@/components/ReferenceImages';
import { useState } from 'react';

interface ReferenceImage {
  id: string;
  url: string;
  file: File;
}

export default function Home() {
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="absolute top-4 left-4 z-20 w-80">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
          Spine2D Animation Studio
        </h1>
        <ThemeToggle />
        <div className="mt-4">
          <ReferenceImages onImagesChange={setReferenceImages} />
        </div>
      </div>
      <SpineAnimator referenceImages={referenceImages} />
    </div>
  );
}
