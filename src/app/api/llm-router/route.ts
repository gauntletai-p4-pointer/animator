import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { z } from 'zod';

// Define the simplified request categories
const RequestCategory = z.enum([
  'image_generation',        // Includes appearance changes, textures, accessories, etc.
  'full_character_generation', // Generate complete character with all body parts
  'animation',               // All animation types (walk, run, jump, dance, etc.)
  'export_assets',           // Export/download functionality
  'unknown'                  // Unclear or unhandled requests
]);

type RequestCategoryType = z.infer<typeof RequestCategory>;

// Schema for the LLM router response
const RouterResponseSchema = z.object({
  category: RequestCategory,
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  extractedParams: z.record(z.any()).optional(),
});

type RouterResponse = z.infer<typeof RouterResponseSchema>;

// Body part mapping for Spine2D character slots
const BODY_PART_MAPPING = {
  // Head/Face area
  head: ['head'],
  face: ['head'],
  hat: ['head'], // Could also be 'goggles' slot for some accessories
  helmet: ['head'],
  hair: ['head'],
  
  // Eyes
  eyes: ['eye'],
  eye: ['eye'],
  glasses: ['goggles'],
  goggles: ['goggles'],
  sunglasses: ['goggles'],
  
  // Mouth
  mouth: ['mouth'],
  lips: ['mouth'],
  teeth: ['mouth'],
  
  // Neck
  neck: ['neck'],
  collar: ['neck'],
  
  // Torso/Body
  torso: ['torso'],
  body: ['torso'],
  chest: ['torso'],
  shirt: ['torso'],
  jacket: ['torso'],
  vest: ['torso'],
  armor: ['torso'],
  
  // Arms
  arms: ['front-upper-arm', 'rear-upper-arm'],
  arm: ['front-upper-arm', 'rear-upper-arm'],
  'left arm': ['front-upper-arm'],
  'right arm': ['rear-upper-arm'],
  shoulder: ['front-upper-arm', 'rear-upper-arm'],
  
  // Forearms/Bracers
  forearm: ['front-bracer', 'rear-bracer'],
  forearms: ['front-bracer', 'rear-bracer'],
  bracer: ['front-bracer', 'rear-bracer'],
  bracers: ['front-bracer', 'rear-bracer'],
  'left forearm': ['front-bracer'],
  'right forearm': ['rear-bracer'],
  
  // Hands/Fists
  hands: ['front-fist'],
  hand: ['front-fist'],
  fist: ['front-fist'],
  fists: ['front-fist'],
  gloves: ['front-fist'],
  glove: ['front-fist'],
  
  // Legs - Thighs
  legs: ['front-thigh', 'rear-thigh'],
  leg: ['front-thigh', 'rear-thigh'],
  thigh: ['front-thigh', 'rear-thigh'],
  thighs: ['front-thigh', 'rear-thigh'],
  'left leg': ['front-thigh'],
  'right leg': ['rear-thigh'],
  
  // Legs - Shins
  shin: ['front-shin', 'rear-shin'],
  shins: ['front-shin', 'rear-shin'],
  'left shin': ['front-shin'],
  'right shin': ['rear-shin'],
  
  // Feet
  feet: ['front-foot', 'rear-foot'],
  foot: ['front-foot', 'rear-foot'],
  shoes: ['front-foot', 'rear-foot'],
  shoe: ['front-foot', 'rear-foot'],
  boots: ['front-foot', 'rear-foot'],
  boot: ['front-foot', 'rear-foot'],
  'left foot': ['front-foot'],
  'right foot': ['rear-foot'],
  
  // Weapons/Accessories
  weapon: ['gun'],
  gun: ['gun'],
  sword: ['gun'], // Gun slot can hold other weapons
  rifle: ['gun'],
  pistol: ['gun'],
  
  // Effects
  muzzle: ['muzzle'],
  flash: ['muzzle'],
  
  // General accessories that could go on head
  accessory: ['goggles'], // Default to goggles slot for accessories
  gear: ['goggles'],
};

// Function to analyze user prompt and determine body part
async function mapPromptToBodyPart(prompt: string): Promise<string[]> {
  console.log(`🔍 BODY PART MAPPING: Analyzing prompt: "${prompt}"`);
  
  const lowerPrompt = prompt.toLowerCase();
  
  // Direct keyword matching with prioritized order (most specific first)
  const prioritizedKeywords = [
    // Specific items first
    'shoes', 'shoe', 'boots', 'boot', 'left foot', 'right foot', 'feet', 'foot',
    'gloves', 'glove', 'hands', 'hand', 'fist', 'fists',
    'glasses', 'goggles', 'sunglasses',
    'left forearm', 'right forearm', 'forearms', 'forearm', 'bracers', 'bracer',
    'left shin', 'right shin', 'shins', 'shin',
    'left arm', 'right arm', 'arms', 'arm', 'shoulder',
    'left leg', 'right leg', 'legs', 'leg', 'thighs', 'thigh',
    // Then general body parts
    'head', 'face', 'hat', 'helmet', 'hair',
    'eyes', 'eye', 'mouth', 'lips', 'teeth',
    'neck', 'collar',
    'torso', 'body', 'chest', 'shirt', 'jacket', 'vest', 'armor',
    'weapon', 'gun', 'sword', 'rifle', 'pistol',
    'muzzle', 'flash',
    'accessory', 'gear'
  ];
  
     // Check prioritized keywords first
   for (const keyword of prioritizedKeywords) {
     if (lowerPrompt.includes(keyword) && keyword in BODY_PART_MAPPING) {
       const slots = BODY_PART_MAPPING[keyword as keyof typeof BODY_PART_MAPPING];
       console.log(`✅ BODY PART MAPPING: Found prioritized match "${keyword}" → slots: ${slots.join(', ')}`);
       return slots;
     }
   }
  
  // Use LLM to analyze more complex prompts
  const messages = [
    {
      role: 'system' as const,
      content: `You are analyzing user prompts to determine which body part of a 2D character they are referring to. 
      
Available body parts and their slots:
- head/face: head
- eyes: eye  
- glasses/goggles: goggles
- mouth: mouth
- neck: neck
- torso/body/chest/shirt: torso
- arms: front-upper-arm, rear-upper-arm
- forearms/bracers: front-bracer, rear-bracer
- hands/fists/gloves: front-fist
- legs/thighs: front-thigh, rear-thigh
- shins: front-shin, rear-shin
- feet/shoes/boots: front-foot, rear-foot
- weapon/gun: gun
- accessories (default): goggles

Respond with ONLY the slot name(s) separated by commas. If multiple slots apply, list them all.
If unclear, default to "head" for wearable items.

Examples:
- "make his face green" → head
- "give him a red hat" → head
- "change his shirt" → torso
- "new shoes" → front-foot,rear-foot
- "gloves" → front-fist
- "glasses" → goggles`
    },
    {
      role: 'user' as const,
      content: `Analyze this prompt: "${prompt}"`
    }
  ];

  try {
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      messages: [
        { role: 'system', content: messages[0].content },
        { role: 'user', content: messages[1].content }
      ],
      temperature: 0.1,
      maxTokens: 50,
    });

    const resultText = result.text.trim();
    if (resultText) {
      const slots = resultText.split(',').map((s: string) => s.trim());
      console.log(`🤖 BODY PART MAPPING: LLM analysis "${prompt}" → slots: ${slots.join(', ')}`);
      return slots;
    }
  } catch (error) {
    console.error('❌ BODY PART MAPPING: LLM analysis failed:', error);
  }
  
  // Default fallback
  console.log(`⚠️  BODY PART MAPPING: No match found, defaulting to head slot`);
  return ['head'];
}

/**
 * Rewrites user prompts into simple image generation requests using GPT-4.1-mini
 * @param userPrompt - The original user prompt
 * @returns Promise<string> - The rewritten prompt for image generation
 */
