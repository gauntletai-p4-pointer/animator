'use client';

import { useEffect, useRef, useState } from 'react';
import { 
  ManagedWebGLRenderingContext, 
  Skeleton, 
  AnimationState, 
  AnimationStateData, 
  AtlasAttachmentLoader, 
  SkeletonJson, 
  SceneRenderer,
  AssetManager,
  TextureAtlas,
  RotateTimeline, 
  TranslateTimeline, 
  Animation,
  Timeline,
  Physics,
  ResizeMode,
  GLTexture,
  TextureRegion,
  RegionAttachment
} from '@esotericsoftware/spine-webgl';
import BodyPartPopover from './BodyPartPopover';

interface SpineAssets {
  skeleton: string | null;
  atlas: string | null;
  texture: string | null;
}

interface SpineViewerProps {
  onSkeletonLoaded?: (skeleton: Skeleton, animationState: AnimationState) => void;
  onDynamicAttachmentCreator?: (createAttachment: (slotName: string, imageUrl: string) => Promise<void>) => void;
}

export default function SpineViewer({ onSkeletonLoaded, onDynamicAttachmentCreator }: SpineViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [assets, setAssets] = useState<SpineAssets>({
    skeleton: null,
    atlas: null,
    texture: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableAnimations, setAvailableAnimations] = useState<string[]>([]);
  const [selectedAnimation, setSelectedAnimation] = useState<string>('');
  const [loadedSkeleton, setLoadedSkeleton] = useState<Skeleton | null>(null);
  const animationRef = useRef<number | null>(null);
  const contextRef = useRef<ManagedWebGLRenderingContext | null>(null);
  const rendererRef = useRef<SceneRenderer | null>(null);
  const skeletonRef = useRef<Skeleton | null>(null);
  const animationStateRef = useRef<AnimationState | null>(null);

  // Try to load default Spineboy assets
  useEffect(() => {
    const loadDefaultAssets = async () => {
      try {
        const skeletonRes = await fetch('/assets/spineboy/export/spineboy-ess.json');
        const atlasRes = await fetch('/assets/spineboy/export/spineboy.atlas');
        
        if (skeletonRes.ok && atlasRes.ok) {
          const skeletonText = await skeletonRes.text();
          const atlasText = await atlasRes.text();
          console.log('Loaded default assets successfully');
          setAssets({
            skeleton: skeletonText,
            atlas: atlasText,
            texture: '/assets/spineboy/export/spineboy.png'
          });
        }
      } catch {
        console.log('Default assets not found, waiting for upload');
      }
    };
    
    loadDefaultAssets();
  }, []);

  // File upload handlers
  const handleFileUpload = (type: keyof SpineAssets) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'texture') {
      const url = URL.createObjectURL(file);
      setAssets(prev => ({ ...prev, texture: url }));
    } else {
      const text = await file.text();
      setAssets(prev => ({ ...prev, [type]: text }));
    }
  };

  // Animation change handler
  const handleAnimationChange = (animationName: string) => {
    setSelectedAnimation(animationName);
    if (animationStateRef.current && skeletonRef.current) {
      animationStateRef.current.setAnimation(0, animationName, true);
    }
  };

  // Create walking animation programmatically
  const createWalkingAnimation = (skeleton: Skeleton): Animation => {
    const timelines: Timeline[] = [];

    // Helper to find bone index
    const findBoneIndex = (name: string): number => {
      const bone = skeleton.findBone(name);
      return bone ? skeleton.data.bones.indexOf(bone.data) : -1;
    };

    // Leg bones - creating simple rotation animation
    const legBones = [
      { name: 'front-thigh', phase: 0 },
      { name: 'front-shin', phase: 0 },
      { name: 'rear-thigh', phase: Math.PI },
      { name: 'rear-shin', phase: Math.PI }
    ];

    // Try hip bone first, then fall back to root
    const hipIndex = findBoneIndex('hip');
    const rootIndex = findBoneIndex('root');
    const bodyIndex = hipIndex >= 0 ? hipIndex : rootIndex;

    legBones.forEach(({ name }) => {
      const boneIndex = findBoneIndex(name);
      if (boneIndex >= 0) {
        const timeline = new RotateTimeline(4, 4, boneIndex);
        // Walking cycle keyframes
        timeline.setFrame(0, 0, name.includes('thigh') ? -30 : -10);
        timeline.setFrame(1, 0.25, name.includes('thigh') ? 30 : 5);
        timeline.setFrame(2, 0.5, name.includes('thigh') ? 30 : 30);
        timeline.setFrame(3, 0.75, name.includes('thigh') ? -30 : -10);
        timelines.push(timeline);
      }
    });

    // Body translation for walking motion
    if (bodyIndex >= 0) {
      const translateTimeline = new TranslateTimeline(3, 3, bodyIndex);
      translateTimeline.setFrame(0, 0, 0, 0);
      translateTimeline.setFrame(1, 0.5, 0, -10);
      translateTimeline.setFrame(2, 1.0, 0, 0);
      timelines.push(translateTimeline);
    }

    return new Animation("walk", timelines, 1.0);
  };

  // Initialize Spine
  useEffect(() => {
    if (!canvasRef.current || !assets.skeleton || !assets.atlas || !assets.texture) return;

    setLoading(true);
    setError(null);

    const canvas = canvasRef.current;
    
    try {
      // Create WebGL context
      const context = new ManagedWebGLRenderingContext(canvas);
      contextRef.current = context;

      // Create renderer
      const renderer = new SceneRenderer(canvas, context);
      rendererRef.current = renderer;

      // Create asset manager (unused but required for initialization)
      new AssetManager(context, "");

      // Load texture
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        try {
          // Create texture
          const texture = context.gl.createTexture();
          if (!texture) throw new Error('Failed to create texture');
          
          context.gl.bindTexture(context.gl.TEXTURE_2D, texture);
          context.gl.texImage2D(context.gl.TEXTURE_2D, 0, context.gl.RGBA, context.gl.RGBA, context.gl.UNSIGNED_BYTE, img);
          context.gl.texParameteri(context.gl.TEXTURE_2D, context.gl.TEXTURE_MIN_FILTER, context.gl.LINEAR);
          context.gl.texParameteri(context.gl.TEXTURE_2D, context.gl.TEXTURE_MAG_FILTER, context.gl.LINEAR);
          
          // Create GLTexture wrapper for Spine
          const glTexture = new GLTexture(context, img, false);
          
          // Parse atlas with the texture
          const atlas = new TextureAtlas(assets.atlas!);
          const pages = atlas.pages;
          if (pages.length > 0) {
            pages[0].setTexture(glTexture);
          }
          
          // Load skeleton data
          const atlasLoader = new AtlasAttachmentLoader(atlas);
          const skeletonJson = new SkeletonJson(atlasLoader);
          // Scale based on device pixel ratio for consistent appearance
          // Base scale of 0.5, multiplied by dpr (so 1.0 on retina, 0.5 on standard)
          const dpr = window.devicePixelRatio || 1;
          skeletonJson.scale = 0.5 * dpr;
          
          const skeletonData = skeletonJson.readSkeletonData(assets.skeleton!);
          const skeleton = new Skeleton(skeletonData);
          skeletonRef.current = skeleton;

          // Set the default skin
          if (skeletonData.defaultSkin) {
            console.log('🎨 Setting default skin:', skeletonData.defaultSkin.name);
            skeleton.setSkin(skeletonData.defaultSkin);
          } else if (skeletonData.skins.length > 0) {
            console.log('🎨 Setting first available skin:', skeletonData.skins[0].name);
            skeleton.setSkin(skeletonData.skins[0]);
          } else {
            console.warn('⚠️ No skins available in skeleton data');
          }

          // Set to setup pose
          skeleton.setToSetupPose();
          skeleton.setSlotsToSetupPose();
          skeleton.update(0);
          skeleton.updateWorldTransform(Physics.reset);
          
          // Verify skin is set
          console.log('🔍 Skeleton skin after setup:', skeleton.skin ? skeleton.skin.name : 'None');

          // Create animation state
          const animationStateData = new AnimationStateData(skeletonData);
          const animationState = new AnimationState(animationStateData);
          animationStateRef.current = animationState;

          // Get available animations
          const animations = skeletonData.animations.map(a => a.name);
          console.log('Available animations:', animations);
          setAvailableAnimations(animations);
          
          // Set loaded skeleton for body part controls
          setLoadedSkeleton(skeleton);
          
          // Select default animation
          let defaultAnimation = skeletonData.findAnimation("walk") || 
                                skeletonData.findAnimation("run") || 
                                skeletonData.animations[0];
          
          if (!defaultAnimation && animations.length === 0) {
            // Create programmatic walking animation
            console.log('Creating programmatic walk animation');
            defaultAnimation = createWalkingAnimation(skeleton);
            skeletonData.animations.push(defaultAnimation);
            setAvailableAnimations([defaultAnimation.name]);
          }

          // Start animation
          if (defaultAnimation) {
            setSelectedAnimation(defaultAnimation.name);
            animationState.setAnimation(0, defaultAnimation.name, true);
          }

          // Create dynamic attachment function
          const createDynamicAttachment = async (slotName: string, imageUrl: string): Promise<void> => {
            console.log(`🔄 DYNAMIC ATTACHMENT: Creating attachment for slot "${slotName}" with image: ${imageUrl}`);
            
            try {
              // Find the slot
              const slot = skeleton.findSlot(slotName);
              if (!slot) {
                console.error(`❌ DYNAMIC ATTACHMENT: Slot "${slotName}" not found`);
                console.log(`🔍 Available slots:`, skeleton.slots.map(s => s.data.name));
                return;
              }
              
              console.log(`🔍 DYNAMIC ATTACHMENT: Found slot "${slotName}" at index ${slot.data.index}`);
              console.log(`🔍 DYNAMIC ATTACHMENT: Current attachment:`, slot.attachment ? slot.attachment.name : 'None');
              
              // Load the image
              const img = new Image();
              img.crossOrigin = "anonymous";
              
              await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error(`Failed to load image: ${imageUrl}`));
                img.src = imageUrl;
              });
              
              console.log(`✅ DYNAMIC ATTACHMENT: Image loaded successfully (${img.width}x${img.height})`);
              
              // Create WebGL texture
              const texture = context.gl.createTexture();
              if (!texture) {
                throw new Error('Failed to create WebGL texture');
              }
              
              context.gl.bindTexture(context.gl.TEXTURE_2D, texture);
              context.gl.texImage2D(context.gl.TEXTURE_2D, 0, context.gl.RGBA, context.gl.RGBA, context.gl.UNSIGNED_BYTE, img);
              context.gl.texParameteri(context.gl.TEXTURE_2D, context.gl.TEXTURE_MIN_FILTER, context.gl.LINEAR);
              context.gl.texParameteri(context.gl.TEXTURE_2D, context.gl.TEXTURE_MAG_FILTER, context.gl.LINEAR);
              context.gl.texParameteri(context.gl.TEXTURE_2D, context.gl.TEXTURE_WRAP_S, context.gl.CLAMP_TO_EDGE);
              context.gl.texParameteri(context.gl.TEXTURE_2D, context.gl.TEXTURE_WRAP_T, context.gl.CLAMP_TO_EDGE);
              
              // Create GLTexture wrapper for Spine
              const glTexture = new GLTexture(context, img, false);
              
              // Get original attachment properties for reference
              const originalAttachment = slot.attachment;
              let baseWidth = 100; // Default width
              let baseHeight = 100; // Default height
              let offsetX = 0;
              let offsetY = 0;
              let scaleX = 1;
              let scaleY = 1;
              let rotation = 0;
              
              if (originalAttachment && originalAttachment.constructor.name === 'RegionAttachment') {
                const regionAttachment = originalAttachment as RegionAttachment;
                console.log(`🔍 DYNAMIC ATTACHMENT: Using original attachment properties:`, {
                  width: regionAttachment.width,
                  height: regionAttachment.height,
                  x: regionAttachment.x,
                  y: regionAttachment.y,
                  scaleX: regionAttachment.scaleX,
                  scaleY: regionAttachment.scaleY,
                  rotation: regionAttachment.rotation
                });
                
                baseWidth = regionAttachment.width;
                baseHeight = regionAttachment.height;
                offsetX = regionAttachment.x;
                offsetY = regionAttachment.y;
                scaleX = regionAttachment.scaleX;
                scaleY = regionAttachment.scaleY;
                rotation = regionAttachment.rotation;
              } else {
                console.log(`🔍 DYNAMIC ATTACHMENT: No original attachment found, using defaults`);
                // Default size based on typical character proportions
                baseWidth = 98; // Typical torso width
                baseHeight = 180; // Typical torso height
              }
              
              // Create texture region with proper dimensions
              const region = new TextureRegion();
              region.texture = glTexture;

              // 🆕 Ensure renderer can access the texture via renderObject.page.texture
              // SceneRenderer expects region.renderObject.page.texture
              (region as any).renderObject = { page: { texture: glTexture } };
              
              // The region dimensions should match what we'll use for the attachment
              region.width = baseWidth;
              region.height = baseHeight;
              
              // Set original dimensions so updateRegion calculates vertices correctly
              (region as any).originalWidth = baseWidth;
              (region as any).originalHeight = baseHeight;
              (region as any).offsetX = 0;
              (region as any).offsetY = 0;
              (region as any).rotate = false;
              (region as any).degrees = 0;
              
              // UV coordinates map the full generated image (0,0) to (1,1)
              region.u = 0;
              region.v = 0;
              region.u2 = 1;
              region.v2 = 1;
              
              console.log(`🔍 DYNAMIC ATTACHMENT: TextureRegion setup:`, {
                textureSize: `${img.width}x${img.height}`,
                regionSize: `${region.width}x${region.height}`,
                uvCoords: `(${region.u},${region.v}) to (${region.u2},${region.v2})`
              });
              
              // Create attachment
              const attachmentName = `generated_${slotName}_${Date.now()}`;
              const attachment = new RegionAttachment(attachmentName, attachmentName);
              attachment.region = region;
              
              // Set dimensions and positioning
              attachment.width = baseWidth;
              attachment.height = baseHeight;
              attachment.x = offsetX;
              attachment.y = offsetY;
              attachment.scaleX = scaleX;
              attachment.scaleY = scaleY;
              attachment.rotation = rotation;
              
              console.log(`🔍 DYNAMIC ATTACHMENT: Set attachment properties:`, {
                width: attachment.width,
                height: attachment.height,
                x: attachment.x,
                y: attachment.y,
                scaleX: attachment.scaleX,
                scaleY: attachment.scaleY,
                rotation: attachment.rotation
              });
              
              attachment.updateRegion();
              
              // Add to current skin
              const skin = skeleton.skin;
              if (!skin) {
                console.error(`❌ DYNAMIC ATTACHMENT: No skin available on skeleton`);
                return;
              }
              
              console.log(`🔍 DYNAMIC ATTACHMENT: Adding to skin "${skin.name}" at slot index ${slot.data.index}`);
              skin.setAttachment(slot.data.index, attachmentName, attachment);
              console.log(`✅ DYNAMIC ATTACHMENT: Added attachment "${attachmentName}" to skin`);
              
              // Verify the attachment was added
              const retrievedAttachment = skin.getAttachment(slot.data.index, attachmentName);
              if (!retrievedAttachment) {
                console.error(`❌ DYNAMIC ATTACHMENT: Failed to retrieve attachment "${attachmentName}" from skin`);
                return;
              }
              console.log(`✅ DYNAMIC ATTACHMENT: Verified attachment exists in skin`);
              
              // Apply the attachment to the slot
              try {
                skeleton.setAttachment(slotName, attachmentName);
                console.log(`✅ DYNAMIC ATTACHMENT: Applied attachment "${attachmentName}" to slot "${slotName}"`);
              } catch (setError) {
                console.error(`❌ DYNAMIC ATTACHMENT: Failed to set attachment on skeleton:`, setError);
                
                // Alternative approach: set attachment directly on slot
                console.log(`🔄 DYNAMIC ATTACHMENT: Trying direct slot assignment...`);
                slot.attachment = attachment;
                console.log(`✅ DYNAMIC ATTACHMENT: Applied attachment directly to slot "${slotName}"`);
              }
              
            } catch (error) {
              console.error(`❌ DYNAMIC ATTACHMENT: Failed to create attachment:`, error);
              throw error;
            }
          };
          
          // Notify parent component
          onSkeletonLoaded?.(skeleton, animationState);
          onDynamicAttachmentCreator?.(createDynamicAttachment);

          setLoading(false);

          // Start render loop
          let lastTime = Date.now() / 1000;
          const render = () => {
            const now = Date.now() / 1000;
            const delta = now - lastTime;
            lastTime = now;

            // Resize to canvas size
            renderer.resize(ResizeMode.Expand);

            // Update animation
            animationState.update(delta);
            animationState.apply(skeleton);
            
            // Update skeleton with physics support
            skeleton.update(delta);
            skeleton.updateWorldTransform(Physics.update);

            // Clear canvas
            context.gl.clearColor(0.1, 0.1, 0.1, 1);
            context.gl.clear(context.gl.COLOR_BUFFER_BIT);

            // Begin rendering
            renderer.begin();

            // Position skeleton centered, scaled by dpr
            const dpr = window.devicePixelRatio || 1;
            skeleton.x = 0;
            skeleton.y = -300 * dpr; // Scale position by dpr (-600 on retina, -300 on standard)

            // Draw skeleton
            renderer.drawSkeleton(skeleton, true);

            // End rendering
            renderer.end();

            animationRef.current = requestAnimationFrame(render);
          };

          render();
        } catch (err) {
          console.error('Error loading spine data:', err);
          setError(err instanceof Error ? err.message : 'Failed to load spine data');
          setLoading(false);
        }
      };

      img.onerror = () => {
        setError('Failed to load texture image');
        setLoading(false);
      };

      img.src = assets.texture;

    } catch (err) {
      console.error('Error initializing Spine:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize Spine');
      setLoading(false);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (contextRef.current) {
        contextRef.current.gl.deleteTexture(contextRef.current.gl.getParameter(contextRef.current.gl.TEXTURE_BINDING_2D));
      }
    };
  }, [assets, onSkeletonLoaded]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>Spine2D Walking Animation Preview</h2>
          {/* File upload controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Skeleton JSON {assets.skeleton && '✓'}
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload('skeleton')}
                className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold"
                style={{ color: 'var(--foreground)' }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Atlas File {assets.atlas && '✓'}
              </label>
              <input
                type="file"
                accept=".atlas"
                onChange={handleFileUpload('atlas')}
                className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold"
                style={{ color: 'var(--foreground)' }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Texture PNG {assets.texture && '✓'}
              </label>
              <input
                type="file"
                accept=".png"
                onChange={handleFileUpload('texture')}
                className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold"
                style={{ color: 'var(--foreground)' }}
              />
            </div>
          </div>

      {/* Animation controls toolbar */}
      {(availableAnimations.length > 0 || loadedSkeleton) && (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {availableAnimations.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                Animation:
              </label>
              <select
                value={selectedAnimation}
                onChange={(e) => handleAnimationChange(e.target.value)}
                className="px-3 py-2 text-sm border rounded-md transition-colors"
                style={{
                  backgroundColor: 'var(--select-bg)',
                  borderColor: 'var(--select-border)',
                  color: 'var(--foreground)'
                }}
              >
                {availableAnimations.map(anim => (
                  <option key={anim} value={anim}>
                    {anim.charAt(0).toUpperCase() + anim.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {loadedSkeleton && (
            <BodyPartPopover skeleton={loadedSkeleton} />
          )}
        </div>
      )}

      {/* Canvas */}
      <div className="relative bg-gray-900 rounded-lg overflow-hidden">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="text-white">Loading...</div>
              </div>
            )}
            
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-50">
                <div className="text-white text-center p-4">
                  <p>Error: {error}</p>
                  <p className="text-sm mt-2">Please upload all required files</p>
                </div>
              </div>
            )}
            
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="w-full h-auto"
            />
      </div>
      
      <div className="mt-4 text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
        <p>Upload Spine2D assets or wait for default Spineboy assets to load.</p>
        <p>Required files: skeleton.json, atlas file, and texture PNG.</p>
      </div>
    </div>
  );
}