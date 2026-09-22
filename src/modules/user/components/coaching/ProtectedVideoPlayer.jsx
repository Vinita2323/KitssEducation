import React, { useRef, useState, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Gauge,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { ProtectedContentWarning } from "./ProtectedContentWarning";

export const ProtectedVideoPlayer = ({
  lecture,
  courseTitle = "Online Coaching",
  subject = "Science",
  studentName = "Rohan Sharma",
  studentId = "KITSS20261084",
  onLectureComplete,
  isCompleted = false,
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isPrivacyShieldActive, setIsPrivacyShieldActive] = useState(false);

  // Moving watermark coordinates state
  const [watermarkPos, setWatermarkPos] = useState({ top: "12%", left: "10%" });

  // Anti-Screen Recording: Window Blur & Tab Visibility Guard
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === "hidden") {
        if (videoRef.current) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
        setIsPrivacyShieldActive(true);
      }
    };

    const handleWindowBlur = () => {
      // Pause and activate shield when external app or capture tool gets focus
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
      setIsPrivacyShieldActive(true);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    // Screen sharing capture interception
    let originalGetDisplayMedia = null;
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.getDisplayMedia) {
      originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
      navigator.mediaDevices.getDisplayMedia = async function (...args) {
        setIsPrivacyShieldActive(true);
        if (videoRef.current) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
        throw new Error("Screen sharing is restricted for protected coaching lectures.");
      };
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      if (originalGetDisplayMedia && navigator.mediaDevices) {
        navigator.mediaDevices.getDisplayMedia = originalGetDisplayMedia;
      }
    };
  }, []);

  // Periodically change watermark position every 8 seconds across the video canvas
  useEffect(() => {
    const positions = [
      { top: "12%", left: "10%" },
      { top: "15%", left: "65%" },
      { top: "68%", left: "15%" },
      { top: "60%", left: "60%" },
      { top: "40%", left: "40%" },
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % positions.length;
      setWatermarkPos(positions[idx]);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Reset playback on lecture change
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  }, [lecture?.id]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const skipTime = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        0,
        Math.min(duration, videoRef.current.currentTime + seconds)
      );
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const newRate = rates[nextIdx];
    setPlaybackRate(newRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = newRate;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Prevent right click / context menu for protected content experience
  const handleContextMenu = (e) => {
    e.preventDefault();
    return false;
  };

  return (
    <div className="space-y-3">
      {/* Screenshot / Screen-recording Detection Warning Overlay */}
      <ProtectedContentWarning isActive={true} />

      {/* Main Video Viewport Container */}
      <div
        ref={containerRef}
        onContextMenu={handleContextMenu}
        className="relative bg-black rounded-2xl overflow-hidden shadow-xl border border-[#0A1D3F] flex flex-col group select-none"
        style={{ userSelect: "none", WebkitUserSelect: "none" }}
      >
        {/* Aspect Ratio Box */}
        <div className="relative aspect-16/9 bg-neutral-950 flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            src={lecture?.videoUrl || "/videos/sample-lecture.mp4"}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={(e) => {
              if (e.target.src !== window.location.origin + "/videos/sample-lecture.mp4") {
                e.target.src = "/videos/sample-lecture.mp4";
                e.target.load();
              }
            }}
            onEnded={() => {
              setIsPlaying(false);
              if (onLectureComplete) onLectureComplete();
            }}
            className="w-full h-full object-contain cursor-pointer"
            onClick={togglePlay}
            playsInline
            preload="auto"
            controlsList="nodownload noplaybackrate noremoteplayback"
            disablePictureInPicture
          />

          {/* Big Center Play Overlay (when paused) */}
          {!isPlaying && (
            <button
              type="button"
              onClick={togglePlay}
              className="absolute w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#FF8A00] text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform z-20 cursor-pointer"
              aria-label="Play Lecture"
            >
              <Play className="w-8 h-8 fill-current ml-1" />
            </button>
          )}

          {/* Dynamic Moving Student Watermark Overlay */}
          <div
            className="absolute z-20 pointer-events-none transition-all duration-1000 ease-in-out opacity-45 sm:opacity-55"
            style={{ top: watermarkPos.top, left: watermarkPos.left }}
          >
            <div className="bg-black/65 border border-white/20 px-3 py-1 rounded-md text-[10px] sm:text-xs text-white/85 font-mono shadow-md backdrop-blur-xs flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-[#17B26A] animate-pulse" />
              <span>{studentName}</span>
              <span className="text-white/40">|</span>
              <span>{studentId}</span>
            </div>
          </div>

          {/* Fixed Protected Content Badge on Top Left */}
          <div className="absolute top-3 left-3 z-20 pointer-events-none flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-xs text-[11px] text-white/80 border border-white/10">
            <Lock className="w-3 h-3 text-[#FF8A00]" />
            <span className="font-semibold tracking-wide">KITSS DRM Protected</span>
          </div>

          {/* Privacy Shield Overlay (Screen capture / blur protection) */}
          {isPrivacyShieldActive && (
            <div className="absolute inset-0 z-35 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center text-white select-none animate-in fade-in duration-150">
              <div className="w-12 h-12 rounded-2xl bg-[#FF8A00]/20 border border-[#FF8A00]/40 flex items-center justify-center text-[#FF8A00] mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="text-base font-black text-white tracking-tight">
                Protected Video Paused
              </h4>
              <p className="text-xs text-white/70 max-w-sm mt-1 leading-relaxed">
                Video playback is protected against screen recording, capture tools, and background window focus loss.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsPrivacyShieldActive(false);
                  if (videoRef.current) {
                    videoRef.current.play().catch(() => {});
                    setIsPlaying(true);
                  }
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-[#FF8A00] hover:bg-[#E67C00] text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
              >
                Resume Playback
              </button>
            </div>
          )}

          {/* Floating Controls Bar at Bottom */}
          <div className="absolute bottom-0 left-0 right-0 z-30 p-2.5 sm:p-3.5 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex flex-col gap-2 transition-opacity duration-300">
            {/* Scrubber Range Slider */}
            <div className="relative flex items-center">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 sm:h-1.5 bg-white/25 rounded-lg appearance-none cursor-pointer accent-[#FF8A00]"
                aria-label="Video scrubber"
              />
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between text-white text-xs">
              {/* Left Controls: Play/Pause, Rewind, Forward, Time, Mute */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="p-1 hover:text-[#FF8A00] transition active:scale-95 cursor-pointer"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => skipTime(-10)}
                  className="p-1 hover:text-[#FF8A00] transition text-white/80 cursor-pointer"
                  title="Rewind 10 seconds"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => skipTime(10)}
                  className="p-1 hover:text-[#FF8A00] transition text-white/80 cursor-pointer"
                  title="Forward 10 seconds"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                {/* Volume & Mute */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="p-1 hover:text-[#FF8A00] transition text-white/80 cursor-pointer"
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-red-400" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="hidden sm:inline-block w-14 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-[#FF8A00]"
                    aria-label="Volume slider"
                  />
                </div>

                <span className="text-[11px] text-white/80 font-mono tracking-tight ml-1">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              {/* Right Controls: Speed Rate, Mark Complete, Fullscreen (NO DOWNLOAD BUTTON) */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Speed Multiplier Button */}
                <button
                  type="button"
                  onClick={cyclePlaybackRate}
                  className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[11px] font-bold tracking-wide transition flex items-center gap-1 cursor-pointer"
                  title="Playback Speed"
                >
                  <Gauge className="w-3 h-3 text-[#FF8A00]" />
                  <span>{playbackRate}x</span>
                </button>

                {/* Mark Lecture Complete Button */}
                {onLectureComplete && (
                  <button
                    type="button"
                    onClick={onLectureComplete}
                    className={`hidden xs:flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                      isCompleted
                        ? "bg-[#17B26A] text-white"
                        : "bg-white/15 hover:bg-white/25 text-white"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isCompleted ? "Completed" : "Mark Done"}</span>
                  </button>
                )}

                {/* Fullscreen Button */}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="p-1 hover:text-[#FF8A00] transition cursor-pointer"
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? (
                    <Minimize className="w-4 h-4" />
                  ) : (
                    <Maximize className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security notice directly beneath player */}
      <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FFF4E5] border border-[#FF8A00]/30 text-[#0A1D3F] text-xs">
        <ShieldCheck className="w-4 h-4 text-[#FF8A00] shrink-0" />
        <span className="font-medium">
          Video content is protected and available for online viewing only. Single-device access enabled.
        </span>
      </div>
    </div>
  );
};
