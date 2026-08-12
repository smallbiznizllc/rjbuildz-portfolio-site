export default function PublicLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="h-10 w-48 animate-pulse bg-parchment-deep/80" />
      <div className="mt-6 h-4 w-full max-w-md animate-pulse bg-parchment-deep/60" />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[3/4] animate-pulse bg-parchment-deep/70"
          />
        ))}
      </div>
    </div>
  );
}
