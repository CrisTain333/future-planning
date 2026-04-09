"use client";

import { useEffect, useRef } from "react";
import { MicOff } from "lucide-react";

interface Participant {
  peerId: string;
  name: string;
  stream: MediaStream | null;
  isMuted?: boolean;
}

interface ParticipantGridProps {
  participants: Participant[];
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  localName: string;
}

function VideoTile({
  stream,
  name,
  isMuted,
  isLocal,
  isScreen,
  className = "",
}: {
  stream: MediaStream | null;
  name: string;
  isMuted?: boolean;
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

  return (
    <div className={`relative bg-gray-800 rounded-xl overflow-hidden flex items-center justify-center ${className}`}>
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover ${isLocal && !isScreen ? "scale-x-[-1]" : ""}`}
        />
      ) : (
        <div className="h-16 w-16 rounded-full bg-gray-600 flex items-center justify-center text-white text-xl font-bold">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded bg-black/50 text-white text-xs">
        {name}
        {isLocal && " (You)"}
        {isScreen && " - Screen"}
      </div>
      {isMuted && (
        <div className="absolute top-2 right-2 p-1 rounded bg-red-500/80">
          <MicOff className="h-3 w-3 text-white" />
        </div>
      )}
    </div>
  );
}

export function ParticipantGrid({
  participants,
  localStream,
  screenStream,
  localName,
}: ParticipantGridProps) {
  const is1on1 = participants.length <= 1 && !screenStream;

  // 1-on-1: large remote + small PiP local
  if (is1on1) {
    const remote = participants[0];
    return (
      <div className="flex-1 relative">
        {/* Large: remote person */}
        {remote ? (
          <VideoTile
            stream={remote.stream}
            name={remote.name}
            isMuted={remote.isMuted}
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
      <VideoTile stream={localStream} name={localName} isLocal />
      {participants.map((p) => (
        <VideoTile
          key={p.peerId}
          stream={p.stream}
          name={p.name}
          isMuted={p.isMuted}
        />
      ))}
    </div>
  );
}
