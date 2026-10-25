import React, { useState } from 'react';
import {
  GLOBAL_STYLE_PROMPT,
  GLOBAL_NEGATIVE_PROMPT,
  MINERAL_PIGMENTS,
  AESTHETIC_RULES,
} from '../data/storyboardData';
import { ShotInfo } from '../types/dunhuang';
import {
  Copy,
  Check,
  Sparkles,
  ShieldAlert,
  Palette,
  Sliders,
  FileText,
  Bookmark,
} from 'lucide-react';

interface PromptStudioProps {
  shots: ShotInfo[];
  selectedShotIndex: number;
  onSelectShot: (index: number) => void;
}

export const PromptStudio: React.FC<PromptStudioProps> = ({
  shots,
  selectedShotIndex,
  onSelectShot,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const activeShot = shots[selectedShotIndex] || shots[0];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const getCombinedPrompt = (shot: ShotInfo) => {
    return `${GLOBAL_STYLE_PROMPT}\n\n[Shot Specific Action - ${shot.id} ${shot.name}]\n${shot.scenePrompt}\nStart Frame State: ${shot.promptStart}\nEnd Frame Target: ${shot.promptEnd}`;
  };

  return (
    <div className="w-full flex flex-col gap-8">
      {/* Visual Style Lock & Generation Rules */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-serif font-bold text-stone-100">
              一、统一视觉风格锁 · 提示词系统工程
            </h2>
            <span className="text-xs font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
              每镜强制保留
            </span>
          </div>
          <p className="text-xs text-stone-400 leading-relaxed max-w-3xl">
            全片为一条连续的“照见”过程。人物、动物、水纹、云气和飘带始终保留敦煌壁画的平面造型、天然矿物颜料和古壁裂纹，只做克制的
            2.5D 离墙运动，严禁变成写实 CG 或仙侠炫光。
          </p>
        </div>

        {/* Global Style Prompt & Negative Prompt Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Global Style Prompt Card */}
          <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 flex flex-col justify-between gap-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-stone-200">
                  Global Style Prompt (正向提示词锁)
                </span>
              </div>
              <button
                onClick={() => handleCopy(GLOBAL_STYLE_PROMPT, 'global_style')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 text-xs transition-colors"
              >
                {copiedKey === 'global_style' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">已复制</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>复制正向词</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3 rounded-lg bg-stone-900/70 border border-stone-800/80 font-mono text-xs text-stone-300 leading-relaxed max-h-48 overflow-y-auto">
              {GLOBAL_STYLE_PROMPT}
            </div>

            <div className="text-[11px] text-stone-500 font-sans">
              核心特征：低饱和矿物颜料、沥粉贴金、龟裂地仗层、2.5D克制离墙动势、古壁呼吸感。
            </div>
          </div>

          {/* Global Negative Prompt Card */}
          <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 flex flex-col justify-between gap-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span className="text-sm font-semibold text-stone-200">
                  Global Negative Prompt (反向负向提示词锁)
                </span>
              </div>
              <button
                onClick={() => handleCopy(GLOBAL_NEGATIVE_PROMPT, 'global_negative')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 text-xs transition-colors"
              >
                {copiedKey === 'global_negative' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">已复制</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>复制负向词</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3 rounded-lg bg-stone-900/70 border border-stone-800/80 font-mono text-xs text-stone-300 leading-relaxed max-h-48 overflow-y-auto">
              {GLOBAL_NEGATIVE_PROMPT}
            </div>

            <div className="text-[11px] text-stone-500 font-sans">
              严禁元素：霓虹光效、赛博朋克、发光传送门、写实皮肤与动物皮毛、3D塑料光泽、仙侠光柱。
            </div>
          </div>
        </div>
      </div>

      {/* Aesthetic Continuity Rules List */}
      <div className="p-5 rounded-xl bg-stone-950 border border-stone-800 flex flex-col gap-3">
        <h3 className="text-sm font-serif font-bold text-stone-200 flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-amber-400" />
          <span>风格连续性规则 (连续照见执行标准)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {AESTHETIC_RULES.map((rule, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-stone-900/60 border border-stone-800/80 flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-amber-300 font-serif">
                  {rule.phase}
                </span>
                <span className="text-[10px] text-stone-400 font-mono">
                  {rule.ratio}
                </span>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed font-sans">
                {rule.rules}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Shot-by-Shot Prompt Generator Workbench */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-serif font-bold text-stone-100">
              单镜提示词工程与首尾帧描述
            </h3>
            <span className="text-xs font-mono text-stone-400">
              (当前选中：{activeShot.id} {activeShot.name})
            </span>
          </div>

          <button
            onClick={() =>
              handleCopy(getCombinedPrompt(activeShot), `combined_${activeShot.id}`)
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-medium text-xs transition-colors shadow-sm"
          >
            {copiedKey === `combined_${activeShot.id}` ? (
              <>
                <Check className="w-4 h-4 text-stone-950" />
                <span>已复制该镜完整 Prompt</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>复制该镜完整 Prompt (含全局锁)</span>
              </>
            )}
          </button>
        </div>

        {/* Shot Selection Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {shots.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => onSelectShot(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                idx === selectedShotIndex
                  ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                  : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              <span className="font-mono mr-1">{s.id}</span>
              <span>{s.name.split('·')[0]}</span>
            </button>
          ))}
        </div>

        {/* Selected Shot Prompt Details Card */}
        <div className="p-5 rounded-xl bg-stone-950 border border-stone-800 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Frame */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-300 font-mono">
                  01_start.png 起始帧要求
                </span>
                <button
                  onClick={() => handleCopy(activeShot.promptStart, 'prompt_start')}
                  className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>复制</span>
                </button>
              </div>
              <div className="p-3 rounded-lg bg-stone-900 border border-stone-800 text-xs font-mono text-stone-300 leading-relaxed">
                {activeShot.promptStart}
              </div>
            </div>

            {/* End Frame */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-300 font-mono">
                  02_end.png 终止帧目标
                </span>
                <button
                  onClick={() => handleCopy(activeShot.promptEnd, 'prompt_end')}
                  className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>复制</span>
                </button>
              </div>
              <div className="p-3 rounded-lg bg-stone-900 border border-stone-800 text-xs font-mono text-stone-300 leading-relaxed">
                {activeShot.promptEnd}
              </div>
            </div>
          </div>

          {/* Scene Motion Prompt */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-stone-300 font-mono">
              运镜与 2.5D 微动描述 (Scene Motion Prompt)
            </span>
            <div className="p-3 rounded-lg bg-stone-900 border border-stone-800 text-xs font-mono text-stone-300 leading-relaxed">
              {activeShot.scenePrompt}
            </div>
          </div>

          {/* Generation Parameters Badge Row */}
          <div className="pt-2 border-t border-stone-800/80 flex flex-wrap items-center gap-4 text-xs text-stone-400 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-stone-500">画幅比:</span>
              <span className="text-stone-200">16:9 (Cinematic)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-stone-500">帧率:</span>
              <span className="text-stone-200">24 fps</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-stone-500">建议时长:</span>
              <span className="text-stone-200">~{activeShot.targetDuration.toFixed(1)} 秒</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-stone-500">候选建议:</span>
              <span className="text-amber-400 font-semibold">2–4 个候选 (Takes)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-stone-500">关键衔接:</span>
              <span className="text-stone-300 font-sans">{activeShot.keyContinuityFocus}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Authentic Dunhuang Mineral Pigment Palette Analyzer */}
      <div className="p-5 rounded-xl bg-stone-950 border border-stone-800 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-serif font-bold text-stone-100">
              敦煌五色矿物颜料色板与色彩锁
            </h3>
          </div>
          <p className="text-xs text-stone-400">
            全片严守敦煌传统工笔重彩五大矿物颜料体系，杜绝现代霓虹感，保留千载氧化褪色的厚重亚光质感。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {MINERAL_PIGMENTS.map((pigment, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-stone-900 border border-stone-800 flex flex-col gap-2.5 group hover:border-stone-700 transition-colors"
            >
              {/* Color Block */}
              <div
                className="w-full h-14 rounded-md shadow-inner border border-white/10 relative flex items-end justify-between p-2"
                style={{ backgroundColor: pigment.hex }}
              >
                <button
                  onClick={() => handleCopy(pigment.hex, `hex_${idx}`)}
                  className="px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-mono text-stone-200 opacity-80 group-hover:opacity-100 hover:bg-black/90 transition-opacity flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedKey === `hex_${idx}` ? '已拷' : pigment.hex}</span>
                </button>
              </div>

              {/* Pigment Information */}
              <div className="flex flex-col gap-1">
                <span className="font-serif font-bold text-xs text-stone-200">
                  {pigment.chineseName}
                </span>
                <span className="text-[10px] text-stone-500 font-mono truncate">
                  {pigment.englishMineral}
                </span>
                <p className="text-[11px] text-stone-400 leading-snug pt-1">
                  {pigment.sceneApplication}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
