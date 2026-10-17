// moldura das telas públicas (login/cadastro): fundo com brilho âmbar e card de vidro
import { ReactNode } from 'react';

export function AuthShell({ children, decoracao }: { children: ReactNode; decoracao?: string }) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-obsidian px-5 py-12">
      {/* os brilhos ficam numa camada própria com overflow-hidden: overflow-clip não existe no Safari < 16 e gerava rolagem lateral */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-40 -left-24 h-[420px] w-[420px] rounded-full bg-secondary/5 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,140,69,0.08),transparent_60%)]" />
        {decoracao && (
          <span className="absolute bottom-8 right-10 hidden select-none font-display-lg text-[56px] italic text-primary/10 lg:block">
            {decoracao}
          </span>
        )}
      </div>

      <div className="relative z-10 w-full max-w-[520px]">{children}</div>
    </div>
  );
}
