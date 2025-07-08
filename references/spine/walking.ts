// Spine2D Walking Animation - Programmatic Creation Example
// This example shows how to create a walking animation using Spine2D APIs

// ===== SETUP AND INITIALIZATION =====

// Create skeleton data and skeleton instance
const skeletonData: SkeletonData = loadSkeletonData("character.json"); // Load from file
const skeleton: Skeleton = new Skeleton(skeletonData);

// Set up animation state for managing animations
const animationStateData: AnimationStateData = new AnimationStateData(skeletonData);
const animationState: AnimationState = new AnimationState(animationStateData);

// ===== CREATING THE WALKING ANIMATION =====

// Create a new animation for walking cycle (typically 1-2 seconds duration)
const walkAnimation: Animation = new Animation("walk", [], 1.5); // 1.5 second duration

// ===== BONE ROTATION TIMELINES (for natural walking movement) =====

// Create rotation timeline for the torso (slight rotation during walk)
const torsoRotateTimeline: RotateTimeline = new RotateTimeline(8); // 8 keyframes
torsoRotateTimeline.boneIndex = skeleton.findBone("torso").data.index;

// Set keyframes for torso rotation (subtle left-right sway)
torsoRotateTimeline.setFrame(0, 0.0, 0);      // Start: neutral
torsoRotateTimeline.setFrame(1, 0.2, -2);     // Lean slightly left
torsoRotateTimeline.setFrame(2, 0.4, 0);      // Return to center
torsoRotateTimeline.setFrame(3, 0.6, 2);      // Lean slightly right
torsoRotateTimeline.setFrame(4, 0.8, 0);      // Return to center
torsoRotateTimeline.setFrame(5, 1.0, -2);     // Lean left again
torsoRotateTimeline.setFrame(6, 1.2, 0);      // Return to center
torsoRotateTimeline.setFrame(7, 1.5, 0);      // End: neutral

// Set interpolation to linear for smooth movement
for (let i = 0; i < 7; i++) {
    torsoRotateTimeline.setLinear(i);
}

// Add torso rotation timeline to animation
walkAnimation.timelines.push(torsoRotateTimeline);

// ===== LEFT LEG ANIMATION =====

// Upper leg (thigh) rotation timeline
const leftThighRotateTimeline: RotateTimeline = new RotateTimeline(9);
leftThighRotateTimeline.boneIndex = skeleton.findBone("leftThigh").data.index;

// Walking cycle: lift -> forward -> plant -> back -> repeat
leftThighRotateTimeline.setFrame(0, 0.0, 10);    // Lifted forward
leftThighRotateTimeline.setFrame(1, 0.2, 20);    // Peak forward position
leftThighRotateTimeline.setFrame(2, 0.4, 5);     // Planting down
leftThighRotateTimeline.setFrame(3, 0.6, -15);   // Pushing back
leftThighRotateTimeline.setFrame(4, 0.75, -25);  // Maximum back extension
leftThighRotateTimeline.setFrame(5, 0.9, -10);   // Beginning to lift
leftThighRotateTimeline.setFrame(6, 1.1, 0);     // Neutral position
leftThighRotateTimeline.setFrame(7, 1.3, 10);    // Lifting forward again
leftThighRotateTimeline.setFrame(8, 1.5, 10);    // Complete cycle

// Set smooth interpolation using Bezier curves for natural movement
for (let i = 0; i < 8; i++) {
    leftThighRotateTimeline.setLinear(i);
}

walkAnimation.timelines.push(leftThighRotateTimeline);

// Lower leg (shin) rotation timeline
const leftShinRotateTimeline: RotateTimeline = new RotateTimeline(8);
leftShinRotateTimeline.boneIndex = skeleton.findBone("leftShin").data.index;

// Shin follows thigh movement with knee bending
leftShinRotateTimeline.setFrame(0, 0.0, -30);   // Bent knee when lifting
leftShinRotateTimeline.setFrame(1, 0.2, -45);   // Maximum bend
leftShinRotateTimeline.setFrame(2, 0.4, -10);   // Extending for plant
leftShinRotateTimeline.setFrame(3, 0.6, 0);     // Straight when planted
leftShinRotateTimeline.setFrame(4, 0.75, 5);    // Slight extension pushing
leftShinRotateTimeline.setFrame(5, 0.9, -20);   // Beginning to bend
leftShinRotateTimeline.setFrame(6, 1.2, -35);   // Bending for lift
leftShinRotateTimeline.setFrame(7, 1.5, -30);   // Complete cycle