async function rewritePromptForImageGeneration(userPrompt: string): Promise<string> {
  console.log('✏️ PROMPT REWRITER: Starting prompt rewrite for image generation');
  console.log('📝 Original prompt:', userPrompt);

  const systemPrompt = `You are a prompt rewriter that converts user requests into simple image generation prompts.

Your job is to analyze the user's request and rewrite it as a clear, simple image generation prompt in the format:
"Generate an image of [item/object/thing]"

Examples:
- "Give him a hat" → "Generate an image of a hat"
- "Make the character wear red shoes" → "Generate an image of red shoes"  
- "Add a sword to his hand" → "Generate an image of a sword"
- "Create armor for his chest" → "Generate an image of chest armor"
- "Make him wear goggles" → "Generate an image of goggles"
- "Give him a blue cape" → "Generate an image of a blue cape"

Focus on:
1. Extracting the main item/object to be generated
2. Including important descriptors (color, style, type)
3. Keeping the prompt simple and direct
4. Always starting with "Generate an image of"

Respond with ONLY the rewritten prompt, nothing else.`;

  try {
    console.log('🤖 PROMPT REWRITER: Sending request to GPT-4.1-mini');
    
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2, // Low temperature for consistent rewriting
      maxTokens: 100, // Short responses expected
    });

    const rewrittenPrompt = result.text.trim();
    console.log('✅ PROMPT REWRITER: Successfully rewritten prompt:', rewrittenPrompt);
    
    return rewrittenPrompt;

  } catch (error) {
    console.error('❌ PROMPT REWRITER: Error during prompt rewriting:', error);
    
    // Fallback: create a simple rewrite based on common patterns
    let fallbackPrompt = userPrompt;
    
    // Simple pattern matching for common requests
    if (userPrompt.toLowerCase().includes('hat')) {
      fallbackPrompt = 'Generate an image of a hat';
    } else if (userPrompt.toLowerCase().includes('shoe') || userPrompt.toLowerCase().includes('boot')) {
      fallbackPrompt = 'Generate an image of shoes';
    } else if (userPrompt.toLowerCase().includes('sword')) {
      fallbackPrompt = 'Generate an image of a sword';
    } else if (userPrompt.toLowerCase().includes('armor')) {
      fallbackPrompt = 'Generate an image of armor';
    } else {
      fallbackPrompt = `Generate an image based on: ${userPrompt}`;
    }
    
    console.log('🔄 PROMPT REWRITER: Using fallback rewrite:', fallbackPrompt);
    return fallbackPrompt;
  }
}

/**
 * Categorizes user requests using GPT-4.1-mini
 * @param userPrompt - The user's natural language request
 * @returns Promise<RouterResponse> - The categorized request with confidence and reasoning
 */
async function categorizeRequest(userPrompt: string): Promise<RouterResponse> {
  console.log('🔍 LLM Router: Starting request categorization');
  console.log('📝 User prompt:', userPrompt);

  const systemPrompt = `You are an expert request categorizer for a Spine2D animation studio application. 
  
Your job is to analyze user requests and categorize them into one of these simplified categories:

1. "image_generation" - User wants to generate, create, or modify images/textures/appearance for a specific body part
   Examples: "generate a hat texture", "give him a hat", "red shoes", "create a sword image", "make a background image", "make the character wear a red hat", "make him blue", "change his shirt color", "add glasses", "make his face green"
   Extract: itemType, color, description, style

2. "full_character_generation" - User wants to generate a complete character with all body parts (NOT specific body parts)
   Examples: "generate a full knight character", "create a complete wizard", "make a full pirate character", "generate an entire robot", "create a complete superhero", "make a full medieval warrior", "generate a complete space marine"
   IMPORTANT: Requests for specific body parts like "generate the head for X character" or "generate the goggles for X character" should be categorized as "image_generation", NOT full_character_generation
   Extract: characterType, style, theme, color, description

3. "animation" - User wants to create or modify any type of animation (walk, run, jump, dance, idle, etc.)
   Examples: "make him walk", "create a walking animation", "make him run faster", "add a jump", "create a dance sequence", "make him stand still", "breathing animation", "make him wave"
   Extract: animationType, speed, direction, style, intensity

4. "export_assets" - User wants to export or download assets
   Examples: "export the animation", "download the character", "save the assets", "export the character assets"
   Extract: format, includeAnimations, includeTextures, exportType

5. "unknown" - The request doesn't fit any category or is unclear

IMPORTANT: 
- Appearance changes (colors, clothing, accessories, body parts) should be categorized as "image_generation" since they will generate images to apply to the character.
- Requests that mention specific body parts like "generate the head for", "generate the goggles for", "generate the mouth for" should ALWAYS be categorized as "image_generation", even if they mention "character"
- Only requests for generating an entire/complete/full character should be categorized as "full_character_generation"

Respond with ONLY a valid JSON object (no markdown formatting, no code blocks) containing:
- category: one of the above categories
- confidence: a number between 0 and 1 indicating your confidence
- reasoning: a brief explanation of why you chose this category
- extractedParams: any relevant parameters you can extract from the request (optional)

Be very specific and choose the most appropriate category. If unsure, use "unknown".

Example response format:
{"category": "image_generation", "confidence": 0.9, "reasoning": "User wants to change character appearance by making shirt green", "extractedParams": {"itemType": "shirt", "color": "green"}}`;

  try {
    console.log('🤖 LLM Router: Sending request to GPT-4.1-mini');
    
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1, // Low temperature for consistent categorization
    });

    console.log('📨 LLM Router: Raw response from GPT-4.1-mini:', result.text);

    // Parse the JSON response
    let parsedResponse: RouterResponse;
    try {
      // Clean the response text in case it has markdown formatting
      let cleanedText = result.text.trim();
      
      // Remove markdown code blocks if present
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      console.log('🧹 LLM Router: Cleaned response text:', cleanedText);
      
      const jsonResponse = JSON.parse(cleanedText);
      parsedResponse = RouterResponseSchema.parse(jsonResponse);
      console.log('✅ LLM Router: Successfully parsed response:', parsedResponse);
    } catch (parseError) {
      console.error('❌ LLM Router: Failed to parse response:', parseError);
      console.error('📄 Raw response that failed to parse:', result.text);
      
      // Try to extract category from text if JSON parsing fails
      let fallbackCategory: RequestCategoryType = 'unknown';
      const text = result.text.toLowerCase();
      
      if (text.includes('image') || text.includes('generate') || text.includes('texture') || 
          text.includes('color') || text.includes('skin') || text.includes('appearance') ||
          text.includes('hat') || text.includes('shirt') || text.includes('shoes')) {
        fallbackCategory = 'image_generation';
      } else if (text.includes('walk') || text.includes('run') || text.includes('jump') || 
                text.includes('dance') || text.includes('animation')) {
        fallbackCategory = 'animation';
      } else if (text.includes('export') || text.includes('download')) {
        fallbackCategory = 'export_assets';
      }
      
      console.log('🔄 LLM Router: Using fallback category:', fallbackCategory);
      
      // Fallback response
      parsedResponse = {
        category: fallbackCategory,
        confidence: 0.5,
        reasoning: 'Failed to parse LLM response, used text analysis fallback',
      };
    }

    return parsedResponse;

  } catch (error) {
    console.error('❌ LLM Router: Error during categorization:', error);
    
    // Fallback response
    return {
      category: 'unknown',
      confidence: 0,
      reasoning: 'Error during LLM categorization',
    };
  }
}

/**
 * Filters reference images to include only relevant body part and all user-uploaded images
 */
