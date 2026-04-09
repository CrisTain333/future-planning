"use client";

import { useEffect, useRef } from "react";
import { MicOff, VideoOff } from "lucide-react";

interface Participant {
  peerId: string;
  name: string;
  stream: MediaStream | null;
  isMuted?: boolean;
  isCameraOff?: boolean;
}

interface ParticipantGridProps {
  participants: Participant[];
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  localName: string;
  localIsMuted?: boolean;
  localIsCameraOff?: boolean;
}

function VideoTile({
  stream,
  name,
  isMuted,
  isCameraOff,
  isLocal,
  isScreen,
  className = "",
}: {
  stream: MediaStream | null;
  name: string;
  isMuted?: boolean;
  isCameraOff?: boolean;
  isLocal?: boolean;
  isScreen?: boolean;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const showVideo = stream && !isCameraOff;

  return (
    <div className={`relative bg-gray-800 rounded-xl overflow-hidden flex items-center justify-center ${className}`}>
      {/* Video or avatar fallback */}
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover ${isLocal && !isScreen ? "scale-x-[-1]" : ""}`}
        />
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="h-20 w-20 rounded-full bg-gray-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {name.charAt(0).toUpperCase()}
          </div>
          {isCameraOff && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-700/80 text-gray-300 text-xs">
              <VideoOff className="h-3 w-3" />
              Camera off
            </div>
          )}
        </div>
      )}

      {/* Hidden video element to keep stream active even when camera is "off" visually */}
      {stream && isCameraOff && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="hidden"
        />
      )}

      {/* Bottom name badge */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 text-white text-xs backdrop-blur-sm">
        {isMuted && <MicOff className="h-3 w-3 text-red-400" />}
        <span>{name}{isLocal && " (You)"}{isScreen && " - Screen"}</span>
      </div>

      {/* Top-right indicators */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        {isMuted && (
          <div className="p-1.5 rounded-lg bg-red-500/90 shadow-sm">
            <MicOff className="h-3.5 w-3.5 text-white" />
          </div>
        )}
        {isCameraOff && showVideo === false && stream && (
          <div className="p-1.5 rounded-lg bg-gray-600/90 shadow-sm">
            <VideoOff className="h-3.5 w-3.5 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

export function ParticipantGrid({
  participants,
  localStream,
  screenStream,
  localName,
  localIsMuted,
  localIsCameraOff,
}: ParticipantGridProps) {
  const is1on1 = participants.length <= 1 && !screenStream;

  // 1-on-1: large remote + small PiP local
  if (is1on1) {
    const remote = participants[0];
    return (
      <div className="flex-1 relative min-h-0">
        {/* Large: remote person */}
        {remote ? (
          <VideoTile
            stream={remote.stream}
            name={remote.name}
            isMuted={remote.isMuted}
            isCameraOff={remote.isCameraOff}
            className="absolute inset-0 rounded-none"
          />
        ) : (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <div className="h-24 w-24 rounded-full bg-gray-700 flex items-center justify-center text-white text-3xl font-bold">
              ?
            </div>
          </div>
        )}

        {/* Small PiP: local camera */}
        <div className="absolute bottom-4 right-4 w-32 h-24 md:w-44 md:h-32 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700 z-10">
          <VideoTile
            stream={localStream}
            name={localName}
            isLocal
            isMuted={localIsMuted}
            isCameraOff={localIsCameraOff}
            className="h-full w-full rounded-none"
          />
        </div>
      </div>
    );
  }

  // Group call: grid layout
  const totalTiles = participants.length + 1 + (screenStream ? 1 : 0);
  const gridClass =
    totalTiles <= 2
      ? "grid-cols-2"
      : totalTiles <= 4
        ? "grid-cols-2 grid-rows-2"
        : totalTiles <= 6
          ? "grid-cols-3 grid-rows-2"
          : "grid-cols-4 grid-rows-3";

  return (
    <div className={`flex-1 grid ${gridClass} gap-2 p-2`}>
      {screenStream && (
        <VideoTile stream={screenStream} name={localName} isLocal isScreen />
      )}
      <VideoTile
        stream={localStream}
        name={localName}
        isLocal
        isMuted={localIsMuted}
        isCameraOff={localIsCameraOff}
      />
      {participants.map((p) => (
        <VideoTile
          key={p.peerId}
          stream={p.stream}
          name={p.name}
          isMuted={p.isMuted}
          isCameraOff={p.isCameraOff}
        />
      ))}
    </div>
  );
}
