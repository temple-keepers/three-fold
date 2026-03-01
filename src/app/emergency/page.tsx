'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { CleaveLogo } from '@/components/ui/Logo';
import { TopBar } from '@/components/ui/TopBar';
import { PremiumBadge } from '@/components/ui/PremiumGate';
import { UpgradePrompt } from '@/components/ui/UpgradePrompt';
import { useSubscription } from '@/lib/useSubscription';
import { t } from '@/lib/tokens';
import Link from 'next/link';

/* ═══════════ Types ═══════════ */

interface ToolStep {
  step: number;
  title: string;
  text: string;
}

interface ConflictTool {
  id: string;
  title: string;
  description: string;
  tool_type: string;
  steps: ToolStep[];
  scripture_text: string | null;
  scripture_reference: string | null;
  urgency: string | null;
  duration_minutes: number | null;
  icon: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

/* ═══════════ Constants ═══════════ */

const TOOL_TYPE_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  timeout_protocol:    { label: 'Timeout Protocol',    bg: t.pillarSafetyBg,    text: t.pillarSafetyText },
  repair_conversation: { label: 'Repair Conversation', bg: t.pillarCommBg,      text: t.pillarCommText },
  de_escalation:       { label: 'De-escalation',       bg: t.pillarSafetyBg,    text: t.pillarSafetyText },
  forgiveness:         { label: 'Forgiveness',         bg: t.pillarSpiritualBg, text: t.pillarSpiritualText },
  reconnection:        { label: 'Reconnection',        bg: t.pillarCovenantBg,  text: t.pillarCovenantText },
  communication:       { label: 'Communication',       bg: t.pillarCommBg,      text: t.pillarCommText },
};

const URGENCY_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  high:   { label: 'High Urgency',  bg: t.redBg,   text: t.red },
  medium: { label: 'Medium',        bg: t.goldBg,  text: t.textLink },
  low:    { label: 'Gentle Pace',   bg: t.greenBg, text: t.green },
};

/* ═══════════ Page ═══════════ */

