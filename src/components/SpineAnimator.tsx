'use client';

import { useState, useRef } from 'react';
import SpineViewer from './SpineViewer';
import ChatSidebar from './ChatSidebar';
import ReferencesUploadSidebar from './ReferencesUploadSidebar';
import { 
  Skeleton, 
  AnimationState,
  Animation,
  RotateTimeline,
  TranslateTimeline,
  ScaleTimeline,
  AttachmentTimeline,
  RGBATimeline,
  Timeline
} from '@esotericsoftware/spine-webgl';

interface ColorValue {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface AppearanceChange {
  type: 'skin' | 'attachment' | 'color' | 'texture';
  target: string;
  value: string | ColorValue;
  description: string;
}

interface AnimationKeyframe {
  time: number;
  value: number | { x: number; y: number } | string | ColorValue;
}

interface AnimationTimeline {
  type: 'rotate' | 'translate' | 'scale' | 'attachment' | 'color';
  target: string;
  keyframes: AnimationKeyframe[];
}

interface AnimationData {
  name: string;
  duration: number;
  timelines: AnimationTimeline[];
  description: string;
}

export default function SpineAnimator() {
  const skeletonRef = useRef<Skeleton | null>(null);
  const animationStateRef = useRef<AnimationState | null>(null);
  const [animationsUpdated, setAnimationsUpdated] = useState(0);

  const handleSkeletonLoaded = (skeleton: Skeleton, animationState: AnimationState) => {
    skeletonRef.current = skeleton;
    animationStateRef.current = animationState;
    
    // Log available slots and attachments for debugging
    console.log('🦴 SKELETON LOADED: Available slots:', skeleton.slots.map(slot => slot.data.name));
    if (skeleton.skin) {
      console.log('🎨 SKELETON LOADED: Current skin:', skeleton.skin.name);
      console.log('📎 SKELETON LOADED: Available attachments:', skeleton.skin.attachments ? Object.keys(skeleton.skin.attachments) : 'None');
    }
  };

  const handleAppearanceChange = (change: AppearanceChange) => {
    if (!skeletonRef.current) return;

    const skeleton = skeletonRef.current;
    console.log('Applying appearance change:', change);

    switch (change.type) {
      case 'skin':
        // Change to a different skin
        try {
          if (typeof change.value === 'string') {
            skeleton.setSkinByName(change.value);
            skeleton.setSlotsToSetupPose();
          }
        } catch (e) {
          console.error('Failed to set skin:', e);
        }
        break;

      case 'attachment':
        // Change a specific attachment
        try {
          if (typeof change.value === 'string') {
            // Check if the slot exists
            const slot = skeleton.findSlot(change.target);
            if (!slot) {
              console.warn(`Slot "${change.target}" not found. Available slots:`, skeleton.slots.map(s => s.data.name));
              break;
            }
            
            // Check if the attachment exists in the skin
            const skin = skeleton.skin;
            if (!skin) {
              console.warn('No skin available on skeleton');
              break;
            }
            
            const attachment = skin.getAttachment(slot.data.index, change.value);
            if (!attachment) {
              console.warn(`Attachment "${change.value}" not found for slot "${change.target}".`);
              console.warn('This attachment does not exist in the current skeleton. Skipping attachment change.');
              
              // List available attachments for debugging
              console.log('Available skin attachments:', skin.attachments ? Object.keys(skin.attachments) : 'None');
            } else {
              skeleton.setAttachment(change.target, change.value);
              console.log(`Successfully set attachment "${change.value}" on slot "${change.target}"`);
            }
          }
        } catch (e) {
          console.error('Failed to set attachment:', e);
          console.log('Available slots:', skeleton.slots.map(slot => slot.data.name));
          console.log('Current skin:', skeleton.skin ? skeleton.skin.name : 'No skin');
        }
        break;

      case 'color':
        // Change slot color
        const slot = skeleton.findSlot(change.target);
        if (slot && typeof change.value === 'object' && 'r' in change.value) {
          const colorValue = change.value as ColorValue;
          slot.color.r = colorValue.r ?? 1;
          slot.color.g = colorValue.g ?? 1;
          slot.color.b = colorValue.b ?? 1;
          slot.color.a = colorValue.a ?? 1;
        }
        break;

      case 'texture':
        // This would require reloading the texture
        console.log('Texture changes not yet implemented');
        break;
    }
  };

  const handleAnimationCreate = (animationData: AnimationData) => {
    if (!skeletonRef.current || !animationStateRef.current) return;

    const skeleton = skeletonRef.current;
    const skeletonData = skeleton.data;
    
    console.log('Creating animation:', animationData);

    try {
      const timelines: Timeline[] = [];

      // Process each timeline in the animation data
      animationData.timelines.forEach((timelineData) => {
        const bone = skeleton.findBone(timelineData.target);
        const slot = skeleton.findSlot(timelineData.target);

        if (!bone && !slot) {
          console.warn(`Target not found: ${timelineData.target}`);
          return;
        }

        switch (timelineData.type) {
          case 'rotate':
            if (bone) {
              const boneIndex = skeletonData.bones.indexOf(bone.data);
              const timeline = new RotateTimeline(timelineData.keyframes.length, timelineData.keyframes.length, boneIndex);
              
              timelineData.keyframes.forEach((kf, idx) => {
                if (typeof kf.value === 'number') {
                  timeline.setFrame(idx, kf.time, kf.value);
                }
              });
              
              timelines.push(timeline);
            }
            break;

          case 'translate':
            if (bone) {
              const boneIndex = skeletonData.bones.indexOf(bone.data);
              const timeline = new TranslateTimeline(timelineData.keyframes.length, timelineData.keyframes.length, boneIndex);
              
              timelineData.keyframes.forEach((kf, idx) => {
                if (typeof kf.value === 'object' && 'x' in kf.value && 'y' in kf.value) {
                  const pos = kf.value as { x: number; y: number };
                  timeline.setFrame(idx, kf.time, pos.x || 0, pos.y || 0);
                }
              });
              
              timelines.push(timeline);
            }
            break;

          case 'scale':
            if (bone) {
              const boneIndex = skeletonData.bones.indexOf(bone.data);
              const timeline = new ScaleTimeline(timelineData.keyframes.length, timelineData.keyframes.length, boneIndex);
              
              timelineData.keyframes.forEach((kf, idx) => {
                if (typeof kf.value === 'object' && 'x' in kf.value && 'y' in kf.value) {
                  const scale = kf.value as { x: number; y: number };
                  timeline.setFrame(idx, kf.time, scale.x || 1, scale.y || 1);
                }
              });
              
              timelines.push(timeline);
            }
            break;

          case 'attachment':
            if (slot) {
              const slotIndex = skeletonData.slots.indexOf(slot.data);
              const timeline = new AttachmentTimeline(timelineData.keyframes.length, slotIndex);
              
              timelineData.keyframes.forEach((kf, idx) => {
                if (typeof kf.value === 'string') {
                  timeline.setFrame(idx, kf.time, kf.value);
                }
              });
              
              timelines.push(timeline);
            }
            break;

          case 'color':
            if (slot) {
              const slotIndex = skeletonData.slots.indexOf(slot.data);
              const timeline = new RGBATimeline(timelineData.keyframes.length, timelineData.keyframes.length, slotIndex);
              
              timelineData.keyframes.forEach((kf, idx) => {
                if (typeof kf.value === 'object' && 'r' in kf.value) {
                  const color = kf.value as ColorValue;
                  timeline.setFrame(idx, kf.time, color.r || 1, color.g || 1, color.b || 1, color.a || 1);
                }
              });
              
              timelines.push(timeline);
            }
            break;
        }
      });

      // Create the new animation
      if (timelines.length > 0) {
        const animation = new Animation(animationData.name, timelines, animationData.duration);
        
        // Add to skeleton data
        skeletonData.animations.push(animation);
        
        // Play the new animation
        animationStateRef.current.setAnimation(0, animationData.name, true);
        
        // Trigger update to refresh animation list
        setAnimationsUpdated(prev => prev + 1);
        
        console.log(`Animation "${animationData.name}" created successfully with ${timelines.length} timelines`);
      }
    } catch (e) {
      console.error('Failed to create animation:', e);
    }
  };

  return (
    <div className="flex h-screen">
      <ReferencesUploadSidebar />
      <div className="flex-1 overflow-auto">
        <SpineViewer 
          key={animationsUpdated}
          onSkeletonLoaded={handleSkeletonLoaded} 
        />
      </div>
      <ChatSidebar 
        onAppearanceChange={handleAppearanceChange}
        onAnimationCreate={handleAnimationCreate}
      />
    </div>
  );
}