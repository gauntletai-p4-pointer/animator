/**
 * Background removal utility for generated images
 * Removes solid backgrounds (especially white) to create transparent images
 */

interface BackgroundRemovalOptions {
  tolerance?: number; // Color tolerance for background detection (0-255)
  edgeDetection?: boolean; // Whether to use edge detection for background color
  backgroundColor?: { r: number; g: number; b: number }; // Specific background color to remove
}

/**
 * Removes solid backgrounds from an image and makes them transparent
 * @param imageDataUrl - The image data URL to process
 * @param options - Options for background removal
 * @returns Promise<string> - The processed image as a data URL with transparent background
 */
export async function removeBackground(
  imageDataUrl: string, 
  options: BackgroundRemovalOptions = {}
): Promise<string> {
  const {
    tolerance = 30,
    edgeDetection = true,
    backgroundColor = null
  } = options;

  console.log('🎭 BACKGROUND REMOVAL: Starting background removal process');
  console.log('   📊 Tolerance:', tolerance);
  console.log('   🔍 Edge detection:', edgeDetection);
  console.log('   🎨 Custom background color:', backgroundColor);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        console.log('✅ BACKGROUND REMOVAL: Image loaded successfully');
        console.log(`   📏 Dimensions: ${img.width}x${img.height}`);
        
        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw image on canvas
        ctx.drawImage(img, 0, 0);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        console.log('📊 BACKGROUND REMOVAL: Processing image data...');
        
        // Detect background color
        const bgColor = backgroundColor || detectBackgroundColor(data, canvas.width, canvas.height, edgeDetection);
        
        console.log('🎨 BACKGROUND REMOVAL: Background color detected:', bgColor);
        
        // Remove background
        let pixelsChanged = 0;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Check if pixel matches background color (within tolerance)
          const colorDistance = Math.sqrt(
            Math.pow(r - bgColor.r, 2) + 
            Math.pow(g - bgColor.g, 2) + 
            Math.pow(b - bgColor.b, 2)
          );
          
          if (colorDistance <= tolerance) {
            // Make pixel transparent
            data[i + 3] = 0;
            pixelsChanged++;
          }
        }
        
        console.log(`🔄 BACKGROUND REMOVAL: Made ${pixelsChanged} pixels transparent`);
        console.log(`   📊 Percentage changed: ${((pixelsChanged / (data.length / 4)) * 100).toFixed(1)}%`);
        
        // Apply modified image data back to canvas
        ctx.putImageData(imageData, 0, 0);
        
        // Convert to data URL
        const processedDataUrl = canvas.toDataURL('image/png');
        
        console.log('✅ BACKGROUND REMOVAL: Background removal completed successfully');
        console.log(`   📏 Output size: ${processedDataUrl.length} characters`);
        
        resolve(processedDataUrl);
        
      } catch (error) {
        console.error('❌ BACKGROUND REMOVAL: Error processing image:', error);
        reject(error);
      }
    };
    
    img.onerror = () => {
      const error = new Error('Failed to load image for background removal');
      console.error('❌ BACKGROUND REMOVAL: Failed to load image');
      reject(error);
    };
    
    img.src = imageDataUrl;
  });
}

/**
 * Detects the most likely background color from an image
 * @param data - Image data array
 * @param width - Image width
 * @param height - Image height
 * @param useEdgeDetection - Whether to sample from edges only
 * @returns The detected background color
 */
