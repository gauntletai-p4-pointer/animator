We want to add a sidebar to the UI with a chat interface to an OpenAI LLM backend. Our ultimate goal is to take a natural language user request to alter the character's appearance or animations (including creating new animations) and use the api described in `references/spine-api` plus Vercel's ai sdk (version 5, `npm i ai`) to turn those user requests into the appropriate agent flows and tool calls to execute them. 

Lets focus on getting two flows:

1. appeareance change (generate modified `public/assets/${name}.png` and `public/assets/${name}.atlas` and `public/assets/${name}.json and set the UI to load them instead of the originals as appropriate)

2. new animation creation (following the api as a guide and the existing animations, create a new animation and the appropriate backing assets, and make sure it loads into/is previewable in the UI)