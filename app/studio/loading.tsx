export default function StudioLoading() {
  return (
    <div aria-label="Loading studio" className="animate-pulse space-y-6">
      <div className="h-9 w-56 rounded-xl bg-[#e5eef3]" />
      <div className="h-4 w-80 max-w-full rounded bg-[#eaf1f5]" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-28 rounded-3xl bg-[#e5eef3]" />
        <div className="h-28 rounded-3xl bg-[#e5eef3]" />
        <div className="h-28 rounded-3xl bg-[#e5eef3]" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.5fr_0.7fr]">
        <div className="h-[420px] rounded-[1.75rem] bg-[#e5eef3]" />
        <div className="h-72 rounded-[1.75rem] bg-[#e5eef3]" />
      </div>
    </div>
  );
}
