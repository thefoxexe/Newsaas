const DEMOS = [
  { src: "/demos/demo-3-sneakers.mp4", label: "Sneakers — DropLab", angle: "Édition limitée" },
  { src: "/demos/demo-2-skincare.mp4", label: "Cosmétique — Lumière", angle: "Preuve sociale" },
  { src: "/demos/demo-4-audio.mp4", label: "Tech audio — EchoPods", angle: "Bénéfice produit" },
];

// Duplicated once so the CSS marquee can loop seamlessly at -50%.
const TRACK = [...DEMOS, ...DEMOS];

export function DemoCarousel() {
  return (
    <div className="group relative w-screen overflow-hidden" style={{ marginLeft: "calc(50% - 50vw)" }}>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent sm:w-40" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent sm:w-40" />

      <div className="flex w-max animate-marquee gap-8 py-10 group-hover:[animation-play-state:paused]">
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
