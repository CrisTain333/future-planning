"use client";

import { Phone, PhoneOff } from "lucide-react";
import { ICallLog, IUser } from "@/types";

interface IncomingCallProps {
  callLog: ICallLog;
  onAccept: () => void;
  onDecline: () => void;
}

export function IncomingCall({ callLog, onAccept, onDecline }: IncomingCallProps) {
  const callerName = typeof callLog.initiatedBy === "object" ? (callLog.initiatedBy as IUser).fullName : "Unknown";

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-sm w-full mx-4">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-primary">{callerName.charAt(0)}</span>
        </div>
        <h3 className="text-lg font-semibold mb-1">{callerName}</h3>
        <p className="text-sm text-muted-foreground mb-6">Incoming {callLog.type} call...</p>
        <div className="flex items-center justify-center gap-6">
          <button onClick={onDecline} className="h-14 w-14 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors">
            <PhoneOff className="h-6 w-6" />
          </button>
          <button onClick={onAccept} className="h-14 w-14 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors">
            <Phone className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
