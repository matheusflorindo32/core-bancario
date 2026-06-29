const items = [
  { k: "01", t: "TypeScript estrito" },
  { k: "02", t: "Clean Architecture" },
  { k: "03", t: "SOLID na prática" },
  { k: "04", t: "Testes automatizados" },
];

export function PrinciplesStrip() {
  return (
    <section id="principios" className="border-y border-border bg-card/50">
      <div className="mx-auto grid max-w-7xl grid-cols-2 divide-border md:grid-cols-4 md:divide-x">
        {items.map((it, i) => (
          <div
            key={it.k}
            className={`flex items-baseline gap-3 px-6 py-6 ${
              i < 2 ? "border-b border-border md:border-b-0" : ""
            } ${i % 2 === 1 ? "border-l border-border md:border-l-0" : ""}`}
          >
            <span className="eyebrow text-[0.62rem]">{it.k}</span>
            <span className="font-display text-xl text-foreground">{it.t}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