function filterReferenceImagesForGeneration(referenceImages: any[], targetBodyPart: string): any[] {
  console.log('🔍 REFERENCE FILTERING: Filtering reference images for generation');
  console.log('📸 REFERENCE FILTERING: Total images available:', referenceImages.length);
  console.log('🎯 REFERENCE FILTERING: Target body part:', targetBodyPart);
  
  if (!referenceImages || referenceImages.length === 0) {
    console.log('⚠️ REFERENCE FILTERING: No reference images provided');
    return [];
  }
  
  const filteredImages = [];
  
  // ALWAYS include all user-uploaded images (for aesthetic style)
  const userUploadedImages = referenceImages.filter(img => img.url.startsWith('data:'));
  if (userUploadedImages.length > 0) {
    filteredImages.push(...userUploadedImages);
    console.log('✅ REFERENCE FILTERING: Added', userUploadedImages.length, 'user-uploaded images');
    userUploadedImages.forEach(img => console.log('   📤 User-uploaded:', img.name));
  }
  
  // Find the specific body part image that matches the target
  const bodyPartImage = referenceImages.find(img => {
    // Skip user-uploaded images
    if (img.url.startsWith('data:')) return false;
    
    const imageName = img.name.toLowerCase();
    const bodyPartLower = targetBodyPart.toLowerCase();
    
    // Direct filename match
    if (imageName === bodyPartLower) {
      return true;
    }
    
    // Check if the image name contains the body part
    if (imageName.includes(bodyPartLower)) {
      return true;
    }
    
    // Special mappings for common body parts
    if (bodyPartLower === 'head' && imageName === 'head') return true;
    if (bodyPartLower === 'torso' && imageName === 'torso') return true;
    if (bodyPartLower === 'front-upper-arm' && imageName === 'front-upper-arm') return true;
    if (bodyPartLower === 'front-thigh' && imageName === 'front-thigh') return true;
    
    return false;
  });
  
  if (bodyPartImage) {
    filteredImages.push(bodyPartImage);
    console.log('✅ REFERENCE FILTERING: Added body part image:', bodyPartImage.name);
  } else {
    console.log('⚠️ REFERENCE FILTERING: No matching body part image found for:', targetBodyPart);
    console.log('   Available asset images:', referenceImages.filter(img => !img.url.startsWith('data:')).map(img => img.name));
  }
  
  console.log('🎯 REFERENCE FILTERING: Final filtered images:', filteredImages.length);
  filteredImages.forEach(img => {
    const imageType = img.url.startsWith('data:') ? 'USER-UPLOADED' : 'BODY-PART';
    console.log(`   📸 ${imageType}: ${img.name}`);
  });
  
  return filteredImages;
}

/**
 * Analyzes a reference body part image to describe its pose using GPT-4o Mini
 * @param imageBuffer - The image buffer to analyze
 * @param bodyPartName - The name of the body part (e.g., "goggles", "head", "foot")
 * @returns Promise<string> - Detailed pose description
 */
