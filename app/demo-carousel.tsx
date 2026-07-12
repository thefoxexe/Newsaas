const DEMOS = [
  { src: "/demos/demo-3-sneakers.mp4", label: "Sneakers", angle: "Édition limitée" },
  { src: "/demos/demo-2-skincare.mp4", label: "Cosmétique", angle: "Preuve sociale" },
  { src: "/demos/demo-4-audio.mp4", label: "Tech audio", angle: "Bénéfice produit" },
];

// Duplicated once so the CSS marquee can loop seamlessly at -50%.
const TRACK = [...DEMOS, ...DEMOS];

export function DemoCarousel() {
  return (
    <div className="group relative w-screen overflow-hidden" style={{ marginLeft: "calc(50% - 50vw)" }}>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent sm:w-32" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent sm:w-32" />

      <div className="flex w-max animate-marquee gap-6 py-4 group-hover:[animation-play-state:paused]">
        {TRACK.map((demo, i) => (
          <div
            key={`${demo.src}-${i}`}
            className="w-56 shrink-0 overflow-hidden rounded-card border border-border bg-surface sm:w-72"
          >
            <video
              src={demo.src}
              className="aspect-[9/16] w-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
            <div className="p-4">
              <p className="text-xs uppercase tracking-wide text-primary">{demo.angle}</p>
              <p className="mt-1 font-semibold">{demo.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
