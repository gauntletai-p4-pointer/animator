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
- **"Make the character wear a red hat"** → Should route to `image_generation` with detailed logging
- **"Make him walk faster"** → Should route to `walk_animation` with parameter modification
- **"Export the character assets"** → Should route to `export_assets` with package creation

### Animation Requests
- "Make him walk faster" → Should route to `walk_animation` (with speed parameters)
- "Create a dance animation" → Should route to `dance_animation`
- "Make him jump" → Should route to `jump_animation`
- "Add a running animation" → Should route to `run_animation`

### Image Generation Requests
- "Generate a sword texture" → Should route to `image_generation`
- "Make the character wear a red hat" → Should route to `image_generation` (with item parameters)
- "Create a hat image" → Should route to `image_generation`

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