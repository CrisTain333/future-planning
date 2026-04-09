"use client";

interface OnlineBadgeProps {
  isOnline: boolean;
  size?: "sm" | "md";
}

export function OnlineBadge({ isOnline, size = "sm" }: OnlineBadgeProps) {
  const sizeClass = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";
  return (
    <span
      className={`${sizeClass} rounded-full border-2 border-white ${
        isOnline ? "bg-green-500" : "bg-gray-300"
      }`}
    />
  );
}
