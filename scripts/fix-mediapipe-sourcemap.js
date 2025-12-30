#!/usr/bin/env node

/**
 * Fix MediaPipe source map path issue
 * Vite looks for vision_bundle_mjs.js.map but the file is vision_bundle.mjs.map
 * This script creates a copy with the expected name
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceMapPath = path.join(
  __dirname,
  '../node_modules/@livekit/track-processors/node_modules/@mediapipe/tasks-vision/vision_bundle.mjs.map'
);

const targetPath = path.join(
  __dirname,
  '../node_modules/@livekit/track-processors/node_modules/@mediapipe/tasks-vision/vision_bundle_mjs.js.map'
);

if (fs.existsSync(sourceMapPath) && !fs.existsSync(targetPath)) {
  try {
    fs.copyFileSync(sourceMapPath, targetPath);
    console.log('✓ Fixed MediaPipe source map path');
  } catch (error) {
    console.warn('⚠ Could not fix MediaPipe source map:', error.message);
  }
} else if (!fs.existsSync(sourceMapPath)) {
  console.warn('⚠ MediaPipe source map not found, skipping fix');
}

