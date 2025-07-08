'use client';

import React, { useState, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import GeneratedImageDisplay from './GeneratedImageDisplay';
import { loadReferenceImages, getRelevantReferenceImages, ReferenceImage } from '@/utils/loadReferenceImages';

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
}

export default function ChatSidebar({ onAppearanceChange, onAnimationCreate }: ChatSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isRoutingRequest, setIsRoutingRequest] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [isLoadingReferences, setIsLoadingReferences] = useState(false);
  
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
        const images = await loadReferenceImages();
        setReferenceImages(images);
        console.log('✅ ChatSidebar: Reference images loaded successfully:', images.length);
      } catch (error) {
        console.error('❌ ChatSidebar: Error loading reference images:', error);
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
      
      // Get relevant reference images for this request
      const relevantReferences = getRelevantReferenceImages(referenceImages, userPrompt);
      console.log('📸 ChatSidebar: Selected relevant reference images:', relevantReferences.length);
      
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
            await append({
              role: 'assistant',
              content: `🎨 **Image Generated & Applied Successfully!**\n\n**Original Request:** ${userPrompt}\n\n**Rewritten Prompt:** ${routerData.result.extractedParams.rewrittenPrompt}\n\n**Generated:** ${routerData.result.extractedParams.itemType} (${routerData.result.extractedParams.color})\n\n**Applied to:** ${bodyParts.join(', ')}\n\n![Generated Image](${routerData.result.extractedParams.generatedImageUrl})`,
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