import type { ReactNode, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps & { children: ReactNode }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" {...props}>{children}</svg>;
}

export function KaelAdd(props: IconProps) { return <Icon {...props}><path d="M12 5v14M5 12h14" /></Icon>; }
export function KaelArrowRight(props: IconProps) { return <Icon {...props}><path d="M4 12h15M13 6l6 6-6 6" /></Icon>; }
export function KaelArrowLeft(props: IconProps) { return <Icon {...props}><path d="M20 12H5M11 6l-6 6 6 6" /></Icon>; }
export function KaelEnter(props: IconProps) { return <Icon {...props}><path d="M14 5h5v14h-5M12 12h7M15 8l4 4-4 4" /></Icon>; }
export function KaelShield(props: IconProps) { return <Icon {...props}><path d="M12 3l7 3v5c0 4.7-2.8 8.1-7 10-4.2-1.9-7-5.3-7-10V6l7-3Z" /><path d="m8.5 12 2.2 2.2 4.8-4.8" /></Icon>; }
export function KaelGrid(props: IconProps) { return <Icon {...props}><rect x="4" y="4" width="6" height="6" /><rect x="14" y="4" width="6" height="6" /><rect x="4" y="14" width="6" height="6" /><rect x="14" y="14" width="6" height="6" /></Icon>; }
export function KaelHelp(props: IconProps) { return <Icon {...props}><circle cx="12" cy="12" r="8.5" /><path d="M9.7 9.4a2.5 2.5 0 1 1 4 2c-1.2.8-1.7 1.2-1.7 2.3M12 17h.01" /></Icon>; }
export function KaelBot(props: IconProps) { return <Icon {...props}><rect x="5" y="7" width="14" height="12" /><path d="M12 7V4M9 12h.01M15 12h.01M9 16h6" /></Icon>; }
export function KaelServer(props: IconProps) { return <Icon {...props}><rect x="4" y="4" width="16" height="6" /><rect x="4" y="14" width="16" height="6" /><path d="M8 7h.01M8 17h.01M12 7h5M12 17h5" /></Icon>; }
export function KaelMembers(props: IconProps) { return <Icon {...props}><circle cx="9" cy="9" r="3" /><path d="M4 19c.5-3 2.1-4.5 5-4.5s4.5 1.5 5 4.5M16 8a2.5 2.5 0 0 1 0 5M17 15c1.8.5 2.8 1.8 3 4" /></Icon>; }
export function KaelSpark(props: IconProps) { return <Icon {...props}><path d="m12 3 1.5 6.5L20 12l-6.5 1.5L12 20l-1.5-6.5L4 12l6.5-2.5L12 3Z" /></Icon>; }
export function KaelConstruct(props: IconProps) { return <Icon {...props}><path d="m14 5 5 5M13 6l-7 7M5 13l-2 6 6-2M15 3l6 6M17 13l4 4M19 11l-4 4" /></Icon>; }
export function KaelUser(props: IconProps) { return <Icon {...props}><circle cx="12" cy="8" r="3" /><path d="M5 20c.8-4 3.1-6 7-6s6.2 2 7 6" /></Icon>; }
export function KaelExit(props: IconProps) { return <Icon {...props}><path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" /></Icon>; }
export function KaelSun(props: IconProps) { return <Icon {...props}><circle cx="12" cy="12" r="3.5" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" /></Icon>; }
export function KaelMoon(props: IconProps) { return <Icon {...props}><path d="M18.8 15.6A7.7 7.7 0 0 1 8.4 5.2 7.7 7.7 0 1 0 18.8 15.6Z" /><path d="m17.5 4 .45 1.15L19.1 5.6l-1.15.45-.45 1.15-.45-1.15-1.15-.45 1.15-.45L17.5 4Z" /></Icon>; }
export function KaelWand(props: IconProps) { return <Icon {...props}><path d="m5 19 10-10M13 5l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2ZM18 14l.7 1.3L20 16l-1.3.7L18 18l-.7-1.3L16 16l1.3-.7L18 14Z" /></Icon>; }
export function KaelClock(props: IconProps) { return <Icon {...props}><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></Icon>; }
