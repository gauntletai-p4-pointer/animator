// ===== PACKAGE.JSON =====
const packageJsonExample = {
  "name": "spine-walking-demo",
  "version": "1.0.0",
  "description": "Spine2D walking animation demo",
  "main": "dist/main.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "serve": "npx http-server . -p 8080"
  },
  "dependencies": {
    "@esotericsoftware/spine-webgl": "^4.2.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "http-server": "^14.0.0"
  }
};
