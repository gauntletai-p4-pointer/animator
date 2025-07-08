import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';

// Tool schemas for appearance changes and animation creation
const changeAppearanceSchema = z.object({
  type: z.enum(['skin', 'attachment', 'color', 'texture']),
  target: z.string().describe('The slot or skin name to modify'),
  value: z.any().describe('The new value (skin name, attachment name, color values, or texture data)'),
  description: z.string().describe('Human-readable description of the change'),
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

export async function POST(req: Request) {
  const body = await req.json();
  const { messages } = body;

  const result = await streamText({
    model: openai('gpt-4o'),
    messages,
    system: `You are a Spine2D animation assistant. You help users modify character appearance and create animations.
    
When users ask to change appearance, analyze their request and use the changeAppearance tool to specify:
- type: 'skin' for switching predefined skins, 'attachment' for changing specific parts, 'color' for tinting, 'texture' for new textures
- target: the specific slot or skin to modify
- value: the new value to apply

When users ask to create animations, use the createAnimation tool to define:
- name: a descriptive name for the animation
- duration: how long the animation should last
- timelines: the property changes over time (rotation, translation, scale, etc.)
- keyframes: specific values at specific times

Examples:
- "Make him wear a red hat" -> changeAppearance with type: 'attachment', target: 'head', value: 'hat_red'
- "Change skin to zombie" -> changeAppearance with type: 'skin', target: 'default', value: 'zombie'
- "Make him blue" -> changeAppearance with type: 'color', target: 'body', value: { r: 0.5, g: 0.5, b: 1, a: 1 }
- "Create a dance animation" -> createAnimation with rotation and translation timelines
`,
    tools: {
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