'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { t } from '@/lib/tokens';

/* ═══════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════ */

interface ShareMilestoneProps {
  type: 'streak' | 'devotional' | 'challenge' | 'assessment';
  value: number;
  title: string;
  subtitle?: string;
  userName?: string;
  onClose: () => void;
}

/* ═══════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════ */

const NAVY = '#0F1E2E';
const NAVY_MID = '#1A2D40';
const GOLD = '#C7A23A';
const GOLD_LIGHT = '#D4B45A';
const GOLD_DIM = 'rgba(199, 162, 58, 0.25)';
const WHITE = '#FFFFFF';
const WHITE_DIM = 'rgba(255, 255, 255, 0.55)';

const BADGE_ICON: Record<ShareMilestoneProps['type'], string> = {
  streak: '\uD83D\uDD25',      // fire
  devotional: '\uD83D\uDCD6',  // open book
  challenge: '\uD83C\uDFC6',   // trophy
  assessment: '\u2728',         // sparkles
};

const BADGE_LABEL: Record<ShareMilestoneProps['type'], string> = {
  streak: 'Streak',
  devotional: 'Devotional',
  challenge: 'Challenge',
  assessment: 'Assessment',
};

const CANVAS_SIZE = 1080;
const VERSE_TEXT = '\u201CA cord of three strands is not quickly broken.\u201D';
const VERSE_REF = 'Ecclesiastes 4:12';

/* ═══════════════════════════════════════════════
   Canvas Drawing
   ═══════════════════════════════════════════════ */

function drawMilestoneCard(
  canvas: HTMLCanvasElement,
  props: ShareMilestoneProps,
): void {
  const S = CANVAS_SIZE;
  const ctx = canvas.getContext('2d')!;
  canvas.width = S;
  canvas.height = S;

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, S);
  bgGrad.addColorStop(0, NAVY);
  bgGrad.addColorStop(1, NAVY_MID);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, S, S);

  // ── Corner accent lines (decorative gold) ──
  const cornerLen = 100;
  const cornerInset = 60;
  const cornerWidth = 2.5;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = cornerWidth;
  ctx.lineCap = 'round';

  // Top-left
  ctx.beginPath();
  ctx.moveTo(cornerInset, cornerInset + cornerLen);
  ctx.lineTo(cornerInset, cornerInset);
  ctx.lineTo(cornerInset + cornerLen, cornerInset);
  ctx.stroke();

  // Top-right
  ctx.beginPath();
  ctx.moveTo(S - cornerInset - cornerLen, cornerInset);
  ctx.lineTo(S - cornerInset, cornerInset);
  ctx.lineTo(S - cornerInset, cornerInset + cornerLen);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(cornerInset, S - cornerInset - cornerLen);
  ctx.lineTo(cornerInset, S - cornerInset);
  ctx.lineTo(cornerInset + cornerLen, S - cornerInset);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(S - cornerInset - cornerLen, S - cornerInset);
  ctx.lineTo(S - cornerInset, S - cornerInset);
  ctx.lineTo(S - cornerInset, S - cornerInset - cornerLen);
  ctx.stroke();

  // ── Inner frame border ──
  const frameInset = 90;
  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = 1;
  ctx.strokeRect(frameInset, frameInset, S - frameInset * 2, S - frameInset * 2);

  // ── Branding: CLEAVE ──
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = '700 28px "Cinzel", "Cormorant Garamond", serif';
  ctx.fillStyle = WHITE;
  ctx.letterSpacing = '8px';
  ctx.fillText('CLEAVE', S / 2, 160);
  // Reset letterSpacing for subsequent text
  ctx.letterSpacing = '0px';

  // Divider with "HOLD FAST"
  const cordY = 195;
  const divW = 60;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(S / 2 - 80 - divW, cordY);
  ctx.lineTo(S / 2 - 80, cordY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(S / 2 + 80, cordY);
  ctx.lineTo(S / 2 + 80 + divW, cordY);
  ctx.stroke();

  ctx.font = '400 18px "Cinzel", "Cormorant Garamond", serif';
  ctx.fillStyle = GOLD;
  ctx.letterSpacing = '6px';
  ctx.fillText('HOLD FAST', S / 2, cordY);
  ctx.letterSpacing = '0px';

  // ── Badge type label ──
  ctx.font = '600 16px "Source Sans 3", "DM Sans", sans-serif';
  ctx.fillStyle = WHITE_DIM;
  ctx.letterSpacing = '4px';
  ctx.fillText(BADGE_LABEL[props.type].toUpperCase(), S / 2, 280);
  ctx.letterSpacing = '0px';

  // ── Large value number ──
  const valueStr = String(props.value);
  ctx.font = `700 ${valueStr.length > 3 ? 160 : 200}px "Cormorant Garamond", serif`;
  ctx.fillStyle = GOLD;
  ctx.fillText(valueStr, S / 2, S / 2 - 40);

  // ── Decorative horizontal divider ──
  const dividerY = S / 2 + 60;
  const dashLen = 120;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1.5;

  // Left dash
  ctx.beginPath();
  ctx.moveTo(S / 2 - dashLen - 30, dividerY);
  ctx.lineTo(S / 2 - 30, dividerY);
  ctx.stroke();

  // Diamond
  const dSize = 6;
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.moveTo(S / 2, dividerY - dSize);
  ctx.lineTo(S / 2 + dSize, dividerY);
  ctx.lineTo(S / 2, dividerY + dSize);
  ctx.lineTo(S / 2 - dSize, dividerY);
  ctx.closePath();
  ctx.fill();

  // Right dash
  ctx.beginPath();
  ctx.moveTo(S / 2 + 30, dividerY);
  ctx.lineTo(S / 2 + dashLen + 30, dividerY);
  ctx.stroke();

  // ── Title ──
  ctx.font = '600 38px "Cormorant Garamond", serif';
  ctx.fillStyle = WHITE;
  ctx.fillText(props.title, S / 2, dividerY + 65);

  // ── Subtitle ──
  if (props.subtitle) {
    ctx.font = '400 22px "Source Sans 3", "DM Sans", sans-serif';
    ctx.fillStyle = WHITE_DIM;
    ctx.fillText(props.subtitle, S / 2, dividerY + 110);
  }

  // ── Username ──
  if (props.userName) {
    ctx.font = '400 18px "Source Sans 3", "DM Sans", sans-serif';
    ctx.fillStyle = GOLD_LIGHT;
    ctx.fillText(props.userName, S / 2, S - 220);
  }

  // ── Scripture quote ──
  ctx.font = 'italic 20px "Cormorant Garamond", serif';
  ctx.fillStyle = WHITE_DIM;
  ctx.fillText(VERSE_TEXT, S / 2, S - 150);

  ctx.font = '400 16px "Source Sans 3", "DM Sans", sans-serif';
  ctx.fillStyle = GOLD_DIM;
  ctx.fillText(VERSE_REF, S / 2, S - 120);
}

