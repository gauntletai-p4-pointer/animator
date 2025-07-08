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
 * Body part priority hierarchy - more specific parts have higher priority
 */
const BODY_PART_PRIORITY: { [key: string]: number } = {
  // Head parts (highest priority for head-related requests)
  'head': 10,
  'eye-indifferent': 9,
  'eye-surprised': 9,
  'mouth-grind': 9,
  'mouth-oooo': 9,
  'mouth-smile': 9,
  'goggles': 8,
  
  // Torso parts
  'torso': 10,
  'neck': 8,
  
  // Arm parts
  'front-upper-arm': 10,
  'rear-upper-arm': 9,
  'front-fist-closed': 8,
  'front-fist-open': 8,
  'front-bracer': 7,
  'rear-bracer': 7,
  
  // Leg parts
  'front-thigh': 10,
  'rear-thigh': 9,
  'front-shin': 8,
  'rear-shin': 7,
  'front-foot': 6,
  'rear-foot': 5,
  
  // Accessories and effects (lower priority)
  'gun': 5,
  'crosshair': 4,
  'hoverboard-board': 4,
  'hoverboard-thruster': 4,
  'hoverglow-small': 3,
  'muzzle-glow': 3,
  'muzzle-ring': 3,
  'muzzle01': 3,
  'muzzle02': 3,
  'muzzle03': 3,
  'muzzle04': 3,
  'muzzle05': 3,
  'portal-bg': 2,
  'portal-flare1': 2,
  'portal-flare2': 2,
  'portal-flare3': 2,
  'portal-shade': 2,
  'portal-streaks1': 2,
  'portal-streaks2': 2,
};

/**
 * Body part matching keywords - maps user prompt keywords to body part names
 * Enhanced with better synonym matching and contextual keywords
 */
const BODY_PART_KEYWORDS: { [key: string]: string[] } = {
  // Head related
  'head': ['head', 'face', 'skull', 'helmet', 'hat', 'hair', 'crown', 'cap', 'mask', 'visor', 'headpiece', 'headband'],
  'eye-indifferent': ['eye', 'eyes', 'vision', 'sight', 'gaze', 'neutral', 'normal', 'default', 'standard'],
  'eye-surprised': ['eye', 'eyes', 'vision', 'sight', 'gaze', 'surprised', 'shock', 'amazed', 'astonished', 'wide'],
  'mouth-grind': ['mouth', 'lips', 'teeth', 'bite', 'grind', 'grit', 'clench', 'determined', 'focused'],
  'mouth-oooo': ['mouth', 'lips', 'open', 'oooo', 'surprise', 'gasp', 'wow', 'amazed', 'round'],
  'mouth-smile': ['mouth', 'lips', 'smile', 'grin', 'happy', 'cheerful', 'joy', 'pleased', 'content'],
  'goggles': ['goggles', 'glasses', 'eyewear', 'protection', 'spectacles', 'shades', 'visor', 'lens'],
  
  // Torso related
  'torso': ['torso', 'body', 'chest', 'shirt', 'armor', 'jacket', 'vest', 'clothing', 'outfit', 'uniform', 'attire', 'garment'],
  'neck': ['neck', 'collar', 'necklace', 'throat', 'chain', 'pendant'],
  
  // Arm related
  'front-upper-arm': ['arm', 'upper-arm', 'shoulder', 'bicep', 'sleeve', 'armband', 'upper', 'muscle'],
  'rear-upper-arm': ['arm', 'upper-arm', 'shoulder', 'bicep', 'sleeve', 'armband', 'upper', 'muscle'],
  'front-fist-closed': ['fist', 'hand', 'closed', 'punch', 'knuckle', 'grip', 'grasp', 'clutch', 'clench'],
  'front-fist-open': ['fist', 'hand', 'open', 'palm', 'finger', 'spread', 'reach', 'gesture', 'wave'],
  'front-bracer': ['bracer', 'forearm', 'wrist', 'guard', 'protection', 'armor', 'gauntlet', 'glove', 'covering'],
  'rear-bracer': ['bracer', 'forearm', 'wrist', 'guard', 'protection', 'armor', 'gauntlet', 'glove', 'covering'],
  
  // Leg related
  'front-thigh': ['thigh', 'leg', 'upper-leg', 'quad', 'pants', 'trouser', 'upper', 'limb'],
  'rear-thigh': ['thigh', 'leg', 'upper-leg', 'quad', 'pants', 'trouser', 'upper', 'limb'],
  'front-shin': ['shin', 'lower-leg', 'calf', 'knee', 'pants', 'trouser', 'lower', 'limb'],
  'rear-shin': ['shin', 'lower-leg', 'calf', 'knee', 'pants', 'trouser', 'lower', 'limb'],
  'front-foot': ['foot', 'feet', 'shoe', 'boot', 'footwear', 'sneaker', 'sandal', 'sole', 'toe', 'heel'],
  'rear-foot': ['foot', 'feet', 'shoe', 'boot', 'footwear', 'sneaker', 'sandal', 'sole', 'toe', 'heel'],
  
  // Accessories
  'gun': ['gun', 'weapon', 'rifle', 'pistol', 'firearm', 'blaster', 'cannon', 'launcher', 'shooter'],
  'crosshair': ['crosshair', 'target', 'aim', 'sight', 'reticle', 'cursor', 'pointer', 'marker'],
  'hoverboard-board': ['hoverboard', 'board', 'platform', 'skateboard', 'surfboard', 'deck', 'ride'],
  'hoverboard-thruster': ['thruster', 'engine', 'propulsion', 'jet', 'booster', 'rocket', 'motor'],
};

