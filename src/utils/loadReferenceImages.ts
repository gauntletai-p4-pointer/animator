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
  console.log('🔍 getRelevantReferenceImages: Processing prompt:', `"${userPrompt}"`);
  console.log('🔍 getRelevantReferenceImages: Total images available:', images.length);
  console.log('🔍 getRelevantReferenceImages: Available image names:', images.map(img => img.name));
  
  const prompt = userPrompt.toLowerCase();
  
  // If prompt mentions specific body parts, include those
  const relevantImages: ReferenceImage[] = [];
  
  // Add body parts if mentioned
  if (prompt.includes('head') || prompt.includes('face') || prompt.includes('hat') || prompt.includes('helmet')) {
    const headImages = images.filter(img => img.name.includes('head') || img.name.includes('eye') || img.name.includes('mouth'));
    console.log('🎯 getRelevantReferenceImages: Found', headImages.length, 'head-related images:', headImages.map(img => img.name));
    relevantImages.push(...headImages);
  }
  
  if (prompt.includes('arm') || prompt.includes('hand') || prompt.includes('fist') || prompt.includes('glove')) {
    const armImages = images.filter(img => img.name.includes('arm') || img.name.includes('fist') || img.name.includes('bracer'));
    console.log('🎯 getRelevantReferenceImages: Found', armImages.length, 'arm-related images:', armImages.map(img => img.name));
    relevantImages.push(...armImages);
  }
  
  if (prompt.includes('leg') || prompt.includes('foot') || prompt.includes('shoe') || prompt.includes('boot')) {
    const legImages = images.filter(img => img.name.includes('thigh') || img.name.includes('shin') || img.name.includes('foot'));
    console.log('🎯 getRelevantReferenceImages: Found', legImages.length, 'leg-related images:', legImages.map(img => img.name));
    relevantImages.push(...legImages);
  }
  
  if (prompt.includes('body') || prompt.includes('torso') || prompt.includes('chest') || prompt.includes('shirt')) {
    const bodyImages = images.filter(img => img.name.includes('torso') || img.name.includes('neck'));
    console.log('🎯 getRelevantReferenceImages: Found', bodyImages.length, 'body-related images:', bodyImages.map(img => img.name));
    relevantImages.push(...bodyImages);
  }
  
  // If no specific matches, return a representative sample
  if (relevantImages.length === 0) {
    console.log('🔍 getRelevantReferenceImages: No specific matches, returning representative sample');
    const representativeSample = images.filter(img => 
      img.name.includes('head') || 
      img.name.includes('torso') || 
      img.name.includes('arm') || 
      img.name.includes('leg')
    ).slice(0, 5);
    console.log('📸 getRelevantReferenceImages: Representative sample (' + representativeSample.length + ' images):', representativeSample.map(img => img.name));
    return representativeSample;
  }
  
  console.log('🎯 getRelevantReferenceImages: Found', relevantImages.length, 'relevant images for prompt:', relevantImages.map(img => img.name));
  return relevantImages;
}

/**
 * Interface for user-uploaded images (matches ReferencesUploadSidebar structure)
 */
export interface UploadedImage {
  id: string;
  name: string;
  url: string;
  file?: File;
}

/**
 * Gets user-uploaded reference images from localStorage
 * @returns Array of user-uploaded images as ReferenceImage objects
 */
export function getUserUploadedImages(): ReferenceImage[] {
  console.log('🔍 getUserUploadedImages: Loading user-uploaded images from localStorage');
  
  try {
    const savedImages = localStorage.getItem('visual-references');
    if (!savedImages) {
      console.log('📸 getUserUploadedImages: No user-uploaded images found in localStorage');
      return [];
    }
    
    const uploadedImages: UploadedImage[] = JSON.parse(savedImages);
    console.log('📸 getUserUploadedImages: Found', uploadedImages.length, 'user-uploaded images');
    
    // Convert to ReferenceImage format
    const referenceImages: ReferenceImage[] = uploadedImages.map((img, index) => ({
      name: img.name.replace(/\.[^/.]+$/, '') || `user-uploaded-${index + 1}`, // Remove file extension or create generic name
      path: img.url,
      url: img.url, // This should be a data: URL for base64 images
      type: 'texture' as const, // User-uploaded images are considered textures/references
    }));
    
    console.log('✅ getUserUploadedImages: Converted to reference format:', referenceImages.map(img => ({ 
      name: img.name, 
      isDataUrl: img.url.startsWith('data:') 
    })));
    
    return referenceImages;
    
  } catch (error) {
    console.error('❌ getUserUploadedImages: Error loading user-uploaded images:', error);
    return [];
  }
}

/**
 * Combines asset reference images with user-uploaded images
 * @param assetImages - Images from the assets directory
 * @param userUploadedImages - User-uploaded images from localStorage
 * @returns Combined array of all reference images
 */
