// 1. SKELETON DATA FILE (character.json) - Exported from Spine Editor
// This is the main skeleton structure file containing bones, slots, skins, etc.

interface SpineJsonFormat {
  skeleton: {
    hash: string;
    spine: string;      // Spine version
    x: number;
    y: number;
    width: number;
    height: number;
    images: string;     // Path to images
    audio?: string;     // Path to audio files
  };
  bones: Array<{
    name: string;
    parent?: string;
    length?: number;
    x?: number;
    y?: number;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
    shearX?: number;
    shearY?: number;
    inherit?: string;
  }>;
  slots: Array<{
    name: string;
    bone: string;
    color?: string;
    dark?: string;
    attachment?: string;
    blend?: string;
  }>;
  skins: {
    [skinName: string]: {
      [slotName: string]: {
        [attachmentName: string]: {
          type?: string;
          x?: number;
          y?: number;
          rotation?: number;
          width?: number;
          height?: number;
          // ... attachment specific properties
        };
      };
    };
  };
  animations?: {
    [animationName: string]: {
      slots?: any;
      bones?: any;
      // ... animation data
    };
  };
}