const DEMOS = [
  { src: "/demos/demo-3-sneakers-v3.mp4", label: "DropLab · Sneakers", angle: "Scarcity" },
  { src: "/demos/demo-2-skincare-v3.mp4", label: "Lumière Skin · Skincare", angle: "Social proof" },
  { src: "/demos/demo-4-audio-v3.mp4", label: "EchoPods · Tech audio", angle: "Product benefit" },
  { src: "/demos/demo-5-fitness-v3.mp4", label: "MoveWell · Fitness", angle: "Transformation" },
  { src: "/demos/demo-6-watches-fr-v3.mp4", label: "Montres Aurore · FR", angle: "Urgence" },
];

// Duplicated once so the CSS marquee can loop seamlessly at -50%.
const TRACK = [...DEMOS, ...DEMOS];

// One full pass covers exactly the un-duplicated DEMOS list (the marquee
// scrolls to -50%, i.e. one full set) — pace scales with the list length
// instead of a fixed duration, so adding/removing demos keeps the same
// per-card speed rather than getting faster or slower as a side effect.
const SECONDS_PER_CARD = 8;

export function DemoCarousel() {
  return (
    // width:100% instead of 100vw sidesteps a scrollbar-width mismatch
    // that w-screen can cause (100vw includes the scrollbar gutter, the
    // parent's 100% doesn't), which showed up as a few px of unwanted
    // horizontal scroll on some browsers.
    <div className="group relative w-full overflow-hidden" style={{ marginInline: "calc(50% - 50vw)" }}>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent sm:w-40" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent sm:w-40" />

      <div
        className="flex w-max animate-marquee gap-8 py-10 group-hover:[animation-play-state:paused]"
        style={{ animationDuration: `${DEMOS.length * SECONDS_PER_CARD}s` }}
      >
        {TRACK.map((demo, i) => (
          <div key={`${demo.src}-${i}`} className="flex w-60 shrink-0 flex-col items-center sm:w-72">
            <div className="card-hover relative w-full overflow-hidden rounded-[1.75rem] border-[6px] border-surface-elevated bg-black shadow-[0_30px_80px_-30px_rgb(0_0_0/0.8)]">
              <div className="pointer-events-none absolute left-1/2 top-0 z-10 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-surface-elevated" />
              <video
                src={demo.src}
                className="aspect-[9/16] w-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              />
            </div>
            <div className="mt-4 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">{demo.angle}</p>
              <p className="mt-1 font-display font-semibold">{demo.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
