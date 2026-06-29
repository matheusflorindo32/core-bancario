import { motion } from "framer-motion";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { GlobeGlobal } from "../globe-global";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(45,138,158,0.10), transparent 60%)",
        }}
      />
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 pb-24 pt-16 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex flex-col justify-center"
        >
          <div className="eyebrow flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full gradient-accent" />
            Desafio DIO · Open Source
          </div>

          <h1 className="mt-6 font-display text-5xl leading-[1.02] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Engenharia bancária,
            <br />
            feita como{" "}
            <span className="italic text-gradient-accent">produto</span>.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            DIO Bank Pro é um core bancário em TypeScript construído com{" "}
            <span className="text-foreground">Clean Architecture</span>,{" "}
            <span className="text-foreground">princípios SOLID</span> e cobertura
            de testes — pronto para evoluir como um produto fintech real.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-2 rounded-md gradient-accent px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5"
            >
              Explorar o código
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <a
              href="#arquitetura"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-3 text-sm font-medium text-foreground hover:bg-secondary"
            >
              <BookOpen className="h-4 w-4" />
              Ler a documentação
            </a>
          </div>

          <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-border pt-6">
            {[
              { k: "TypeScript", v: "estrito" },
              { k: "Cobertura", v: "92%" },
              { k: "Camadas", v: "4" },
            ].map((s) => (
              <div key={s.k}>
                <dt className="eyebrow text-[0.62rem]">{s.k}</dt>
                <dd className="mt-1 font-display text-2xl text-foreground">
                  {s.v}
                </dd>
              </div>
            ))}
          </dl>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
          className="relative mx-auto w-full max-w-[560px]"
        >
          <div
            className="relative rounded-3xl p-6 shadow-2xl ring-1 ring-white/5"
            style={{
              background:
                "radial-gradient(120% 90% at 50% 0%, #0c2340 0%, #06101f 70%, #04080f 100%)",
            }}
          >
            <GlobeGlobal />
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Rede global simulada · 10 regiões · pulsos de tráfego em tempo real.
          </p>
        </motion.div>

      </div>
    </section>
  );
}