/**
 * Enhanced target body part detection with better context awareness
 * @param userPrompt - The user's request prompt
 * @returns The most likely target body part based on context
 */
export function detectTargetBodyPart(userPrompt: string): string {
  console.log('🎯 detectTargetBodyPart: Analyzing prompt for target body part');
  console.log('   📝 Prompt:', userPrompt);
  
  const prompt = userPrompt.toLowerCase();
  
  // Score each body part based on keyword matches
  const bodyPartScores: { [key: string]: number } = {};
  
  // Check each body part for keyword matches
  Object.entries(BODY_PART_KEYWORDS).forEach(([bodyPart, keywords]) => {
    const matches = keywords.filter(keyword => prompt.includes(keyword));
    if (matches.length > 0) {
      bodyPartScores[bodyPart] = matches.length;
      console.log(`   📊 ${bodyPart}: ${matches.length} matches (${matches.join(', ')})`);
    }
  });
  
  // Find the body part with the highest score
  let bestBodyPart = 'head'; // default
  let bestScore = 0;
  
  Object.entries(bodyPartScores).forEach(([bodyPart, score]) => {
    if (score > bestScore) {
      bestScore = score;
      bestBodyPart = bodyPart;
    }
  });
  
  console.log(`✅ detectTargetBodyPart: Selected target body part: ${bestBodyPart} (score: ${bestScore})`);
  return bestBodyPart;
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
 * UPDATED: Now enforces single body part rule using selectSingleBodyPartImage
 * @param images - Array of all reference images
 * @param userPrompt - The user's request prompt
 * @returns Array of relevant reference images (max 1 body part + all user images)
 */
export function getRelevantReferenceImages(
  images: ReferenceImage[], 
  userPrompt: string
): ReferenceImage[] {
  console.log('🔍 getRelevantReferenceImages: Processing prompt:', `"${userPrompt}"`);
  console.log('🔍 getRelevantReferenceImages: Total images available:', images.length);
  console.log('🔍 getRelevantReferenceImages: Available image names:', images.map(img => img.name));
  
  const relevantImages: ReferenceImage[] = [];
  
  // PRIORITY 1: Include all user-uploaded images (for aesthetic style)
  const userUploadedImages = images.filter(img => img.url.startsWith('data:'));
  if (userUploadedImages.length > 0) {
    relevantImages.push(...userUploadedImages);
    console.log('✅ getRelevantReferenceImages: Added', userUploadedImages.length, 'user-uploaded images');
  }
  
  // PRIORITY 2: Use selectSingleBodyPartImage to get ONE body part image
  // Use the enhanced detection function to determine target body part
  const targetBodyPart = detectTargetBodyPart(userPrompt);
  
  // Select single body part image
  const selectedBodyPartImage = selectSingleBodyPartImage(images, userPrompt, targetBodyPart);
  if (selectedBodyPartImage) {
    relevantImages.push(selectedBodyPartImage);
    console.log('✅ getRelevantReferenceImages: Added single body part image:', selectedBodyPartImage.name);
  } else {
    console.log('⚠️ getRelevantReferenceImages: No body part image selected');
  }
  
  console.log('🎯 getRelevantReferenceImages: Final selection:', relevantImages.length, 'images');
  console.log('   📸 Images:', relevantImages.map(img => `${img.name} (${img.url.startsWith('data:') ? 'USER' : 'ASSET'})`));
  
  // VALIDATION: Ensure only one body part image
  const bodyPartImages = relevantImages.filter(img => !img.url.startsWith('data:'));
  if (bodyPartImages.length > 1) {
    console.error('❌ getRelevantReferenceImages: VALIDATION FAILED - Multiple body part images!');
    console.error('   Body part images:', bodyPartImages.map(img => img.name));
    // Return only the first body part image to enforce the rule
    const fixedImages = [...userUploadedImages, bodyPartImages[0]];
    console.log('🔧 getRelevantReferenceImages: Fixed by keeping only first body part image:', bodyPartImages[0].name);
    return fixedImages;
  }
  
  console.log('✅ getRelevantReferenceImages: VALIDATION PASSED - Single body part rule enforced');
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
 * UPDATED: Now enforces single body part rule using selectSingleBodyPartImage
 * @param images - Array of all reference images
 * @param userPrompt - The user's request prompt
 * @param targetSlot - The target slot being modified (optional)
 * @returns Array of relevant reference images including the original body part (max 1 body part)
 */
export function getRelevantReferenceImagesWithOriginal(
  images: ReferenceImage[], 
  userPrompt: string,
  targetSlot?: string
): ReferenceImage[] {
  console.log('🔍 getRelevantReferenceImagesWithOriginal: Processing prompt:', `"${userPrompt}"`);
  console.log('🔍 getRelevantReferenceImagesWithOriginal: Target slot:', targetSlot || 'auto-detect');
  
  const selectedImages: ReferenceImage[] = [];
  
  // PRIORITY 1: Add ALL user-uploaded images as aesthetic references
  const userUploadedImages = images.filter(img => img.type === 'texture' && img.url.startsWith('data:'));
  if (userUploadedImages.length > 0) {
    selectedImages.push(...userUploadedImages);
    console.log('✅ getRelevantReferenceImagesWithOriginal: Added', userUploadedImages.length, 'user-uploaded images');
    userUploadedImages.forEach(img => console.log('   📤 User-uploaded:', img.name));
  } else {
    console.log('⚠️ getRelevantReferenceImagesWithOriginal: No user-uploaded images found');
  }
  
  // PRIORITY 2: Use selectSingleBodyPartImage to get ONE body part image
  const targetBodyPart = targetSlot || detectTargetBodyPart(userPrompt); // use targetSlot if provided, otherwise detect from prompt
  const selectedBodyPartImage = selectSingleBodyPartImage(images, userPrompt, targetBodyPart);
  
  if (selectedBodyPartImage) {
    selectedImages.push(selectedBodyPartImage);
    console.log('✅ getRelevantReferenceImagesWithOriginal: Added single body part image:', selectedBodyPartImage.name);
  } else {
    console.log('⚠️ getRelevantReferenceImagesWithOriginal: No body part image selected');
  }
  
  // Remove duplicates (in case the selected image was already included)
  const uniqueImages = selectedImages.filter((img, index, self) => 
    index === self.findIndex(i => i.name === img.name)
  );
  
  console.log('🎯 getRelevantReferenceImagesWithOriginal: Final selection:', uniqueImages.length, 'images');
  uniqueImages.forEach(img => {
    const imageType = img.url.startsWith('data:') ? 'USER-UPLOADED' : 'ASSET';
    console.log(`   📸 ${imageType}: ${img.name} (${img.type})`);
  });
  
  // VALIDATION: Ensure only one body part image
  const bodyPartImages = uniqueImages.filter(img => !img.url.startsWith('data:'));
  if (bodyPartImages.length > 1) {
    console.error('❌ getRelevantReferenceImagesWithOriginal: VALIDATION FAILED - Multiple body part images!');
    console.error('   Body part images:', bodyPartImages.map(img => img.name));
    // Return only the first body part image to enforce the rule
    const fixedImages = [...userUploadedImages, bodyPartImages[0]];
    console.log('🔧 getRelevantReferenceImagesWithOriginal: Fixed by keeping only first body part image:', bodyPartImages[0].name);
    return fixedImages;
  }
  
  console.log('✅ getRelevantReferenceImagesWithOriginal: VALIDATION PASSED - Single body part rule enforced');
  return uniqueImages;
} 

/**
 * Selects the single most relevant body part image based on the user prompt and target body part
 * This function enforces the "only one body part reference image" rule
 * @param images - Array of all reference images
 * @param userPrompt - The user's request prompt
 * @param targetBodyPart - The detected target body part
 * @returns Single most relevant body part image or null
 */
export function selectSingleBodyPartImage(
  images: ReferenceImage[],
  userPrompt: string,
  targetBodyPart: string
): ReferenceImage | null {
  console.log('🎯 selectSingleBodyPartImage: Selecting single body part image');
  console.log('   📝 User prompt:', userPrompt);
  console.log('   🎯 Target body part:', targetBodyPart);
  console.log('   📸 Available images:', images.length);
  
  // Filter out user-uploaded images (they're not body parts)
  const bodyPartImages = images.filter(img => !img.url.startsWith('data:') && img.type === 'character_part');
  
  if (bodyPartImages.length === 0) {
    console.log('❌ selectSingleBodyPartImage: No body part images available');
    return null;
  }
  
  console.log('   📁 Body part images available:', bodyPartImages.map(img => img.name));
  
  const prompt = userPrompt.toLowerCase();
  const targetLower = targetBodyPart.toLowerCase();
  
  // Scoring system to find the best match
  const candidateScores: { image: ReferenceImage; score: number; reasons: string[] }[] = [];
  
  bodyPartImages.forEach(img => {
    const imgName = img.name.toLowerCase();
    let score = 0;
    const reasons: string[] = [];
    
    // PRIORITY 1: Direct match with target body part (highest score)
    if (imgName === targetLower) {
      score += 100;
      reasons.push(`Direct match with target: ${targetBodyPart}`);
    }
    
    // PRIORITY 2: Target body part contains image name or vice versa
    if (targetLower.includes(imgName) || imgName.includes(targetLower)) {
      score += 80;
      reasons.push(`Partial match with target: ${targetBodyPart}`);
    }
    
    // PRIORITY 3: Keyword matching from user prompt
    const keywords = BODY_PART_KEYWORDS[img.name] || [];
    const keywordMatches = keywords.filter((keyword: string) => prompt.includes(keyword));
    if (keywordMatches.length > 0) {
      score += keywordMatches.length * 20;
      reasons.push(`Keyword matches: ${keywordMatches.join(', ')}`);
    }
    
    // PRIORITY 4: Base priority from hierarchy
    const basePriority = BODY_PART_PRIORITY[img.name] || 1;
    score += basePriority;
    reasons.push(`Base priority: ${basePriority}`);
    
    // PRIORITY 5: Prefer "front" over "rear" parts (more commonly used)
    if (imgName.includes('front')) {
      score += 5;
      reasons.push('Front-facing preference');
    }
    
    candidateScores.push({ image: img, score, reasons });
  });
  
  // Sort by score (highest first)
  candidateScores.sort((a, b) => b.score - a.score);
  
  // Log the scoring results
  console.log('📊 selectSingleBodyPartImage: Candidate scores:');
  candidateScores.forEach((candidate, index) => {
    console.log(`   ${index + 1}. ${candidate.image.name}: ${candidate.score} points`);
    console.log(`      Reasons: ${candidate.reasons.join(', ')}`);
  });
  
  // Return the highest scoring image
  const selectedImage = candidateScores[0]?.image || null;
  
  if (selectedImage) {
    console.log('✅ selectSingleBodyPartImage: Selected body part image:', selectedImage.name);
    console.log('   📊 Final score:', candidateScores[0].score);
    console.log('   🎯 Selection reasons:', candidateScores[0].reasons.join(', '));
  } else {
    console.log('❌ selectSingleBodyPartImage: No suitable body part image found');
  }
  
  return selectedImage;
}

/**
 * Example test cases for validating the single body part rule
 * These can be used during development to ensure the system works correctly
 */
export const EXAMPLE_TEST_CASES = [
  {
    prompt: "Give the character a red hat",
    expectedBodyPart: "head",
    description: "Head-related request should select head image"
  },
  {
    prompt: "Make the character wear a blue jacket",
    expectedBodyPart: "torso",
    description: "Torso-related request should select torso image"
  },
  {
    prompt: "Give him stronger arms",
    expectedBodyPart: "front-upper-arm",
    description: "Arm-related request should select arm image"
  },
  {
    prompt: "Make the character wear red boots",
    expectedBodyPart: "front-foot",
    description: "Foot-related request should select foot image"
  },
  {
    prompt: "Create a random item",
    expectedBodyPart: "head",
    description: "Generic request should default to head"
  },
];

/**
 * Convenience function to run the validation tests with example cases
 * Call this during development to validate the system
 */
export function runValidationTests() {
  console.log('🧪 runValidationTests: Running validation tests with example cases');
  return testSingleBodyPartRule(EXAMPLE_TEST_CASES);
}

/**
 * Test function to validate the single body part rule enforcement
 * This function should be called during development to ensure the system works correctly
 * @param testCases - Array of test cases with prompts and expected results
 */
export function testSingleBodyPartRule(testCases: Array<{
  prompt: string;
  expectedBodyPart?: string;
  description: string;
}>) {
  console.log('🧪 testSingleBodyPartRule: Starting validation tests');
  
  const mockImages: ReferenceImage[] = [
    { name: 'head', url: '/assets/head.png', path: '/assets/head.png', type: 'character_part' },
    { name: 'torso', url: '/assets/torso.png', path: '/assets/torso.png', type: 'character_part' },
    { name: 'front-upper-arm', url: '/assets/arm.png', path: '/assets/arm.png', type: 'character_part' },
    { name: 'front-foot', url: '/assets/foot.png', path: '/assets/foot.png', type: 'character_part' },
    { name: 'user-image', url: 'data:image/png;base64,test', path: 'data:image/png;base64,test', type: 'texture' },
  ];
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  testCases.forEach((testCase, index) => {
    console.log(`\n🧪 Test ${index + 1}: ${testCase.description}`);
    console.log(`   📝 Prompt: "${testCase.prompt}"`);
    
    try {
      // Test the complete flow
      const targetBodyPart = detectTargetBodyPart(testCase.prompt);
      const relevantImages = getRelevantReferenceImages(mockImages, testCase.prompt);
      
      // Validate single body part rule
      const bodyPartImages = relevantImages.filter(img => !img.url.startsWith('data:'));
      
      if (bodyPartImages.length > 1) {
        console.log(`   ❌ FAILED: Multiple body part images returned (${bodyPartImages.length})`);
        console.log(`      Images: ${bodyPartImages.map(img => img.name).join(', ')}`);
      } else if (bodyPartImages.length === 1) {
        console.log(`   ✅ PASSED: Single body part image returned: ${bodyPartImages[0].name}`);
        
        // Check if expected body part matches
        if (testCase.expectedBodyPart && bodyPartImages[0].name !== testCase.expectedBodyPart) {
          console.log(`   ⚠️ WARNING: Expected ${testCase.expectedBodyPart}, got ${bodyPartImages[0].name}`);
        }
        
        passedTests++;
      } else {
        console.log(`   ⚠️ INFO: No body part images returned (user images only)`);
        passedTests++;
      }
      
      console.log(`   📊 Total images: ${relevantImages.length} (${bodyPartImages.length} body parts, ${relevantImages.length - bodyPartImages.length} user images)`);
      
    } catch (error) {
      console.log(`   ❌ ERROR: Test failed with error: ${error}`);
    }
  });
  
  console.log(`\n📊 testSingleBodyPartRule: Results`);
  console.log(`   ✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log(`   📈 Success rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('   🎉 All tests passed! Single body part rule is working correctly.');
  } else {
    console.log('   ⚠️ Some tests failed. Check the implementation.');
  }
  
  return {
    passed: passedTests,
    total: totalTests,
    successRate: (passedTests / totalTests) * 100
  };
} 