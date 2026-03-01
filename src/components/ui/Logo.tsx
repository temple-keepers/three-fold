import Image from 'next/image';

/* ── Backward-compat aliases: ThreefoldLogo → CleaveLogo ── */

export function CleaveLogo({ size = 48 }: { size?: number }) {
  return (
    <div className="flex justify-center">
      <Image
        src="/logo-knot.png"
        alt="Cleave"
        width={size}
        height={size}
        className="object-contain"
        priority={size >= 80}
      />
    </div>
  );
}

/** @deprecated Use CleaveLogo */
export const ThreefoldLogo = CleaveLogo;

export function CleaveWordmark({ size = 20, color = '#0F1E2E' }: { size?: number; color?: string }) {
  const gold = '#C7A23A';
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{
        fontFamily: 'Cinzel, serif',
        fontSize: size,
        fontWeight: 700,
        color,
        letterSpacing: '0.18em',
        textTransform: 'uppercase' as const,
        lineHeight: 1,
        margin: 0,
      }}>CLEAVE</p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: size * 0.12 }}>
        <div style={{ width: 16, height: 1, background: gold, opacity: 0.5 }} />
        <p style={{
          fontFamily: 'Cinzel, serif',
          fontSize: size * 0.55,
          fontWeight: 400,
          color: gold,
          letterSpacing: '0.35em',
          textTransform: 'uppercase' as const,
          margin: 0,
        }}>Hold Fast</p>
        <div style={{ width: 16, height: 1, background: gold, opacity: 0.5 }} />
      </div>
    </div>
  );
}

/** @deprecated Use CleaveWordmark */
export const ThreefoldWordmark = CleaveWordmark;
