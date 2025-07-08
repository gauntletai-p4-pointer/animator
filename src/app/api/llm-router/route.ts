import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { z } from 'zod';

// Define the request categories
const RequestCategory = z.enum([
  'image_generation',
  'walk_animation',
  'run_animation',
  'idle_animation',
  'jump_animation',
  'dance_animation',
  'other_animation',
  'export_assets',
  'appearance_change',
  'unknown'
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
  
Your job is to analyze user requests and categorize them into one of these categories:

1. "image_generation" - User wants to generate, create, or modify images/textures
   Examples: "generate a hat texture", "give him a hat", "red shoes", "create a sword image", "make a background image", "make the character wear a red hat"
   Extract: itemType, color, description, style

2. "walk_animation" - User wants to create or modify walking animations
   Examples: "make him walk", "create a walking animation", "modify the walk cycle", "make him walk faster"
   Extract: speed, direction, style, intensity

3. "run_animation" - User wants to create or modify running animations
   Examples: "make him run", "create a running animation", "speed up the run"

4. "idle_animation" - User wants to create or modify idle/standing animations
   Examples: "make him stand still", "create an idle animation", "breathing animation"

5. "jump_animation" - User wants to create or modify jumping animations
   Examples: "make him jump", "create a jumping animation", "add a leap"

6. "dance_animation" - User wants to create or modify dancing animations
   Examples: "make him dance", "create a dance sequence", "add dance moves"

7. "other_animation" - User wants to create other types of animations not listed above
   Examples: "make him wave", "create a spinning animation", "add a falling animation"

8. "export_assets" - User wants to export or download assets
   Examples: "export the animation", "download the character", "save the assets", "export the character assets"
   Extract: format, includeAnimations, includeTextures, exportType

9. "appearance_change" - User wants to change character appearance (skin, colors, attachments)
   Examples: "make him blue", "change his hat", "switch to zombie skin"

10. "unknown" - The request doesn't fit any category or is unclear

Respond with ONLY a valid JSON object (no markdown formatting, no code blocks) containing:
- category: one of the above categories
- confidence: a number between 0 and 1 indicating your confidence
- reasoning: a brief explanation of why you chose this category
- extractedParams: any relevant parameters you can extract from the request (optional)

Be very specific and choose the most appropriate category. If unsure, use "unknown".

Example response format:
{"category": "walk_animation", "confidence": 0.9, "reasoning": "User wants to modify walking animation speed", "extractedParams": {"speed": "faster"}}`;

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
      
      if (text.includes('image') || text.includes('generate') || text.includes('texture')) {
        fallbackCategory = 'image_generation';
      } else if (text.includes('walk')) {
        fallbackCategory = 'walk_animation';
      } else if (text.includes('run')) {
        fallbackCategory = 'run_animation';
      } else if (text.includes('jump')) {
        fallbackCategory = 'jump_animation';
      } else if (text.includes('dance')) {
        fallbackCategory = 'dance_animation';
      } else if (text.includes('export') || text.includes('download')) {
        fallbackCategory = 'export_assets';
      } else if (text.includes('color') || text.includes('skin') || text.includes('appearance')) {
        fallbackCategory = 'appearance_change';
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
- Transparent background (PNG format)
- High contrast and clear details
- Appropriate size for character accessories
- Style: cartoon/anime game art
- Color: ${color}
- Item type: ${itemType}

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
 * Stubbed function for walk animation requests
 * Example: "Make him walk faster"
 */
async function handleWalkAnimation(userPrompt: string, extractedParams?: Record<string, any>, referenceImages?: any[]) {
  console.log('🚶 WALK ANIMATION: Function reached successfully!');
  console.log('📝 User prompt:', userPrompt);
  console.log('📋 Extracted params:', extractedParams);
  console.log('🖼️ Reference images:', referenceImages ? referenceImages.length : 0);
  
  // Extract animation parameters
  const speed = extractedParams?.speed || 'normal';
  const direction = extractedParams?.direction || 'forward';
  const style = extractedParams?.style || 'default';
  
  console.log('🎮 WALK ANIMATION: Analyzing animation parameters');
  console.log('   ⚡ Speed:', speed);
  console.log('   🧭 Direction:', direction);
  console.log('   🎭 Style:', style);
  
  // Simulate parameter modification process
  console.log('⚙️ WALK ANIMATION: Modifying animation parameters...');
  console.log('   📊 Calculating new keyframe timings');
  console.log('   🦴 Adjusting bone rotation speeds');
  console.log('   📈 Updating animation curve interpolation');
  console.log('   🔄 Applying changes to existing walk cycle');
  
  // Calculate new animation properties based on speed
  let newDuration = 1.0; // default walk cycle duration
  let speedMultiplier = 1.0;
  
  if (speed === 'faster' || speed === 'fast') {
    newDuration = 0.7;
    speedMultiplier = 1.5;
  } else if (speed === 'slower' || speed === 'slow') {
    newDuration = 1.5;
    speedMultiplier = 0.7;
  }
  
  console.log('   ⏱️ New animation duration:', newDuration);
  console.log('   🚀 Speed multiplier:', speedMultiplier);
  
  return {
    success: true,
    message: `Walk animation parameters modified: ${speed} speed`,
    category: 'walk_animation',
    userPrompt,
    extractedParams: {
      speed,
      direction,
      style,
      newDuration,
      speedMultiplier,
      modifiedTimelines: ['front-thigh', 'front-shin', 'rear-thigh', 'rear-shin'],
      animationName: 'walk_modified',
    },
  };
}

/**
 * Stubbed function for run animation requests
 */
async function handleRunAnimation(userPrompt: string, extractedParams?: Record<string, any>, referenceImages?: any[]) {
  console.log('🏃 RUN ANIMATION: Function reached successfully!');
  console.log('📝 User prompt:', userPrompt);
  console.log('📋 Extracted params:', extractedParams);
  console.log('🖼️ Reference images:', referenceImages ? referenceImages.length : 0);
  
  return {
    success: true,
    message: 'Run animation request received',
    category: 'run_animation',
    userPrompt,
    extractedParams,
  };
}

/**
 * Stubbed function for idle animation requests
 */
async function handleIdleAnimation(userPrompt: string, extractedParams?: Record<string, any>, referenceImages?: any[]) {
  console.log('🧍 IDLE ANIMATION: Function reached successfully!');
  console.log('📝 User prompt:', userPrompt);
  console.log('📋 Extracted params:', extractedParams);
  console.log('🖼️ Reference images:', referenceImages ? referenceImages.length : 0);
  
  return {
    success: true,
    message: 'Idle animation request received',
    category: 'idle_animation',
    userPrompt,
    extractedParams,
  };
}

/**
 * Stubbed function for jump animation requests
 */
async function handleJumpAnimation(userPrompt: string, extractedParams?: Record<string, any>, referenceImages?: any[]) {
  console.log('🦘 JUMP ANIMATION: Function reached successfully!');
  console.log('📝 User prompt:', userPrompt);
  console.log('📋 Extracted params:', extractedParams);
  console.log('🖼️ Reference images:', referenceImages ? referenceImages.length : 0);
  
  return {
    success: true,
    message: 'Jump animation request received',
    category: 'jump_animation',
    userPrompt,
    extractedParams,
  };
}

/**
 * Stubbed function for dance animation requests
 */
async function handleDanceAnimation(userPrompt: string, extractedParams?: Record<string, any>, referenceImages?: any[]) {
  console.log('💃 DANCE ANIMATION: Function reached successfully!');
  console.log('📝 User prompt:', userPrompt);
  console.log('📋 Extracted params:', extractedParams);
  console.log('🖼️ Reference images:', referenceImages ? referenceImages.length : 0);
  
  return {
    success: true,
    message: 'Dance animation request received',
    category: 'dance_animation',
    userPrompt,
    extractedParams,
  };
}

/**
 * Stubbed function for other animation requests
 */
async function handleOtherAnimation(userPrompt: string, extractedParams?: Record<string, any>, referenceImages?: any[]) {
  console.log('🎭 OTHER ANIMATION: Function reached successfully!');
  console.log('📝 User prompt:', userPrompt);
  console.log('📋 Extracted params:', extractedParams);
  console.log('🖼️ Reference images:', referenceImages ? referenceImages.length : 0);
  
  return {
    success: true,
    message: 'Other animation request received',
    category: 'other_animation',
    userPrompt,
    extractedParams,
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
 * Stubbed function for appearance change requests (fallback to original system)
 */
async function handleAppearanceChange(userPrompt: string, extractedParams?: Record<string, any>, referenceImages?: any[]) {
  console.log('🎨 APPEARANCE CHANGE: Function reached successfully!');
  console.log('📝 User prompt:', userPrompt);
  console.log('📋 Extracted params:', extractedParams);
  console.log('🖼️ Reference images:', referenceImages ? referenceImages.length : 0);
  
  return {
    success: true,
    message: 'Appearance change request - routing to original system',
    category: 'appearance_change',
    userPrompt,
    extractedParams,
    useOriginalSystem: true,
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
    
    case 'walk_animation':
      return await handleWalkAnimation(userPrompt, extractedParams, referenceImages);
    
    case 'run_animation':
      return await handleRunAnimation(userPrompt, extractedParams, referenceImages);
    
    case 'idle_animation':
      return await handleIdleAnimation(userPrompt, extractedParams, referenceImages);
    
    case 'jump_animation':
      return await handleJumpAnimation(userPrompt, extractedParams, referenceImages);
    
    case 'dance_animation':
      return await handleDanceAnimation(userPrompt, extractedParams, referenceImages);
    
    case 'other_animation':
      return await handleOtherAnimation(userPrompt, extractedParams, referenceImages);
    
    case 'export_assets':
      return await handleExportAssets(userPrompt, extractedParams, referenceImages);
    
    case 'appearance_change':
      return await handleAppearanceChange(userPrompt, extractedParams, referenceImages);
    
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