export default function EmergencyRepairToolsPage() {
  const [tools, setTools] = useState<ConflictTool[]>([]);
  const [selectedTool, setSelectedTool] = useState<ConflictTool | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  const supabase = createClient();
  const router = useRouter();
  const { isPremium } = useSubscription();
  const FREE_TOOL_LIMIT = 2;

  useEffect(() => { loadTools(); }, []);
  useEffect(() => { if (!loading) setTimeout(() => setVisible(true), 100); }, [loading]);

  async function loadTools() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth'); return; }

    const { data } = await supabase
      .from('conflict_tools')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (data) setTools(data);
    setLoading(false);
  }

  function selectTool(tool: ConflictTool) {
    setSelectedTool(tool);
    setCurrentStep(0);
    setCompleted(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goBack() {
    setSelectedTool(null);
    setCurrentStep(0);
    setCompleted(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goToPrevStep() {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  }

  function goToNextStep() {
    if (!selectedTool) return;
    if (currentStep < selectedTool.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }

  function completeTool() {
    setCompleted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ═══════════ Loading ═══════════ */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: t.bgPrimary }}>
        <CleaveLogo size={48} />
      </div>
    );
  }

  /* ═══════════ VIEW 2: Active Tool ═══════════ */

  if (selectedTool) {
    const steps = selectedTool.steps || [];
    const totalSteps = steps.length;
    const isLastStep = currentStep === totalSteps - 1;
    const step = steps[currentStep];

    /* ---- Completion Screen ---- */
    if (completed) {
      return (
        <div className="min-h-screen" style={{ background: t.bgPrimary }}>
          <TopBar
            title="Repair Tools"
            subtitle={selectedTool.title}
            backHref="/emergency"
          />
          <div className="px-4 py-8">
            <div
              className="max-w-lg mx-auto"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(16px)',
                transition: 'all 0.6s ease',
              }}
            >
              <div
                className="rounded-3xl p-8 text-center"
                style={{ background: t.bgCard, boxShadow: t.shadowCard }}
              >
                <span className="text-5xl block mb-4">🕊️</span>
                <h2
                  className="text-2xl font-medium m-0 mb-3"
                  style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}
                >
                  Well Done
                </h2>
                <p
                  className="text-sm m-0 mb-6"
                  style={{
                    fontFamily: 'Source Sans 3, sans-serif',
                    color: t.textMuted,
                    lineHeight: 1.7,
                    maxWidth: 320,
                    marginLeft: 'auto',
                    marginRight: 'auto',
                  }}
                >
                  Well done for choosing to repair. That takes courage.
                  Every step toward each other is a step toward healing.
                </p>

                {selectedTool.scripture_text && selectedTool.scripture_reference && (
                  <div
                    className="rounded-xl p-5 mb-6 text-left"
                    style={{ background: t.pillarSpiritualBg, border: `1px solid ${t.border}` }}
                  >
                    <p
                      className="text-base italic m-0 mb-2"
                      style={{
                        fontFamily: 'Cormorant Garamond, serif',
                        color: t.textPrimary,
                        lineHeight: 1.7,
                      }}
                    >
                      &ldquo;{selectedTool.scripture_text}&rdquo;
                    </p>
                    <p
                      className="text-xs m-0 font-semibold"
                      style={{ color: t.pillarSpiritualText, fontFamily: 'Source Sans 3, sans-serif' }}
                    >
                      {selectedTool.scripture_reference}
                    </p>
                  </div>
                )}

                <button
                  onClick={goBack}
                  className="w-full py-4 rounded-xl text-sm font-semibold text-white border-none cursor-pointer"
                  style={{
                    fontFamily: 'Source Sans 3, sans-serif',
                    background: 'linear-gradient(135deg, #B8860B, #8B6914)',
                  }}
                >
                  Back to Repair Tools
                </button>
              </div>

              <div className="text-center py-6">
                <p className="text-sm italic m-0" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textMuted }}>
                  &ldquo;Be kind and compassionate to one another, forgiving each other.&rdquo;
                </p>
                <p className="text-xs m-0 mt-1" style={{ color: t.textLight }}>Ephesians 4:32</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    /* ---- Step Walkthrough ---- */
    return (
      <div className="min-h-screen" style={{ background: t.bgPrimary }}>
        <TopBar
          title={selectedTool.title}
          subtitle={`Step ${currentStep + 1} of ${totalSteps}`}
          backHref="/emergency"
        />
        <div className="px-4 py-6">
          <div
            className="max-w-lg mx-auto"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(12px)',
              transition: 'all 0.6s ease',
            }}
          >
            {/* Tool header */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{selectedTool.icon}</span>
              <div className="flex-1 min-w-0">
                <h2
                  className="text-xl font-medium m-0"
                  style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}
                >
                  {selectedTool.title}
                </h2>
                <p
                  className="text-xs m-0 mt-0.5"
                  style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif', lineHeight: 1.5 }}
                >
                  {selectedTool.description}
                </p>
              </div>
            </div>

            {/* Step progress bar */}
            <div className="flex gap-1.5 mb-5">
              {steps.map((_: ToolStep, i: number) => (
                <div
                  key={i}
                  className="flex-1 h-2 rounded-full"
                  style={{
                    background: i <= currentStep ? t.pillarCommText : t.border,
                    opacity: i <= currentStep ? 1 : 0.45,
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </div>

            {/* Current step card */}
            {step && (
              <div
                className="rounded-3xl p-7 mb-5"
                style={{ background: t.bgCard, boxShadow: t.shadowCard }}
              >
                <div className="flex items-center gap-3.5 mb-5">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{
                      background: t.pillarCommBg,
                      color: t.pillarCommText,
                      fontFamily: 'Source Sans 3, sans-serif',
                    }}
                  >
                    {step.step}
                  </div>
                  <h3
                    className="text-lg font-medium m-0"
                    style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}
                  >
                    {step.title}
                  </h3>
                </div>

                <p
                  className="text-sm m-0"
                  style={{
                    fontFamily: 'Source Sans 3, sans-serif',
                    color: t.textPrimary,
                    lineHeight: 1.8,
                  }}
                >
                  {step.text}
                </p>
              </div>
            )}

            {/* Scripture card on last step */}
            {isLastStep && selectedTool.scripture_text && selectedTool.scripture_reference && (
              <div
                className="rounded-xl p-5 mb-5"
                style={{ background: t.pillarSpiritualBg, border: `1px solid ${t.border}` }}
              >
                <p
                  className="text-base italic m-0 mb-2"
                  style={{
                    fontFamily: 'Cormorant Garamond, serif',
                    color: t.textPrimary,
                    lineHeight: 1.7,
                  }}
                >
                  &ldquo;{selectedTool.scripture_text}&rdquo;
                </p>
                <p
                  className="text-xs m-0 font-semibold"
                  style={{ color: t.pillarSpiritualText, fontFamily: 'Source Sans 3, sans-serif' }}
                >
                  {selectedTool.scripture_reference}
                </p>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3">
              {currentStep > 0 && (
                <button
                  onClick={goToPrevStep}
                  className="flex-1 py-4 rounded-xl text-sm font-semibold cursor-pointer"
                  style={{
                    background: 'transparent',
                    border: `1.5px solid ${t.border}`,
                    color: t.textSecondary,
                    fontFamily: 'Source Sans 3, sans-serif',
                  }}
                >
                  &larr; Previous Step
                </button>
              )}
              {!isLastStep ? (
                <button
                  onClick={goToNextStep}
                  className="flex-1 py-4 rounded-xl text-sm font-semibold text-white border-none cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #B8860B, #8B6914)',
                    fontFamily: 'Source Sans 3, sans-serif',
                  }}
                >
                  Next Step &rarr;
                </button>
              ) : (
                <button
                  onClick={completeTool}
                  className="flex-1 py-4 rounded-xl text-sm font-semibold text-white border-none cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #5B8A3C, #3D6B28)',
                    fontFamily: 'Source Sans 3, sans-serif',
                  }}
                >
                  Complete &#10003;
                </button>
              )}
            </div>

            {/* Gentle encouragement */}
            <div className="text-center py-5">
              <p
                className="text-xs m-0"
                style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif', lineHeight: 1.6 }}
              >
                Take your time. There&apos;s no rush here.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════ VIEW 1: Tool Selection ═══════════ */

  return (
    <div className="min-h-screen" style={{ background: t.bgPrimary }}>
      <TopBar
        title="Repair Tools"
        subtitle="Step-by-step guides for when things get hard"
        backHref="/dashboard"
      />
      <div className="px-4 py-6">
        <div
          className="max-w-lg mx-auto"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(12px)',
            transition: 'all 0.6s ease',
          }}
        >
          {/* Warm intro card */}
          <div
            className="rounded-2xl p-6 mb-5"
            style={{ background: t.pillarSafetyBg, border: `1px solid ${t.border}` }}
          >
            <div className="flex items-start gap-3.5">
              <span className="text-2xl flex-shrink-0 mt-0.5">🕊️</span>
              <div>
                <h2
                  className="text-lg font-medium m-0 mb-2"
                  style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}
                >
                  Every Couple Argues
                </h2>
                <p
                  className="text-sm m-0"
                  style={{
                    fontFamily: 'Source Sans 3, sans-serif',
                    color: t.textSecondary,
                    lineHeight: 1.7,
                  }}
                >
                  What matters is how you repair. These tools walk you through conflict
                  resolution, rooted in scripture and grace. Pick the one that fits
                  where you are right now.
                </p>
              </div>
            </div>
          </div>

          {/* Tool cards */}
          <div className="space-y-3">
            {tools.map((tool, toolIdx) => {
              const typeStyle = TOOL_TYPE_LABELS[tool.tool_type] || {
                label: tool.tool_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
                bg: t.pillarCommBg,
                text: t.pillarCommText,
              };
              const urgencyStyle = tool.urgency ? URGENCY_STYLES[tool.urgency] : null;
              const isLocked = !isPremium && toolIdx >= FREE_TOOL_LIMIT;

              return (
                <button
                  key={tool.id}
                  onClick={() => isLocked ? undefined : selectTool(tool)}
                  className="w-full rounded-2xl p-5 text-left cursor-pointer border-none transition-all hover:-translate-y-0.5"
                  style={{ background: t.bgCard, boxShadow: t.shadowCard, opacity: isLocked ? 0.6 : 1 }}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: t.pillarSafetyBg }}
                    >
                      {tool.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          className="text-base font-semibold m-0"
                          style={{
                            fontFamily: 'Cormorant Garamond, serif',
                            color: t.textPrimary,
                            fontSize: 17,
                          }}
                        >
                          {tool.title}
                        </h3>
                        {isLocked && <PremiumBadge />}
                      </div>
                      <p
                        className="text-xs m-0 mb-3"
                        style={{
                          fontFamily: 'Source Sans 3, sans-serif',
                          color: t.textMuted,
                          lineHeight: 1.6,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical' as const,
                          overflow: 'hidden',
                        }}
                      >
                        {tool.description}
                      </p>

                      {/* Badges row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Tool type badge */}
                        <span
                          className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                          style={{ background: typeStyle.bg, color: typeStyle.text }}
                        >
                          {typeStyle.label}
                        </span>

                        {/* Duration badge */}
                        {tool.duration_minutes && (
                          <span
                            className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                            style={{ background: t.bgCardHover, color: t.textMuted }}
                          >
                            ~{tool.duration_minutes} min
                          </span>
                        )}

                        {/* Urgency indicator */}
                        {urgencyStyle && (
                          <span
                            className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                            style={{ background: urgencyStyle.bg, color: urgencyStyle.text }}
                          >
                            {urgencyStyle.label}
                          </span>
                        )}
                      </div>

                      {/* Scripture reference */}
                      {tool.scripture_reference && (
                        <p
                          className="text-xs m-0 mt-2 italic"
                          style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textLight }}
                        >
                          {tool.scripture_reference}
                        </p>
                      )}
                    </div>

                    {/* Arrow */}
                    <span
                      className="flex-shrink-0 mt-1"
                      style={{ color: t.textLink, fontSize: 18 }}
                    >
                      &rarr;
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Upgrade prompt for free users */}
          {!isPremium && tools.length > FREE_TOOL_LIMIT && (
            <div className="mt-6">
              <UpgradePrompt feature="All Conflict Repair Tools" compact />
            </div>
          )}

          {/* Empty state */}
          {tools.length === 0 && (
            <div
              className="rounded-2xl p-8 text-center"
              style={{ background: t.bgCard, boxShadow: t.shadowCard }}
            >
              <span className="text-4xl block mb-3">🛠️</span>
              <p
                className="text-sm m-0"
                style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}
              >
                No repair tools available yet. Check back soon.
              </p>
            </div>
          )}

          {/* Safety note */}
          <div
            className="rounded-xl p-4 mt-5"
            style={{ background: t.redBg, border: `1px solid ${t.red}20` }}
          >
            <p
              className="text-xs m-0"
              style={{
                fontFamily: 'Source Sans 3, sans-serif',
                color: t.textSecondary,
                lineHeight: 1.6,
              }}
            >
              If you or your spouse are in immediate danger, please contact
              emergency services or a domestic abuse helpline. These tools are for
              relational conflict, not situations involving abuse or violence.
            </p>
          </div>

          {/* Footer */}
          <div className="text-center py-6">
            <p className="text-sm italic m-0" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textMuted }}>
              &ldquo;A cord of three strands is not quickly broken.&rdquo;
            </p>
            <p className="text-xs m-0 mt-1" style={{ color: t.textLight }}>Ecclesiastes 4:12</p>
          </div>
        </div>
      </div>
    </div>
  );
}
