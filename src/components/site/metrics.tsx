import { animate, useInView, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

interface Metric {
  label: string;
  value: number;
  suffix?: string;
  caption: string;
}

const metrics: Metric[] = [
  { label: "Cobertura de testes", value: 92, suffix: "%", caption: "indicador interno do projeto" },
  { label: "Módulos implementados", value: 14, caption: "indicador interno do projeto" },
  { label: "Camadas arquiteturais", value: 4, caption: "Domain · App · Infra · UI" },
  { label: "Densidade de tipos", value: 100, suffix: "%", caption: "TypeScript em modo estrito" },
];

function Counter({ value, suffix }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toString());

  useEffect(() => {
    if (inView) {
      const controls = animate(mv, value, { duration: 1.6, ease: "easeOut" });
      const unsub = rounded.on("change", (latest) => {
        if (ref.current) ref.current.textContent = latest + (suffix ?? "");
      });
      return () => {
        controls.stop();
        unsub();
      };
    }
  }, [inView, mv, rounded, value, suffix]);

  return <span ref={ref}>0{suffix ?? ""}</span>;
}

export function Metrics() {
  return (
    <section id="metricas" className="bg-card/60 border-y border-border">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_2fr] lg:items-end">
          <div>
            <div className="eyebrow">Indicadores do projeto</div>
            <h2 className="mt-3 font-display text-4xl text-foreground sm:text-5xl">
              Métricas <span className="italic text-gradient-accent">do código</span>,
              não de clientes.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              DIO Bank Pro é um projeto educacional aberto. Os números abaixo refletem
              a qualidade interna da base de código — não há usuários reais, transações
              ou clientes envolvidos.
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-4">
            {metrics.map((m) => (
              <div key={m.label} className="bg-card p-6">
                <dt className="eyebrow text-[0.62rem]">{m.label}</dt>
                <dd className="mt-3 font-display text-5xl leading-none text-foreground tabular-nums">
                  <Counter value={m.value} suffix={m.suffix} />
                </dd>
                <p className="mt-3 text-[0.7rem] uppercase tracking-wider text-muted-foreground">
                  {m.caption}
                </p>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
