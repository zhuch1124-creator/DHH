import React, { useState } from 'react';
import { Flame, Bell, Sparkles, Music, Share2, Check } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

interface HeaderProps {
  activeTab: 'player' | 'continuity' | 'prompts' | 'layers';
  setActiveTab: (tab: 'player' | 'continuity' | 'prompts' | 'layers') => void;
  isCandleActive: boolean;
  onToggleCandle: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isCandleActive,
  onToggleCandle,
}) => {
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  const handleCopyShareUrl = () => {
    const url = 'https://ais-pre-tsssm4mwiato3c7v4tnqvg-731901148888.us-west2.run.app';
    navigator.clipboard.writeText(url);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  return (
    <header className="w-full border-b border-stone-800 bg-stone-950/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('player');
          }}
          className="text-lg font-serif font-bold tracking-tight text-amber-200 whitespace-nowrap shrink-0 hover:text-amber-100 transition-colors"
        >
          敦煌照见 · 莫高窟连续视界
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <button
            onClick={() => setActiveTab('player')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              activeTab === 'player'
                ? 'border-amber-400 text-amber-300 font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            41秒全片照见
          </button>

          <button
            onClick={() => setActiveTab('continuity')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              activeTab === 'continuity'
                ? 'border-amber-400 text-amber-300 font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            镜头衔接检查表
          </button>

          <button
            onClick={() => setActiveTab('prompts')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              activeTab === 'prompts'
                ? 'border-amber-400 text-amber-300 font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            视觉风格锁与提示词
          </button>

          <button
            onClick={() => setActiveTab('layers')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              activeTab === 'layers'
                ? 'border-amber-400 text-amber-300 font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            2.5D离墙运镜
          </button>
        </nav>

        {/* Zone 3: 1 primary action + BGM channel toggle + Share URL */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Header BGM Channel Button */}
          <button
            onClick={() => soundEngine.toggleBgm()}
            className="p-2 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-amber-300 transition-colors flex items-center gap-1.5 text-xs"
            title="配乐 BGM 通道开关 (HGNNNN - Meiyo to Songen)"
          >
            <Music className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline font-mono text-[11px]">BGM</span>
          </button>

          {/* Share/Export Product URL Button */}
          <button
            onClick={handleCopyShareUrl}
            className="px-3 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-amber-300 transition-colors flex items-center gap-1.5 text-xs"
            title="复制成品在线分享网址"
          >
            {copiedShare ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium font-serif text-[11px]">网址已复制</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-stone-400" />
                <span className="hidden sm:inline font-medium font-serif text-[11px]">导出网址</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              onToggleCandle();
              soundEngine.playBowlChime(528);
            }}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
              isCandleActive
                ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'bg-stone-900 hover:bg-stone-800 text-amber-300 border border-stone-700'
            }`}
          >
            <Flame className="w-4 h-4 fill-current" />
            <span>{isCandleActive ? '熄烛全貌' : '持烛照壁'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