export function combineReferenceImages(
  assetImages: ReferenceImage[],
  userUploadedImages: ReferenceImage[]
): ReferenceImage[] {
  console.log('🔄 combineReferenceImages: Combining reference images');
  console.log('   📁 Asset images:', assetImages.length);
  console.log('   📤 User-uploaded images:', userUploadedImages.length);
  
  const combined = [...assetImages, ...userUploadedImages];
  console.log('✅ combineReferenceImages: Combined total:', combined.length, 'images');
  
  return combined;
}

/**
 * Gets the original body part image for a specific target slot
 * @param targetSlot - The slot name (e.g., 'head', 'torso', 'arm')
 * @param images - Array of reference images to search through
 * @returns The original body part image if found, null otherwise
 */
export function getOriginalBodyPartImage(
  targetSlot: string, 
  images: ReferenceImage[]
): ReferenceImage | null {
  console.log('🔍 getOriginalBodyPartImage: Looking for original image for slot:', targetSlot);
  
  const slotLower = targetSlot.toLowerCase();
  
  // Find the original image for this body part
  const originalImage = images.find(img => {
    const imgName = img.name.toLowerCase();
    
    // Direct matches
    if (imgName === slotLower) {
      return true;
    }
    
    // For head, look for head-related images
    if (slotLower.includes('head') && imgName.includes('head')) {
      return true;
    }
    
    // For torso/body
    if ((slotLower.includes('torso') || slotLower.includes('body')) && imgName.includes('torso')) {
      return true;
    }
    
    // For arm parts
    if (slotLower.includes('arm') && imgName.includes('arm')) {
      return true;
    }
    
    // For leg parts - match specific parts, not just any leg part
    if (slotLower.includes('thigh') && imgName.includes('thigh')) {
      return true;
    }
    if (slotLower.includes('shin') && imgName.includes('shin')) {
      return true;
    }
    if (slotLower.includes('foot') && imgName.includes('foot')) {
      return true;
    }
    
    return false;
  });
  
  if (originalImage) {
    console.log('✅ getOriginalBodyPartImage: Found original image:', originalImage.name);
  } else {
    console.log('❌ getOriginalBodyPartImage: No original image found for slot:', targetSlot);
  }
  
  return originalImage || null;
}

/**
 * Enhanced version of getRelevantReferenceImages that includes the original body part image
 * @param images - Array of all reference images
 * @param userPrompt - The user's request prompt
 * @param targetSlot - The target slot being modified (optional)
 * @returns Array of relevant reference images including the original body part
 */
export function getRelevantReferenceImagesWithOriginal(
  images: ReferenceImage[], 
  userPrompt: string,
  targetSlot?: string
): ReferenceImage[] {
  console.log('🔍 getRelevantReferenceImagesWithOriginal: Processing prompt:', `"${userPrompt}"`);
  console.log('🔍 getRelevantReferenceImagesWithOriginal: Target slot:', targetSlot || 'auto-detect');
  
  const selectedImages: ReferenceImage[] = [];
  
  // PRIORITY 1: Add the original body part image if we have a target slot
  if (targetSlot) {
    const originalImage = getOriginalBodyPartImage(targetSlot, images);
    if (originalImage) {
      selectedImages.push(originalImage);
      console.log('✅ getRelevantReferenceImagesWithOriginal: Added original body part image:', originalImage.name);
    } else {
      console.log('❌ getRelevantReferenceImagesWithOriginal: No original body part image found for slot:', targetSlot);
    }
  }
  
  // PRIORITY 2: Add ALL user-uploaded images as aesthetic references
  const userUploadedImages = images.filter(img => img.type === 'texture' && img.url.startsWith('data:'));
  if (userUploadedImages.length > 0) {
    selectedImages.push(...userUploadedImages);
    console.log('✅ getRelevantReferenceImagesWithOriginal: Added', userUploadedImages.length, 'user-uploaded images');
    userUploadedImages.forEach(img => console.log('   📤 User-uploaded:', img.name));
  } else {
    console.log('⚠️ getRelevantReferenceImagesWithOriginal: No user-uploaded images found');
  }
  
  // PRIORITY 3: If no target slot, fall back to general body part detection
  if (!targetSlot) {
    console.log('🔍 getRelevantReferenceImagesWithOriginal: No target slot provided, using general detection');
    const generalImages = getRelevantReferenceImages(images, userPrompt);
    
    // Only add asset images (not user-uploaded ones as they're already added)
    const assetImages = generalImages.filter(img => img.type !== 'texture' || !img.url.startsWith('data:'));
    selectedImages.push(...assetImages.slice(0, 3)); // Limit to 3 additional images
    
    console.log('✅ getRelevantReferenceImagesWithOriginal: Added', assetImages.length, 'general reference images');
  }
  
  // Remove duplicates (in case the original image was already included)
  const uniqueImages = selectedImages.filter((img, index, self) => 
    index === self.findIndex(i => i.name === img.name)
  );
  
  console.log('🎯 getRelevantReferenceImagesWithOriginal: Final selection:', uniqueImages.length, 'images');
  uniqueImages.forEach(img => {
    const imageType = img.url.startsWith('data:') ? 'USER-UPLOADED' : 'ASSET';
    console.log(`   📸 ${imageType}: ${img.name} (${img.type})`);
  });
  
  return uniqueImages;
} 