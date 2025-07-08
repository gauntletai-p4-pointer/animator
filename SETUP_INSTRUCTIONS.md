# Setup Instructions for Spine2D Animation Studio

## Environment Configuration

To use the LLM router and AI assistant features, you need to configure your OpenAI API key:

1. Create a `.env.local` file in the `animator/` directory
2. Add your OpenAI API key:

```
OPENAI_API_KEY=your_actual_openai_api_key_here
```

## Required Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key for GPT-4.1-mini integration

## Testing the LLM Router

Once configured, you can test the LLM router by running the application and trying these example prompts in the chat:

### Primary Test Cases
- **"Make the character wear a red hat"** → Should route to `image_generation` with GPT-image-1 generation
- **"Give him a hat"** → Should route to `image_generation` with GPT-image-1 generation
- **"Make him walk faster"** → Should route to `walk_animation` with parameter modification
- **"Export the character assets"** → Should route to `export_assets` with package creation

### Animation Requests
- "Make him walk faster" → Should route to `walk_animation` (with speed parameters)
- "Create a dance animation" → Should route to `dance_animation`
- "Make him jump" → Should route to `jump_animation`
- "Add a running animation" → Should route to `run_animation`

### Image Generation Requests (GPT-image-1 Integration)
- "Generate a sword texture" → Should route to `image_generation` (with reference images)
- "Make the character wear a red hat" → Should route to `image_generation` (with reference images)
- "Give him a hat" → Should route to `image_generation` (with reference images)
- "Create a hat image" → Should route to `image_generation` (with reference images)

### Export Requests
- "Export the character assets" → Should route to `export_assets` (with file packaging)
- "Download the animation" → Should route to `export_assets`

### Appearance Changes
- "Make him blue" → Should route to `appearance_change` (uses original system)
- "Change his hat" → Should route to `appearance_change` (uses original system)

## Console Output

The LLM router includes extensive console logging. Check your browser's developer console and the terminal running the Next.js server to see the routing process in action.

## Development

```bash
npm install
npm run dev
```

The application will be available at `http://localhost:3000`

## Image Generation Feature

The LLM router now includes GPT-image-1 integration with intelligent prompt rewriting:

- **Intelligent Prompt Rewriting**: Uses GPT-4.1-mini to transform user requests into clear image generation prompts
- **Real Image Generation**: Uses OpenAI's GPT-image-1 model to generate actual PNG images (1024x1024)
- **Reference Context Integration**: Automatically adds character part names as art style context
- **Enhanced Prompts**: Optimizes prompts using reference part names for art style consistency
- **Chat Integration**: Generated images appear directly in the chat conversation as assistant replies
- **Live Preview**: Generated images also appear in the dedicated sidebar for management
- **Image Management**: Click the × button to remove generated images
- **Error Handling**: Graceful fallback if image generation fails

### Prompt Rewriting Examples
- "Give him a hat" → "Generate an image of a hat"
- "Make the character wear red shoes" → "Generate an image of red shoes"
- "Add a sword to his hand" → "Generate an image of a sword"
- "Create armor for his chest" → "Generate an image of chest armor"

Generated images are displayed in two ways:

**In Chat Conversation:**
- Success: Shows image directly in chat with markdown image format
- Failure: Shows error message with details and suggested retry
- Context: Includes original request, rewritten prompt, and generation details

**In Sidebar Preview:**
- Dedicated image management area
- Original user request and rewritten prompt
- GPT-image-1's generated PNG image (1024x1024)
- Image type and color information
- Close button to remove from preview area

## Reference Image System

The system automatically loads character part information from the assets directory:

- **Automatic Loading**: Loads 40+ character part names on component mount
- **Smart Filtering**: Selects relevant reference parts based on user prompt
- **Context Enhancement**: Adds reference part names as art style context to GPT-image-1 prompts
- **Type Categorization**: Organizes parts by character_part, texture, and accessory
- **Intelligent Matching**: Matches body parts mentioned in prompts to relevant references

Reference images include:
- Body parts (head, torso, arms, legs)
- Accessories (goggles, gun, hoverboard)
- Effects (muzzle flashes, portals, glows)
- Facial features (eyes, mouth expressions) 