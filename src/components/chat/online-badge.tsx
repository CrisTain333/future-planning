"use client";

interface OnlineBadgeProps {
  isOnline: boolean;
  size?: "sm" | "md";
  borderColor?: string;
}

export function OnlineBadge({ isOnline, size = "sm", borderColor = "border-white" }: OnlineBadgeProps) {
  const sizeClass = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";
  return (
    <span
      className={`${sizeClass} rounded-full border-2 ${borderColor} ${
        isOnline ? "bg-emerald-500" : "bg-gray-300"
      } block`}
    />
  );
}
