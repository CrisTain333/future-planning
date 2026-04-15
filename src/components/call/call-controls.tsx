"use client";

import { Mic, MicOff, Video, VideoOff, Monitor, PhoneOff, MessageSquare } from "lucide-react";

interface CallControlsProps {
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isChatOpen: boolean;
  callType: "audio" | "video";
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onEndCall: () => void;
}

export function CallControls({ isMuted, isCameraOff, isScreenSharing, isChatOpen, callType, onToggleMute, onToggleCamera, onToggleScreenShare, onToggleChat, onEndCall }: CallControlsProps) {
  return (
    <div className="flex items-center justify-center gap-3 p-4 bg-gray-900/80 rounded-2xl">
      <button onClick={onToggleMute} className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${isMuted ? "bg-red-500 text-white" : "bg-gray-700 text-white hover:bg-gray-600"}`}>
        {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </button>
      {callType === "video" && (
        <button onClick={onToggleCamera} className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${isCameraOff ? "bg-red-500 text-white" : "bg-gray-700 text-white hover:bg-gray-600"}`}>
          {isCameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
        </button>
      )}
      {callType === "video" && (
        <button onClick={onToggleScreenShare} className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${isScreenSharing ? "bg-blue-500 text-white" : "bg-gray-700 text-white hover:bg-gray-600"}`}>
          <Monitor className="h-5 w-5" />
        </button>
      )}
      {callType === "video" && (
        <button onClick={onToggleChat} className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${isChatOpen ? "bg-blue-500 text-white" : "bg-gray-700 text-white hover:bg-gray-600"}`}>
          <MessageSquare className="h-5 w-5" />
        </button>
      )}
      <button onClick={onEndCall} className="h-12 w-12 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors">
        <PhoneOff className="h-5 w-5" />
      </button>
    </div>
  );
}
