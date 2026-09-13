import type { SVGProps } from "react";

function Base(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={22}
      height={22}
      {...props}
    />
  );
}

export const IconeOrcamento = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 9h18M8 4v16" />
  </Base>
);

export const IconeMovimentos = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M4 7h16M4 12h10M4 17h16" />
  </Base>
);

export const IconeRelatorios = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M4 20V10M12 20V4M20 20v-7" />
  </Base>
);

export const IconeAlertas = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M12 3a6 6 0 0 0-6 6c0 5-2 6-2 6h16s-2-1-2-6a6 6 0 0 0-6-6Z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </Base>
);

export const IconeMembros = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <circle cx="9" cy="8" r="3" />
    <path d="M2 20c0-3.3 3-6 7-6s7 2.7 7 6M16 8a3 3 0 1 1 3.7 2.9M22 20c0-2.5-1.9-4.6-4.5-5.5" />
  </Base>
);

export const IconeMais = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

export const IconeSair = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5M21 12H9" />
  </Base>
);
