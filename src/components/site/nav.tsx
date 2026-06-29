import { Github } from "lucide-react";

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md gradient-accent text-[11px] font-bold text-primary-foreground">
            D
          </span>
          <span className="text-sm font-semibold tracking-tight">
            DIO Bank <span className="text-muted-foreground">Pro</span>
          </span>
        </a>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#principios" className="hover:text-foreground">Princípios</a>
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#metricas" className="hover:text-foreground">Métricas</a>
          <a href="#arquitetura" className="hover:text-foreground">Arquitetura</a>
        </nav>
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
        >
          <Github className="h-3.5 w-3.5" />
          Ver no GitHub
        </a>
      </div>
    </header>
  );
}
