import React, { useState } from 'react';
import { Layers, Eye, Compass, Move, Sparkles } from 'lucide-react';

export const MuralLayerParallax: React.FC = () => {
  const [depthIntensity, setDepthIntensity] = useState<number>(35); // 0 to 100
  const [rotX, setRotX] = useState<number>(8);
  const [rotY, setRotY] = useState<number>(-14);
  const [activeLayer, setActiveLayer] = useState<string>('all');

  const layers = [
    {
      id: 'layer_wall',
      name: 'Layer 1: 古壁地仗层与龟裂 (Wall Plaster & Cracks)',
      zOffset: 0,
      color: 'bg-amber-950/20 border-amber-900/60',
      description: '敦煌崖体泥麦草地仗、白垩土打底与千载风化细碎龟裂纹理，作为空间锚点。',
      thumb: '/assets/frames/v10/start.jpg',
    },
    {
      id: 'layer_mountains',
      name: 'Layer 2: 赭红大地与青绿群山 (Landscape & Peaks)',
      zOffset: 25,
      color: 'bg-emerald-950/20 border-emerald-900/60',
      description: '人大于山、水不容泛的北魏早期山水构图，平涂矿物色块，保持纯粹平面感。',
      thumb: '/assets/frames/v11/start.jpg',
    },
    {
      id: 'layer_figures',
      name: 'Layer 3: 灵鹿与巡狩主体 (Nine-Colored Deer & Figures)',
      zOffset: 55,
      color: 'bg-stone-900/40 border-stone-700/60',
      description: '九色神鹿雪白身躯与国王列骑，铁线勾勒，克制离墙位移（< 15px），杜绝真实立体化。',
      thumb: '/assets/frames/v10/mid.jpg',
    },
    {
      id: 'layer_waves',
      name: 'Layer 4: 湍流浪花与青绿水纹 (River Waves)',
      zOffset: 80,
      color: 'bg-teal-950/20 border-teal-900/60',
      description: '救人动作完成后的单独水纹延伸，如书法笔意般舒展，引导视线走向。',
      thumb: '/assets/frames/v11/end.jpg',
    },
    {
      id: 'layer_ribbons',
      name: 'Layer 5: 青绿飘带与飞天散花 (Ribbons & Clouds)',
      zOffset: 110,
      color: 'bg-cyan-950/20 border-cyan-900/60',
      description: '吴带当风的青绿长绫，在最前层自然舒卷，与水纹无缝咬合，带出飞天神韵。',
      thumb: '/assets/frames/v13/mid.jpg',
    },
  ];

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Intro Header */}
      <div className="p-5 rounded-xl bg-stone-900/60 border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-serif font-bold text-stone-100">
              三、克制 2.5D 离墙运镜深度剖析器 (2.5D Parallax Breakdown)
            </h2>
            <span className="text-xs font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
              反 AI 仙侠 CG 规则
            </span>
          </div>
          <p className="text-xs text-stone-400 leading-relaxed max-w-3xl">
            核心美学规范：进入三兔、九色鹿、飞天段落后，始终保留敦煌壁画的平面造型与矿物颜料。只允许轻微的分层离墙、横卷展开和飘带运动，严禁变成写实3D动物或科幻网游特效。
          </p>
        </div>

        {/* Orbit Angle Controls */}
        <div className="flex items-center gap-3 bg-stone-950 p-2.5 rounded-lg border border-stone-800 shrink-0">
          <div className="flex items-center gap-2 text-xs text-stone-300">
            <Compass className="w-4 h-4 text-amber-400" />
            <span>三维离墙观察角:</span>
            <span className="font-mono text-amber-400">
              Y:{rotY}° X:{rotX}°
            </span>
          </div>
          <button
            onClick={() => {
              setRotX(8);
              setRotY(-14);
              setDepthIntensity(35);
            }}
            className="px-2 py-1 text-[11px] rounded bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800"
          >
            复位基准
          </button>
        </div>
      </div>

      {/* Main 2.5D 3D Spatial Stage & Layer List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive 3D Perspective Stage (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="relative aspect-video w-full bg-stone-950 rounded-xl border border-stone-800 overflow-hidden flex items-center justify-center p-8 select-none">
            {/* 3D Scene Viewport */}
            <div
              className="relative w-4/5 h-4/5 transition-transform duration-100 ease-out"
              style={{
                perspective: '1200px',
                transformStyle: 'preserve-3d',
                transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
              }}
            >
              {layers.map((layer, idx) => {
                const z = (layer.zOffset * (depthIntensity / 50));
                const isFocused = activeLayer === 'all' || activeLayer === layer.id;

                return (
                  <div
                    key={layer.id}
                    onClick={() => setActiveLayer(layer.id)}
                    className={`absolute inset-0 rounded-lg border transition-all duration-200 cursor-pointer overflow-hidden ${
                      isFocused ? 'opacity-100 ring-1 ring-amber-400/50' : 'opacity-20'
                    }`}
                    style={{
                      transform: `translateZ(${z}px)`,
                      transformStyle: 'preserve-3d',
                      boxShadow: isFocused
                        ? `0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 0 15px rgba(245, 158, 11, 0.15)`
                        : 'none',
                    }}
                  >
                    <img
                      src={layer.thumb}
                      alt={layer.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-stone-950/20 hover:bg-transparent transition-colors" />

                    {/* Layer Tag */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-amber-300 border border-stone-700">
                      Layer {idx + 1} · +{Math.round(z)}px
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Orbit Slider Controls inside stage */}
            <div className="absolute bottom-3 left-4 right-4 z-20 flex items-center justify-between bg-stone-900/80 backdrop-blur-md px-3 py-2 rounded-lg border border-stone-800 text-xs text-stone-300">
              <div className="flex items-center gap-3">
                <span className="text-stone-400 text-[11px]">离墙距离拉伸:</span>
                <input
                  type="range"
                  min="0"
                  max="80"
                  value={depthIntensity}
                  onChange={(e) => setDepthIntensity(parseInt(e.target.value, 10))}
                  className="w-32 accent-amber-500 bg-stone-800 rounded appearance-none cursor-pointer"
                />
                <span className="font-mono text-amber-400 text-[11px]">{depthIntensity}%</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRotY((r) => r - 10)}
                  className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 font-mono text-[11px]"
                >
                  ◀ 旋转
                </button>
                <button
                  onClick={() => setRotY((r) => r + 10)}
                  className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 font-mono text-[11px]"
                >
                  旋转 ▶
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Layer Breakdown Hierarchy Cards (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-stone-400 pb-1">
            <span className="font-semibold text-stone-300">壁画 5 重图层分解</span>
            <button
              onClick={() => setActiveLayer('all')}
              className={`text-[11px] hover:underline ${
                activeLayer === 'all' ? 'text-amber-400 font-semibold' : 'text-stone-500'
              }`}
            >
              显示全部图层
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {layers.map((layer) => {
              const isSelected = activeLayer === layer.id;

              return (
                <div
                  key={layer.id}
                  onClick={() => setActiveLayer(layer.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-amber-950/30 border-amber-500 ring-1 ring-amber-500/30'
                      : 'bg-stone-950 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-200">
                      {layer.name}
                    </span>
                    <span className="font-mono text-[10px] text-amber-400">
                      Z: +{layer.zOffset}px
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    {layer.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
