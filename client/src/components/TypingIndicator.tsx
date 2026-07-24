interface Props {
  name: string;
}

export default function TypingIndicator({ name }: Props) {
  return (
    <div className="px-4 pb-2 flex items-center gap-1.5 text-accent text-sm animate-fade-in">
      <div className="flex gap-0.75 items-center">
        {[0, 0.15, 0.3].map((delay, i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-accent opacity-60"
            style={{ animation: `bounce 1s ease-in-out ${delay}s infinite` }}
          />
        ))}
      </div>
      {name} is typing...
    </div>
  );
}
