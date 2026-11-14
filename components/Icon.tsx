import type { ReactNode } from "react";

const P: Record<string, ReactNode> = {
  copy: <><rect x="9" y="9" width="11" height="11" rx="2.5" /><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H16" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  user: <><circle cx="12" cy="8" r="3.6" /><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" /></>,
  invoice: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9.5 8h5M9.5 12h5" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1" /></>,
  share: <><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6" /></>,
  chevron: <path d="M6 9l6 6 6-6" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  bolt: <path d="M13 2.5L4.5 13.5H11l-1 8 8.5-11H12z" />,
  wallet: <><path d="M4 7.5h14a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /><path d="M4 7.5L15 4v3.5" /><circle cx="16.2" cy="13.8" r="1" /></>,
  qr: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><path d="M14 14h2.5v2.5M20 14v.01M14 20h2.5M20 17.5V20h-2" /></>,
  bell: <><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 20.5a2.2 2.2 0 0 0 4 0" /></>,
  print: <><path d="M7 9V4h10v5" /><rect x="4" y="9" width="16" height="8" rx="2" /><path d="M7 14h10v6H7z" /></>,
  split: <><path d="M12 20v-6" /><path d="M12 14c0-4-6-4-6-9M12 14c0-4 6-4 6-9" /></>,
  layers: <><path d="M12 4l8 4-8 4-8-4z" /><path d="M4 12.5l8 4 8-4" /><path d="M4 16.5l8 4 8-4" /></>,
  code: <><path d="m8 8-4 4 4 4" /><path d="m16 8 4 4-4 4" /><path d="m13.5 5-3 14" /></>,
  bot: <><rect x="5" y="8" width="14" height="10" rx="3" /><path d="M12 8V4.5" /><circle cx="12" cy="4" r="1" /><circle cx="9.3" cy="13" r="1" /><circle cx="14.7" cy="13" r="1" /></>,
  home: <><path d="M4 11l8-6.5 8 6.5" /><path d="M6 10v9h12v-9" /></>,
  download: <><path d="M12 4v11" /><path d="M7.5 11l4.5 4.5 4.5-4.5" /><path d="M5 19.5h14" /></>,
  x: <path d="M6 6l12 12M18 6L6 18" />,
};

export function Icon({ name, size = 18, className }: { name: keyof typeof P | string; size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {P[name] ?? null}
    </svg>
  );
}

/** The NearZap mark: a bolt inside a rounded tile. */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#0b0b0b" />
      <rect x=".5" y=".5" width="31" height="31" rx="8.5" fill="none" stroke="#dafa9c" strokeOpacity=".35" />
      <polygon points="20,2.5 5.5,18.5 13.8,18.5 11.5,29.5" fill="#dafa9c" />
      <polygon points="20,2.5 18.2,13 26.5,13 11.5,29.5" fill="#2fd98b" />
    </svg>
  );
}
