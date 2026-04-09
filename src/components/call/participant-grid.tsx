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

function VideoTile({ stream, name, isMuted, isLocal, isScreen }: { stream: MediaStream | null; name: string; isMuted?: boolean; isLocal?: boolean; isScreen?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative bg-gray-800 rounded-xl overflow-hidden flex items-center justify-center">
      {stream ? (
        <video ref={videoRef} autoPlay playsInline muted={isLocal} className={`w-full h-full object-cover ${isLocal && !isScreen ? "scale-x-[-1]" : ""}`} />
      ) : (
        <div className="h-16 w-16 rounded-full bg-gray-600 flex items-center justify-center text-white text-xl font-bold">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded bg-black/50 text-white text-xs">
        {name}{isLocal && " (You)"}{isScreen && " - Screen"}
      </div>
      {isMuted && (
        <div className="absolute top-2 right-2 p-1 rounded bg-red-500/80">
          <MicOff className="h-3 w-3 text-white" />
        </div>
      )}
    </div>
  );
}

export function ParticipantGrid({ participants, localStream, screenStream, localName }: ParticipantGridProps) {
  const totalTiles = participants.length + 1 + (screenStream ? 1 : 0);
  const gridClass = totalTiles <= 1 ? "grid-cols-1" : totalTiles <= 2 ? "grid-cols-2" : totalTiles <= 4 ? "grid-cols-2 grid-rows-2" : totalTiles <= 6 ? "grid-cols-3 grid-rows-2" : "grid-cols-4 grid-rows-3";

  return (
    <div className={`flex-1 grid ${gridClass} gap-2 p-2`}>
      {screenStream && <VideoTile stream={screenStream} name={localName} isLocal isScreen />}
      <VideoTile stream={localStream} name={localName} isLocal />
      {participants.map((p) => <VideoTile key={p.peerId} stream={p.stream} name={p.name} isMuted={p.isMuted} />)}
    </div>
  );
}
