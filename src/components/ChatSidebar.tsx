'use client';

import React, { useState, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import GeneratedImageDisplay from './GeneratedImageDisplay';
import { loadReferenceImages, getRelevantReferenceImages, getRelevantReferenceImagesWithOriginal, getUserUploadedImages, combineReferenceImages, ReferenceImage } from '@/utils/loadReferenceImages';
import { makeTransparent } from '@/utils/backgroundRemoval';
import ReferenceImageDisplay from './ReferenceImageDisplay';

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

interface ChatSidebarProps {
  onAppearanceChange?: (changes: AppearanceChange) => void;
  onAnimationCreate?: (animation: AnimationData) => void;
}

interface GeneratedImage {
  id: string;
  imageUrl: string;
  description: string;
  revisedPrompt?: string;
  rewrittenPrompt?: string;
  itemType?: string;
  color?: string;
  timestamp: string;
  hasTransparency?: boolean;
}

/**
 * Detects the target slot from the user's prompt
 * @param userPrompt - The user's request prompt
 * @returns The target slot name or null if not detected
 */
function detectTargetSlot(userPrompt: string): string | null {
  const prompt = userPrompt.toLowerCase();
  
  // Prioritized detection - check most specific items first
  
  // Feet/Shoes (most specific)
  if (prompt.includes('shoe') || prompt.includes('shoes') || prompt.includes('boot') || prompt.includes('boots') || prompt.includes('feet') || prompt.includes('foot')) {
    return 'front-foot'; // Default to front foot for shoes
  }
  
  // Hands/Gloves (specific)
  if (prompt.includes('glove') || prompt.includes('gloves') || prompt.includes('hand') || prompt.includes('hands') || prompt.includes('fist')) {
    return 'front-fist'; // Default to front fist for hand items
  }
  
  // Eyes/Glasses (specific)
  if (prompt.includes('glasses') || prompt.includes('goggles') || prompt.includes('sunglasses')) {
    return 'goggles';
  }
  
  // Head-related modifications
  if (prompt.includes('head') || prompt.includes('face') || prompt.includes('hat') || prompt.includes('helmet') || prompt.includes('hair')) {
    return 'head';
  }
  
  // Eyes
  if (prompt.includes('eye') || prompt.includes('eyes')) {
    return 'eye';
  }
  
  // Mouth
  if (prompt.includes('mouth') || prompt.includes('lips') || prompt.includes('teeth')) {
    return 'mouth';
  }
  
  // Torso-related modifications
  if (prompt.includes('torso') || prompt.includes('body') || prompt.includes('chest') || prompt.includes('shirt') || prompt.includes('jacket') || prompt.includes('vest')) {
    return 'torso';
  }
  
  // Neck
  if (prompt.includes('neck') || prompt.includes('collar')) {
    return 'neck';
  }
  
  // Arms (after checking hands/gloves)
  if (prompt.includes('arm') || prompt.includes('shoulder')) {
    return 'front-upper-arm'; // Default to front arm
  }
  
  // Forearms/Bracers
  if (prompt.includes('forearm') || prompt.includes('bracer')) {
    return 'front-bracer'; // Default to front bracer
  }
  
  // Shins (specific)
  if (prompt.includes('shin') || prompt.includes('shins')) {
    return 'front-shin'; // Default to front shin
  }
  
  // Legs/Thighs (after checking feet/shoes and shins)
  if (prompt.includes('leg') || prompt.includes('thigh')) {
    return 'front-thigh'; // Default to front thigh
  }
  
  // Weapons
  if (prompt.includes('weapon') || prompt.includes('gun') || prompt.includes('sword') || prompt.includes('rifle')) {
    return 'gun';
  }
  
  console.log('🔍 detectTargetSlot: No specific target detected for prompt:', userPrompt);
  return null;
}

export default function ChatSidebar({ onAppearanceChange, onAnimationCreate }: ChatSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isRoutingRequest, setIsRoutingRequest] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [isLoadingReferences, setIsLoadingReferences] = useState(false);
  const [currentReferenceImages, setCurrentReferenceImages] = useState<ReferenceImage[]>([]);
  const [currentTargetSlot, setCurrentTargetSlot] = useState<string>('');
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, append } = useChat({
    api: '/api/spine-assistant',
    onToolCall: ({ toolCall }) => {
      console.log('Tool called:', toolCall);
      // The tool results will be in the message stream
    }
  });

  /**
   * Load reference images when component mounts
   */
  useEffect(() => {
    const loadReferences = async () => {
      console.log('🔄 ChatSidebar: Loading reference images...');
      setIsLoadingReferences(true);
      
      try {
        // Load asset images from the assets directory
        console.log('📁 ChatSidebar: Loading asset images...');
        const assetImages = await loadReferenceImages();
        console.log('✅ ChatSidebar: Asset images loaded:', assetImages.length);
        
        // Load user-uploaded images from localStorage
        console.log('📤 ChatSidebar: Loading user-uploaded images...');
        const userUploadedImages = getUserUploadedImages();
        console.log('✅ ChatSidebar: User-uploaded images loaded:', userUploadedImages.length);
        
        // Combine both sources
        const combinedImages = combineReferenceImages(assetImages, userUploadedImages);
        setReferenceImages(combinedImages);
        
        console.log('✅ ChatSidebar: Combined reference images loaded successfully:', combinedImages.length);
        console.log('   📁 Asset images:', assetImages.length, assetImages.map(img => img.name));
        console.log('   📤 User-uploaded images:', userUploadedImages.length, userUploadedImages.map(img => img.name));
        
      } catch (error) {
        console.error('❌ ChatSidebar: Error loading reference images:', error);
        
        // Even if asset loading fails, try to load user-uploaded images
        try {
          console.log('🔄 ChatSidebar: Attempting to load user-uploaded images only...');
          const userUploadedImages = getUserUploadedImages();
          setReferenceImages(userUploadedImages);
          console.log('✅ ChatSidebar: Fallback to user-uploaded images only:', userUploadedImages.length);
        } catch (fallbackError) {
          console.error('❌ ChatSidebar: Fallback loading also failed:', fallbackError);
          setReferenceImages([]);
        }
      } finally {
        setIsLoadingReferences(false);
      }
    };

    loadReferences();
  }, []);

  /**
   * Handles form submission by first routing through the LLM router
   */
  const handleCustomSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading || isRoutingRequest) {
      return;
    }

    const userPrompt = input.trim();
    console.log('🎯 ChatSidebar: Processing user prompt:', userPrompt);
    
    // Add user message to chat immediately
    await append({
      role: 'user',
      content: userPrompt,
    });

    setIsRoutingRequest(true);

    try {
      console.log('🔄 ChatSidebar: Calling LLM router...');
      
      // Try to detect the target body part from the prompt
      const targetSlot = detectTargetSlot(userPrompt);
      console.log('🎯 ChatSidebar: Detected target slot:', targetSlot || 'auto-detect from prompt');
      
      // Get relevant reference images for this request (including original body part)
      const relevantReferences = getRelevantReferenceImagesWithOriginal(referenceImages, userPrompt, targetSlot || undefined);
      console.log('📸 ChatSidebar: Selected relevant reference images:', relevantReferences.length);
      
      // Update the current reference images for display
      setCurrentReferenceImages(relevantReferences);
      setCurrentTargetSlot(targetSlot || '');
      
              if (relevantReferences.length > 0) {
          console.log('📸 ChatSidebar: Reference image names:', relevantReferences.map(img => img.name));
          
          // Show the selected reference images in the chat
          const bodyPartImages = relevantReferences.filter(img => !img.url.startsWith('data:'));
          const userImages = relevantReferences.filter(img => img.url.startsWith('data:'));
          
          console.log('🖼️ ChatSidebar: Reference images for display:');
          console.log('   📁 Body part images:', bodyPartImages.length, bodyPartImages.map(img => `${img.name} -> ${img.url}`));
          console.log('   📤 User images:', userImages.length, userImages.map(img => `${img.name} -> ${img.url.substring(0, 50)}...`));
          
          let referenceDescription = '';
          if (bodyPartImages.length > 0) {
            referenceDescription += `• **Body Part Reference:** ${bodyPartImages[0].name} (for proportions and positioning)\n`;
          }
          if (userImages.length > 0) {
            referenceDescription += `• **User Aesthetic References:** ${userImages.map(img => img.name).join(', ')} (for art style)\n`;
          }
        
                            await append({
            role: 'assistant',
            content: `🔍 **Reference Images Selected for Generation:**\n\n${referenceDescription}\n*The selected reference images are displayed below and will be sent to GPT-image-1 to provide context for generating your request.*`,
          });
      } else {
        console.log('⚠️ ChatSidebar: No relevant reference images selected');
        console.log('📋 ChatSidebar: Total available reference images:', referenceImages.length);
        console.log('📋 ChatSidebar: Available reference names:', referenceImages.map(img => img.name));
        
        await append({
          role: 'assistant',
          content: `⚠️ **No Reference Images Found**\n\nNo relevant reference images were found for your request. This may affect the quality of the generated image.\n\n*Available images: ${referenceImages.length}*`,
        });
      }
      
      // Call the LLM router first
      const routerResponse = await fetch('/api/llm-router', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userPrompt,
          referenceImages: relevantReferences,
        }),
      });

      if (!routerResponse.ok) {
        throw new Error(`Router API error: ${routerResponse.status}`);
      }

      const routerData = await routerResponse.json();
      console.log('📊 ChatSidebar: Router response:', routerData);

      // Handle the response based on the routing result
      if (routerData.result.useOriginalSystem) {
        console.log('🔄 ChatSidebar: Using original system for this request');
        
        // Add router response to chat for original system requests
        await append({
          role: 'assistant',
          content: `🔍 Request categorized as: **${routerData.categorization.category}**\n\n${routerData.result.message}\n\n*Confidence: ${Math.round(routerData.categorization.confidence * 100)}%*\n\n*Reasoning: ${routerData.categorization.reasoning}*`,
        });
        
        // Let the original system handle it - the form submission will proceed normally
        // after this function completes
      } else {
        console.log('✅ ChatSidebar: Request handled by new router system');
        
        // Handle image generation results
        if (routerData.categorization.category === 'image_generation') {
          
          console.log('🔍 ChatSidebar: Checking image generation result...');
          console.log('   ✅ Success:', routerData.result.success);
          console.log('   🖼️ Has generatedImageUrl:', !!routerData.result.extractedParams?.generatedImageUrl);
          console.log('   📋 ExtractedParams keys:', Object.keys(routerData.result.extractedParams || {}));
          if (routerData.result.extractedParams?.generatedImageUrl) {
            console.log('   🔗 Image URL:', routerData.result.extractedParams.generatedImageUrl);
          }
          
          if (routerData.result.success && routerData.result.extractedParams?.generatedImageUrl) {
            console.log('🖼️ ChatSidebar: Adding generated image to chat and display');
            
            // Extract body parts for character attachment
            const bodyParts = routerData.result.extractedParams.bodyParts || ['head'];
            console.log('🎯 ChatSidebar: Body parts detected:', bodyParts);
            
            // Process the generated image to remove background
            try {
              console.log('🎭 ChatSidebar: Starting background removal process for generated image');
              
              const transparentImageUrl = await makeTransparent(routerData.result.extractedParams.generatedImageUrl, {
                tolerance: 35, // Slightly higher tolerance for AI-generated images
                edgeDetection: true
              });
              
              console.log('✅ ChatSidebar: Background removal completed successfully');
              
              // Update the extracted params with the processed image
              routerData.result.extractedParams.generatedImageUrl = transparentImageUrl;
              routerData.result.extractedParams.hasTransparency = true;
              
            } catch (error) {
              console.error('❌ ChatSidebar: Background removal failed, using original image:', error);
              // Continue with original image if background removal fails
              routerData.result.extractedParams.hasTransparency = false;
            }
            
            // Create appearance changes for each body part
            if (onAppearanceChange && bodyParts.length > 0) {
              console.log('🔄 ChatSidebar: Applying generated image to character slots');
              
              bodyParts.forEach((slotName: string) => {
                console.log(`   📎 ChatSidebar: Applying to slot: ${slotName}`);
                
                // Create appearance change for this slot
                const appearanceChange: AppearanceChange = {
                  type: 'texture',
                  target: slotName,
                  value: routerData.result.extractedParams.generatedImageUrl,
                  description: `Applied generated ${routerData.result.extractedParams.itemType} to ${slotName}`,
                };
                
                // Apply the appearance change
                onAppearanceChange(appearanceChange);
                
                console.log(`   ✅ ChatSidebar: Applied appearance change to ${slotName}`);
              });
            }
            
            // Add successful image generation response to chat
            const filteredImages = routerData.result.extractedParams.filteredReferenceImages || [];
            const bodyPartImages = filteredImages.filter((img: any) => !img.url.startsWith('data:'));
            const userImages = filteredImages.filter((img: any) => img.url.startsWith('data:'));
            
            let referenceInfo = '';
            if (filteredImages.length > 0) {
              referenceInfo = '\n\n**References Used:**\n';
              if (bodyPartImages.length > 0) {
                referenceInfo += `• **Body Part:** ${bodyPartImages[0].name} (for pose and proportions)\n`;
              }
              if (userImages.length > 0) {
                referenceInfo += `• **User Aesthetic:** ${userImages.map((img: any) => img.name).join(', ')}\n`;
              }
            }
            
            // Show the complete prompt that was sent to GPT-image-1
            const finalPrompt = routerData.result.extractedParams.finalPrompt || '';
            let promptDisplay = '';
            if (finalPrompt) {
              promptDisplay = `\n\n**Complete Prompt Sent to GPT-image-1:**\n\`\`\`\n${finalPrompt}\n\`\`\``;
            }
            
            await append({
              role: 'assistant',
              content: `🎨 **Image Generated & Applied Successfully!**\n\n**Original Request:** ${userPrompt}\n\n**Rewritten Prompt:** ${routerData.result.extractedParams.rewrittenPrompt}\n\n**Generated:** ${routerData.result.extractedParams.itemType} (${routerData.result.extractedParams.color})\n\n**Applied to:** ${bodyParts.join(', ')}${referenceInfo}${promptDisplay}\n\n![Generated Image](${routerData.result.extractedParams.generatedImageUrl})`,
            });
            
            const newImage: GeneratedImage = {
              id: Date.now().toString(),
              imageUrl: routerData.result.extractedParams.generatedImageUrl,
              description: routerData.result.extractedParams.description,
              revisedPrompt: routerData.result.extractedParams.revisedPrompt,
              rewrittenPrompt: routerData.result.extractedParams.rewrittenPrompt,
              itemType: routerData.result.extractedParams.itemType,
              color: routerData.result.extractedParams.color,
              timestamp: routerData.result.extractedParams.timestamp,
              hasTransparency: routerData.result.extractedParams.hasTransparency,
            };
            
            setGeneratedImages(prev => [...prev, newImage]);
            console.log('✅ ChatSidebar: Generated image added to chat and state');
            
          } else {
            console.log('❌ ChatSidebar: Image generation failed');
            
            // Add failed image generation response to chat
            await append({
              role: 'assistant',
              content: `❌ **Image Generation Failed**\n\n**Original Request:** ${userPrompt}\n\n**Error:** ${routerData.result.error}\n\n**Rewritten Prompt:** ${routerData.result.extractedParams?.rewrittenPrompt || 'N/A'}\n\nPlease try again with a different request.`,
            });
          }
          
        } else {
          // For other categories (animations, export, etc.)
          await append({
            role: 'assistant',
            content: `🔍 **Request Processed:** ${routerData.categorization.category}\n\n${routerData.result.message}\n\n*Confidence: ${Math.round(routerData.categorization.confidence * 100)}%*\n\n*Reasoning: ${routerData.categorization.reasoning}*`,
          });
        }
        
        // The new system has already handled the request
      }

    } catch (error) {
      console.error('❌ ChatSidebar: Error with LLM router:', error);
      
      // Add error message to chat
      await append({
        role: 'assistant',
        content: '❌ Error processing request with LLM router. Falling back to original system...',
      });
      
      // Fall back to original system
      console.log('🔄 ChatSidebar: Falling back to original system due to error');
    } finally {
      setIsRoutingRequest(false);
    }
  };

  /**
   * Removes a generated image from the display
   */
  const removeGeneratedImage = (imageId: string) => {
    console.log('🗑️ ChatSidebar: Removing generated image:', imageId);
    setGeneratedImages(prev => prev.filter(img => img.id !== imageId));
  };

  /**
   * Clears the current reference images display
   */
  const clearCurrentReferenceImages = () => {
    console.log('🧹 ChatSidebar: Clearing current reference images');
    setCurrentReferenceImages([]);
    setCurrentTargetSlot('');
  };

  // Watch for tool results in messages
  React.useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant' && lastMessage.toolInvocations) {
      lastMessage.toolInvocations.forEach((invocation) => {
        if (invocation.state === 'result') {
          switch (invocation.toolName) {
            case 'changeAppearance':
              onAppearanceChange?.(invocation.result);
              break;
            case 'createAnimation':
              onAnimationCreate?.(invocation.result);
              break;
          }
        }
      });
    }
  }, [messages, onAppearanceChange, onAnimationCreate]);

  return (
    <div className={`fixed right-0 top-0 h-full transition-transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} z-10`}>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 px-2 py-4 rounded-l-md transition-colors"
        style={{
          backgroundColor: 'var(--button-bg)',
          color: 'var(--button-text)',
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
          className={`transition-transform ${isOpen ? 'rotate-0' : 'rotate-180'}`}
        >
          <path d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
        </svg>
      </button>

      {/* Sidebar content */}
      <div 
        className="h-full w-96 flex flex-col"
        style={{
          backgroundColor: 'var(--background)',
          borderLeft: '1px solid var(--select-border)',
        }}
      >
        {/* Header */}
        <div 
          className="px-4 py-3 border-b"
          style={{
            borderColor: 'var(--select-border)',
          }}
        >
          <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            Spine AI Assistant
          </h3>
          <p className="text-sm mt-1" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
            Describe appearance changes or new animations
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
              <p className="text-sm">Try asking me to:</p>
              <ul className="text-sm mt-2 space-y-1">
                <li>&quot;Make the character wear a red hat&quot;</li>
                <li>&quot;Give him a hat&quot;</li>
                <li>&quot;Create a dance animation&quot;</li>
                <li>&quot;Make him walk faster&quot;</li>
                <li>&quot;Generate a sword texture&quot;</li>
                <li>&quot;Export the character assets&quot;</li>
              </ul>
              
              {isLoadingReferences && (
                <div className="mt-4 text-xs" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
                  <div className="animate-pulse">Loading reference images...</div>
                </div>
              )}
              
              {!isLoadingReferences && referenceImages.length > 0 && (
                <div className="mt-4 text-xs" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
                  <div>📸 {referenceImages.length} reference images loaded</div>
                </div>
              )}
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded-lg ${
                message.role === 'user' ? 'ml-8' : 'mr-8'
              }`}
              style={{
                backgroundColor: message.role === 'user' 
                  ? 'var(--button-bg)' 
                  : 'var(--select-bg)',
                color: message.role === 'user'
                  ? 'var(--button-text)'
                  : 'var(--foreground)',
                border: '1px solid var(--select-border)',
              }}
            >
              <p className="text-sm">{message.content}</p>
              
              {/* Show tool call status in content */}
              {message.role === 'assistant' && message.content.includes('🔄') && (
                <div className="mt-2 text-xs" style={{ opacity: 0.7 }}>
                  {message.content.split('\n').filter((line: string) => line.includes('🔄') || line.includes('✅'))}
                </div>
              )}
            </div>
                      ))}
          
          {/* Reference Images Display */}
          {currentReferenceImages.length > 0 && (
            <div className="mb-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  Current Selection:
                </span>
                <button
                  onClick={clearCurrentReferenceImages}
                  className="text-xs px-2 py-1 rounded transition-colors"
                  style={{
                    backgroundColor: 'var(--select-bg)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--select-border)',
                  }}
                >
                  Clear
                </button>
              </div>
              <ReferenceImageDisplay 
                images={currentReferenceImages} 
                targetSlot={currentTargetSlot || undefined}
              />
            </div>
          )}
          
          {/* Generated Images Display */}
          {generatedImages.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm font-medium text-center py-2" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                Generated Images
              </div>
              {generatedImages.map((image) => (
                <GeneratedImageDisplay
                  key={image.id}
                  imageUrl={image.imageUrl}
                  description={image.description}
                  revisedPrompt={image.revisedPrompt}
                  rewrittenPrompt={image.rewrittenPrompt}
                  itemType={image.itemType}
                  color={image.color}
                  hasTransparency={image.hasTransparency}
                  onClose={() => removeGeneratedImage(image.id)}
                />
              ))}
            </div>
          )}
          
          {(isLoading || isRoutingRequest) && (
            <div className="flex justify-center py-2">
              <div className="animate-pulse" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
                {isRoutingRequest ? 'Routing request...' : 'Thinking...'}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleCustomSubmit} className="p-4 border-t" style={{ borderColor: 'var(--select-border)' }}>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Describe your changes..."
              className="flex-1 px-3 py-2 text-sm border rounded-md"
              style={{
                backgroundColor: 'var(--select-bg)',
                borderColor: 'var(--select-border)',
                color: 'var(--foreground)',
              }}
              disabled={isLoading || isRoutingRequest}
            />
            <button
              type="submit"
              disabled={isLoading || isRoutingRequest || !input.trim()}
              className="px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50"
              style={{
                backgroundColor: 'var(--button-bg)',
                color: 'var(--button-text)',
              }}
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}