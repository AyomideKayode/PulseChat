export default function MessageSkeleton() {
  const items = Array.from({ length: 4 }).map((_, i) => {
    const isOwn = i % 2 === 0;
    const width = Math.random() * 30 + 30;
    return { isOwn, width };
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
      {items.map((item, i) => (
        <div
          key={i}
          className={`flex ${item.isOwn ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className="h-12 rounded-xl relative overflow-hidden"
            style={{ width: `${item.width}%` }}
          >
            <div
              className={`absolute inset-0 ${item.isOwn ? 'bg-bubble-sent/50' : 'bg-card'}`}
            >
              <div className="absolute inset-0 shimmer animate-shimmer" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
