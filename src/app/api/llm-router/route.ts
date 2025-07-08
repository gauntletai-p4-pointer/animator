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
   Examples: "generate a hat texture", "create a sword image", "make a background image"

2. "walk_animation" - User wants to create or modify walking animations
   Examples: "make him walk", "create a walking animation", "modify the walk cycle"

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
   Examples: "export the animation", "download the character", "save the assets"

9. "appearance_change" - User wants to change character appearance (skin, colors, attachments)
   Examples: "make him blue", "change his hat", "switch to zombie skin"

10. "unknown" - The request doesn't fit any category or is unclear

Respond with a JSON object containing:
- category: one of the above categories
- confidence: a number between 0 and 1 indicating your confidence
- reasoning: a brief explanation of why you chose this category
- extractedParams: any relevant parameters you can extract from the request (optional)

Be very specific and choose the most appropriate category. If unsure, use "unknown".`;

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
      const jsonResponse = JSON.parse(result.text);
      parsedResponse = RouterResponseSchema.parse(jsonResponse);
      console.log('✅ LLM Router: Successfully parsed response:', parsedResponse);
    } catch (parseError) {
      console.error('❌ LLM Router: Failed to parse response:', parseError);
      console.error('📄 Raw response that failed to parse:', result.text);
      
      // Fallback response
      parsedResponse = {
        category: 'unknown',
        confidence: 0,
        reasoning: 'Failed to parse LLM response',
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
 * Stubbed function for image generation requests
 */
async function handleImageGeneration(userPrompt: string, extractedParams?: Record<string, any>) {
  console.log('🎨 IMAGE GENERATION: Function reached successfully!');
  console.log('📝 User prompt:', userPrompt);
  console.log('📋 Extracted params:', extractedParams);
  
  return {
    success: true,
    message: 'Image generation request received (not implemented yet)',
    category: 'image_generation',
    userPrompt,
    extractedParams,
  };
}

/**
 * Stubbed function for walk animation requests
 */
async function handleWalkAnimation(userPrompt: string, extractedParams?: Record<string, any>) {
  console.log('🚶 WALK ANIMATION: Function reached successfully!');
  console.log('📝 User prompt:', userPrompt);
  console.log('📋 Extracted params:', extractedParams);
  
  return {
    success: true,
    message: 'Walk animation request received',
    category: 'walk_animation',
    userPrompt,
    extractedParams,
  };
}

/**
 * Stubbed function for run animation requests
 */
async function handleRunAnimation(userPrompt: string, extractedParams?: Record<string, any>) {
  console.log('🏃 RUN ANIMATION: Function reached successfully!');
  console.log('📝 User prompt:', userPrompt);
  console.log('📋 Extracted params:', extractedParams);
  
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
async function handleIdleAnimation(userPrompt: string, extractedParams?: Record<string, any>) {
  console.log('🧍 IDLE ANIMATION: Function reached successfully!');
  console.log('📝 User prompt:', userPrompt);
  console.log('📋 Extracted params:', extractedParams);
  
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
async function handleJumpAnimation(userPrompt: string, extractedParams?: Record<string, any>) {
  console.log('🦘 JUMP ANIMATION: Function reached successfully!');
  console.log('📝 User prompt:', userPrompt);
  console.log('📋 Extracted params:', extractedParams);
  
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
async function handleDanceAnimation(userPrompt: string, extractedParams?: Record<string, any>) {
  console.log('💃 DANCE ANIMATION: Function reached successfully!');
  console.log('📝 User prompt:', userPrompt);
  console.log('📋 Extracted params:', extractedParams);
  
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
async function handleOtherAnimation(userPrompt: string, extractedParams?: Record<string, any>) {
  console.log('🎭 OTHER ANIMATION: Function reached successfully!');
  console.log('📝 User prompt:', userPrompt);
  console.log('📋 Extracted params:', extractedParams);
  
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
 */
async function handleExportAssets(userPrompt: string, extractedParams?: Record<string, any>) {
  console.log('📦 EXPORT ASSETS: Function reached successfully!');
  console.log('📝 User prompt:', userPrompt);
  console.log('📋 Extracted params:', extractedParams);
  
  return {
    success: true,
    message: 'Export assets request received (not implemented yet)',
    category: 'export_assets',
    userPrompt,
    extractedParams,
  };
}

/**
 * Stubbed function for appearance change requests (fallback to original system)
 */
async function handleAppearanceChange(userPrompt: string, extractedParams?: Record<string, any>) {
  console.log('🎨 APPEARANCE CHANGE: Function reached successfully!');
  console.log('📝 User prompt:', userPrompt);
  console.log('📋 Extracted params:', extractedParams);
  
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
async function routeRequest(category: RequestCategoryType, userPrompt: string, extractedParams?: Record<string, any>) {
  console.log('🎯 LLM Router: Routing request to category:', category);
  
  switch (category) {
    case 'image_generation':
      return await handleImageGeneration(userPrompt, extractedParams);
    
    case 'walk_animation':
      return await handleWalkAnimation(userPrompt, extractedParams);
    
    case 'run_animation':
      return await handleRunAnimation(userPrompt, extractedParams);
    
    case 'idle_animation':
      return await handleIdleAnimation(userPrompt, extractedParams);
    
    case 'jump_animation':
      return await handleJumpAnimation(userPrompt, extractedParams);
    
    case 'dance_animation':
      return await handleDanceAnimation(userPrompt, extractedParams);
    
    case 'other_animation':
      return await handleOtherAnimation(userPrompt, extractedParams);
    
    case 'export_assets':
      return await handleExportAssets(userPrompt, extractedParams);
    
    case 'appearance_change':
      return await handleAppearanceChange(userPrompt, extractedParams);
    
    default:
      console.log('❓ LLM Router: Unknown category, using fallback');
      return {
        success: false,
        message: 'Unknown request category',
        category: 'unknown',
        userPrompt,
        extractedParams,
        useOriginalSystem: true,
      };
  }
}

export async function POST(req: Request) {
  console.log('🚀 LLM Router API: Received POST request');
  
  try {
    const body = await req.json();
    console.log('📦 LLM Router: Request body:', body);
    
    const { userPrompt } = body;
    
    if (!userPrompt || typeof userPrompt !== 'string') {
      console.error('❌ LLM Router: Invalid or missing userPrompt');
      return Response.json({ 
        error: 'Invalid or missing userPrompt' 
      }, { status: 400 });
    }

    console.log('🔄 LLM Router: Starting categorization process');
    
    // Step 1: Categorize the request
    const categorization = await categorizeRequest(userPrompt);
    console.log('📊 LLM Router: Categorization result:', categorization);
    
    // Step 2: Route to appropriate handler
    const routingResult = await routeRequest(
      categorization.category, 
      userPrompt, 
      categorization.extractedParams
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