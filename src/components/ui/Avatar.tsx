interface AvatarProps {
  username: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  isMe?: boolean;
  className?: string;
}

const sizes = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-xl",
};

export function Avatar({ username, avatarUrl, size = "md", isMe = true, className = "" }: AvatarProps) {
  const sizeClass = sizes[size];
  const initial = username?.[0]?.toUpperCase() ?? "?";

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={username}
        className={`${sizeClass} rounded-xl object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div className={`${sizeClass} rounded-xl flex items-center justify-center flex-shrink-0 ${
      isMe
        ? "bg-gradient-to-br from-accent to-blue"
        : "bg-surface-3 border border-border"
    } ${className}`}>
      <span className={`font-bold ${isMe ? "text-background" : "text-text-secondary"}`}>
        {initial}
      </span>
    </div>
  );
}
