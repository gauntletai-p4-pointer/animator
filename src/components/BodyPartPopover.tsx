'use client';

import { useEffect, useState, useRef } from 'react';
import { Skeleton } from '@esotericsoftware/spine-webgl';

interface BodyPartPopoverProps {
  skeleton: Skeleton | null;
}

interface BodyPartGroup {
  name: string;
  slots: string[];
}

const BODY_PART_GROUPS: BodyPartGroup[] = [
  {
    name: 'Head',
    slots: ['head', 'neck', 'eye', 'mouth', 'goggles']
  },
  {
    name: 'Torso',
    slots: ['torso']
  },
  {
    name: 'Arms',
    slots: ['front-upper-arm', 'front-bracer', 'front-fist', 'rear-upper-arm', 'rear-bracer', 'gun']
  },
  {
    name: 'Legs',
    slots: ['front-thigh', 'front-shin', 'front-foot', 'rear-thigh', 'rear-shin', 'rear-foot']
  },
  {
    name: 'Effects',
    slots: ['muzzle']
  }
];

export default function BodyPartPopover({ skeleton }: BodyPartPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [visibilityState, setVisibilityState] = useState<Record<string, boolean>>({});
  const [slotAttachments, setSlotAttachments] = useState<Record<string, string | null>>({});
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Initialize visibility state and store original attachments
  useEffect(() => {
    if (!skeleton) return;

    const initialState: Record<string, boolean> = {};
    const attachments: Record<string, string | null> = {};

    BODY_PART_GROUPS.forEach(group => {
      group.slots.forEach(slotName => {
        const slot = skeleton.findSlot(slotName);
        if (slot) {
          initialState[slotName] = slot.getAttachment() !== null;
          const slotData = skeleton.data.findSlot(slotName);
          attachments[slotName] = slotData?.attachmentName || null;
        }
      });
    });

    setVisibilityState(initialState);
    setSlotAttachments(attachments);
  }, [skeleton]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSlot = (slotName: string) => {
    if (!skeleton) return;

    const slot = skeleton.findSlot(slotName);
    if (!slot) return;

    const newVisibility = !visibilityState[slotName];
    
    if (newVisibility) {
      const attachmentName = slotAttachments[slotName];
      if (attachmentName) {
        const slotIndex = skeleton.slots.indexOf(slot);
        const attachment = skeleton.getAttachment(slotIndex, attachmentName);
        slot.setAttachment(attachment);
      }
    } else {
      slot.setAttachment(null);
    }

    setVisibilityState(prev => ({
      ...prev,
      [slotName]: newVisibility
    }));
  };

  const toggleGroup = (group: BodyPartGroup) => {
    if (!skeleton) return;

    const validSlots = group.slots.filter(slotName => skeleton.findSlot(slotName));
    const allVisible = validSlots.every(slotName => visibilityState[slotName]);
    
    validSlots.forEach(slotName => {
      const slot = skeleton.findSlot(slotName);
      if (slot) {
        if (allVisible) {
          slot.setAttachment(null);
        } else {
          const attachmentName = slotAttachments[slotName];
          if (attachmentName) {
            const slotIndex = skeleton.slots.indexOf(slot);
            const attachment = skeleton.getAttachment(slotIndex, attachmentName);
            slot.setAttachment(attachment);
          }
        }
      }
    });

    const newState = { ...visibilityState };
    validSlots.forEach(slotName => {
      newState[slotName] = !allVisible;
    });
    setVisibilityState(newState);
  };

  const toggleAll = () => {
    if (!skeleton) return;

    const allSlots = BODY_PART_GROUPS.flatMap(g => g.slots).filter(slotName => skeleton.findSlot(slotName));
    const allVisible = allSlots.every(slotName => visibilityState[slotName]);

    allSlots.forEach(slotName => {
      const slot = skeleton.findSlot(slotName);
      if (slot) {
        if (allVisible) {
          slot.setAttachment(null);
        } else {
          const attachmentName = slotAttachments[slotName];
          if (attachmentName) {
            const slotIndex = skeleton.slots.indexOf(slot);
            const attachment = skeleton.getAttachment(slotIndex, attachmentName);
            slot.setAttachment(attachment);
          }
        }
      }
    });

    const newState = { ...visibilityState };
    allSlots.forEach(slotName => {
      newState[slotName] = !allVisible;
    });
    setVisibilityState(newState);
  };

  if (!skeleton) {
    return null;
  }

  const hiddenCount = Object.values(visibilityState).filter(visible => !visible).length;

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 text-sm border rounded-md transition-colors inline-flex items-center gap-2"
        style={{
          backgroundColor: 'var(--button-bg)',
          borderColor: 'var(--button-border)',
          color: 'var(--button-text)'
        }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d={isOpen ? "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
                         : "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"} />
        </svg>
        Body Parts
        {hiddenCount > 0 && (
          <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
            {hiddenCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute top-full mt-2 left-0 z-50 p-4 rounded-lg shadow-lg border min-w-[320px]"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--border)'
          }}
        >
          <div className="flex items-center justify-between mb-3 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>Body Part Visibility</h3>
            <button
              onClick={toggleAll}
              className="text-sm px-2 py-1 rounded transition-colors"
              style={{
                backgroundColor: 'var(--button-secondary-bg)',
                color: 'var(--button-text)'
              }}
            >
              {Object.values(visibilityState).every(v => v) ? 'Hide All' : 'Show All'}
            </button>
          </div>

          <div className="space-y-3">
            {BODY_PART_GROUPS.map(group => {
              const groupSlots = group.slots.filter(slotName => skeleton.findSlot(slotName));
              if (groupSlots.length === 0) return null;

              const allVisible = groupSlots.every(slotName => visibilityState[slotName]);
              const someVisible = groupSlots.some(slotName => visibilityState[slotName]);

              return (
                <div key={group.name}>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                      {group.name}
                    </h4>
                    <button
                      onClick={() => toggleGroup(group)}
                      className="text-xs px-2 py-0.5 rounded transition-colors"
                      style={{
                        backgroundColor: allVisible ? 'var(--button-bg)' : 'var(--button-secondary-bg)',
                        color: 'var(--button-text)',
                        opacity: someVisible && !allVisible ? 0.7 : 1
                      }}
                    >
                      {allVisible ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-1 pl-2">
                    {groupSlots.map(slotName => (
                      <label
                        key={slotName}
                        className="flex items-center gap-1.5 cursor-pointer py-0.5 text-sm"
                        style={{ color: 'var(--foreground)' }}
                      >
                        <input
                          type="checkbox"
                          checked={visibilityState[slotName] || false}
                          onChange={() => toggleSlot(slotName)}
                          className="w-3 h-3 rounded"
                        />
                        <span className="text-xs">{slotName}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}