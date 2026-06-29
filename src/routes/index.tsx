import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/site/nav";
import { Hero } from "@/components/site/hero";
import { PrinciplesStrip } from "@/components/site/principles-strip";
import { FeaturesBento } from "@/components/site/features-bento";
import { Metrics } from "@/components/site/metrics";
import { Architecture } from "@/components/site/architecture";
import { SiteFooter } from "@/components/site/footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DIO Bank Pro — Core bancário em TypeScript com Clean Architecture" },
      {
        name: "description",
        content:
          "DIO Bank Pro é um core bancário open source em TypeScript com Clean Architecture, princípios SOLID, testes automatizados e documentação profissional.",
      },
      { property: "og:title", content: "DIO Bank Pro — Core bancário em TypeScript" },
      {
        property: "og:description",
        content:
          "Projeto educacional que evolui o desafio DIO em um sistema fintech modular: TypeScript estrito, Clean Architecture, SOLID e testes.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <main>
        <Hero />
        <PrinciplesStrip />
        <FeaturesBento />
        <Metrics />
        <Architecture />
      </main>
      <SiteFooter />
    </div>
  );
}
