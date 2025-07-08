# AI Assistant Setup

To enable the AI chat sidebar for natural language control of Spine2D animations, you need to set up your OpenAI API key.

## Setup Instructions

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_actual_openai_api_key_here
   ```

3. Get an OpenAI API key from: https://platform.openai.com/api-keys

## Features

The AI assistant can help you:

### 1. Appearance Changes
- Change character skins: "Switch to the zombie skin"
- Swap attachments: "Give the character a red hat"
- Modify colors: "Make the character's body blue"
- Update textures (planned feature)

### 2. Animation Creation
- Create custom animations with natural language
- Examples:
  - "Create a dance animation with hip swaying"
  - "Make a jump animation that goes up and down"
  - "Create a wave animation for the arm"

## How It Works

The AI assistant uses OpenAI's GPT-4 to understand your requests and converts them into appropriate Spine2D API calls:

- **Appearance changes** modify the skeleton's skins, attachments, or slot colors
- **Animation creation** generates timelines with keyframes for bones and slots

The assistant will show the status of tool calls in the chat, so you can see when changes are being applied to your character.