for (let i = 0; i < 7; i++) {
    leftShinRotateTimeline.setLinear(i);
}

walkAnimation.timelines.push(leftShinRotateTimeline);

// ===== RIGHT LEG ANIMATION (OPPOSITE PHASE) =====

// Right thigh rotation (offset by half cycle for realistic walking)
const rightThighRotateTimeline: RotateTimeline = new RotateTimeline(9);
rightThighRotateTimeline.boneIndex = skeleton.findBone("rightThigh").data.index;

// Right leg is 180 degrees out of phase with left leg
rightThighRotateTimeline.setFrame(0, 0.0, -25);   // Back position
rightThighRotateTimeline.setFrame(1, 0.2, -10);   // Beginning to lift
rightThighRotateTimeline.setFrame(2, 0.4, 0);     // Neutral
rightThighRotateTimeline.setFrame(3, 0.6, 10);    // Lifting forward
rightThighRotateTimeline.setFrame(4, 0.75, 20);   // Peak forward
rightThighRotateTimeline.setFrame(5, 0.9, 5);     // Planting down
rightThighRotateTimeline.setFrame(6, 1.1, -15);   // Pushing back
rightThighRotateTimeline.setFrame(7, 1.3, -25);   // Maximum back
rightThighRotateTimeline.setFrame(8, 1.5, -25);   // Complete cycle

for (let i = 0; i < 8; i++) {
    rightThighRotateTimeline.setLinear(i);
}

walkAnimation.timelines.push(rightThighRotateTimeline);

// Right shin rotation
const rightShinRotateTimeline: RotateTimeline = new RotateTimeline(8);
rightShinRotateTimeline.boneIndex = skeleton.findBone("rightShin").data.index;

rightShinRotateTimeline.setFrame(0, 0.0, 5);     // Extended when pushing
rightShinRotateTimeline.setFrame(1, 0.2, -20);   // Beginning to bend
rightShinRotateTimeline.setFrame(2, 0.4, -35);   // Bending for lift
rightShinRotateTimeline.setFrame(3, 0.6, -30);   // Bent knee when lifting
rightShinRotateTimeline.setFrame(4, 0.75, -45);  // Maximum bend
rightShinRotateTimeline.setFrame(5, 0.9, -10);   // Extending for plant
rightShinRotateTimeline.setFrame(6, 1.2, 0);     // Straight when planted
rightShinRotateTimeline.setFrame(7, 1.5, 5);     // Complete cycle

for (let i = 0; i < 7; i++) {
    rightShinRotateTimeline.setLinear(i);
}

walkAnimation.timelines.push(rightShinRotateTimeline);

// ===== ARM ANIMATION (OPPOSITE TO LEGS) =====

// Left arm swings opposite to left leg
const leftArmRotateTimeline: RotateTimeline = new RotateTimeline(6);
leftArmRotateTimeline.boneIndex = skeleton.findBone("leftUpperArm").data.index;

leftArmRotateTimeline.setFrame(0, 0.0, -15);    // Back when left leg forward
leftArmRotateTimeline.setFrame(1, 0.4, -20);    // Maximum back swing
leftArmRotateTimeline.setFrame(2, 0.75, 0);     // Neutral position
leftArmRotateTimeline.setFrame(3, 1.1, 15);     // Forward swing
leftArmRotateTimeline.setFrame(4, 1.3, 20);     // Maximum forward
leftArmRotateTimeline.setFrame(5, 1.5, -15);    // Complete cycle

for (let i = 0; i < 5; i++) {
    leftArmRotateTimeline.setLinear(i);
}

walkAnimation.timelines.push(leftArmRotateTimeline);

// Right arm swings opposite to right leg
const rightArmRotateTimeline: RotateTimeline = new RotateTimeline(6);
rightArmRotateTimeline.boneIndex = skeleton.findBone("rightUpperArm").data.index;

rightArmRotateTimeline.setFrame(0, 0.0, 20);    // Forward when right leg back
rightArmRotateTimeline.setFrame(1, 0.3, 15);    // Beginning back swing
rightArmRotateTimeline.setFrame(2, 0.6, -15);   // Back swing
rightArmRotateTimeline.setFrame(3, 0.9, -20);   // Maximum back
rightArmRotateTimeline.setFrame(4, 1.2, 0);     // Neutral
rightArmRotateTimeline.setFrame(5, 1.5, 20);    // Complete cycle

for (let i = 0; i < 5; i++) {
    rightArmRotateTimeline.setLinear(i);
}

walkAnimation.timelines.push(rightArmRotateTimeline);

