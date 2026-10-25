import React, { useState } from 'react';
import { ContinuityTransition } from '../types/dunhuang';
import {
  CheckCircle2,
  AlertCircle,
  Eye,
  SlidersHorizontal,
  ArrowRight,
  Maximize2,
  Sparkles,
  Download,
  Info,
} from 'lucide-react';

interface ContinuityInspectorProps {
  transitions: ContinuityTransition[];
  onUpdateTransitionStatus: (id: string, status: 'passed' | 'review') => void;
  onPlayTransition?: (transitionId: string) => void;
}

export const ContinuityInspector: React.FC<ContinuityInspectorProps> = ({
  transitions,
  onUpdateTransitionStatus,
  onPlayTransition,
}) => {
  const [selectedId, setSelectedId] = useState<string>(transitions[0].id);
  const [wipePosition, setWipePosition] = useState<number>(50); // 0 to 100%
  const [isHoveringWipe, setIsHoveringWipe] = useState<boolean>(false);
  const [blendMode, setBlendMode] = useState<'split' | 'onion' | 'diff'>('split');

  const activeTransition =
    transitions.find((t) => t.id === selectedId) || transitions[0];

  const handlePointerDownWipe = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const handleMove = (ev: PointerEvent) => {
      const pos = ((ev.clientX - rect.left) / rect.width) * 100;
      setWipePosition(Math.max(0, Math.min(100, pos)));
    };
    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    const initialPos = ((e.clientX - rect.left) / rect.width) * 100;
    setWipePosition(Math.max(0, Math.min(100, initialPos)));
  };

  const passedCount = transitions.filter((t) => t.status === 'passed').length;

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Top Overview & Criteria Header */}
      <div className="p-5 rounded-xl bg-stone-900/60 border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-serif font-bold text-stone-100">
              四、镜头衔接检查表 · 交互式质检核验台
            </h2>
            <span className="text-xs font-mono text-stone-400 bg-stone-800 px-2 py-0.5 rounded border border-stone-700">
              8 组关键转折
            </span>
          </div>
          <p className="text-xs text-stone-400 leading-relaxed max-w-2xl">
            全片为一条连续“照见”长卷，严禁硬切失真。通过两帧接缝比对器，细致检验门内黑场轴线、藻井中心推近、三兔顺时针转速、丹青大旋涡与青绿水纹飞天的一致性。
          </p>
        </div>

        {/* Verification Status Score */}
        <div className="flex items-center gap-4 bg-stone-950/80 p-3 rounded-lg border border-stone-800 shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] text-stone-500 uppercase tracking-widest font-mono">
              连续性合格率
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-serif font-bold text-emerald-400">
                {passedCount}
              </span>
              <span className="text-sm font-mono text-stone-500">/ 8 项</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Split Layout: Table on Left / Interactive Split Wipe on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Transition Matrix Table (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-2">
          <div className="text-xs font-semibold text-stone-300 px-1 flex items-center justify-between">
            <span>衔接节点清单 (点击切换检查)</span>
            <span className="text-[11px] text-stone-500">必须连续元素 · 检查重点</span>
          </div>

          <div className="flex flex-col gap-2">
            {transitions.map((item) => {
              const isSelected = item.id === selectedId;
              const isPassed = item.status === 'passed';

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-amber-950/30 border-amber-500/80 shadow-md ring-1 ring-amber-500/30'
                      : 'bg-stone-950 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-400">
                        {item.transitionName}
                      </span>
                      <span className="text-stone-600 text-xs">/</span>
                      <span className="text-xs font-medium text-stone-200">
                        {item.requiredElements}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateTransitionStatus(
                          item.id,
                          isPassed ? 'review' : 'passed'
                        );
                      }}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                        isPassed
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                          : 'bg-amber-950/80 text-amber-300 border border-amber-700/60'
                      }`}
                    >
                      {isPassed ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>已达标</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 text-amber-400" />
                          <span>待复查</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-stone-400 leading-snug line-clamp-1">
                    重点：{item.checkPoints}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Interactive Split-Wipe Comparator (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4 bg-stone-950 p-4 rounded-xl border border-stone-800">
          {/* Header of Active Transition */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-800 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-amber-400 font-mono">
                {activeTransition.transitionName}
              </span>
              <span className="text-stone-600">·</span>
              <span className="text-xs text-stone-200 font-serif">
                {activeTransition.requiredElements}
              </span>
            </div>

            {/* Compare Modes */}
            <div className="flex items-center gap-1 bg-stone-900 p-0.5 rounded-lg border border-stone-800 text-xs">
              <button
                onClick={() => setBlendMode('split')}
                className={`px-2 py-1 rounded text-[11px] transition-colors ${
                  blendMode === 'split'
                    ? 'bg-amber-600/40 text-amber-300 font-medium'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                左右擦拭对比
              </button>
              <button
                onClick={() => setBlendMode('onion')}
                className={`px-2 py-1 rounded text-[11px] transition-colors ${
                  blendMode === 'onion'
                    ? 'bg-amber-600/40 text-amber-300 font-medium'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                半透叠影 (50%)
              </button>
              <button
                onClick={() => setBlendMode('diff')}
                className={`px-2 py-1 rounded text-[11px] transition-colors ${
                  blendMode === 'diff'
                    ? 'bg-amber-600/40 text-amber-300 font-medium'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                色差差值 (Diff)
              </button>
            </div>
          </div>

          {/* Interactive Frame Comparison Canvas */}
          <div
            onPointerDown={blendMode === 'split' ? handlePointerDownWipe : undefined}
            onMouseEnter={() => setIsHoveringWipe(true)}
            onMouseLeave={() => setIsHoveringWipe(false)}
            className="relative aspect-video w-full rounded-lg overflow-hidden border border-stone-800 bg-stone-900 cursor-ew-resize select-none"
          >
            {/* Base Image: Next Shot's Start Frame (01_start) */}
            <img
              src={activeTransition.toStartFrame}
              alt="Next Shot Start Frame"
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Top Image: Previous Shot's End Frame (02_end) */}
            {blendMode === 'split' && (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${wipePosition}%` }}
              >
                <img
                  src={activeTransition.fromEndFrame}
                  alt="Previous Shot End Frame"
                  className="absolute inset-0 w-full h-full object-cover max-w-none"
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            )}

            {/* Onion Skin Mode */}
            {blendMode === 'onion' && (
              <img
                src={activeTransition.fromEndFrame}
                alt="Previous Shot End Frame"
                className="absolute inset-0 w-full h-full object-cover opacity-50"
              />
            )}

            {/* Difference Mode */}
            {blendMode === 'diff' && (
              <img
                src={activeTransition.fromEndFrame}
                alt="Previous Shot End Frame"
                className="absolute inset-0 w-full h-full object-cover mix-blend-difference"
              />
            )}

            {/* Divider Line in Split Mode */}
            {blendMode === 'split' && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] z-10 pointer-events-none"
                style={{ left: `${wipePosition}%` }}
              >
                {/* Drag Handle */}
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-stone-950 border-2 border-amber-400 flex items-center justify-center text-amber-300 shadow-xl">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </div>
              </div>
            )}

            {/* Floating Frame Labels */}
            <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/80 backdrop-blur-sm text-[10px] font-mono text-stone-200 border border-stone-700 pointer-events-none z-20">
              前镜尾帧 (02_end): {activeTransition.fromShotId}
            </div>
            <div className="absolute top-3 right-3 px-2 py-1 rounded bg-black/80 backdrop-blur-sm text-[10px] font-mono text-stone-200 border border-stone-700 pointer-events-none z-20">
              后镜首帧 (01_start): {activeTransition.toShotId}
            </div>

            {/* Wipe readout */}
            {blendMode === 'split' && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded bg-black/75 text-[10px] font-mono text-stone-300 pointer-events-none z-20">
                拖动擦拭对比：{Math.round(wipePosition)}%
              </div>
            )}
          </div>

          {/* Details & Inspection Checklist Box */}
          <div className="p-3.5 rounded-lg bg-stone-900/60 border border-stone-800 flex flex-col gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-medium">
              <Info className="w-4 h-4 text-amber-400" />
              <span>专项核查标准与验收结论</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-stone-300 pt-1">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-stone-500 font-mono uppercase">
                  检查重点 (Check Points)
                </span>
                <p className="font-serif leading-relaxed text-stone-200">
                  {activeTransition.checkPoints}
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-stone-500 font-mono uppercase">
                  实测达标分析 (Audit Result)
                </span>
                <p className="font-sans leading-relaxed text-stone-400">
                  {activeTransition.notes}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between">
              <span className="text-[11px] text-stone-500">
                调机建议：{activeTransition.continuityTips}
              </span>

              <button
                onClick={() =>
                  onUpdateTransitionStatus(
                    activeTransition.id,
                    activeTransition.status === 'passed' ? 'review' : 'passed'
                  )
                }
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  activeTransition.status === 'passed'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-amber-600 hover:bg-amber-500 text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {activeTransition.status === 'passed'
                    ? '标记为待微调'
                    : '确认本组衔接达标'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