function detectBackgroundColor(
  data: Uint8ClampedArray, 
  width: number, 
  height: number, 
  useEdgeDetection: boolean = true
): { r: number; g: number; b: number } {
  const colorCounts = new Map<string, number>();
  
  // Sample pixels for background detection
  const pixelsToSample: number[] = [];
  
  if (useEdgeDetection) {
    // Sample from edges (corners and borders)
    console.log('🔍 BACKGROUND REMOVAL: Using edge detection for background color');
    
    // Top and bottom edges
    for (let x = 0; x < width; x++) {
      pixelsToSample.push(0 * width + x); // Top edge
      pixelsToSample.push((height - 1) * width + x); // Bottom edge
    }
    
    // Left and right edges
    for (let y = 0; y < height; y++) {
      pixelsToSample.push(y * width + 0); // Left edge
      pixelsToSample.push(y * width + (width - 1)); // Right edge
    }
  } else {
    // Sample from entire image
    console.log('🔍 BACKGROUND REMOVAL: Sampling entire image for background color');
    for (let i = 0; i < width * height; i++) {
      pixelsToSample.push(i);
    }
  }
  
  // Count color frequencies
  for (const pixelIndex of pixelsToSample) {
    const dataIndex = pixelIndex * 4;
    const r = data[dataIndex];
    const g = data[dataIndex + 1];
    const b = data[dataIndex + 2];
    
    const colorKey = `${r},${g},${b}`;
    colorCounts.set(colorKey, (colorCounts.get(colorKey) || 0) + 1);
  }
  
  // Find most common color
  let mostCommonColor = { r: 255, g: 255, b: 255 }; // Default to white
  let maxCount = 0;
  
  for (const [colorKey, count] of colorCounts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      const [r, g, b] = colorKey.split(',').map(Number);
      mostCommonColor = { r, g, b };
    }
  }
  
  console.log(`🎨 BACKGROUND REMOVAL: Most common color: rgb(${mostCommonColor.r}, ${mostCommonColor.g}, ${mostCommonColor.b}) - ${maxCount} occurrences`);
  
  return mostCommonColor;
}

/**
 * Applies additional cleanup to remove artifacts and improve transparency
 * @param imageDataUrl - The image data URL to clean up
 * @returns Promise<string> - The cleaned image data URL
 */
export async function cleanupTransparency(imageDataUrl: string): Promise<string> {
  console.log('🧹 TRANSPARENCY CLEANUP: Starting cleanup process');
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Remove semi-transparent pixels that might be artifacts
        let cleanedPixels = 0;
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          
          // If pixel is very faint (low alpha), make it fully transparent
          if (alpha < 50) {
            data[i + 3] = 0;
            cleanedPixels++;
          }
          // If pixel is nearly opaque, make it fully opaque
          else if (alpha > 200) {
            data[i + 3] = 255;
          }
        }
        
        console.log(`🧹 TRANSPARENCY CLEANUP: Cleaned ${cleanedPixels} semi-transparent pixels`);
        
        ctx.putImageData(imageData, 0, 0);
        
        const cleanedDataUrl = canvas.toDataURL('image/png');
        
        console.log('✅ TRANSPARENCY CLEANUP: Cleanup completed successfully');
        resolve(cleanedDataUrl);
        
      } catch (error) {
        console.error('❌ TRANSPARENCY CLEANUP: Error during cleanup:', error);
        reject(error);
      }
    };
    
    img.onerror = () => {
      const error = new Error('Failed to load image for cleanup');
      console.error('❌ TRANSPARENCY CLEANUP: Failed to load image');
      reject(error);
    };
    
    img.src = imageDataUrl;
  });
}

/**
 * Convenience function that combines background removal and cleanup
 * @param imageDataUrl - The image data URL to process
 * @param options - Options for background removal
 * @returns Promise<string> - The processed image with transparent background
 */
export async function makeTransparent(
  imageDataUrl: string, 
  options: BackgroundRemovalOptions = {}
): Promise<string> {
  console.log('🎭 MAKE TRANSPARENT: Starting full transparency process');
  
  try {
    // Step 1: Remove background
    const backgroundRemoved = await removeBackground(imageDataUrl, options);
    
    // Step 2: Clean up transparency
    const cleaned = await cleanupTransparency(backgroundRemoved);
    
    console.log('✅ MAKE TRANSPARENT: Transparency process completed successfully');
    return cleaned;
    
  } catch (error) {
    console.error('❌ MAKE TRANSPARENT: Error in transparency process:', error);
    throw error;
  }
} 