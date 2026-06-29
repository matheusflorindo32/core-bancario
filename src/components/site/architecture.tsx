import { Gem, Workflow, Server, Layout } from "lucide-react";

const layers = [
  {
    icon: Gem,
    name: "Domain",
    sub: "Entidades, value objects e regras de negócio puras.",
  },
  {
    icon: Workflow,
    name: "Application",
    sub: "Casos de uso orquestrando o domínio via portas.",
  },
  {
    icon: Server,
    name: "Infrastructure",
    sub: "Adapters: persistência, HTTP, cripto, integrações externas.",
  },
  {
    icon: Layout,
    name: "Presentation",
    sub: "API REST, controllers e serialização — só fala com Application.",
  },
];

export function Architecture() {
  return (
    <section id="arquitetura" className="mx-auto max-w-7xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <div className="eyebrow">Arquitetura em camadas</div>
        <h2 className="mt-3 font-display text-4xl text-foreground sm:text-5xl">
          Dependências apontam{" "}
          <span className="italic text-gradient-accent">para dentro</span>.
        </h2>
        <p className="mt-4 text-muted-foreground">
          Núcleo de negócio independente de framework, banco ou interface — o
          princípio que mantém o sistema testável e evolutivo.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-3 md:grid-cols-4">
        {layers.map((l, i) => {
          const Icon = l.icon;
          return (
            <div
              key={l.name}
              className="relative rounded-xl border border-border bg-card p-6"
            >
              <div className="flex items-center justify-between">
                <span className="eyebrow text-[0.62rem]">Camada 0{i + 1}</span>
                <Icon className="h-4 w-4 text-accent" />
              </div>
              <div className="mt-4 font-display text-2xl text-foreground">
                {l.name}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {l.sub}
              </p>
              {i < layers.length - 1 && (
                <div
                  aria-hidden
                  className="hidden md:block absolute right-[-10px] top-1/2 z-10 h-px w-5 -translate-y-1/2 gradient-accent"
                />
              )}
            </div>
          );
        })}
      </div>

      <pre className="mx-auto mt-12 max-w-3xl overflow-x-auto rounded-xl border border-border bg-foreground/95 p-6 text-[0.78rem] leading-relaxed text-background">
{`src/
├─ domain/           ← entidades, VOs, regras puras
├─ application/      ← casos de uso (use cases)
│   └─ ports/        ← contratos (interfaces)
├─ infrastructure/   ← adapters (db, http, crypto)
└─ presentation/     ← controllers, REST, DTOs`}
      </pre>
    </section>
  );
}
