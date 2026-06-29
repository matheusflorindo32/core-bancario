export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 py-12 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md gradient-accent text-[10px] font-bold text-primary-foreground">
              D
            </span>
            <span className="text-sm font-semibold tracking-tight">
              DIO Bank <span className="text-muted-foreground">Pro</span>
            </span>
          </div>
          <p className="mt-3 max-w-md text-xs leading-relaxed text-muted-foreground">
            Projeto educacional open source desenvolvido como evolução do desafio
            DIO. Não representa um banco real e não processa transações reais.
          </p>
        </div>
        <div className="flex gap-6 text-xs text-muted-foreground">
          <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-foreground">
            Repositório
          </a>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-foreground">
            Licença MIT
          </a>
          <a href="#top" className="hover:text-foreground">Topo</a>
        </div>
      </div>
    </footer>
  );
}
