"use client";

interface TypingIndicatorProps {
  names: string[];
}

export function TypingIndicator({ names }: TypingIndicatorProps) {
  if (names.length === 0) return null;

  const text =
    names.length === 1
      ? `${names[0]} is typing`
      : names.length === 2
        ? `${names[0]} and ${names[1]} are typing`
        : `${names[0]} and ${names.length - 1} others are typing`;

  return (
    <div className="px-4 py-1 text-xs text-muted-foreground flex items-center gap-1">
      <span className="flex gap-0.5">
        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
      </span>
      <span>{text}</span>
    </div>
  );
}
