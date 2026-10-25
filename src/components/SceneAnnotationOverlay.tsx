import React from 'react';
import { ShotAnnotation } from '../types/dunhuang';

interface SceneAnnotationOverlayProps {
  annotation: ShotAnnotation;
  visible: boolean;
  onTogglePin?: () => void;
  isPinned?: boolean;
}

export const SceneAnnotationOverlay: React.FC<SceneAnnotationOverlayProps> = ({
  annotation,
  visible,
  onTogglePin,
  isPinned = false,
}) => {
  return (
    <div
      className={`absolute bottom-10 left-8 z-30 pointer-events-auto select-none transition-all duration-700 ease-out max-w-md ${
        visible || isPinned
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-3 pointer-events-none'
      }`}
    >
      <div className="flex flex-col gap-2 p-3 rounded-lg backdrop-blur-[2px] bg-black/20">
        {/* Top: Minimal Index Marker */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-amber-400/90 tracking-widest">
            {annotation.index}
          </span>
          <div className="w-4 h-[1px] bg-amber-500/40" />
        </div>

        {/* Title: Authentic Dunhuang / Museum Editorial Serif */}
        <h3 className="text-xl sm:text-2xl font-serif font-bold text-stone-100 tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          {annotation.title}
        </h3>

        {/* Poetic Commentary Prose */}
        <p className="text-xs sm:text-sm font-serif text-stone-300/95 leading-relaxed tracking-wide drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] max-w-sm">
          {annotation.prose}
        </p>

        {/* Metadata Tags Separated by Typographic Dots (Anti-slop clean metadata) */}
        <div className="flex items-center gap-2 text-[11px] font-sans text-stone-400/80 pt-1 tracking-wider drop-shadow-sm">
          {annotation.tags.map((tag, idx) => (
            <React.Fragment key={tag}>
              <span>{tag}</span>
              {idx < annotation.tags.length - 1 && (
                <span className="text-stone-600 select-none">·</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
