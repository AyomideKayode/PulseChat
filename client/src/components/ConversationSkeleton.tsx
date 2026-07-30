export default function ConversationSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto" role="status" aria-label="Loading conversations">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="h-9 w-9 rounded-full bg-card shrink-0 relative overflow-hidden">
            <div className="absolute inset-0 shimmer animate-shimmer" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-3 w-28 rounded bg-card relative overflow-hidden">
              <div className="absolute inset-0 shimmer animate-shimmer" />
            </div>
            <div className="h-2.5 w-44 rounded bg-card relative overflow-hidden">
              <div className="absolute inset-0 shimmer animate-shimmer" />
            </div>
          </div>
          <div className="h-2.5 w-8 rounded bg-card relative overflow-hidden">
            <div className="absolute inset-0 shimmer animate-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}