// ===== VERTICAL BODY MOVEMENT =====

// Create translation timeline for subtle up-down movement
const bodyTranslateTimeline: TranslateTimeline = new TranslateTimeline(8);
bodyTranslateTimeline.boneIndex = skeleton.findBone("root").data.index;

// Body rises slightly when legs push off, falls when legs are lifted
bodyTranslateTimeline.setFrame(0, 0.0, 0, 0);     // Neutral
bodyTranslateTimeline.setFrame(1, 0.2, 0, -3);    // Slight dip when lifting
bodyTranslateTimeline.setFrame(2, 0.4, 0, 2);     // Rise when planted
bodyTranslateTimeline.setFrame(3, 0.6, 0, 0);     // Neutral
bodyTranslateTimeline.setFrame(4, 0.75, 0, -3);   // Dip again
bodyTranslateTimeline.setFrame(5, 1.0, 0, 2);     // Rise again
bodyTranslateTimeline.setFrame(6, 1.2, 0, 0);     // Neutral
bodyTranslateTimeline.setFrame(7, 1.5, 0, 0);     // Complete cycle

for (let i = 0; i < 7; i++) {
    bodyTranslateTimeline.setLinear(i);
}

walkAnimation.timelines.push(bodyTranslateTimeline);

// ===== SETUP ANIMATION LOOPING AND MIXING =====

// Add the walking animation to skeleton data
skeletonData.animations.push(walkAnimation);

// Set up mixing between idle and walk animations
animationStateData.setMix("idle", "walk", 0.3); // 0.3 second transition
animationStateData.setMix("walk", "idle", 0.3);

// ===== PLAYING THE ANIMATION =====

// Set the walking animation to loop continuously
const walkTrackEntry: TrackEntry = animationState.setAnimation(0, "walk", true);

// Configure the animation properties
walkTrackEntry.timeScale = 1.0;        // Normal speed
walkTrackEntry.alpha = 1.0;            // Full strength
walkTrackEntry.mixBlend = MixBlend.first; // First animation sets pose

// ===== RUNTIME UPDATE LOOP =====

function updateAnimation(deltaTime: number): void {
    // Update animation state
    animationState.update(deltaTime);
    
    // Apply animations to skeleton
    animationState.apply(skeleton);
    
    // Update skeleton world transforms
    skeleton.updateWorldTransform(Physics.update);
    
    // Render the skeleton (implementation depends on your rendering system)
    // renderer.render(skeleton);
}

// ===== ADVANCED FEATURES =====

// Add event timeline for footstep sounds
const footstepEventTimeline: EventTimeline = new EventTimeline(4);
const footstepEvent: Event = new Event(walkAnimation.duration / 4, skeleton.data.findEvent("footstep"));

footstepEventTimeline.setFrame(0, footstepEvent);               // Left foot plant
footstepEventTimeline.setFrame(1, new Event(0.4, footstepEvent)); // Right foot plant  
footstepEventTimeline.setFrame(2, new Event(0.9, footstepEvent)); // Left foot plant
footstepEventTimeline.setFrame(3, new Event(1.3, footstepEvent)); // Right foot plant

walkAnimation.timelines.push(footstepEventTimeline);

// ===== HELPER FUNCTIONS =====

function startWalking(): void {
    // Transition from current animation to walking
    animationState.setAnimation(0, "walk", true);
}

function stopWalking(): void {
    // Transition back to idle
    animationState.setAnimation(0, "idle", true);
}

function setWalkingSpeed(speed: number): void {
    // Adjust walking animation speed
    const currentTrack = animationState.getCurrent(0);
    if (currentTrack && currentTrack.animation.name === "walk") {
        currentTrack.timeScale = speed;
    }
}

// ===== CONSTRAINTS AND PHYSICS =====

// Apply IK constraint for foot placement (if needed)
function setupFootIK(): void {
    const leftFootIK: IkConstraint = skeleton.findIkConstraint("leftFootIK");
    const rightFootIK: IkConstraint = skeleton.findIkConstraint("rightFootIK");
    
    if (leftFootIK) {
        leftFootIK.mix = 0.8;  // 80% IK influence for natural foot placement
    }
    
    if (rightFootIK) {
        rightFootIK.mix = 0.8;
    }
}

// Example of dynamic timeline modification
function adjustStepHeight(height: number): void {
    // Find the body translate timeline and modify Y values
    for (const timeline of walkAnimation.timelines) {
        if (timeline instanceof TranslateTimeline) {
            // Modify existing keyframes to adjust step height
            // This would require recreating frames with new Y values
        }
    }
}