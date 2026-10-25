import React from 'react';
import { ShotInfo, CandidateTake } from '../types/dunhuang';
import { X, Check, Play, Film, Layers } from 'lucide-react';

interface TakeSwitcherModalProps {
  shot: ShotInfo | null;
  onClose: () => void;
  onSelectTake: (shotId: string, takeId: string) => void;
}

export const TakeSwitcherModal: React.FC<TakeSwitcherModalProps> = ({
  shot,
  onClose,
  onSelectTake,
}) => {
  if (!shot) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-stone-950 rounded-2xl border border-stone-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-800/80 text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-mono text-amber-400 font-bold text-sm">
                  {shot.id}
                </span>
                <span className="text-stone-600">/</span>
                <h3 className="text-base font-serif font-bold text-stone-100">
                  {shot.name}
                </h3>
              </div>
              <span className="text-xs text-stone-400">
                本镜已导入 {shot.takes.length} 个 AI 生成候选版本 (Candidate Takes)，选择最佳版本装配进全片长卷
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-stone-900 text-stone-400 hover:text-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Takes List Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto">
          {shot.takes.map((take) => {
            const isSelected = take.id === shot.selectedTakeId;

            return (
              <div
                key={take.id}
                onClick={() => {
                  onSelectTake(shot.id, take.id);
                  onClose();
                }}
                className={`relative flex flex-col rounded-xl overflow-hidden border cursor-pointer transition-all group ${
                  isSelected
                    ? 'border-amber-500 shadow-lg ring-2 ring-amber-500/40 bg-stone-900'
                    : 'border-stone-800 bg-stone-950 hover:border-stone-700 hover:bg-stone-900/60'
                }`}
              >
                {/* Video / Thumbnail preview */}
                <div className="relative aspect-video w-full bg-stone-900 overflow-hidden">
                  <img
                    src={take.thumbUrl}
                    alt={take.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-black/70 border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-4 h-4 fill-current translate-x-0.5" />
                    </div>
                  </div>

                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/80 font-mono text-[10px] text-amber-400">
                    {take.duration.toFixed(1)}s
                  </div>

                  {isSelected && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-emerald-600 text-[10px] font-sans font-medium text-white flex items-center gap-1 shadow">
                      <Check className="w-3 h-3" />
                      <span>全片当前选用</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-3 flex flex-col gap-1.5">
                  <span className="font-semibold text-xs text-stone-200">
                    {take.name}
                  </span>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    {take.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-900/40 flex items-center justify-between text-xs text-stone-400">
          <span>提示：切换候选后，总片长 (~41s) 与各镜头时间戳将自动重新对齐。</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium transition-colors"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
