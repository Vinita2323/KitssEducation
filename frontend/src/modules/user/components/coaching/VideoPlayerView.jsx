import React, { useRef, useState, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  RotateCw,
  Share2,
  Download,
  CheckCircle2,
  ShieldAlert
} from "lucide-react";
import { useToast } from "../../context/ToastContext";

export const VideoPlayerView = ({
  lecture,
  courseTitle,
  onComplete,
  isCompleted = false
}) => {
  const videoRef = useRef(null);
  const { showSuccess, showInfo } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
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
      setDuration(videoRef.current.duration);
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
      videoRef.current.currentTime += seconds;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="bg-black rounded-2xl overflow-hidden shadow-lg border border-[#0A1D3F] flex flex-col relative group">
      {/* Video Viewport */}
      <div className="relative aspect-16/9 bg-neutral-900 flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          src={lecture?.videoUrl || "/videos/sample-lecture.mp4"}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => {
            setIsPlaying(false);
            if (onComplete) onComplete();
          }}
          className="w-full h-full object-contain cursor-pointer"
          onClick={togglePlay}
          playsInline
          preload="auto"
        />

        {/* Center Big Play Button when paused */}
        {!isPlaying && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#FF8A00] text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform"
            aria-label="Play Lecture"
          >
            <Play className="w-8 h-8 fill-current ml-1" />
          </button>
        )}

        {/* Video Overlays / Security Watermark */}
        <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/60 text-[10px] text-white/70 backdrop-blur-xs font-mono select-none">
          KITSS Protected Stream
        </div>

        {/* Floating Controls Bar at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-2">
          {/* Progress Slider */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-[#FF8A00]"
          />

          <div className="flex items-center justify-between text-white text-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlay}
                className="p-1 hover:text-[#FF8A00] transition"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              </button>

              <button
                type="button"
                onClick={() => skipTime(-10)}
                className="p-1 hover:text-[#FF8A00] transition text-white/80"
                title="Rewind 10s"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => skipTime(10)}
                className="p-1 hover:text-[#FF8A00] transition text-white/80"
                title="Forward 10s"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={toggleMute}
                className="p-1 hover:text-[#FF8A00] transition text-white/80"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <span className="text-[11px] text-white/80 font-mono">
                {formatTime(currentTime)} / {formatTime(duration || 620)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-1 hover:text-[#FF8A00] transition"
                aria-label="Fullscreen"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
