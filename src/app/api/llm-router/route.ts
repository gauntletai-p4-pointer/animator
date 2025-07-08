import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { z } from 'zod';

// Define the simplified request categories
const RequestCategory = z.enum([
  'image_generation',  // Includes appearance changes, textures, accessories, etc.
  'animation',         // All animation types (walk, run, jump, dance, etc.)
  'export_assets',     // Export/download functionality
  'unknown'            // Unclear or unhandled requests
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
  
  // Direct keyword matching first
  for (const [bodyPart, slots] of Object.entries(BODY_PART_MAPPING)) {
    if (lowerPrompt.includes(bodyPart)) {
      console.log(`✅ BODY PART MAPPING: Found direct match "${bodyPart}" → slots: ${slots.join(', ')}`);
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

1. "image_generation" - User wants to generate, create, or modify images/textures/appearance
   Examples: "generate a hat texture", "give him a hat", "red shoes", "create a sword image", "make a background image", "make the character wear a red hat", "make him blue", "change his shirt color", "add glasses", "make his face green"
   Extract: itemType, color, description, style

2. "animation" - User wants to create or modify any type of animation (walk, run, jump, dance, idle, etc.)
   Examples: "make him walk", "create a walking animation", "make him run faster", "add a jump", "create a dance sequence", "make him stand still", "breathing animation", "make him wave"
   Extract: animationType, speed, direction, style, intensity

3. "export_assets" - User wants to export or download assets
   Examples: "export the animation", "download the character", "save the assets", "export the character assets"
   Extract: format, includeAnimations, includeTextures, exportType

4. "unknown" - The request doesn't fit any category or is unclear

IMPORTANT: Appearance changes (colors, clothing, accessories, body parts) should be categorized as "image_generation" since they will generate images to apply to the character.

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
 * Image generation function using OpenAI GPT-image-1
 * Example: "Make the character wear a red hat"
 */
async function handleImageGeneration(userPrompt: string, extractedParams?: Record<string, any>, referenceImages?: any[]) {
  console.log('🎨 IMAGE GENERATION: Function reached successfully!');
  console.log('📝 User prompt:', userPrompt);
  console.log('📋 Extracted params:', extractedParams);
  console.log('🖼️ Reference images:', referenceImages ? referenceImages.length : 0);
  
  // Extract potential image generation parameters
  const itemType = extractedParams?.itemType || 'accessory';
  const color = extractedParams?.color || 'default';
  const description = extractedParams?.description || userPrompt;
  
  console.log('🖼️ IMAGE GENERATION: Preparing to generate image');
  console.log('   🎯 Item type:', itemType);
  console.log('   🎨 Color:', color);
  console.log('   📄 Description:', description);
  
  try {
    console.log('⚡ IMAGE GENERATION: Starting GPT-image-1 generation...');
    
    // Step 1: Rewrite the user prompt for image generation
    const rewrittenPrompt = await rewritePromptForImageGeneration(userPrompt);
    console.log('📝 IMAGE GENERATION: Rewritten prompt:', rewrittenPrompt);
    
    // Step 2: Create a detailed prompt for Spine2D compatible assets
    const enhancedPrompt = `${rewrittenPrompt}

The image should be a 2D character sprite asset with these specifications:
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

Please generate an image that matches the art style and proportions of the reference character parts provided.

Original user request: ${userPrompt}`;
    
    console.log('🚀 IMAGE GENERATION: Enhanced prompt:', enhancedPrompt);
    
    // Add reference context to prompt if images are provided
    let finalPrompt = enhancedPrompt;
    if (referenceImages && referenceImages.length > 0) {
      console.log('📎 IMAGE GENERATION: Adding reference context to prompt');
      const referenceNames = referenceImages.slice(0, 5).map(img => img.name).join(', ');
      console.log(`   📸 Reference parts: ${referenceNames}`);
      
      finalPrompt += `\n\nReference art style context: This should match the art style of these character parts: ${referenceNames}. Use similar proportions, color palette, and artistic style.`;
    }
    
    console.log('📨 IMAGE GENERATION: Final prompt for gpt-image-1:', finalPrompt);
    
    // Debug: Check if we have API key
    console.log('🔑 IMAGE GENERATION: Has API key:', !!process.env.OPENAI_API_KEY);
    console.log('🔑 IMAGE GENERATION: API key length:', process.env.OPENAI_API_KEY?.length || 0);
    
    // Make request to OpenAI Images API with gpt-image-1
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: finalPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'medium'
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ IMAGE GENERATION: GPT-image-1 API error:', errorData);
      throw new Error(`GPT-image-1 API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const imageData = await response.json();
    console.log('✅ IMAGE GENERATION: GPT-image-1 response received');
    console.log('📋 IMAGE GENERATION: Full response data:', JSON.stringify(imageData, null, 2));
    
    // Check if response has expected structure
    if (!imageData.data || !Array.isArray(imageData.data) || imageData.data.length === 0) {
      console.error('❌ IMAGE GENERATION: Unexpected response format - no data array');
      console.error('📄 Response structure:', Object.keys(imageData));
      throw new Error('Invalid response format from GPT-image-1 API');
    }
    
    const firstDataItem = imageData.data[0];
    const revisedPrompt = firstDataItem.revised_prompt || finalPrompt;
    
    let generatedImageUrl: string;
    
    // Handle both URL and base64 response formats
    if (firstDataItem.url) {
      // URL format (like DALL-E)
      generatedImageUrl = firstDataItem.url;
      console.log('🖼️ IMAGE GENERATION: Generated image URL:', generatedImageUrl);
    } else if (firstDataItem.b64_json) {
      // Base64 format (GPT-image-1)
      generatedImageUrl = `data:image/png;base64,${firstDataItem.b64_json}`;
      console.log('🖼️ IMAGE GENERATION: Generated image as base64 data (converted to data URL)');
      console.log('📏 IMAGE GENERATION: Base64 data length:', firstDataItem.b64_json.length);
    } else {
      console.error('❌ IMAGE GENERATION: No URL or base64 data in response');
      console.error('📄 First data item:', JSON.stringify(firstDataItem, null, 2));
      throw new Error('No image data returned from GPT-image-1 API');
    }
    
    console.log('📝 IMAGE GENERATION: Revised prompt:', revisedPrompt);
    
    // Step 3: Map the original prompt to body parts
    const bodyParts = await mapPromptToBodyPart(userPrompt);
    
    return {
      success: true,
      message: `Image generated successfully for: ${itemType} (${color})`,
      category: 'image_generation',
      userPrompt,
      extractedParams: {
        itemType,
        color,
        description,
        rewrittenPrompt,
        generatedImageUrl,
        revisedPrompt,
        enhancedPrompt,
        finalPrompt,
        referenceImagesUsed: referenceImages ? referenceImages.length : 0,
        dimensions: { width: 1024, height: 1024 },
        format: 'PNG',
        model: 'gpt-image-1',
        timestamp: new Date().toISOString(),
        bodyParts: bodyParts,
      },
    };
    
  } catch (error) {
    console.error('❌ IMAGE GENERATION: Error with image generation:', error);
    
    // Try to get a fallback rewritten prompt even in error case
    let fallbackRewrittenPrompt = `Generate an image of ${description}`;
    try {
      fallbackRewrittenPrompt = await rewritePromptForImageGeneration(userPrompt);
    } catch (rewriteError) {
      console.error('❌ IMAGE GENERATION: Error with fallback prompt rewrite:', rewriteError);
    }
    
    return {
      success: false,
      message: `Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      category: 'image_generation',
      userPrompt,
      error: error instanceof Error ? error.message : 'Unknown error',
      extractedParams: {
        itemType,
        color,
        description,
        rewrittenPrompt: fallbackRewrittenPrompt,
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
      return await handleImageGeneration(userPrompt, extractedParams, referenceImages);
    
    case 'animation':
      return await handleAnimation(userPrompt, extractedParams, referenceImages);
    
    case 'export_assets':
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
    const body = await req.json();
    console.log('📦 LLM Router: Request body:', body);
    
    const { userPrompt, referenceImages } = body;
    
    if (!userPrompt || typeof userPrompt !== 'string') {
      console.error('❌ LLM Router: Invalid or missing userPrompt');
      return Response.json({ 
        error: 'Invalid or missing userPrompt' 
      }, { status: 400 });
    }

    // Log reference images if provided
    if (referenceImages && Array.isArray(referenceImages)) {
      console.log('🖼️ LLM Router: Reference images provided:', referenceImages.length);
      referenceImages.forEach((img, index) => {
        console.log(`   📸 Reference ${index + 1}:`, img.name || img.path || 'unnamed');
      });
    }

    console.log('🔄 LLM Router: Starting categorization process');
    
    // Step 1: Categorize the request
    const categorization = await categorizeRequest(userPrompt);
    console.log('📊 LLM Router: Categorization result:', categorization);
    
    // Step 2: Route to appropriate handler
    const routingResult = await routeRequest(
      categorization.category, 
      userPrompt, 
      categorization.extractedParams,
      referenceImages
    );
    console.log('🎯 LLM Router: Routing result:', routingResult);
    
    // Step 3: Return response
    const response = {
      categorization,
      result: routingResult,
      timestamp: new Date().toISOString(),
    };
    
    console.log('✅ LLM Router: Final response:', response);
    return Response.json(response);

  } catch (error) {
    console.error('❌ LLM Router: Unexpected error:', error);
    return Response.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 