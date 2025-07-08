'use client';

import React, { useState } from 'react';
import { useChat } from '@ai-sdk/react';

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

export default function ChatSidebar({ onAppearanceChange, onAnimationCreate }: ChatSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/spine-assistant',
    onToolCall: ({ toolCall }) => {
      console.log('Tool called:', toolCall);
      // The tool results will be in the message stream
    }
  });

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
                <li>&quot;Change the skin color to blue&quot;</li>
                <li>&quot;Create a dance animation&quot;</li>
                <li>&quot;Add a jumping animation&quot;</li>
              </ul>
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
          
          {isLoading && (
            <div className="flex justify-center py-2">
              <div className="animate-pulse" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
                Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t" style={{ borderColor: 'var(--select-border)' }}>
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
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
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