/* ═══════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════ */

export function ShareMilestone({ type, value, title, subtitle, userName, onClose }: ShareMilestoneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Fade-in on mount
  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Generate canvas blob
  const generateBlob = useCallback(async (): Promise<Blob> => {
    const canvas = canvasRef.current ?? document.createElement('canvas');
    drawMilestoneCard(canvas, { type, value, title, subtitle, userName, onClose });
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Canvas export failed'))),
        'image/png',
      );
    });
  }, [type, value, title, subtitle, userName, onClose]);

  // ── Share via Web Share API ──
  async function handleShare() {
    setSharing(true);
    try {
      const blob = await generateBlob();
      const file = new File([blob], 'cleave-milestone.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `${title} - Cleave`,
          text: subtitle || 'Growing together in covenant',
          files: [file],
        });
      } else if (navigator.share) {
        // Fallback share without file
        await navigator.share({
          title: `${title} - Cleave`,
          text: `${BADGE_ICON[type]} ${title}${subtitle ? ` \u2014 ${subtitle}` : ''}\n\n${VERSE_TEXT} ${VERSE_REF}`,
        });
      } else {
        // Final fallback: copy text
        await handleCopyLink();
      }
    } catch (err: unknown) {
      // User cancelled share - not an error
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    } finally {
      setSharing(false);
    }
  }

  // ── Copy text to clipboard ──
  async function handleCopyLink() {
    const text = `${BADGE_ICON[type]} ${title}${subtitle ? ` \u2014 ${subtitle}` : ''}\n\n${VERSE_TEXT} ${VERSE_REF}\n\nCleave \u2014 Marriage, rooted in faith.`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }

  // ── Download PNG ──
  async function handleDownload() {
    try {
      const blob = await generateBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cleave-${type}-${value}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  }

  // Determine if Web Share API is available
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: visible ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0)',
        backdropFilter: visible ? 'blur(8px)' : 'blur(0px)',
        WebkitBackdropFilter: visible ? 'blur(8px)' : 'blur(0px)',
        transition: 'all 0.3s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Share milestone"
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: t.bgCard,
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)',
          transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${t.border}` }}>
          <h2
            className="text-lg font-medium m-0"
            style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}
          >
            Share Your Journey
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full border-none cursor-pointer text-base"
            style={{ background: t.bgAccent, color: t.textSecondary }}
            aria-label="Close"
          >
            \u2715
          </button>
        </div>

        {/* ── Preview Card ── */}
        <div className="px-5 py-5">
          <div
            className="rounded-xl overflow-hidden mx-auto"
            style={{
              background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY_MID} 100%)`,
              border: `1px solid ${GOLD_DIM}`,
              aspectRatio: '1',
              maxWidth: 360,
            }}
          >
            <div className="flex flex-col items-center justify-center h-full p-6 text-center relative">
              {/* Corner accents (CSS) */}
              <div style={{ position: 'absolute', top: 12, left: 12, width: 28, height: 28, borderTop: `2px solid ${GOLD}`, borderLeft: `2px solid ${GOLD}` }} />
              <div style={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderTop: `2px solid ${GOLD}`, borderRight: `2px solid ${GOLD}` }} />
              <div style={{ position: 'absolute', bottom: 12, left: 12, width: 28, height: 28, borderBottom: `2px solid ${GOLD}`, borderLeft: `2px solid ${GOLD}` }} />
              <div style={{ position: 'absolute', bottom: 12, right: 12, width: 28, height: 28, borderBottom: `2px solid ${GOLD}`, borderRight: `2px solid ${GOLD}` }} />

              {/* Branding */}
              <div className="mb-1">
                <p className="m-0" style={{ fontFamily: 'Cinzel, Cormorant Garamond, serif', fontSize: 11, fontWeight: 700, color: WHITE, letterSpacing: '0.18em', textTransform: 'uppercase' as const }}>
                  CLEAVE
                </p>
                <div className="flex items-center justify-center gap-2 mt-0.5">
                  <div style={{ width: 16, height: 1, background: GOLD, opacity: 0.5 }} />
                  <p className="m-0" style={{ fontFamily: 'Cinzel, Cormorant Garamond, serif', fontSize: 7, fontWeight: 400, color: GOLD, letterSpacing: '0.35em', textTransform: 'uppercase' as const }}>
                    Hold Fast
                  </p>
                  <div style={{ width: 16, height: 1, background: GOLD, opacity: 0.5 }} />
                </div>
              </div>

              {/* Type label */}
              <p className="m-0 mt-2" style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: 8, fontWeight: 600, color: WHITE_DIM, letterSpacing: '0.25em', textTransform: 'uppercase' as const }}>
                {BADGE_LABEL[type]}
              </p>

              {/* Value */}
              <p className="m-0 my-2" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 72, fontWeight: 700, color: GOLD, lineHeight: 1 }}>
                {value}
              </p>

              {/* Divider */}
              <div className="flex items-center gap-2 mb-2">
                <div style={{ width: 40, height: 1, background: GOLD }} />
                <div style={{ width: 5, height: 5, background: GOLD, transform: 'rotate(45deg)' }} />
                <div style={{ width: 40, height: 1, background: GOLD }} />
              </div>

              {/* Title */}
              <p className="m-0" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 16, fontWeight: 600, color: WHITE }}>
                {title}
              </p>

              {/* Subtitle */}
              {subtitle && (
                <p className="m-0 mt-1" style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: 10, color: WHITE_DIM }}>
                  {subtitle}
                </p>
              )}

              {/* Username */}
              {userName && (
                <p className="m-0 mt-3" style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: 9, color: GOLD_LIGHT }}>
                  {userName}
                </p>
              )}

              {/* Scripture */}
              <div className="mt-auto pt-3">
                <p className="m-0 italic" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 9, color: WHITE_DIM }}>
                  {VERSE_TEXT}
                </p>
                <p className="m-0 mt-0.5" style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: 7, color: GOLD_DIM }}>
                  {VERSE_REF}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="px-5 pb-5 flex flex-col gap-2.5">
          {/* Share (primary) */}
          {canShare && (
            <button
              onClick={handleShare}
              disabled={sharing}
              className="w-full py-3 rounded-xl border-none cursor-pointer text-sm font-semibold flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #B8860B, #8B6914)',
                color: WHITE,
                fontFamily: 'Source Sans 3, sans-serif',
                opacity: sharing ? 0.7 : 1,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              {sharing ? 'Sharing...' : 'Share'}
            </button>
          )}

          {/* Copy + Download row */}
          <div className="flex gap-2.5">
            <button
              onClick={handleCopyLink}
              className="flex-1 py-3 rounded-xl border cursor-pointer text-sm font-semibold flex items-center justify-center gap-2"
              style={{
                background: 'transparent',
                borderColor: t.border,
                color: t.textPrimary,
                fontFamily: 'Source Sans 3, sans-serif',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              {copied ? 'Copied!' : 'Copy Text'}
            </button>

            <button
              onClick={handleDownload}
              className="flex-1 py-3 rounded-xl border cursor-pointer text-sm font-semibold flex items-center justify-center gap-2"
              style={{
                background: 'transparent',
                borderColor: t.border,
                color: t.textPrimary,
                fontFamily: 'Source Sans 3, sans-serif',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download
            </button>
          </div>
        </div>

        {/* Hidden canvas for image generation */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
}
