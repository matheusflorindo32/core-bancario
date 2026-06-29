import { motion } from "framer-motion";
import {
  Braces,
  Layers,
  Boxes,
  TestTube2,
  FileText,
  GitBranch,
} from "lucide-react";

const features = [
  {
    icon: Braces,
    title: "TypeScript estrito",
    body: "Tipagem ponta a ponta, sem any. Erros pegos em build, não em produção.",
    span: "md:col-span-2",
  },
  {
    icon: Layers,
    title: "Clean Architecture",
    body: "Domínio isolado de frameworks, banco e UI. Regras de negócio no centro.",
  },
  {
    icon: Boxes,
    title: "SOLID na prática",
    body: "Cada módulo com responsabilidade única e dependências injetadas por contrato.",
  },
  {
    icon: TestTube2,
    title: "Testes automatizados",
    body: "Suite com Vitest cobrindo casos de uso, adapters e fluxos críticos do banco.",
    span: "md:col-span-2",
  },
  {
    icon: FileText,
    title: "Documentação profissional",
    body: "README por camada e ADRs explicando cada decisão de arquitetura.",
  },
  {
    icon: GitBranch,
    title: "Evolução contínua",
    body: "Do desafio DIO a um produto modular — pronto para receber novos casos de uso.",
  },
];

export function FeaturesBento() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <div className="eyebrow">Engenharia</div>
        <h2 className="mt-3 font-display text-4xl text-foreground sm:text-5xl">
          Características <span className="italic text-gradient-accent">premium</span>
        </h2>
        <p className="mt-4 text-muted-foreground">
          Cada decisão técnica do projeto pensada para parecer — e funcionar — como
          um sistema fintech de verdade.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <motion.article
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className={`group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-colors hover:border-accent/40 ${f.span ?? ""}`}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-foreground transition-colors group-hover:gradient-accent group-hover:text-primary-foreground">
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="mt-5 font-display text-2xl text-foreground">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.body}
              </p>
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-12 -right-12 h-32 w-32 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                style={{
                  background:
                    "radial-gradient(circle, rgba(45,138,158,0.18), transparent 70%)",
                }}
              />
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
