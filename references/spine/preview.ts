// ===== BROWSER SETUP WITH SPINE RUNTIME =====

// Install spine runtime: npm install @esotericsoftware/spine-webgl

import { 
  AssetManager, 
  GLTexture, 
  ManagedWebGLRenderingContext, 
  SceneRenderer, 
  SkeletonRenderer,
  Vector3,
  Skeleton,
  AnimationState,
  AnimationStateData,
  SkeletonData,
  AtlasAttachmentLoader,
  SkeletonJson,
  TextureAtlas
} from '@esotericsoftware/spine-webgl';

// ===== COMPLETE BROWSER IMPLEMENTATION =====

class SpineWalkingDemo {
  private canvas: HTMLCanvasElement;
  private context: ManagedWebGLRenderingContext;
  private renderer: SceneRenderer;
  private assetManager: AssetManager;
  private skeleton: Skeleton;
  private animationState: AnimationState;
  private lastFrameTime: number = Date.now() / 1000;

  constructor(canvasId: string) {
    // Setup canvas and WebGL context
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.canvas.width = 800;
    this.canvas.height = 600;
    
    // Create WebGL context
    const gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
    if (!gl) throw new Error('WebGL not supported');
    
    this.context = new ManagedWebGLRenderingContext(gl);
    this.renderer = new SceneRenderer(this.canvas, this.context);
    this.assetManager = new AssetManager(this.context);
  }

  async loadCharacter(): Promise<void> {
    // Load all required assets
    this.assetManager.loadText('assets/character.json');
    this.assetManager.loadText('assets/character.atlas');
    this.assetManager.loadTexture('assets/character.png');

    // Wait for assets to load
    await new Promise<void>((resolve) => {
      const checkLoaded = () => {
        if (this.assetManager.isLoadingComplete()) {
          resolve();
        } else {
          requestAnimationFrame(checkLoaded);
        }
      };
      checkLoaded();
    });

    // Create atlas from loaded data
    const atlasText = this.assetManager.get('assets/character.atlas');
    const atlasTexture = this.assetManager.get('assets/character.png');
    const atlas = new TextureAtlas(atlasText, (path: string) => {
      return new GLTexture(this.context, atlasTexture);
    });

    // Create attachment loader
    const attachmentLoader = new AtlasAttachmentLoader(atlas);

    // Load skeleton data
    const skeletonJson = new SkeletonJson(attachmentLoader);
    const jsonData = this.assetManager.get('assets/character.json');
    const skeletonData = skeletonJson.readSkeletonData(jsonData);

    // Create skeleton and animation state
    this.skeleton = new Skeleton(skeletonData);
    this.skeleton.setToSetupPose();

    const animationStateData = new AnimationStateData(skeletonData);
    this.animationState = new AnimationState(animationStateData);

    // Position skeleton in center of screen
    this.skeleton.x = this.canvas.width / 2;
    this.skeleton.y = this.canvas.height / 2;
    this.skeleton.scaleX = this.skeleton.scaleY = 0.5;

    // Create walking animation programmatically
    this.createWalkingAnimation(skeletonData);

    // Start walking animation
    this.animationState.setAnimation(0, 'walk', true);
  }

  private createWalkingAnimation(skeletonData: SkeletonData): void {
    // This is where our previous walking animation code would go
    // For brevity, showing simplified version:
    
    const walkAnimation = new spine.Animation('walk', [], 1.5);
    
    // Add bone rotation timelines (simplified example)
    const torsoData = skeletonData.findBone('torso');
    if (torsoData) {
      const timeline = new spine.RotateTimeline(4);
      timeline.boneIndex = torsoData.index;
      
      timeline.setFrame(0, 0.0, 0);
      timeline.setFrame(1, 0.375, -5);
      timeline.setFrame(2, 0.75, 0);
      timeline.setFrame(3, 1.5, 0);
      
      walkAnimation.timelines.push(timeline);
    }
    
    // Add to skeleton data
    skeletonData.animations.push(walkAnimation);
  }

  render(): void {
    const now = Date.now() / 1000;
    const delta = now - this.lastFrameTime;
    this.lastFrameTime = now;

    // Update animation
    this.animationState.update(delta);
    this.animationState.apply(this.skeleton);
    this.skeleton.updateWorldTransform();

    // Clear and render
    this.context.gl.clearColor(0.2, 0.2, 0.2, 1);
    this.context.gl.clear(this.context.gl.COLOR_BUFFER_BIT);

    // Render skeleton
    this.renderer.begin();
    this.renderer.drawSkeleton(this.skeleton, false);
    this.renderer.end();

    // Continue animation loop
    requestAnimationFrame(() => this.render());
  }

  // Public methods for controlling animation
  startWalking(): void {
    this.animationState.setAnimation(0, 'walk', true);
  }

  stopWalking(): void {
    this.animationState.setAnimation(0, 'idle', true);
  }

  setWalkSpeed(speed: number): void {
    const track = this.animationState.getCurrent(0);
    if (track) track.timeScale = speed;
  }
}