const SKELETON_ITEMS = Array.from({ length: 4 }).map((_, i) => ({
  isOwn: i % 2 === 0,
  width: 30 + ((i * 7 + 13) % 31),
}));

export default function MessageSkeleton() {
  return (
    <div role="status" aria-label="Loading messages" className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
      {SKELETON_ITEMS.map((item, i) => (
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
