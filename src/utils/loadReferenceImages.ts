/**
 * Utility functions for loading reference images from the assets directory
 */

export interface ReferenceImage {
  name: string;
  path: string;
  url: string;
  type: 'character_part' | 'texture' | 'accessory';
}

/**
 * List of character part images available in the assets directory
 */
const CHARACTER_PART_IMAGES = [
  'head.png',
  'torso.png',
  'neck.png',
  'front-thigh.png',
  'front-shin.png',
  'front-foot.png',
  'rear-thigh.png',
  'rear-shin.png',
  'rear-foot.png',
  'front-upper-arm.png',
  'rear-upper-arm.png',
  'front-fist-closed.png',
  'front-fist-open.png',
  'front-bracer.png',
  'rear-bracer.png',
  'eye-indifferent.png',
  'eye-surprised.png',
  'mouth-grind.png',
  'mouth-oooo.png',
  'mouth-smile.png',
  'goggles.png',
  'gun.png',
  'crosshair.png',
  'hoverboard-board.png',
  'hoverboard-thruster.png',
  'hoverglow-small.png',
  'muzzle-glow.png',
  'muzzle-ring.png',
  'muzzle01.png',
  'muzzle02.png',
  'muzzle03.png',
  'muzzle04.png',
  'muzzle05.png',
  'portal-bg.png',
  'portal-flare1.png',
  'portal-flare2.png',
  'portal-flare3.png',
  'portal-shade.png',
  'portal-streaks1.png',
  'portal-streaks2.png',
];

/**
 * Loads reference images from the assets directory
 * @returns Promise<ReferenceImage[]> - Array of reference image objects
 */
export async function loadReferenceImages(): Promise<ReferenceImage[]> {
  console.log('🔍 loadReferenceImages: Loading character part references');
  
  const referenceImages: ReferenceImage[] = [];
  
  // Load character part images
  for (const imageName of CHARACTER_PART_IMAGES) {
    const imagePath = `/assets/spineboy/images/${imageName}`;
    
    try {
      // Test if the image exists by attempting to load it
      const response = await fetch(imagePath, { method: 'HEAD' });
      
      if (response.ok) {
        const referenceImage: ReferenceImage = {
          name: imageName.replace('.png', ''),
          path: imagePath,
          url: imagePath,
          type: getImageType(imageName),
        };
        
        referenceImages.push(referenceImage);
        console.log(`✅ loadReferenceImages: Added ${imageName}`);
      } else {
        console.log(`⚠️ loadReferenceImages: ${imageName} not found, skipping`);
      }
    } catch (error) {
      console.log(`❌ loadReferenceImages: Error loading ${imageName}:`, error);
    }
  }
  
  console.log(`📸 loadReferenceImages: Loaded ${referenceImages.length} reference images`);
  return referenceImages;
}

/**
 * Determines the type of image based on its filename
 * @param imageName - The filename of the image
 * @returns The type category of the image
 */
function getImageType(imageName: string): 'character_part' | 'texture' | 'accessory' {
  const name = imageName.toLowerCase();
  
  // Body parts
  if (name.includes('head') || name.includes('torso') || name.includes('neck') ||
      name.includes('thigh') || name.includes('shin') || name.includes('foot') ||
      name.includes('arm') || name.includes('fist') || name.includes('bracer')) {
    return 'character_part';
  }
  
  // Accessories and equipment
  if (name.includes('goggles') || name.includes('gun') || name.includes('crosshair') ||
      name.includes('hoverboard') || name.includes('portal')) {
    return 'accessory';
  }
  
  // Effects and textures
  if (name.includes('muzzle') || name.includes('glow') || name.includes('flare') ||
      name.includes('streak') || name.includes('eye') || name.includes('mouth')) {
    return 'texture';
  }
  
  return 'character_part';
}

/**
 * Filters reference images by type
 * @param images - Array of reference images
 * @param type - Type to filter by
 * @returns Filtered array of reference images
 */
export function filterReferenceImagesByType(
  images: ReferenceImage[], 
  type: 'character_part' | 'texture' | 'accessory'
): ReferenceImage[] {
  return images.filter(img => img.type === type);
}

/**
 * Gets reference images relevant to a specific request
 * @param images - Array of all reference images
 * @param userPrompt - The user's request prompt
 * @returns Array of relevant reference images
 */
export function getRelevantReferenceImages(
  images: ReferenceImage[], 
  userPrompt: string
): ReferenceImage[] {
  const prompt = userPrompt.toLowerCase();
  
  // If prompt mentions specific body parts, include those
  const relevantImages: ReferenceImage[] = [];
  
  // Add body parts if mentioned
  if (prompt.includes('head') || prompt.includes('face') || prompt.includes('hat') || prompt.includes('helmet')) {
    relevantImages.push(...images.filter(img => img.name.includes('head') || img.name.includes('eye') || img.name.includes('mouth')));
  }
  
  if (prompt.includes('arm') || prompt.includes('hand') || prompt.includes('fist') || prompt.includes('glove')) {
    relevantImages.push(...images.filter(img => img.name.includes('arm') || img.name.includes('fist') || img.name.includes('bracer')));
  }
  
  if (prompt.includes('leg') || prompt.includes('foot') || prompt.includes('shoe') || prompt.includes('boot')) {
    relevantImages.push(...images.filter(img => img.name.includes('thigh') || img.name.includes('shin') || img.name.includes('foot')));
  }
  
  if (prompt.includes('body') || prompt.includes('torso') || prompt.includes('chest') || prompt.includes('shirt')) {
    relevantImages.push(...images.filter(img => img.name.includes('torso') || img.name.includes('neck')));
  }
  
  // If no specific matches, return a representative sample
  if (relevantImages.length === 0) {
    console.log('🔍 getRelevantReferenceImages: No specific matches, returning representative sample');
    return images.filter(img => 
      img.name.includes('head') || 
      img.name.includes('torso') || 
      img.name.includes('arm') || 
      img.name.includes('leg')
    ).slice(0, 5);
  }
  
  console.log(`🎯 getRelevantReferenceImages: Found ${relevantImages.length} relevant images for prompt`);
  return relevantImages;
} 