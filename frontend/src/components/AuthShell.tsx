// moldura das telas públicas (login/cadastro): fundo com brilho âmbar e card de vidro
import { ReactNode } from 'react';

export function AuthShell({ children, decoracao }: { children: ReactNode; decoracao?: string }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-clip bg-obsidian px-5 py-12">
      <div className="pointer-events-none absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full bg-primary/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-[420px] w-[420px] rounded-full bg-secondary/5 blur-[120px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,140,69,0.08),transparent_60%)]" />

      <div className="relative z-10 w-full max-w-[520px]">{children}</div>

      {decoracao && (
        <span className="pointer-events-none absolute bottom-8 right-10 hidden select-none font-display-lg text-[56px] italic text-primary/10 lg:block">
          {decoracao}
        </span>
      )}
    </div>
  );
}
