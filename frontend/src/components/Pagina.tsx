import type { ReactNode } from 'react';

// container padrão das páginas internas (largura máxima e respiros laterais do design system)
export const CONTAINER = 'mx-auto max-w-container-max 2xl:max-w-[1560px] px-5 md:px-10 xl:px-margin-desktop';

export function Pagina({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`${CONTAINER} py-8 md:py-12 ${className}`}>{children}</div>;
}
