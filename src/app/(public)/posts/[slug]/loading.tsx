export default function PostLoading() {
  return (
    <div className="animate-pulse">
      <div className="bg-charcoal px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="h-3 w-24 bg-parchment/20" />
          <div className="mt-6 h-12 w-2/3 max-w-xl bg-parchment/25" />
          <div className="mt-4 h-4 w-1/2 max-w-md bg-parchment/15" />
        </div>
      </div>
      <div className="aspect-[16/9] bg-parchment-deep" />
      <div className="mx-auto max-w-3xl space-y-3 px-4 py-12">
        <div className="h-4 w-full bg-parchment-deep" />
        <div className="h-4 w-11/12 bg-parchment-deep" />
        <div className="h-4 w-4/5 bg-parchment-deep" />
      </div>
    </div>
  );
}
