import React, { useState, useEffect } from 'react';
import {
  INITIAL_SHOTS,
  CONTINUITY_TRANSITIONS,
} from './data/storyboardData';
import { ShotInfo, ContinuityTransition, CandlelightSettings } from './types/dunhuang';
import { Header } from './components/Header';
import { ContinuousPlayer } from './components/ContinuousPlayer';
import { ContinuityInspector } from './components/ContinuityInspector';
import { PromptStudio } from './components/PromptStudio';
import { MuralLayerParallax } from './components/MuralLayerParallax';
import { TakeSwitcherModal } from './components/TakeSwitcherModal';
import { soundEngine } from './utils/soundEngine';
import {
  Flame,
  Film,
  CheckCircle2,
  Sliders,
  Palette,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

export default function App() {
  const [shots, setShots] = useState<ShotInfo[]>(INITIAL_SHOTS);
  const [transitions, setTransitions] = useState<ContinuityTransition[]>(
    CONTINUITY_TRANSITIONS
  );
  const [currentShotIndex, setCurrentShotIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<
    'player' | 'continuity' | 'prompts' | 'layers'
  >('player');
  const [activeTakeSwitcherShot, setActiveTakeSwitcherShot] =
    useState<ShotInfo | null>(null);

  const [candlelightSettings, setCandlelightSettings] =
    useState<CandlelightSettings>({
      enabled: true,
      intensity: 0.75,
      radius: 280,
      flickerSpeed: 'natural',
      revealTexture: true,
      mode: 'cursor',
      dustMotes: true,
      colorTemperature: 'warm_amber',
    });

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.code === 'KeyC') {
        setCandlelightSettings((prev) => ({ ...prev, enabled: !prev.enabled }));
      } else if (e.code === 'BracketLeft') {
        setCurrentShotIndex((idx) => Math.max(0, idx - 1));
      } else if (e.code === 'BracketRight') {
        setCurrentShotIndex((idx) => Math.min(shots.length - 1, idx + 1));
      } else if (e.code === 'KeyM') {
        soundEngine.toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shots.length]);

  const handleSelectTake = (shotId: string, takeId: string) => {
    setShots((prev) =>
      prev.map((s) => (s.id === shotId ? { ...s, selectedTakeId: takeId } : s))
    );
  };

  const handleUpdateTransitionStatus = (
    id: string,
    status: 'passed' | 'review'
  ) => {
    setTransitions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* 3-Zone Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCandleActive={candlelightSettings.enabled}
        onToggleCandle={() =>
          setCandlelightSettings((prev) => ({ ...prev, enabled: !prev.enabled }))
        }
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-8">
        {/* Editorial Sub-Navigation / Operational Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-800/80 gap-3 text-xs text-stone-400">
          <div className="flex items-center gap-2">
            <span className="font-serif text-amber-300 font-semibold text-sm">
              莫高窟第407窟与第257窟 · 连续照见工程
            </span>
            <span className="text-stone-600">·</span>
            <span>41秒 · 9镜 · 16:9 · 24fps</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>
              快捷键：<kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-300">Space</kbd> 播放
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-300">[ / ]</kbd> 切镜
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-300">C</kbd> 烛光
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-300">M</kbd> 静音
            </span>
          </div>
        </div>

        {/* Tab 1: Continuous 41s Cave Illumination Player */}
        {activeTab === 'player' && (
          <div className="flex flex-col gap-6">
            <ContinuousPlayer
              shots={shots}
              currentShotIndex={currentShotIndex}
              onSelectShot={(idx) => setCurrentShotIndex(idx)}
              onOpenTakeSwitcher={(shot) => setActiveTakeSwitcherShot(shot)}
              candlelightSettings={candlelightSettings}
              setCandlelightSettings={setCandlelightSettings}
              onOpenContinuityCheck={(transId) => {
                setActiveTab('continuity');
              }}
            />

            {/* Quick Overview Bento Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div
                onClick={() => setActiveTab('continuity')}
                className="p-4 rounded-xl bg-stone-900/40 border border-stone-800 hover:border-amber-700/60 cursor-pointer transition-all flex flex-col gap-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-stone-200 font-serif font-semibold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>镜头衔接检查表 (8项核验)</span>
                  </div>
                  <span className="text-stone-500 group-hover:text-amber-400 transition-colors">
                    →
                  </span>
                </div>
                <p className="text-xs text-stone-400 leading-relaxed">
                  比对首尾关键帧，确保门内黑场轴线、藻井顺时针旋转与青绿水纹飞天不产生硬切。
                </p>
              </div>

              <div
                onClick={() => setActiveTab('prompts')}
                className="p-4 rounded-xl bg-stone-900/40 border border-stone-800 hover:border-amber-700/60 cursor-pointer transition-all flex flex-col gap-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-stone-200 font-serif font-semibold text-sm">
                    <Palette className="w-4 h-4 text-amber-400" />
                    <span>视觉风格锁与提示词工作台</span>
                  </div>
                  <span className="text-stone-500 group-hover:text-amber-400 transition-colors">
                    →
                  </span>
                </div>
                <p className="text-xs text-stone-400 leading-relaxed">
                  提供完整的正向风格锁、负向过滤锁、五大矿物颜料色板与各镜参数复制工具。
                </p>
              </div>

              <div
                onClick={() => setActiveTab('layers')}
                className="p-4 rounded-xl bg-stone-900/40 border border-stone-800 hover:border-amber-700/60 cursor-pointer transition-all flex flex-col gap-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-stone-200 font-serif font-semibold text-sm">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>克制 2.5D 离墙运镜分析</span>
                  </div>
                  <span className="text-stone-500 group-hover:text-amber-400 transition-colors">
                    →
                  </span>
                </div>
                <p className="text-xs text-stone-400 leading-relaxed">
                  三维立体分解地仗层、青绿群山、九色鹿与飞天飘带，确保坚守壁画平面美学。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Continuity Inspector */}
        {activeTab === 'continuity' && (
          <ContinuityInspector
            transitions={transitions}
            onUpdateTransitionStatus={handleUpdateTransitionStatus}
          />
        )}

        {/* Tab 3: Prompt & Style Lock Studio */}
        {activeTab === 'prompts' && (
          <PromptStudio
            shots={shots}
            selectedShotIndex={currentShotIndex}
            onSelectShot={(idx) => setCurrentShotIndex(idx)}
          />
        )}

        {/* Tab 4: 2.5D Layer Breakdown */}
        {activeTab === 'layers' && <MuralLayerParallax />}
      </main>

      {/* Candidate Take Switcher Modal */}
      <TakeSwitcherModal
        shot={activeTakeSwitcherShot}
        onClose={() => setActiveTakeSwitcherShot(null)}
        onSelectTake={handleSelectTake}
      />

      {/* Museum Editorial Footer */}
      <footer className="w-full border-t border-stone-800 bg-stone-950 mt-12 py-8 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-stone-400 font-serif font-semibold">
              敦煌莫高窟数字壁画连续视界
            </span>
            <span>·</span>
            <span>三兔连环藻井与九色鹿王本生故事</span>
          </div>

          <div className="flex items-center gap-6 text-[11px] font-mono">
            <span>分辨率: 16:9 (864x496 / 1080p)</span>
            <span>帧率: 24.000 fps</span>
            <span>总时长: 41.00s</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