async function analyzePoseWithGPT4o(imageBuffer: Buffer, bodyPartName: string): Promise<string> {
  console.log(`🔍 POSE ANALYSIS: Analyzing pose for body part: ${bodyPartName}`);
  
  try {
    // Convert buffer to base64 for GPT-4o Mini
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64Image}`;
    
    console.log(`📸 POSE ANALYSIS: Image converted to base64 (${base64Image.length} chars)`);
    
    const analysisPrompt = `You are a pose analysis expert for 2D character sprites. Analyze this image of a "${bodyPartName}" and provide a detailed description of its pose, orientation, and visual characteristics.

Focus on these key aspects:
1. **ORIENTATION**: Which direction is it facing? (left, right, front, 3/4 view, etc.)
2. **ANGLE**: What is the viewing angle? (straight-on, tilted, angled, etc.)
3. **POSITIONING**: How is it positioned in the frame? (centered, offset, etc.)
4. **PROPORTIONS**: What are the size ratios and shape characteristics?
5. **PERSPECTIVE**: What is the camera/viewing perspective?
6. **DISTINCTIVE FEATURES**: Any unique visual elements that define the pose?

Provide a detailed, technical description that another AI could use to recreate the exact same pose and orientation. Be specific about angles, directions, and positioning.

Example format:
"The ${bodyPartName} is positioned at a 3/4 left-facing angle, tilted slightly upward at approximately 15 degrees. It's centered in the frame with the main bulk oriented toward the left side. The proportions show..."

Be precise and descriptive - this description will be used to generate a new item that matches this exact pose.`;

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: analysisPrompt },
            { 
              type: 'image', 
              image: dataUrl
            }
          ]
        }
      ],
      temperature: 0.1, // Low temperature for consistent analysis
      maxTokens: 500,
    });

    const poseDescription = result.text.trim();
    console.log(`✅ POSE ANALYSIS: Generated pose description (${poseDescription.length} chars)`);
    console.log(`📝 POSE ANALYSIS: Description: ${poseDescription}`);
    
    return poseDescription;

  } catch (error) {
    console.error('❌ POSE ANALYSIS: Error analyzing pose:', error);
    
    // Fallback description
    const fallbackDescription = `The ${bodyPartName} is positioned in a standard forward-facing orientation, centered in the frame with typical proportions for a 2D character sprite.`;
    console.log(`🔄 POSE ANALYSIS: Using fallback description: ${fallbackDescription}`);
    
    return fallbackDescription;
  }
}

/**
 * Core image generation function for a specific body part
 * This function contains the reusable logic for generating images for body parts
 */
async function generateImageForBodyPart(
  targetBodyPart: string,
  itemPrompt: string,
  userPrompt: string,
  extractedParams?: Record<string, any>,
  referenceImages?: any[]
): Promise<any> {
  console.log('🔧 GENERATE IMAGE FOR BODY PART: Function called');
  console.log('🎯 Target body part:', targetBodyPart);
  console.log('📝 Item prompt:', itemPrompt);
  console.log('📝 Original user prompt:', userPrompt);
  console.log('📋 Extracted params:', extractedParams);
  console.log('🖼️ Reference images:', referenceImages ? referenceImages.length : 0);
  
  // Extract potential image generation parameters
  const itemType = extractedParams?.itemType || 'accessory';
  const color = extractedParams?.color || 'default';
  const description = extractedParams?.description || itemPrompt;
  
  console.log('🔧 GENERATE IMAGE FOR BODY PART: Preparing generation parameters');
  console.log('   🎯 Item type:', itemType);
  console.log('   🎨 Color:', color);
  console.log('   📄 Description:', description);
  
  // Initialize variables at function level
  let poseDescription = '';
  
  try {
    console.log('⚡ GENERATE IMAGE FOR BODY PART: Starting generation process...');
    
    // Step 1: Filter reference images to include only relevant body part and all user images
    const filteredReferenceImages = filterReferenceImagesForGeneration(referenceImages || [], targetBodyPart);
    console.log('📸 GENERATE IMAGE FOR BODY PART: Filtered reference images:', filteredReferenceImages.length);
    
    // Step 2: Rewrite the item prompt for image generation
    const rewrittenPrompt = await rewritePromptForImageGeneration(itemPrompt);
    console.log('📝 GENERATE IMAGE FOR BODY PART: Rewritten prompt:', rewrittenPrompt);
    
    // Step 3: Create a detailed prompt for Spine2D compatible assets
    let enhancedPrompt = `${rewrittenPrompt}

The image should be a 2D character sprite asset with these specifications:
- The character is facing to the right. THE CHARACTER IS FACING TO THE RIGHT.
- Clean and simple design suitable for game sprites
- SOLID WHITE BACKGROUND (will be made transparent in post-processing)
- High contrast and clear details with sharp edges
- Appropriate size for character accessories/equipment
- Style: cartoon/anime game art with clean lines
- Color: ${color}
- Item type: ${itemType}
- The object should be centered in the image with clear separation from background
- Avoid gradients or soft shadows that blend with the background
- Use bold, defined outlines around the object

=== CHARACTER ORIENTATION CONTEXT ===
CRITICAL: This body part belongs to a character that is facing DIRECTLY TO THE RIGHT (90-degree right profile view).
- The character's entire body is oriented facing right
- The character's head points to the right
- The character's feet/shoes point to the right
- All body parts maintain this consistent rightward-facing orientation
- The generated item must match this right-facing directional perspective
- If generating shoes: they should face right (heel on left, toe on right)
- If generating head items: they should face right profile
- If generating body items: they should show the right side view
- Maintain consistency with a character walking/standing facing right

Original user request: ${userPrompt}`;

    // Step 4: Analyze pose of body part reference image using GPT-4o Mini
    if (filteredReferenceImages.length > 0) {
      console.log('🎨 GENERATE IMAGE FOR BODY PART: Adding reference context to prompt');
      
      const bodyPartImages = filteredReferenceImages.filter(img => !img.url.startsWith('data:'));
      const userImages = filteredReferenceImages.filter(img => img.url.startsWith('data:'));
      
      let referenceContext = '\n\n=== REFERENCE STYLE CONTEXT ===\n';
      
      if (bodyPartImages.length > 0) {
        referenceContext += `CRITICAL: Original body part reference image "${bodyPartImages[0].name}" - You MUST follow this image EXACTLY for:\n`;
        referenceContext += `• POSE: Match the exact orientation and angle (if head faces right, generate facing right)\n`;
        referenceContext += `• PROPORTIONS: Use identical size ratios and shape proportions\n`;
        referenceContext += `• SILHOUETTE: Maintain the same general outline and form\n`;
        referenceContext += `• POSITIONING: Keep the same stance, angle, and directional facing\n`;
        referenceContext += `• PERSPECTIVE: Match the exact viewing angle (front, side, 3/4, etc.)\n`;
        referenceContext += `Examples: If foot points right, generate shoe pointing right. If head tilts left, generate head tilting left.\n\n`;
      }
      
      if (userImages.length > 0) {
        referenceContext += `User aesthetic references: ${userImages.map(img => img.name).join(', ')} - Apply the artistic STYLE and AESTHETICS from these images while maintaining the pose from the body part reference.\n\n`;
      }
      
      referenceContext += 'PRIORITY ORDER:\n';
      referenceContext += '1. FIRST: Match the right-facing character orientation (CHARACTER ORIENTATION CONTEXT)\n';
      referenceContext += '2. SECOND: Match general pose and proportions from the body part reference image\n';
      referenceContext += '3. THIRD: Apply artistic style and aesthetics from user references\n';
      referenceContext += '4. FINALLY: Apply the requested modifications while preserving the original pose structure and rightward orientation\n\n';
      referenceContext += 'The generated image must look like it could replace the original body part seamlessly in terms of pose, proportions, and directional facing. It must maintain the character\'s consistent right-facing orientation.';
      
      enhancedPrompt += referenceContext;
    }
    
    console.log('🚀 GENERATE IMAGE FOR BODY PART: Enhanced prompt with reference context');
    console.log('📨 GENERATE IMAGE FOR BODY PART: Final prompt for gpt-image-1:', enhancedPrompt);
    
    // Step 5: Make API call to OpenAI
    console.log('🔑 GENERATE IMAGE FOR BODY PART: Has API key:', !!process.env.OPENAI_API_KEY);
    console.log('🔑 GENERATE IMAGE FOR BODY PART: API key length:', process.env.OPENAI_API_KEY?.length || 0);
    
    let apiEndpoint: string;
    let imageData: any;
    
    if (filteredReferenceImages.length > 0) {
      // Use images/edits endpoint when we have reference images
      apiEndpoint = 'https://api.openai.com/v1/images/edits';
      console.log('🖼️ GENERATE IMAGE FOR BODY PART: Using /images/edits endpoint with reference images');
      
      // Create FormData for multipart/form-data request
      const formData = new FormData();
      formData.append('model', 'gpt-image-1');
      formData.append('prompt', enhancedPrompt);
      formData.append('n', '1');
      formData.append('size', '1024x1024');
      formData.append('quality', 'medium');
      
      // Add reference images to the request
      for (let i = 0; i < Math.min(filteredReferenceImages.length, 10); i++) {
        const img = filteredReferenceImages[i];
        console.log(`📎 GENERATE IMAGE FOR BODY PART: Adding reference image ${i + 1}: ${img.name}`);
        
        if (img.url.startsWith('data:')) {
          // Handle base64 user-uploaded images
          const base64Data = img.url.split(',')[1];
          const binaryData = Buffer.from(base64Data, 'base64');
          const blob = new Blob([binaryData], { type: 'image/png' });
          formData.append('image[]', blob, img.name || `user_image_${i}.png`);
        } else {
          // Handle asset images - read from filesystem directly
          try {
            const filePath = img.url.startsWith('/') ? `public${img.url}` : `public/${img.url}`;
            console.log(`📁 GENERATE IMAGE FOR BODY PART: Reading asset from filesystem: ${filePath}`);
            
            const fs = require('fs');
            const path = require('path');
            const fullPath = path.resolve(process.cwd(), filePath);
            console.log(`📁 GENERATE IMAGE FOR BODY PART: Full path: ${fullPath}`);
            
            if (fs.existsSync(fullPath)) {
              const fileBuffer = fs.readFileSync(fullPath);
              const ext = path.extname(filePath).toLowerCase();
              let mimeType = 'image/png';
              if (ext === '.jpg' || ext === '.jpeg') {
                mimeType = 'image/jpeg';
              } else if (ext === '.webp') {
                mimeType = 'image/webp';
              }
              
              console.log(`🎨 GENERATE IMAGE FOR BODY PART: Using MIME type: ${mimeType} for file: ${filePath}`);
              const blob = new Blob([fileBuffer], { type: mimeType });
              formData.append('image[]', blob, img.name || `asset_image_${i}.png`);
              console.log(`✅ GENERATE IMAGE FOR BODY PART: Successfully added asset image: ${img.name}`);
            } else {
              console.warn(`⚠️ GENERATE IMAGE FOR BODY PART: Asset file not found: ${fullPath}`);
            }
          } catch (fetchError) {
            console.error(`❌ GENERATE IMAGE FOR BODY PART: Error reading asset image ${img.name}:`, fetchError);
          }
        }
      }
      
      // Make request to OpenAI Images Edit API
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ GENERATE IMAGE FOR BODY PART: GPT-image-1 Edit API error:', errorData);
        throw new Error(`GPT-image-1 Edit API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }
      
      imageData = await response.json();
      console.log('✅ GENERATE IMAGE FOR BODY PART: GPT-image-1 Edit response received');
      
    } else {
      // Use images/generations endpoint when no reference images
      apiEndpoint = 'https://api.openai.com/v1/images/generations';
      console.log('🖼️ GENERATE IMAGE FOR BODY PART: Using /images/generations endpoint (no reference images)');
      
      const requestBody = {
        model: 'gpt-image-1',
        prompt: enhancedPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'medium'
      };
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ GENERATE IMAGE FOR BODY PART: GPT-image-1 API error:', errorData);
        throw new Error(`GPT-image-1 API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }
      
      imageData = await response.json();
      console.log('✅ GENERATE IMAGE FOR BODY PART: GPT-image-1 response received');
    }
    
    // Step 6: Process the response
    console.log('📋 GENERATE IMAGE FOR BODY PART: Processing response data');
    
    if (!imageData.data || !Array.isArray(imageData.data) || imageData.data.length === 0) {
      console.error('❌ GENERATE IMAGE FOR BODY PART: Unexpected response format - no data array');
      throw new Error('Invalid response format from GPT-image-1 API');
    }
    
    const firstDataItem = imageData.data[0];
    const revisedPrompt = firstDataItem.revised_prompt || enhancedPrompt;
    
    let generatedImageUrl: string;
    
    if (firstDataItem.url) {
      generatedImageUrl = firstDataItem.url;
      console.log('🖼️ GENERATE IMAGE FOR BODY PART: Generated image URL:', generatedImageUrl);
    } else if (firstDataItem.b64_json) {
      generatedImageUrl = `data:image/png;base64,${firstDataItem.b64_json}`;
      console.log('🖼️ GENERATE IMAGE FOR BODY PART: Generated image as base64 data');
      console.log('📏 GENERATE IMAGE FOR BODY PART: Base64 data length:', firstDataItem.b64_json.length);
    } else {
      console.error('❌ GENERATE IMAGE FOR BODY PART: No URL or base64 data in response');
      throw new Error('No image data returned from GPT-image-1 API');
    }
    
    console.log('📝 GENERATE IMAGE FOR BODY PART: Revised prompt:', revisedPrompt);
    console.log('✅ GENERATE IMAGE FOR BODY PART: Generation successful for body part:', targetBodyPart);
    
    return {
      success: true,
      targetBodyPart,
      itemType,
      color,
      description,
      rewrittenPrompt,
      generatedImageUrl,
      revisedPrompt,
      enhancedPrompt,
      filteredReferenceImages,
      referenceImagesUsed: referenceImages ? referenceImages.length : 0,
      referenceImageNames: referenceImages ? referenceImages.map(img => img.name) : [],
      dimensions: { width: 1024, height: 1024 },
      format: 'PNG',
      model: 'gpt-image-1',
      timestamp: new Date().toISOString(),
    };
    
  } catch (error) {
    console.error('❌ GENERATE IMAGE FOR BODY PART: Error during generation:', error);
    
    let fallbackRewrittenPrompt = `Generate an image of ${description}`;
    try {
      fallbackRewrittenPrompt = await rewritePromptForImageGeneration(itemPrompt);
    } catch (rewriteError) {
      console.error('❌ GENERATE IMAGE FOR BODY PART: Error with fallback prompt rewrite:', rewriteError);
    }
    
    return {
      success: false,
      targetBodyPart,
      itemType,
      color,
      description,
      rewrittenPrompt: fallbackRewrittenPrompt,
      generatedImageUrl: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      referenceImagesUsed: referenceImages ? referenceImages.length : 0,
      dimensions: { width: 1024, height: 1024 },
      format: 'PNG',
      model: 'gpt-image-1',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Image generation function using OpenAI GPT-image-1
 * Example: "Make the character wear a red hat"
 */
async function handleImageGeneration(userPrompt: string, extractedParams?: Record<string, any>, referenceImages?: any[]) {
  console.log('🎨 IMAGE GENERATION: Function reached successfully!');
  console.log('📝 User prompt:', userPrompt);
  console.log('📋 Extracted params:', extractedParams);
  console.log('🖼️ Reference images:', referenceImages ? referenceImages.length : 0);
  
  try {
    console.log('⚡ IMAGE GENERATION: Starting single body part generation process...');
    
    // Step 1: Determine the target body part for this generation
    console.log('🔍 IMAGE GENERATION: Calling mapPromptToBodyPart...');
    const detectedBodyParts = await mapPromptToBodyPart(userPrompt);
    const targetBodyPart = detectedBodyParts[0]; // Use the first body part as the target
    console.log('🎯 IMAGE GENERATION: Target body part detected:', targetBodyPart);
    
    // Step 2: Use the extracted generation function
    console.log('🔧 IMAGE GENERATION: Calling generateImageForBodyPart...');
    const generationResult = await generateImageForBodyPart(
      targetBodyPart,
      userPrompt,
      userPrompt,
      extractedParams,
      referenceImages
    );
    
    console.log('📊 IMAGE GENERATION: Generation result received:', generationResult.success);
    
    if (generationResult.success) {
      console.log('✅ IMAGE GENERATION: Successfully generated image for body part:', targetBodyPart);
      
      // Map the original prompt to body parts for result
      const resultBodyParts = await mapPromptToBodyPart(userPrompt);
      
      return {
        success: true,
        message: `Image generated successfully for: ${generationResult.itemType} (${generationResult.color})`,
        category: 'image_generation',
        userPrompt,
        extractedParams: {
          ...generationResult,
          bodyParts: resultBodyParts,
        },
      };
    } else {
      console.error('❌ IMAGE GENERATION: Generation failed for body part:', targetBodyPart);
      return {
        success: false,
        message: `Image generation failed: ${generationResult.error}`,
        category: 'image_generation',
        userPrompt,
        error: generationResult.error,
        extractedParams: generationResult,
      };
    }
    
  } catch (error) {
    console.error('❌ IMAGE GENERATION: Error in handleImageGeneration:', error);
    
    return {
      success: false,
      message: `Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      category: 'image_generation',
      userPrompt,
      error: error instanceof Error ? error.message : 'Unknown error',
      extractedParams: {
        itemType: extractedParams?.itemType || 'accessory',
        color: extractedParams?.color || 'default',
        description: extractedParams?.description || userPrompt,
        generatedImageUrl: null,
        referenceImagesUsed: referenceImages ? referenceImages.length : 0,
        dimensions: { width: 1024, height: 1024 },
        format: 'PNG',
        model: 'gpt-image-1',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Full character generation function using GPT-4.1-mini to create targeted prompts
 * Example: "Generate a full knight character"
 */
async function handleFullCharacterGeneration(userPrompt: string, extractedParams?: Record<string, any>, referenceImages?: any[]) {
  console.log('🏰 FULL CHARACTER GENERATION: Function reached successfully!');
  console.log('📝 User prompt:', userPrompt);
  console.log('📋 Extracted params:', extractedParams);
  console.log('🖼️ Reference images:', referenceImages ? referenceImages.length : 0);
  
  // Extract character generation parameters
  const characterType = extractedParams?.characterType || 'character';
  const style = extractedParams?.style || 'default';
  const theme = extractedParams?.theme || characterType;
  const color = extractedParams?.color || 'default';
  const description = extractedParams?.description || userPrompt;
  
  console.log('🏰 FULL CHARACTER GENERATION: Analyzing character parameters');
  console.log('   👤 Character type:', characterType);
  console.log('   🎨 Style:', style);
  console.log('   🎭 Theme:', theme);
  console.log('   🌈 Color:', color);
  console.log('   📄 Description:', description);
  
  // Define the body parts for full character generation (limit to 3 for now)
  const bodyPartsToGenerate = [
    'head',
    'goggles',
    'mouth'
  ];
  
  console.log('🦴 FULL CHARACTER GENERATION: Body parts to generate:', bodyPartsToGenerate.length);
  bodyPartsToGenerate.forEach((part, index) => {
    console.log(`   ${index + 1}. ${part}`);
  });
  
  try {
    console.log('🤖 FULL CHARACTER GENERATION: Calling GPT-4.1-mini to generate targeted prompts...');
    
    // Step 1: Use GPT-4.1-mini to create specific prompts for each body part
    const promptGenerationSystemPrompt = `You are a prompt generator for character creation. Your job is to take a general character generation request and convert it into specific prompts for individual body parts.

Given a user request like "generate an alien character", you need to create 3 specific prompts for these body parts in this exact order:
1. head
2. goggles  
3. mouth

Your response should be ONLY a Python list of 3 strings, with no other text. Each prompt should be specific to the body part while maintaining the character theme.

Examples:
Input: "generate an alien character"
Output: ["generate the head for an alien character", "generate the goggles for an alien character", "generate the mouth for an alien character"]

Input: "create a knight character"  
Output: ["generate the head for a knight character", "generate the goggles for a knight character", "generate the mouth for a knight character"]

Input: "make a robot character"
Output: ["generate the head for a robot character", "generate the goggles for a robot character", "generate the mouth for a robot character"]

Remember: 
- Always return exactly 3 prompts
- Always in the order: head, goggles, mouth
- Return ONLY the Python list, no explanations
- Each prompt should start with "generate the [body part] for"`;

    const promptGenerationResult = await generateText({
      model: openai('gpt-4o-mini'),
      messages: [
        { role: 'system', content: promptGenerationSystemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2,
      maxTokens: 200,
    });

    console.log('📨 FULL CHARACTER GENERATION: Raw GPT-4.1-mini response:', promptGenerationResult.text);
    
    // Parse the Python list from the response
    let generatedPrompts: string[] = [];
    try {
      // Clean the response and extract the list
      let cleanedResponse = promptGenerationResult.text.trim();
      
      // Remove any markdown code blocks
      if (cleanedResponse.startsWith('```python')) {
        cleanedResponse = cleanedResponse.replace(/```python\n?/, '').replace(/\n?```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      console.log('🧹 FULL CHARACTER GENERATION: Cleaned response:', cleanedResponse);
      
      // Parse as JSON (Python list syntax is valid JSON)
      generatedPrompts = JSON.parse(cleanedResponse);
      
      console.log('✅ FULL CHARACTER GENERATION: Successfully parsed prompts:', generatedPrompts);
      
      // Validate we have exactly 3 prompts
      if (!Array.isArray(generatedPrompts) || generatedPrompts.length !== 3) {
        throw new Error(`Expected 3 prompts, got ${generatedPrompts.length}`);
      }
      
    } catch (parseError) {
      console.error('❌ FULL CHARACTER GENERATION: Failed to parse prompts:', parseError);
      
      // Fallback to manual generation
      generatedPrompts = [
        `generate the head for ${description}`,
        `generate the goggles for ${description}`,
        `generate the mouth for ${description}`
      ];
      
      console.log('🔄 FULL CHARACTER GENERATION: Using fallback prompts:', generatedPrompts);
    }
    
    // Step 2: Display the generated prompts in chat
    console.log('📢 FULL CHARACTER GENERATION: Generated prompts for body parts:');
    generatedPrompts.forEach((prompt, index) => {
      console.log(`   ${index + 1}. ${bodyPartsToGenerate[index]}: "${prompt}"`);
    });
    
    // Step 3: Send each prompt to the LLM router as individual requests
    const individualResults: any[] = [];
    const successfulGenerations: any[] = [];
    const failedGenerations: any[] = [];
    
    console.log('🔄 FULL CHARACTER GENERATION: Processing each prompt through LLM router...');
    
    for (let i = 0; i < generatedPrompts.length; i++) {
      const prompt = generatedPrompts[i];
      const bodyPart = bodyPartsToGenerate[i];
      
      console.log(`\n🎯 FULL CHARACTER GENERATION: Processing prompt ${i + 1}/${generatedPrompts.length}:`);
      console.log(`   🦴 Body part: ${bodyPart}`);
      console.log(`   📝 Prompt: "${prompt}"`);
      
      try {
        // Call the full LLM router flow for this individual prompt (same as user prompts)
        console.log('🔗 FULL CHARACTER GENERATION: Processing individual prompt through full router flow...');
        
        // Step 1: Categorize the request (same as user prompts)
        const categorization = await categorizeRequest(prompt);
        console.log(`📊 FULL CHARACTER GENERATION: Categorization for ${bodyPart}:`, categorization.category);
        
        // Step 2: Route through the same flow as user prompts
        const routingResult = await routeRequest(
          categorization.category, 
          prompt, 
          categorization.extractedParams,
          referenceImages
        );
        
        console.log(`📊 FULL CHARACTER GENERATION: Routing result for ${bodyPart}:`, routingResult.success);
        
        if (routingResult.success && routingResult.extractedParams?.generatedImageUrl) {
          console.log(`✅ FULL CHARACTER GENERATION: Successfully generated ${bodyPart}`);
          successfulGenerations.push({
            bodyPart,
            prompt,
            result: routingResult.extractedParams
          });
        } else {
          const errorMessage = ('error' in routingResult) ? routingResult.error : routingResult.message || 'Image generation failed';
          console.error(`❌ FULL CHARACTER GENERATION: Failed to generate ${bodyPart}:`, errorMessage);
          failedGenerations.push({
            bodyPart,
            prompt,
            error: errorMessage
          });
        }
        
        individualResults.push({
          bodyPart,
          prompt,
          success: routingResult.success,
          result: routingResult
        });
        
      } catch (error) {
        console.error(`❌ FULL CHARACTER GENERATION: Error processing ${bodyPart}:`, error);
        failedGenerations.push({
          bodyPart,
          prompt,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        individualResults.push({
          bodyPart,
          prompt,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    console.log('\n📊 FULL CHARACTER GENERATION: Final summary:');
    console.log(`   ✅ Successful generations: ${successfulGenerations.length}`);
    console.log(`   ❌ Failed generations: ${failedGenerations.length}`);
    console.log(`   📋 Total attempts: ${individualResults.length}`);
    
    const overallSuccess = successfulGenerations.length > 0;
    
         // Create chat messages showing the generated prompts and results
     const chatMessages = [];
     
     chatMessages.push(`🏰 Starting full character generation for ${characterType}...`);
     chatMessages.push('');
     chatMessages.push('🤖 Generated specific prompts for each body part:');
     
     generatedPrompts.forEach((prompt, index) => {
       chatMessages.push(`${index + 1}. ${bodyPartsToGenerate[index]}: "${prompt}"`);
     });
     
     chatMessages.push('');
     chatMessages.push('🎨 Generation results:');
     
     // Add individual prompt messages for display
     const individualPromptMessages = generatedPrompts.map((prompt, index) => ({
       type: 'generated_prompt',
       bodyPart: bodyPartsToGenerate[index],
       prompt: prompt,
       displayName: getBodyPartDisplayName(bodyPartsToGenerate[index]),
       index: index + 1
     }));
     
     successfulGenerations.forEach((gen, index) => {
       chatMessages.push(`✅ ${getBodyPartDisplayName(gen.bodyPart)}: Successfully generated! (${index + 1}/${bodyPartsToGenerate.length})`);
     });
     
     failedGenerations.forEach((gen) => {
       chatMessages.push(`❌ ${getBodyPartDisplayName(gen.bodyPart)}: ${gen.error}`);
     });
     
     chatMessages.push('');
     chatMessages.push(`🎉 Completed: ${successfulGenerations.length}/${bodyPartsToGenerate.length} body parts generated successfully!`);
     
     // Add generated images info to the message
     if (successfulGenerations.length > 0) {
       chatMessages.push('');
       chatMessages.push('📸 Generated Images:');
       successfulGenerations.forEach((gen) => {
         chatMessages.push(`✅ ${getBodyPartDisplayName(gen.bodyPart)}: ${gen.result.itemType || 'Generated'}`);
       });
     }
     
     // Create comprehensive message
     const fullMessage = chatMessages.join('\n');

         return {
       success: overallSuccess,
       message: fullMessage,
       category: 'image_generation',
       userPrompt,
       useOriginalSystem: false,
       extractedParams: {
         // Full character generation metadata
         isFullCharacterGeneration: true,
         characterType,
         style,
         theme,
         color,
         description,
         bodyPartsToGenerate,
         generatedPrompts, // Show the prompts that were generated
         totalBodyParts: bodyPartsToGenerate.length,
         successfulGenerations: successfulGenerations.length,
         failedGenerations: failedGenerations.length,
         individualResults,
         chatMessages,
         individualPromptMessages, // For frontend to display as separate messages
         
         // Primary image for compatibility (first successful generation)
         generatedImageUrl: successfulGenerations.length > 0 ? successfulGenerations[0].result.generatedImageUrl : null,
         itemType: successfulGenerations.length > 0 ? successfulGenerations[0].result.itemType : 'full character',
         rewrittenPrompt: successfulGenerations.length > 0 ? successfulGenerations[0].result.rewrittenPrompt : userPrompt,
         
         // All generated images
         allGeneratedImages: successfulGenerations.map(gen => ({
           bodyPart: gen.bodyPart,
           prompt: gen.prompt,
           generatedImageUrl: gen.result.generatedImageUrl,
           itemType: gen.result.itemType,
           rewrittenPrompt: gen.result.rewrittenPrompt,
           revisedPrompt: gen.result.revisedPrompt,
           displayName: getBodyPartDisplayName(gen.bodyPart)
         })),
         
         successfulResults: successfulGenerations.map(gen => ({
           bodyPart: gen.bodyPart,
           prompt: gen.prompt,
           generatedImageUrl: gen.result.generatedImageUrl,
           itemType: gen.result.itemType,
           rewrittenPrompt: gen.result.rewrittenPrompt,
           revisedPrompt: gen.result.revisedPrompt
         })),
         
         failedResults: failedGenerations.map(gen => ({
           bodyPart: gen.bodyPart,
           prompt: gen.prompt,
           error: gen.error
         })),
         
         referenceImagesUsed: referenceImages ? referenceImages.length : 0,
         referenceImageNames: referenceImages ? referenceImages.map(img => img.name) : [],
         dimensions: { width: 1024, height: 1024 },
         format: 'PNG',
         model: 'gpt-image-1',
         timestamp: new Date().toISOString(),
         bodyParts: bodyPartsToGenerate,
         
         // For frontend compatibility - ensure these are set
         ...(successfulGenerations.length > 0 && {
           generatedImageUrl: successfulGenerations[0].result.generatedImageUrl,
           itemType: successfulGenerations[0].result.itemType,
           rewrittenPrompt: successfulGenerations[0].result.rewrittenPrompt,
           bodyParts: [successfulGenerations[0].bodyPart]
         }),
       },
     };
    
  } catch (error) {
    console.error('❌ FULL CHARACTER GENERATION: Error during full character generation:', error);
    
    const errorMessage = `❌ Full character generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    
    return {
      success: false,
      message: errorMessage,
      category: 'image_generation',
      userPrompt,
      error: error instanceof Error ? error.message : 'Unknown error',
      useOriginalSystem: false,
      extractedParams: {
        isFullCharacterGeneration: true,
        characterType: extractedParams?.characterType || 'character',
        style: extractedParams?.style || 'default',
        theme: extractedParams?.theme || extractedParams?.characterType || 'character',
        color: extractedParams?.color || 'default',
        description: extractedParams?.description || userPrompt,
        bodyPartsToGenerate,
        generatedPrompts: [],
        totalBodyParts: bodyPartsToGenerate.length,
        successfulGenerations: 0,
        failedGenerations: 0,
        individualResults: [],
        chatMessages: [errorMessage],
        generatedImageUrl: null,
        itemType: 'full character',
        rewrittenPrompt: userPrompt,
        allGeneratedImages: [],
        successfulResults: [],
        failedResults: [],
        bodyParts: bodyPartsToGenerate,
        referenceImagesUsed: referenceImages ? referenceImages.length : 0,
        dimensions: { width: 1024, height: 1024 },
        format: 'PNG',
        model: 'gpt-image-1',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Creates a specific prompt for a body part based on the character theme
 */
function createBodyPartPrompt(bodyPart: string, theme: string, characterType: string, style: string, color: string, originalPrompt: string): string {
  console.log(`📝 CREATE BODY PART PROMPT: Creating prompt for ${bodyPart} with theme ${theme}`);
  
  // Body part specific prompt templates
  const bodyPartPrompts: Record<string, string> = {
    'head': `Generate an image of a ${theme} ${characterType} head`,
    'goggles': `Generate an image of ${theme} ${characterType} eyewear/goggles`,
    'mouth': `Generate an image of a ${theme} ${characterType} mouth expression`,
    'neck': `Generate an image of a ${theme} ${characterType} neck accessory`,
    'torso': `Generate an image of a ${theme} ${characterType} torso/body armor`,
    'front-upper-arm': `Generate an image of a ${theme} ${characterType} upper arm armor`,
    'front-bracer': `Generate an image of a ${theme} ${characterType} forearm bracer`,
    'front-fist': `Generate an image of a ${theme} ${characterType} hand/glove`,
    'front-thigh': `Generate an image of a ${theme} ${characterType} thigh armor`,
    'front-shin': `Generate an image of a ${theme} ${characterType} shin guard`,
    'front-foot': `Generate an image of a ${theme} ${characterType} boot/shoe`,
    'gun': `Generate an image of a ${theme} ${characterType} weapon`
  };
  
  let basePrompt = bodyPartPrompts[bodyPart] || `Generate an image of a ${theme} ${characterType} ${bodyPart}`;
  
  // Add style and color modifiers
  if (style !== 'default') {
    basePrompt += ` in ${style} style`;
  }
  
  if (color !== 'default') {
    basePrompt += ` with ${color} color scheme`;
  }
  
  console.log(`✅ CREATE BODY PART PROMPT: Created prompt for ${bodyPart}: ${basePrompt}`);
  return basePrompt;
}

/**
 * Determines the item type for a body part based on character type
 */
function getBodyPartItemType(bodyPart: string, characterType: string): string {
  console.log(`🏷️ GET BODY PART ITEM TYPE: Determining item type for ${bodyPart} on ${characterType}`);
  
  const itemTypes: Record<string, string> = {
    'head': 'helmet',
    'goggles': 'eyewear',
    'mouth': 'facial_expression',
    'neck': 'neck_accessory',
    'torso': 'armor',
    'front-upper-arm': 'arm_armor',
    'front-bracer': 'forearm_guard',
    'front-fist': 'glove',
    'front-thigh': 'leg_armor',
    'front-shin': 'shin_guard',
    'front-foot': 'boot',
    'gun': 'weapon'
  };
  
  const itemType = itemTypes[bodyPart] || 'accessory';
  console.log(`✅ GET BODY PART ITEM TYPE: Item type for ${bodyPart}: ${itemType}`);
  return itemType;
}

/**
 * Gets a user-friendly display name for a body part
 */
function getBodyPartDisplayName(bodyPart: string): string {
  console.log(`🏷️ GET BODY PART DISPLAY NAME: Getting display name for ${bodyPart}`);
  
  const displayNames: Record<string, string> = {
    'head': 'head',
    'goggles': 'eyewear',
    'mouth': 'mouth',
    'neck': 'neck accessory',
    'torso': 'torso armor',
    'front-upper-arm': 'arm armor',
    'front-bracer': 'forearm guard',
    'front-fist': 'gloves',
    'front-thigh': 'leg armor',
    'front-shin': 'shin guards',
    'front-foot': 'boots',
    'gun': 'weapon'
  };
  
  const displayName = displayNames[bodyPart] || bodyPart;
  console.log(`✅ GET BODY PART DISPLAY NAME: Display name for ${bodyPart}: ${displayName}`);
  return displayName;
}

/**
 * Consolidated handler for all animation requests
 * Handles walk, run, jump, dance, idle, and other animation types
 */
async function handleAnimation(userPrompt: string, extractedParams?: Record<string, any>, referenceImages?: any[]) {
  console.log('🎬 ANIMATION: Function reached successfully!');
  console.log('📝 User prompt:', userPrompt);
  console.log('📋 Extracted params:', extractedParams);
  console.log('🖼️ Reference images:', referenceImages ? referenceImages.length : 0);
  
  // Determine animation type from prompt
  const prompt = userPrompt.toLowerCase();
  let animationType = 'other';
  let emoji = '🎭';
  
  if (prompt.includes('walk')) {
    animationType = 'walk';
    emoji = '🚶';
  } else if (prompt.includes('run')) {
    animationType = 'run';
    emoji = '🏃';
  } else if (prompt.includes('jump')) {
    animationType = 'jump';
    emoji = '🦘';
  } else if (prompt.includes('dance')) {
    animationType = 'dance';
    emoji = '💃';
  } else if (prompt.includes('idle') || prompt.includes('stand')) {
    animationType = 'idle';
    emoji = '🧍';
  }
  
  console.log(`${emoji} ANIMATION: Detected animation type: ${animationType}`);
  
  // Extract animation parameters
  const speed = extractedParams?.speed || 'normal';
  const direction = extractedParams?.direction || 'forward';
  const style = extractedParams?.style || 'default';
  const intensity = extractedParams?.intensity || 'medium';
  
  console.log('🎮 ANIMATION: Analyzing animation parameters');
  console.log('   ⚡ Speed:', speed);
  console.log('   🧭 Direction:', direction);
  console.log('   🎭 Style:', style);
  console.log('   💪 Intensity:', intensity);
  
  // Simulate animation modification process
  console.log('⚙️ ANIMATION: Modifying animation parameters...');
  console.log('   📊 Calculating new keyframe timings');
  console.log('   🦴 Adjusting bone rotation speeds');
  console.log('   📈 Updating animation curve interpolation');
  console.log(`   🔄 Applying changes to ${animationType} animation`);
  
  // Calculate animation properties based on type and speed
  let newDuration = 1.0;
  let speedMultiplier = 1.0;
  let affectedBones = ['front-thigh', 'front-shin', 'rear-thigh', 'rear-shin'];
  
  switch (animationType) {
    case 'walk':
      newDuration = 1.0;
      affectedBones = ['front-thigh', 'front-shin', 'rear-thigh', 'rear-shin', 'torso'];
      break;
    case 'run':
      newDuration = 0.6;
      affectedBones = ['front-thigh', 'front-shin', 'rear-thigh', 'rear-shin', 'torso', 'front-upper-arm', 'rear-upper-arm'];
      break;
    case 'jump':
      newDuration = 1.2;
      affectedBones = ['front-thigh', 'rear-thigh', 'torso', 'front-upper-arm', 'rear-upper-arm'];
      break;
    case 'dance':
      newDuration = 2.0;
      affectedBones = ['torso', 'front-upper-arm', 'rear-upper-arm', 'head', 'front-thigh', 'rear-thigh'];
      break;
    case 'idle':
      newDuration = 3.0;
      affectedBones = ['torso', 'head'];
      break;
  }
  
  if (speed === 'faster' || speed === 'fast') {
    newDuration *= 0.7;
    speedMultiplier = 1.5;
  } else if (speed === 'slower' || speed === 'slow') {
    newDuration *= 1.5;
    speedMultiplier = 0.7;
  }
  
  console.log('   ⏱️ New animation duration:', newDuration);
  console.log('   🚀 Speed multiplier:', speedMultiplier);
  console.log('   🦴 Affected bones:', affectedBones.join(', '));
  
  return {
    success: true,
    message: `${animationType.charAt(0).toUpperCase() + animationType.slice(1)} animation parameters modified: ${speed} speed`,
    category: 'animation',
    userPrompt,
    extractedParams: {
      animationType,
      speed,
      direction,
      style,
      intensity,
      newDuration,
      speedMultiplier,
      affectedBones,
      animationName: `${animationType}_modified`,
    },
  };
}



/**
 * Stubbed function for export assets requests
 * Example: "Export the character assets"
 */
async function handleExportAssets(userPrompt: string, extractedParams?: Record<string, any>, referenceImages?: any[]) {
  console.log('📦 EXPORT ASSETS: Function reached successfully!');
  console.log('📝 User prompt:', userPrompt);
  console.log('📋 Extracted params:', extractedParams);
  console.log('🖼️ Reference images:', referenceImages ? referenceImages.length : 0);
  
  // Extract export parameters
  const format = extractedParams?.format || 'spine';
  const includeAnimations = extractedParams?.includeAnimations !== false;
  const includeTextures = extractedParams?.includeTextures !== false;
  const exportType = extractedParams?.exportType || 'complete';
  
  console.log('📋 EXPORT ASSETS: Analyzing export parameters');
  console.log('   📄 Format:', format);
  console.log('   🎬 Include animations:', includeAnimations);
  console.log('   🖼️ Include textures:', includeTextures);
  console.log('   📦 Export type:', exportType);
  
  // Simulate export process
  console.log('⚡ EXPORT ASSETS: Starting export process...');
  console.log('   📊 Gathering skeleton data');
  console.log('   🎨 Collecting texture atlas');
  console.log('   🎬 Bundling animation data');
  console.log('   📁 Creating export package');
  
  // Simulate file generation
  const exportFiles = [];
  
  if (includeAnimations) {
    exportFiles.push('spineboy-animations.json');
    console.log('   ✅ Added animations to export package');
  }
  
  if (includeTextures) {
    exportFiles.push('spineboy-atlas.png');
    exportFiles.push('spineboy.atlas');
    console.log('   ✅ Added textures to export package');
  }
  
  exportFiles.push('spineboy-skeleton.json');
  console.log('   ✅ Added skeleton data to export package');
  
  console.log('🎉 EXPORT ASSETS: Export package ready!');
  console.log('   📦 Files included:', exportFiles.join(', '));
  
  return {
    success: true,
    message: `Export package created with ${exportFiles.length} files`,
    category: 'export_assets',
    userPrompt,
    extractedParams: {
      format,
      includeAnimations,
      includeTextures,
      exportType,
      exportFiles,
      packageSize: '2.3 MB',
      downloadUrl: 'placeholder_download_url',
      timestamp: new Date().toISOString(),
    },
  };
}



/**
 * Routes the categorized request to the appropriate handler
 */
async function routeRequest(category: RequestCategoryType, userPrompt: string, extractedParams?: Record<string, any>, referenceImages?: any[]) {
  console.log('🎯 LLM Router: Routing request to category:', category);
  
  if (referenceImages && referenceImages.length > 0) {
    console.log('🖼️ LLM Router: Passing reference images to handler:', referenceImages.length);
  }
  
  switch (category) {
    case 'image_generation':
      console.log('🎨 LLM Router: Routing to handleImageGeneration');
      return await handleImageGeneration(userPrompt, extractedParams, referenceImages);
    
    case 'full_character_generation':
      console.log('🏰 LLM Router: Routing to handleFullCharacterGeneration');
      return await handleFullCharacterGeneration(userPrompt, extractedParams, referenceImages);
    
    case 'animation':
      console.log('🎬 LLM Router: Routing to handleAnimation');
      return await handleAnimation(userPrompt, extractedParams, referenceImages);
    
    case 'export_assets':
      console.log('📦 LLM Router: Routing to handleExportAssets');
      return await handleExportAssets(userPrompt, extractedParams, referenceImages);
    
    case 'unknown':
    default:
      console.log('❓ LLM Router: Unknown category, using fallback');
      return {
        success: false,
        message: 'Unknown request category',
        category: 'unknown',
        userPrompt,
        extractedParams,
        referenceImages,
        useOriginalSystem: true,
      };
  }
}

export async function POST(req: Request) {
  console.log('🚀 LLM Router API: Received POST request');
  
  try {
    console.log('📥 LLM Router: Parsing request body...');
    const body = await req.json();
    console.log('📦 LLM Router: Request body keys:', Object.keys(body));
    
    const { userPrompt, referenceImages } = body;
    
    if (!userPrompt || typeof userPrompt !== 'string') {
      console.error('❌ LLM Router: Invalid or missing userPrompt');
      return Response.json({ 
        error: 'Invalid or missing userPrompt' 
      }, { status: 400 });
    }

    console.log('📝 LLM Router: User prompt received:', userPrompt);

    // Log reference images if provided
    if (referenceImages && Array.isArray(referenceImages)) {
      console.log('🖼️ LLM Router: Reference images provided:', referenceImages.length);
      referenceImages.forEach((img, index) => {
        console.log(`   📸 Reference ${index + 1}:`, img.name || img.path || 'unnamed');
      });
    } else {
      console.log('🖼️ LLM Router: No reference images provided');
    }

    console.log('🔄 LLM Router: Starting categorization process...');
    
    // Step 1: Categorize the request
    console.log('🔍 LLM Router: Calling categorizeRequest...');
    const categorization = await categorizeRequest(userPrompt);
    console.log('📊 LLM Router: Categorization result:', categorization);
    console.log('   📂 Category:', categorization.category);
    console.log('   📈 Confidence:', categorization.confidence);
    console.log('   💭 Reasoning:', categorization.reasoning);
    
    // Step 2: Route to appropriate handler
    console.log('🎯 LLM Router: Calling routeRequest...');
    const routingResult = await routeRequest(
      categorization.category, 
      userPrompt, 
      categorization.extractedParams,
      referenceImages
    );
    console.log('🎯 LLM Router: Routing completed');
    console.log('   ✅ Success:', routingResult.success);
    console.log('   💬 Message:', routingResult.message);
    console.log('   📂 Category:', routingResult.category);
    
    // Step 3: Return response
    console.log('📤 LLM Router: Preparing final response...');
    const response = {
      categorization,
      result: routingResult,
      timestamp: new Date().toISOString(),
    };
    
    console.log('✅ LLM Router: Final response prepared successfully');
    console.log('   📊 Response keys:', Object.keys(response));
    console.log('   🕐 Timestamp:', response.timestamp);
    
    return Response.json(response);

  } catch (error) {
    console.error('❌ LLM Router: Unexpected error in POST handler:', error);
    console.error('   🔍 Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('   💬 Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('   📚 Error stack:', error instanceof Error ? error.stack : 'No stack available');
    
    return Response.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 