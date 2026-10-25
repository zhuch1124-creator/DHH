import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ShotInfo, CandlelightSettings } from '../types/dunhuang';
import { CandlelightOverlay } from './CandlelightOverlay';
import { SceneAnnotationOverlay } from './SceneAnnotationOverlay';
import { soundEngine } from '../utils/soundEngine';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Flame,
  Volume2,
  VolumeX,
  Maximize,
  Layers,
  Sparkles,
  Sliders,
  Compass,
  MessageSquare,
  Music,
  Music2,
  SlidersHorizontal,
  Bell,
  Wind,
} from 'lucide-react';

interface ContinuousPlayerProps {
  shots: ShotInfo[];
  onSelectShot: (shotIndex: number) => void;
  currentShotIndex: number;
  onOpenTakeSwitcher: (shot: ShotInfo) => void;
  candlelightSettings: CandlelightSettings;
  setCandlelightSettings: React.Dispatch<React.SetStateAction<CandlelightSettings>>;
  onOpenContinuityCheck: (transitionId: string) => void;
}

export const ContinuousPlayer: React.FC<ContinuousPlayerProps> = ({
  shots,
  onSelectShot,
  currentShotIndex,
  onOpenTakeSwitcher,
  candlelightSettings,
  setCandlelightSettings,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTimeInShot, setCurrentTimeInShot] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.4);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [showCandleControls, setShowCandleControls] = useState<boolean>(false);
  const [isParallaxActive, setIsParallaxActive] = useState<boolean>(false);
  const [mouseParallax, setMouseParallax] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Subtitle Annotation state
  const [showAnnotation, setShowAnnotation] = useState<boolean>(true);
  const [isAnnotationPinned, setIsAnnotationPinned] = useState<boolean>(false);

  // Audio Channels State (BGM, Cave Ambient, Temple Chimes)
  const [isBgmEnabled, setIsBgmEnabled] = useState<boolean>(soundEngine.getBgmEnabled());
  const [bgmVolume, setBgmVolumeState] = useState<number>(soundEngine.getBgmVolume());
  const [isAmbientEnabled, setIsAmbientEnabled] = useState<boolean>(soundEngine.getAmbientEnabled());
  const [ambientVolume, setAmbientVolumeState] = useState<number>(soundEngine.getAmbientVolume());
  const [isChimesEnabled, setIsChimesEnabled] = useState<boolean>(soundEngine.getChimesEnabled());
  const [showAudioMixer, setShowAudioMixer] = useState<boolean>(false);

  // Subscribe to soundEngine changes
  useEffect(() => {
    return soundEngine.subscribe(() => {
      setIsBgmEnabled(soundEngine.getBgmEnabled());
      setBgmVolumeState(soundEngine.getBgmVolume());
      setIsAmbientEnabled(soundEngine.getAmbientEnabled());
      setAmbientVolumeState(soundEngine.getAmbientVolume());
      setIsChimesEnabled(soundEngine.getChimesEnabled());
      setIsMuted(soundEngine.getIsMuted());
      setVolume(soundEngine.getMasterVolume());
    });
  }, []);

  // Dual Video Buffer Ping-Pong (A/B Seamless Swapping)
  // activeSlot indicates which video element is currently in front and active
  const [activeSlot, setActiveSlot] = useState<'A' | 'B'>('A');
  const [slotAVideoUrl, setSlotAVideoUrl] = useState<string>('');
  const [slotBVideoUrl, setSlotBVideoUrl] = useState<string>('');

  const videoRefA = useRef<HTMLVideoElement | null>(null);
  const videoRefB = useRef<HTMLVideoElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const isTransitioningRef = useRef<boolean>(false);
  const annotationTimerRef = useRef<number | null>(null);

  const currentShot = shots[currentShotIndex] || shots[0];
  const activeTake =
    currentShot.takes.find((t) => t.id === currentShot.selectedTakeId) ||
    currentShot.takes[0];

  const nextShotIndex = currentShotIndex + 1 < shots.length ? currentShotIndex + 1 : 0;
  const nextShot = shots[nextShotIndex];
  const nextTake =
    nextShot.takes.find((t) => t.id === nextShot.selectedTakeId) ||
    nextShot.takes[0];

  // Calculate cumulative timestamps for all 9 shots
  const shotOffsets = shots.map((_, i) => {
    let offset = 0;
    for (let j = 0; j < i; j++) {
      const take =
        shots[j].takes.find((t) => t.id === shots[j].selectedTakeId) ||
        shots[j].takes[0];
      offset += take.duration;
    }
    return offset;
  });

  const totalDuration = shots.reduce((acc, s) => {
    const take = s.takes.find((t) => t.id === s.selectedTakeId) || s.takes[0];
    return acc + take.duration;
  }, 0);

  const globalCurrentTime =
    (shotOffsets[currentShotIndex] || 0) + currentTimeInShot;

  // Initialize and synchronize video URLs for slots A and B
  useEffect(() => {
    if (activeSlot === 'A') {
      setSlotAVideoUrl(activeTake.videoUrl);
      if (currentShotIndex + 1 < shots.length) {
        setSlotBVideoUrl(nextTake.videoUrl);
      }
    } else {
      setSlotBVideoUrl(activeTake.videoUrl);
      if (currentShotIndex + 1 < shots.length) {
        setSlotAVideoUrl(nextTake.videoUrl);
      }
    }
  }, [currentShotIndex, activeTake.videoUrl, nextTake.videoUrl, activeSlot, shots.length]);

  // Subtitle Annotation display trigger when entering new scene
  useEffect(() => {
    setShowAnnotation(true);
    if (annotationTimerRef.current) {
      window.clearTimeout(annotationTimerRef.current);
    }
    if (!isAnnotationPinned) {
      // Show for 3.6 seconds, then gently fade out
      annotationTimerRef.current = window.setTimeout(() => {
        setShowAnnotation(false);
      }, 3600);
    }
    return () => {
      if (annotationTimerRef.current) {
        window.clearTimeout(annotationTimerRef.current);
      }
    };
  }, [currentShotIndex, isAnnotationPinned]);

  // Seamless transition handler without black frame cut
  const triggerSeamlessTransition = useCallback(
    (toIndex: number) => {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;

      const activeVid = activeSlot === 'A' ? videoRefA.current : videoRefB.current;
      const standbyVid = activeSlot === 'A' ? videoRefB.current : videoRefA.current;
      const nextSlot = activeSlot === 'A' ? 'B' : 'A';

      const targetShot = shots[toIndex];
      const targetTake =
        targetShot.takes.find((t) => t.id === targetShot.selectedTakeId) ||
        targetShot.takes[0];

      if (standbyVid) {
        standbyVid.src = targetTake.videoUrl;
        standbyVid.currentTime = 0;
        standbyVid.playbackRate = playbackRate;

        // Play the standby video immediately
        standbyVid
          .play()
          .then(() => {
            // Swap active slot so standby fades in seamlessly over active
            setActiveSlot(nextSlot);
            onSelectShot(toIndex);
            setCurrentTimeInShot(0);
            soundEngine.playBowlChime(432);

            setTimeout(() => {
              if (activeVid) {
                activeVid.pause();
                activeVid.currentTime = 0;
              }
              isTransitioningRef.current = false;
            }, 300);
          })
          .catch(() => {
            // Fallback if browser requires user gesture
            setActiveSlot(nextSlot);
            onSelectShot(toIndex);
            isTransitioningRef.current = false;
          });
      } else {
        onSelectShot(toIndex);
        isTransitioningRef.current = false;
      }
    },
    [activeSlot, shots, playbackRate, onSelectShot]
  );

  // Monitor playback time and trigger seamless swap near end
  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const vid = e.currentTarget;
    const currentT = vid.currentTime;
    setCurrentTimeInShot(currentT);

    // When within 0.12s of end and playing, trigger seamless crossfade to next shot
    if (
      isPlaying &&
      vid.duration > 0 &&
      currentT >= vid.duration - 0.15 &&
      !isTransitioningRef.current
    ) {
      if (currentShotIndex < shots.length - 1) {
        triggerSeamlessTransition(currentShotIndex + 1);
      }
    }
  };

  // When active video reaches 'ended'
  const handleVideoEnded = () => {
    if (currentShotIndex < shots.length - 1) {
      if (!isTransitioningRef.current) {
        triggerSeamlessTransition(currentShotIndex + 1);
      }
    } else {
      setIsPlaying(false);
      setCurrentTimeInShot(0);
    }
  };

  // Sync isPlaying state to active video element & BGM audio
  useEffect(() => {
    const activeVid = activeSlot === 'A' ? videoRefA.current : videoRefB.current;
    if (!activeVid) return;

    if (isPlaying) {
      soundEngine.startAmbient();
      soundEngine.startBgm();
      activeVid.play().catch(() => {
        setIsPlaying(false);
      });
    } else {
      activeVid.pause();
      soundEngine.pauseBgm();
    }
  }, [isPlaying, activeSlot]);

  // Keep playbackRate in sync
  useEffect(() => {
    if (videoRefA.current) videoRefA.current.playbackRate = playbackRate;
    if (videoRefB.current) videoRefB.current.playbackRate = playbackRate;
  }, [playbackRate]);

  const togglePlay = () => {
    if (!isPlaying) {
      soundEngine.startAmbient();
      soundEngine.startBgm();
      setIsPlaying(true);
    } else {
      soundEngine.pauseBgm();
      setIsPlaying(false);
    }
  };

  const handlePrevShot = () => {
    if (currentShotIndex > 0) {
      triggerSeamlessTransition(currentShotIndex - 1);
    }
  };

  const handleNextShot = () => {
    if (currentShotIndex < shots.length - 1) {
      triggerSeamlessTransition(currentShotIndex + 1);
    }
  };

  const handleReplayFullFilm = () => {
    triggerSeamlessTransition(0);
    soundEngine.seekBgm(0);
    soundEngine.startBgm();
    setIsPlaying(true);
  };

  const handleFrameStep = (deltaFrames: number) => {
    const activeVid = activeSlot === 'A' ? videoRefA.current : videoRefB.current;
    if (!activeVid) return;
    activeVid.pause();
    setIsPlaying(false);
    const fps = 24;
    const newTime = Math.max(
      0,
      Math.min(activeTake.duration, activeVid.currentTime + deltaFrames / fps)
    );
    activeVid.currentTime = newTime;
    setCurrentTimeInShot(newTime);
  };

  const handleGlobalScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetGlobalTime = clickRatio * totalDuration;

    let acc = 0;
    for (let i = 0; i < shots.length; i++) {
      const take =
        shots[i].takes.find((t) => t.id === shots[i].selectedTakeId) ||
        shots[i].takes[0];
      if (targetGlobalTime <= acc + take.duration || i === shots.length - 1) {
        const shotLocalTime = targetGlobalTime - acc;
        if (i !== currentShotIndex) {
          triggerSeamlessTransition(i);
        }
        const activeVid = activeSlot === 'A' ? videoRefA.current : videoRefB.current;
        if (activeVid) {
          activeVid.currentTime = shotLocalTime;
        }
        setCurrentTimeInShot(shotLocalTime);
        break;
      }
      acc += take.duration;
    }
  };

  const handleToggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleMouseMoveParallax = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isParallaxActive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMouseParallax({ x, y });
  };

  const formatTimecode = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 24);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
  };

  const isCaveReality = currentShot.shotNumber <= 3;

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Cinematic Viewport Container */}
      <div
        ref={playerContainerRef}
        onMouseMove={handleMouseMoveParallax}
        className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-stone-800 shadow-2xl group select-none"
      >
        {/* Dual Video Buffer Layer (100% Zero-Black Seamless Crossfade Ping-Pong) */}
        <div
          className="relative w-full h-full transition-transform duration-200 ease-out"
          style={
            isParallaxActive
              ? {
                  transform: `perspective(1000px) rotateY(${mouseParallax.x * 6}deg) rotateX(${
                    -mouseParallax.y * 6
                  }deg) scale3d(1.02, 1.02, 1.02)`,
                }
              : undefined
          }
        >
          {/* Video Player A */}
          <video
            ref={videoRefA}
            src={slotAVideoUrl || undefined}
            playsInline
            muted
            preload="auto"
            onTimeUpdate={activeSlot === 'A' ? handleTimeUpdate : undefined}
            onEnded={activeSlot === 'A' ? handleVideoEnded : undefined}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ease-in-out ${
              activeSlot === 'A'
                ? 'opacity-100 z-10'
                : 'opacity-0 z-0 pointer-events-none'
            }`}
          />

          {/* Video Player B */}
          <video
            ref={videoRefB}
            src={slotBVideoUrl || undefined}
            playsInline
            muted
            preload="auto"
            onTimeUpdate={activeSlot === 'B' ? handleTimeUpdate : undefined}
            onEnded={activeSlot === 'B' ? handleVideoEnded : undefined}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ease-in-out ${
              activeSlot === 'B'
                ? 'opacity-100 z-10'
                : 'opacity-0 z-0 pointer-events-none'
            }`}
          />

          {/* Programmatic Interactive Candlelight Overlay ("持烛照壁") */}
          <CandlelightOverlay
            settings={candlelightSettings}
            isCaveExploring={isCaveReality}
          />

          {/* 2.5D Parallax Floating Depth Particles */}
          {isParallaxActive && (
            <div
              className="absolute inset-0 pointer-events-none z-20 transition-transform duration-100 ease-out"
              style={{
                transform: `translateX(${mouseParallax.x * -25}px) translateY(${mouseParallax.y * -25}px)`,
              }}
            >
              <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-200/5 via-transparent to-transparent" />
            </div>
          )}

          {/* Scene Subtitle Annotation (每一幕前字幕注释 · 参考图样式) */}
          <SceneAnnotationOverlay
            annotation={currentShot.annotation}
            visible={showAnnotation}
            isPinned={isAnnotationPinned}
            onTogglePin={() => setIsAnnotationPinned(!isAnnotationPinned)}
          />
        </div>

        {/* Top Floating HUD: Shot Meta & Aesthetic Phase */}
        <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-950/85 backdrop-blur-md border border-stone-800 text-stone-200 pointer-events-auto shadow-md">
              <span className="font-mono text-amber-500 font-semibold text-xs tracking-wider">
                {currentShot.id}
              </span>
              <span className="text-stone-600 text-xs font-mono">/</span>
              <span className="text-xs font-medium text-stone-200 font-serif">
                {currentShot.name}
              </span>
              <span className="text-stone-600 text-xs font-mono">·</span>
              <span className="text-[11px] text-stone-400 font-sans">
                {currentShot.caveSection}
              </span>
            </div>

            {/* Aesthetic Ratio Tag */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-900/80 backdrop-blur-md border border-stone-800/80 text-[11px] text-stone-400 pointer-events-auto">
              <Compass className="w-3.5 h-3.5 text-stone-500" />
              <span>{currentShot.aestheticRatio}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Exhibition Spotlight Preset (展厅同款照见) */}
            <button
              onClick={() => {
                setCandlelightSettings((prev) => ({
                  ...prev,
                  enabled: true,
                  mode: prev.mode === 'spotlight' ? 'cursor' : 'spotlight',
                  radius: 260,
                  intensity: 0.85,
                }));
              }}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all backdrop-blur-md ${
                candlelightSettings.enabled && candlelightSettings.mode === 'spotlight'
                  ? 'bg-amber-600/30 border-amber-500/80 text-amber-300'
                  : 'bg-stone-950/80 border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
              title="切换为展厅同款中心聚光照见模式 (参考图同款)"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>展厅聚光</span>
            </button>

            {/* Subtitle Pin/Toggle Button */}
            <button
              onClick={() => {
                if (!showAnnotation && !isAnnotationPinned) {
                  setShowAnnotation(true);
                } else {
                  setIsAnnotationPinned(!isAnnotationPinned);
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all backdrop-blur-md ${
                isAnnotationPinned
                  ? 'bg-amber-500/20 border-amber-500/80 text-amber-300'
                  : 'bg-stone-950/80 border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
              title="切换幕前字幕注释常驻显示"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{isAnnotationPinned ? '字幕常驻' : '幕前注释'}</span>
            </button>

            {/* Candidate Take Indicator & Switcher */}
            {currentShot.takes.length > 1 && (
              <button
                onClick={() => onOpenTakeSwitcher(currentShot)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-950/70 hover:bg-amber-900/80 text-amber-300 border border-amber-700/60 text-xs font-medium transition-all shadow-sm"
                title="切换当前镜头候选版本 (Candidate Takes)"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{currentShot.takes.length} 个候选</span>
              </button>
            )}

            {/* Parallax Toggle */}
            <button
              onClick={() => setIsParallaxActive(!isParallaxActive)}
              className={`p-2 rounded-lg border text-xs transition-colors backdrop-blur-md ${
                isParallaxActive
                  ? 'bg-amber-600/30 border-amber-500/80 text-amber-300'
                  : 'bg-stone-950/70 border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
              title="2.5D 壁画离墙视差观察"
            >
              <Layers className="w-4 h-4" />
            </button>

            {/* Candlelight Quick Toggle */}
            <button
              onClick={() =>
                setCandlelightSettings((prev) => ({ ...prev, enabled: !prev.enabled }))
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all backdrop-blur-md ${
                candlelightSettings.enabled
                  ? 'bg-amber-500/20 border-amber-500/80 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'bg-stone-950/80 border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
              title="切换交互烛光照见层 (Interactive Torchlight)"
            >
              <Flame
                className={`w-4 h-4 ${
                  candlelightSettings.enabled ? 'text-amber-400 fill-amber-400' : 'text-stone-500'
                }`}
              />
              <span>{candlelightSettings.enabled ? '烛光照见 开' : '烛光照见 关'}</span>
            </button>
          </div>
        </div>

        {/* Center Big Play Button Overlay on Pause */}
        {!isPlaying && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-[2px] cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-stone-900/90 border border-stone-700/80 flex items-center justify-center text-amber-300 shadow-2xl hover:scale-105 transition-transform">
              <Play className="w-7 h-7 fill-amber-400 translate-x-0.5" />
            </div>
          </div>
        )}

        {/* Bottom Floating Control Bar */}
        <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-stone-950 via-stone-950/90 to-transparent pt-8 pb-3 px-4 flex flex-col gap-2">
          {/* Timeline Multi-segment Bar (9 Shots) */}
          <div
            onClick={handleGlobalScrub}
            className="relative w-full h-3 bg-stone-900/90 rounded-full cursor-pointer overflow-hidden border border-stone-800 flex items-center"
          >
            {shots.map((shot, idx) => {
              const take =
                shot.takes.find((t) => t.id === shot.selectedTakeId) ||
                shot.takes[0];
              const shotWidthPercent = (take.duration / totalDuration) * 100;
              const isCurrent = idx === currentShotIndex;

              return (
                <div
                  key={shot.id}
                  style={{ width: `${shotWidthPercent}%` }}
                  className={`relative h-full border-r border-stone-800/80 transition-colors ${
                    isCurrent ? 'bg-amber-950/40' : 'hover:bg-stone-800/50'
                  }`}
                  title={`${shot.id}: ${shot.name} (${take.duration.toFixed(1)}s)`}
                />
              );
            })}

            {/* Global Playhead Progress Bar */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-amber-700 to-amber-500 pointer-events-none opacity-85 transition-[width] duration-75"
              style={{
                width: `${Math.min(100, (globalCurrentTime / totalDuration) * 100)}%`,
              }}
            />
          </div>

          {/* Primary Playback Controls Row */}
          <div className="flex items-center justify-between text-stone-300">
            {/* Left Controls: Play, Step, Replay */}
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="p-2 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-100 transition-colors"
                title={isPlaying ? '暂停 (Space)' : '播放全片 (Space)'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              </button>

              <button
                onClick={handlePrevShot}
                disabled={currentShotIndex === 0}
                className="p-2 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="上一镜 ([)"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={handleNextShot}
                disabled={currentShotIndex === shots.length - 1}
                className="p-2 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="下一镜 (])"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={handleReplayFullFilm}
                className="p-2 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors"
                title="重播全片 (约41秒)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* 24fps Single Frame Step */}
              <div className="hidden sm:flex items-center gap-1 border-l border-stone-800 pl-2">
                <button
                  onClick={() => handleFrameStep(-1)}
                  className="px-2 py-1 rounded bg-stone-900 hover:bg-stone-800 text-[11px] font-mono text-stone-400 hover:text-stone-200"
                  title="后退一帧 (1/24s)"
                >
                  -1 帧
                </button>
                <button
                  onClick={() => handleFrameStep(1)}
                  className="px-2 py-1 rounded bg-stone-900 hover:bg-stone-800 text-[11px] font-mono text-stone-400 hover:text-stone-200"
                  title="前进一帧 (1/24s)"
                >
                  +1 帧
                </button>
              </div>

              {/* Timecode */}
              <div className="flex items-center gap-1 text-xs font-mono text-stone-400 ml-2">
                <span className="text-amber-400 font-semibold">{formatTimecode(globalCurrentTime)}</span>
                <span className="text-stone-600">/</span>
                <span>{formatTimecode(totalDuration)}</span>
                <span className="text-[10px] text-stone-500 uppercase ml-1">无缝衔接 · 24fps</span>
              </div>
            </div>

            {/* Right Controls: Speed, Audio, Candlelight Settings, Fullscreen */}
            <div className="flex items-center gap-2">
              {/* Speed Selector */}
              <div className="hidden sm:flex items-center gap-1 text-xs font-mono text-stone-400 bg-stone-900/80 p-0.5 rounded-lg border border-stone-800">
                {[0.5, 1.0, 1.25].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setPlaybackRate(rate)}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                      playbackRate === rate
                        ? 'bg-amber-600/40 text-amber-300 font-medium'
                        : 'hover:text-stone-200'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              {/* BGM Channel Quick Toggle Icon (HGNNNN - Meiyo to Songen) */}
              <button
                onClick={() => soundEngine.toggleBgm()}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  isBgmEnabled
                    ? 'bg-amber-500/20 border-amber-500/80 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                    : 'bg-stone-900/80 border-stone-800 text-stone-500 hover:text-stone-300'
                }`}
                title={
                  isBgmEnabled
                    ? '点击关闭配乐通道 (BGM: HGNNNN - Meiyo to Songen)'
                    : '点击开启配乐通道 (BGM: HGNNNN - Meiyo to Songen)'
                }
              >
                {isBgmEnabled ? (
                  <Music className="w-4 h-4 text-amber-400 animate-pulse" />
                ) : (
                  <Music2 className="w-4 h-4 text-stone-500 line-through" />
                )}
                <span className="hidden lg:inline text-[11px] font-medium font-serif">
                  {isBgmEnabled ? 'BGM 开' : 'BGM 关'}
                </span>
              </button>

              {/* Multi-Channel Audio Mixer Console Toggle */}
              <button
                onClick={() => setShowAudioMixer(!showAudioMixer)}
                className={`p-2 rounded-lg border text-xs transition-colors ${
                  showAudioMixer
                    ? 'bg-amber-950/60 border-amber-600/70 text-amber-300'
                    : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
                title="打开多通道音频混音台 (BGM/环境音/佛磬独立控制)"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>

              {/* Master Volume Slider */}
              <div className="flex items-center gap-1 bg-stone-900/80 px-2 py-1 rounded-lg border border-stone-800">
                <button
                  onClick={() => soundEngine.toggleMute()}
                  className="text-stone-400 hover:text-amber-300 transition-colors"
                  title={isMuted ? '解除静音' : '全部静音'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-stone-600" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setVolume(v);
                    soundEngine.setMasterVolume(v);
                  }}
                  className="w-14 h-1 accent-amber-500 bg-stone-800 rounded appearance-none cursor-pointer"
                  title="全局主音量"
                />
              </div>

              {/* Candle Settings Drawer Toggle */}
              <button
                onClick={() => setShowCandleControls(!showCandleControls)}
                className={`p-2 rounded-lg border text-xs transition-colors ${
                  showCandleControls
                    ? 'bg-amber-950/60 border-amber-600/70 text-amber-300'
                    : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
                title="微调持烛照壁参数"
              >
                <Sliders className="w-4 h-4" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={handleToggleFullscreen}
                className="p-2 rounded-lg bg-stone-900/80 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-stone-200 transition-colors"
                title="全屏模式"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Multi-Channel Audio Mixer Console */}
      {showAudioMixer && (
        <div className="w-full p-4 rounded-xl bg-stone-950 border border-stone-800 flex flex-col gap-4 text-xs text-stone-300 animate-in fade-in duration-150 shadow-xl">
          <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-stone-100 text-sm font-serif">
                莫高窟多通道音频混音台 · 独立音轨控制
              </span>
              <span className="text-stone-500 hidden sm:inline">
                (支持独立开关配乐BGM、地宫穴鸣、佛磬梵音通道)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => soundEngine.toggleBgm()}
                className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors border ${
                  isBgmEnabled
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                    : 'bg-stone-900 text-stone-400 border-stone-800'
                }`}
              >
                {isBgmEnabled ? <Music className="w-3.5 h-3.5" /> : <Music2 className="w-3.5 h-3.5" />}
                <span>{isBgmEnabled ? 'BGM通道运行中' : 'BGM通道已关闭'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Channel 1: BGM (HGNNNN - Meiyo to Songen) */}
            <div className="p-3.5 rounded-lg bg-stone-900/70 border border-amber-800/50 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-300 font-semibold font-serif">
                  <Music className="w-4 h-4 text-amber-400" />
                  <span>配乐 BGM 通道</span>
                </div>
                <button
                  onClick={() => soundEngine.toggleBgm()}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-colors border ${
                    isBgmEnabled
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                      : 'bg-rose-950/80 text-rose-300 border-rose-700/60'
                  }`}
                >
                  {isBgmEnabled ? '通道开启' : '通道关闭'}
                </button>
              </div>

              <div className="text-[11px] text-stone-400 font-mono truncate">
                曲目: HGNNNN - Meiyo to Songen
              </div>

              <div className="flex flex-col gap-1 pt-1">
                <div className="flex justify-between text-stone-400 text-[11px]">
                  <span>通道推子音量</span>
                  <span className="font-mono text-amber-400">{Math.round(bgmVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={bgmVolume}
                  onChange={(e) => {
                    soundEngine.setBgmVolume(parseFloat(e.target.value));
                  }}
                  className="w-full accent-amber-500 bg-stone-800 rounded appearance-none cursor-pointer"
                />
              </div>

              <p className="text-[10px] text-stone-500 leading-snug">
                179秒原曲音轨，循环伴随全片流转，随时可单独一键静音关闭。
              </p>
            </div>

            {/* Channel 2: Cave Subterranean Ambient */}
            <div className="p-3.5 rounded-lg bg-stone-900/70 border border-stone-800 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-stone-200 font-semibold font-serif">
                  <Wind className="w-4 h-4 text-cyan-400" />
                  <span>洞窟低频穴鸣</span>
                </div>
                <button
                  onClick={() => soundEngine.toggleAmbient()}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-colors border ${
                    isAmbientEnabled
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                      : 'bg-stone-900 text-stone-500 border-stone-800'
                  }`}
                >
                  {isAmbientEnabled ? '通道开启' : '通道关闭'}
                </button>
              </div>

              <div className="text-[11px] text-stone-400 font-mono">
                54.8Hz 地宫次声波谐振
              </div>

              <div className="flex flex-col gap-1 pt-1">
                <div className="flex justify-between text-stone-400 text-[11px]">
                  <span>通道推子音量</span>
                  <span className="font-mono text-cyan-400">{Math.round(ambientVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={ambientVolume}
                  onChange={(e) => {
                    soundEngine.setAmbientVolume(parseFloat(e.target.value));
                  }}
                  className="w-full accent-cyan-500 bg-stone-800 rounded appearance-none cursor-pointer"
                />
              </div>

              <p className="text-[10px] text-stone-500 leading-snug">
                实时物理合成莫高窟窟壁共振声场与大漠轻风。
              </p>
            </div>

            {/* Channel 3: Temple Chimes */}
            <div className="p-3.5 rounded-lg bg-stone-900/70 border border-stone-800 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-stone-200 font-semibold font-serif">
                  <Bell className="w-4 h-4 text-amber-300" />
                  <span>转场铜磬梵音</span>
                </div>
                <button
                  onClick={() => soundEngine.toggleChimes()}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-colors border ${
                    isChimesEnabled
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                      : 'bg-stone-900 text-stone-500 border-stone-800'
                  }`}
                >
                  {isChimesEnabled ? '通道开启' : '通道关闭'}
                </button>
              </div>

              <div className="text-[11px] text-stone-400 font-mono">
                432Hz 非整数倍金属泛音
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => soundEngine.playBowlChime(432)}
                  className="px-3 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs flex items-center gap-1.5 transition-colors border border-stone-700"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>鸣磬试听</span>
                </button>
                <span className="text-[10px] text-stone-500">
                  {isChimesEnabled ? '切镜时鸣响' : '已静音'}
                </span>
              </div>

              <p className="text-[10px] text-stone-500 leading-snug">
                每一镜切换或抵达重要时空转折时鸣响。
              </p>
            </div>

            {/* Channel 4: Master Bus */}
            <div className="p-3.5 rounded-lg bg-stone-900/70 border border-stone-800 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-stone-200 font-semibold font-serif">
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span>全局总线输出</span>
                </div>
                <button
                  onClick={() => soundEngine.toggleMute()}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-colors border ${
                    !isMuted
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                      : 'bg-rose-950/80 text-rose-300 border-rose-700/60'
                  }`}
                >
                  {!isMuted ? '正常输出' : '已全静音'}
                </button>
              </div>

              <div className="text-[11px] text-stone-400 font-mono">
                Master Gain Bus
              </div>

              <div className="flex flex-col gap-1 pt-1">
                <div className="flex justify-between text-stone-400 text-[11px]">
                  <span>主推子总电平</span>
                  <span className="font-mono text-emerald-400">
                    {isMuted ? 'Muted' : `${Math.round(volume * 100)}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setVolume(v);
                    soundEngine.setMasterVolume(v);
                  }}
                  className="w-full accent-emerald-500 bg-stone-800 rounded appearance-none cursor-pointer"
                />
              </div>

              <p className="text-[10px] text-stone-500 leading-snug">
                控制全站所有声轨的最终总电平输出。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expandable Candlelight Fine-Tuning Console */}
      {showCandleControls && (
        <div className="w-full p-4 rounded-xl bg-stone-950 border border-stone-800 flex flex-col gap-4 text-xs text-stone-300 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-stone-200 text-sm">
                程序化交互烛光系统 · 照见参数配置
              </span>
              <span className="text-stone-500">
                (遵循规则：S05后壁画无烘焙烛光，完全由本程序层动态照亮)
              </span>
            </div>
            <button
              onClick={() => soundEngine.playBowlChime(528)}
              className="px-3 py-1 rounded-md bg-stone-900 hover:bg-stone-800 text-amber-400 border border-stone-700 flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>敲响佛罄鸣响 (432Hz)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Illumination Radius */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-stone-400">
                <span>照见光晕半径</span>
                <span className="font-mono text-amber-400">{candlelightSettings.radius}px</span>
              </div>
              <input
                type="range"
                min="140"
                max="450"
                step="10"
                value={candlelightSettings.radius}
                onChange={(e) =>
                  setCandlelightSettings((prev) => ({
                    ...prev,
                    radius: parseInt(e.target.value, 10),
                  }))
                }
                className="w-full accent-amber-500 bg-stone-900 rounded appearance-none cursor-pointer"
              />
            </div>

            {/* Light Intensity */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-stone-400">
                <span>核心照度强度</span>
                <span className="font-mono text-amber-400">
                  {Math.round(candlelightSettings.intensity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={candlelightSettings.intensity}
                onChange={(e) =>
                  setCandlelightSettings((prev) => ({
                    ...prev,
                    intensity: parseFloat(e.target.value),
                  }))
                }
                className="w-full accent-amber-500 bg-stone-900 rounded appearance-none cursor-pointer"
              />
            </div>

            {/* Illumination Mode */}
            <div className="flex flex-col gap-1.5">
              <span className="text-stone-400">持烛照见模式</span>
              <div className="grid grid-cols-3 gap-1 p-0.5 bg-stone-900 rounded-lg border border-stone-800">
                {(['cursor', 'ambient', 'spotlight'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() =>
                      setCandlelightSettings((prev) => ({ ...prev, mode }))
                    }
                    className={`py-1 text-center rounded text-[11px] font-medium transition-colors ${
                      candlelightSettings.mode === mode
                        ? 'bg-amber-600/40 text-amber-300'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {mode === 'cursor' ? '游标随行' : mode === 'ambient' ? '慢速巡照' : '中央聚焦'}
                  </button>
                ))}
              </div>
            </div>

            {/* Flame Flicker Speed & Toggles */}
            <div className="flex flex-col gap-2">
              <span className="text-stone-400">烛火律动与微尘</span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer text-stone-300">
                  <input
                    type="checkbox"
                    checked={candlelightSettings.dustMotes}
                    onChange={(e) =>
                      setCandlelightSettings((prev) => ({ ...prev, dustMotes: e.target.checked }))
                    }
                    className="accent-amber-500 rounded"
                  />
                  <span>悬浮矿物浮尘</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-stone-300">
                  <input
                    type="checkbox"
                    checked={candlelightSettings.revealTexture}
                    onChange={(e) =>
                      setCandlelightSettings((prev) => ({
                        ...prev,
                        revealTexture: e.target.checked,
                      }))
                    }
                    className="accent-amber-500 rounded"
                  />
                  <span>显露裂纹微芒</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9-Shot Horizontal Sequence Rail */}
      <div className="w-full flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-stone-400">
          <span className="font-semibold text-stone-200 tracking-wide uppercase font-serif">
            全片 9 镜连续时空序列 (41秒 · 无黑屏无缝流转)
          </span>
          <span className="text-stone-500 text-[11px]">
            双缓冲无缝切镜机制 · 当前激活：{activeSlot === 'A' ? '缓冲A' : '缓冲B'} · 点击任一镜头即刻平滑过渡
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
          {shots.map((shot, idx) => {
            const isSelected = idx === currentShotIndex;
            const take =
              shot.takes.find((t) => t.id === shot.selectedTakeId) ||
              shot.takes[0];

            return (
              <div
                key={shot.id}
                onClick={() => {
                  triggerSeamlessTransition(idx);
                }}
                className={`relative flex flex-col rounded-lg overflow-hidden border cursor-pointer transition-all group ${
                  isSelected
                    ? 'border-amber-500 shadow-md ring-1 ring-amber-500/50 bg-stone-900'
                    : 'border-stone-800 bg-stone-950 hover:border-stone-700'
                }`}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-full bg-stone-900 overflow-hidden">
                  <img
                    src={shot.startFrameThumb}
                    alt={shot.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 font-mono text-[10px] text-amber-400 font-semibold">
                    {shot.annotation.index}
                  </div>
                  <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 font-mono text-[9px] text-stone-300">
                    {take.duration.toFixed(1)}s
                  </div>
                </div>

                {/* Meta details */}
                <div className="p-1.5 flex flex-col gap-0.5">
                  <span className="text-[11px] font-medium text-stone-200 truncate font-serif">
                    {shot.annotation.title}
                  </span>
                  <span className="text-[10px] text-stone-500 truncate font-sans">
                    {shot.name.split('·')[0]}
                  </span>
                </div>

                {/* Active Indicator Bar */}
                {isSelected && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
