import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';

// Tool schemas for appearance changes and animation creation
const changeAppearanceSchema = z.object({
  type: z.enum(['skin', 'attachment', 'color', 'texture']),
  target: z.string().describe('The slot or skin name to modify'),
  value: z.any().describe('The new value (skin name, attachment name, color values, or texture data)'),
  description: z.string().describe('Human-readable description of the change'),
  needsGeneration: z.boolean().optional().describe('Whether this asset needs to be generated'),
});

const createAnimationSchema = z.object({
  name: z.string().describe('Name of the new animation'),
  duration: z.number().describe('Duration in seconds'),
  timelines: z.array(z.object({
    type: z.enum(['rotate', 'translate', 'scale', 'attachment', 'color']),
    target: z.string().describe('Bone or slot name'),
    keyframes: z.array(z.object({
      time: z.number().describe('Time in seconds'),
      value: z.any().describe('Value at this keyframe (angle, position, scale, etc.)'),
    })),
  })),
  description: z.string().describe('Human-readable description of the animation'),
});

// Schema for image generation
const generateImageSchema = z.object({
  prompt: z.string().describe('Detailed prompt for DALL-E to generate the asset'),
  assetType: z.string().describe('Type of asset (e.g., hat, weapon, clothing)'),
  targetSlot: z.string().describe('Target slot name'),
});

export async function POST(req: Request) {
  const body = await req.json();
  const { messages, referenceImages } = body;

  const result = await streamText({
    model: openai('gpt-4o'),
    messages,
    system: `You are a Spine2D animation assistant. You help users modify character appearance and create animations.

IMPORTANT: When users request appearance changes (especially attachments), you should:
1. First use the checkAssetExists tool to verify if the requested asset exists
2. If it doesn't exist, use the generateAsset tool to create it using DALL-E
3. Then proceed with the changeAppearance tool

Available reference images: ${referenceImages?.length || 0} images uploaded by the user.

When users ask to change appearance:
- type: 'skin' for switching predefined skins, 'attachment' for changing specific parts, 'color' for tinting, 'texture' for new textures
- target: the specific slot or skin to modify
- value: the new value to apply
- needsGeneration: true if the asset doesn't exist and needs to be generated

When users ask to create animations, use the createAnimation tool to define:
- name: a descriptive name for the animation
- duration: how long the animation should last
- timelines: the property changes over time (rotation, translation, scale, etc.)
- keyframes: specific values at specific times

Examples:
- "Make him wear a red hat" -> First check if 'hat_red' exists, generate if needed, then changeAppearance with type: 'attachment', target: 'head', value: 'hat_red'
- "Change skin to zombie" -> changeAppearance with type: 'skin', target: 'default', value: 'zombie'
- "Make him blue" -> changeAppearance with type: 'color', target: 'body', value: { r: 0.5, g: 0.5, b: 1, a: 1 }
- "Create a dance animation" -> createAnimation with rotation and translation timelines
`,
    tools: {
      checkAssetExists: tool({
        description: 'Check if a specific asset exists in the current skeleton',
        parameters: z.object({
          assetType: z.enum(['attachment', 'skin']),
          assetName: z.string(),
          slotName: z.string().optional(),
        }),
        execute: async ({ assetType, assetName, slotName }) => {
          // This will be checked on the client side
          console.log('Checking asset existence:', { assetType, assetName, slotName });
          return {
            exists: false, // For now, assume it doesn't exist to trigger generation
            assetType,
            assetName,
            slotName,
          };
        },
      }),
      generateAsset: tool({
        description: 'Generate a new asset using DALL-E based on description and reference images',
        parameters: generateImageSchema,
        execute: async ({ prompt, assetType, targetSlot }) => {
          try {
            // For now, return a placeholder - actual DALL-E integration would go here
            console.log('Would generate asset with prompt:', prompt);
            
            // In production, you would use:
            // const response = await openai.images.generate({
            //   model: "dall-e-3",
            //   prompt: `Create a ${assetType} sprite...`,
            //   n: 1,
            //   size: "1024x1024",
            // });
            
            return {
              success: true,
              assetType,
              targetSlot,
              imageUrl: 'placeholder-image-url', // response.data[0].url in production
              timestamp: new Date().toISOString(),
              needsImplementation: true,
            };
          } catch (error) {
            console.error('Failed to generate asset:', error);
            return {
              success: false,
              error: 'Failed to generate asset',
            };
          }
        },
      }),
      changeAppearance: tool({
        description: 'Change the appearance of the character',
        parameters: changeAppearanceSchema,
        execute: async (args) => {
          console.log('Appearance change requested:', args);
          return {
            success: true,
            ...args,
            timestamp: new Date().toISOString(),
          };
        },
      }),
      createAnimation: tool({
        description: 'Create a new animation',
        parameters: createAnimationSchema,
        execute: async (args) => {
          console.log('Animation creation requested:', args);
          return {
            success: true,
            ...args,
            timestamp: new Date().toISOString(),
          };
        },
      }),
    },
    onFinish: async ({ text, toolCalls, toolResults }) => {
      // Log the results for debugging
      console.log('Finished with:', { text, toolCalls, toolResults });
    },
  });

  return result.toDataStreamResponse();
}