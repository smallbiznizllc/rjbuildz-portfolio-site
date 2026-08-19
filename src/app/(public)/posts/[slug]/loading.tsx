export default function PostLoading() {
  return (
    <div className="animate-pulse">
      <div className="bg-charcoal px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="h-3 w-24 bg-parchment/20" />
          <div className="mt-6 h-12 w-full bg-parchment/25" />
          <div className="mt-4 h-4 w-1/2 max-w-md bg-parchment/15" />
        </div>
      </div>
      <div className="aspect-[16/9] bg-parchment-deep" />
      <div className="bg-copper px-6 py-12 md:mx-auto md:max-w-[1100px] md:px-14">
        <div className="mx-auto h-10 w-48 bg-black" />
        <div className="mt-8 space-y-3">
          <div className="h-4 w-full bg-white/25" />
          <div className="h-4 w-11/12 bg-white/20" />
          <div className="h-4 w-4/5 bg-white/15" />
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 border-t border-white/20 pt-8">
          <div className="h-6 w-24 bg-white/30" />
          <div className="h-6 w-28 bg-white/30" />
          <div className="mt-2 h-7 w-32 rounded-full bg-white/80" />
          <div className="mt-2 h-7 w-24 rounded-full bg-white/80" />
        </div>
      </div>
    </div>
  );
}
