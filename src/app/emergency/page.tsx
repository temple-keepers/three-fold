'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { TopBar } from '@/components/ui/TopBar';
import { ThreefoldLogo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { t } from '@/lib/tokens';
import Image from 'next/image';
import Link from 'next/link';

const URGENCY_CONFIG: Record<string, { bg: string; border: string; text: string; label: string }> = {
  immediate: { bg: t.redBg, border: `${t.red}30`, text: t.red, label: 'Use Now' },
  medium: { bg: t.goldBg, border: `${t.textLink}30`, text: t.textLink, label: 'When Calm' },
  reflective: { bg: t.pillarSafetyBg, border: `${t.pillarSafetyText}30`, text: t.pillarSafetyText, label: 'Reflect' },
};

export default function EmergencyPage() {
  const [tools, setTools] = useState<any[]>([]);
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('conflict_tools').select('*').eq('is_active', true).order('display_order');
      if (data) setTools(data);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!loading) setTimeout(() => setVisible(true), 100);
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: t.bgPrimary }}>
        <ThreefoldLogo size={48} />
      </div>
    );
  }

  if (selectedTool) {
    const steps = selectedTool.steps || [];
    const step = steps[currentStep];
    const urgency = URGENCY_CONFIG[selectedTool.urgency] || URGENCY_CONFIG.medium;

    return (
      <div className="min-h-screen px-4 py-6" style={{ background: t.bgPrimary }}>
        <div className="max-w-lg mx-auto" style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease' }}>
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => { setSelectedTool(null); setCurrentStep(0); }} className="text-sm border-none bg-transparent cursor-pointer" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>
              ← Back to tools
            </button>
            <ThemeToggle size="sm" />
          </div>

          <div className="rounded-3xl p-7" style={{ background: t.bgCard, boxShadow: t.shadowCardLg }}>
            <div className="flex items-center gap-3 mb-2">
              <Image src="/icons/icon-tools.png" alt="" width={36} height={36} />
              <div>
                <h1 className="text-2xl font-medium m-0" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>{selectedTool.title}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold" style={{ background: urgency.bg, color: urgency.text }}>{urgency.label}</span>
                  <span className="text-xs" style={{ color: t.textMuted }}>~{selectedTool.duration_minutes} min</span>
                </div>
              </div>
            </div>

            <div className="flex gap-1.5 my-5">
              {steps.map((_: any, i: number) => (
                <div key={i} className="flex-1 h-1.5 rounded-full transition-all" style={{ background: i <= currentStep ? '#B8860B' : t.border }} />
              ))}
            </div>

            {step && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: t.goldBg, color: t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}>{step.step}</div>
                  <h2 className="text-lg font-medium m-0" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>{step.title}</h2>
                </div>
                <p className="text-sm mb-6" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary, lineHeight: 1.7 }}>{step.text}</p>
              </div>
            )}

            {currentStep === steps.length - 1 && selectedTool.scripture_text && (
              <div className="rounded-xl p-5 mb-5" style={{ background: t.bgCardHover, border: `1px solid ${t.border}` }}>
                <p className="text-base italic m-0 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary, lineHeight: 1.7 }}>&ldquo;{selectedTool.scripture_text}&rdquo;</p>
                <p className="text-xs m-0 font-semibold" style={{ color: t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}>{selectedTool.scripture_reference}</p>
              </div>
            )}

            <div className="flex gap-3">
              {currentStep > 0 && (
                <button onClick={() => setCurrentStep(currentStep - 1)} className="flex-1 py-4 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: 'transparent', border: `1.5px solid ${t.border}`, color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>← Previous</button>
              )}
              {currentStep < steps.length - 1 ? (
                <button onClick={() => setCurrentStep(currentStep + 1)} className="flex-1 py-4 rounded-xl text-sm font-semibold text-white cursor-pointer border-none" style={{ background: 'linear-gradient(135deg, #B8860B, #8B6914)', fontFamily: 'Source Sans 3, sans-serif', boxShadow: '0 4px 16px rgba(184,134,11,0.2)' }}>Next Step →</button>
              ) : (
                <button onClick={() => { setSelectedTool(null); setCurrentStep(0); }} className="flex-1 py-4 rounded-xl text-sm font-semibold text-white cursor-pointer border-none" style={{ background: 'linear-gradient(135deg, #5B8A3C, #3D6B28)', fontFamily: 'Source Sans 3, sans-serif' }}>Done ✓</button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6" style={{ background: t.bgPrimary }}>
      <div className="max-w-2xl mx-auto" style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.6s ease' }}>
        <TopBar title="Conflict Repair Tools" subtitle="Step-by-step guides for when things get hard" backHref="/dashboard" />

        <div className="rounded-xl p-4 mb-5 mt-4" style={{ background: t.goldBg, border: `1px solid rgba(212,168,71,0.13)` }}>
          <p className="text-sm m-0" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textSecondary, lineHeight: 1.6 }}>
            💛 <strong>It&apos;s okay to need these.</strong> Every couple faces conflict. These tools help you navigate it without causing more damage.
          </p>
        </div>

        <div className="space-y-3">
          {tools.map(tool => {
            const urgency = URGENCY_CONFIG[tool.urgency] || URGENCY_CONFIG.medium;
            const stepCount = (tool.steps || []).length;
            return (
              <button key={tool.id} onClick={() => { setSelectedTool(tool); setCurrentStep(0); }} className="w-full rounded-2xl p-5 text-left cursor-pointer transition-all hover:-translate-y-0.5 border-none" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: urgency.bg }}>
                    <Image src="/icons/icon-tools.png" alt="" width={28} height={28} />
                  </div>
                  <div className="flex-1">
                    <div className="text-base font-semibold" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>{tool.title}</div>
                    <div className="text-xs mt-1" style={{ color: t.textMuted, lineHeight: 1.5 }}>{tool.description}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: urgency.bg, color: urgency.text }}>{urgency.label}</span>
                      <span className="text-xs" style={{ color: t.textMuted }}>{stepCount} steps · ~{tool.duration_minutes} min</span>
                    </div>
                  </div>
                  <span style={{ color: t.textLink }}>→</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-xl p-4 mt-6" style={{ background: t.redBg, border: `1px solid ${t.red}20` }}>
          <p className="text-xs m-0" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textSecondary, lineHeight: 1.6 }}>
            🚨 <strong>If you or your spouse are in immediate danger,</strong> please contact emergency services or a domestic abuse helpline. These tools are designed for relational conflict, not situations involving abuse or violence.
          </p>
        </div>
      </div>
    </div>
  );
}
