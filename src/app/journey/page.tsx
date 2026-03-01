'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { ThreefoldLogo } from '@/components/ui/Logo';
import { TopBar } from '@/components/ui/TopBar';
import { t } from '@/lib/tokens';

/* ═══ BIBLE BOOKS (canonical order) ═══ */
const BIBLE_BOOKS = {
  'Old Testament': [
    'Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth',
    '1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles',
    'Ezra','Nehemiah','Esther','Job','Psalm','Proverbs','Ecclesiastes',
    'Song of Solomon','Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel',
    'Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk',
    'Zephaniah','Haggai','Zechariah','Malachi'
  ],
  'New Testament': [
    'Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians','2 Corinthians',
    'Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonians',
    '1 Timothy','2 Timothy','Titus','Philemon','Hebrews','James','1 Peter','2 Peter',
    '1 John','2 John','3 John','Jude','Revelation'
  ]
};

interface BibleReading { book: string; chapter: number; verse_start: number|null; verse_end: number|null; scripture_reference: string; read_at: string; }
interface Stats { devos_done: number; current_day: number; total_days: number; streak: number; longest_streak: number; books_read: number; }

export default function JourneyPage() {
  const [readings, setReadings] = useState<BibleReading[]>([]);
  const [stats, setStats] = useState<Stats|null>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => { load(); }, []);
  useEffect(() => { if (!loading) setTimeout(() => setVisible(true), 100); }, [loading]);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth'); return; }

    // Profile
    const { data: prof } = await supabase.from('profiles').select('current_devotional_day,streak_count,longest_streak').eq('id',user.id).single();

    // Devotional completions count
    const { count: devCount } = await supabase.from('devotional_completions').select('*',{count:'exact',head:true}).eq('profile_id',user.id);

    // Total devotionals
    const { count: totalDays } = await supabase.from('devotionals').select('*',{count:'exact',head:true}).eq('is_active',true);

    // Bible readings
    const { data: br } = await supabase.from('bible_readings').select('book,chapter,verse_start,verse_end,scripture_reference,read_at').eq('profile_id',user.id).order('read_at',{ascending:true});

    const uniqueBooks = new Set((br||[]).map(r => r.book));

    setReadings(br || []);
    setStats({
      devos_done: devCount || 0,
      current_day: prof?.current_devotional_day || 1,
      total_days: totalDays || 90,
      streak: prof?.streak_count || 0,
      longest_streak: Math.max(prof?.longest_streak || 0, prof?.streak_count || 0),
      books_read: uniqueBooks.size,
    });
    setLoading(false);
  }

  // Build sets for quick lookup
  const readBooks = new Set(readings.map(r => r.book));
  const readRefs = new Set(readings.map(r => r.scripture_reference));

  // Count readings per book
  const bookCounts: Record<string,number> = {};
  readings.forEach(r => { bookCounts[r.book] = (bookCounts[r.book]||0)+1; });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: t.bgPrimary }}>
        <ThreefoldLogo size={48} />
      </div>
    );
  }

  const progressPct = stats ? Math.round((stats.devos_done / stats.total_days) * 100) : 0;

  return (
    <div className="min-h-screen" style={{ background: t.bgPrimary }}>
      <div className="max-w-2xl mx-auto" style={{ opacity:visible?1:0, transform:visible?'none':'translateY(12px)', transition:'all .6s ease' }}>

        <TopBar title="Your Journey" backHref="/dashboard" />

        <div className="px-4 pb-10">

          {/* ═══ STATS ═══ */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="rounded-2xl p-4 text-center" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
              <div className="text-3xl font-bold" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textLink }}>
                {stats?.devos_done || 0}
              </div>
              <div className="text-xs mt-1" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>Days completed</div>
            </div>
            <div className="rounded-2xl p-4 text-center" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
              <div className="text-3xl font-bold" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textLink }}>
                {stats?.books_read || 0}
              </div>
              <div className="text-xs mt-1" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>Bible books read</div>
            </div>
            <div className="rounded-2xl p-4 text-center" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
              <div className="text-3xl font-bold" style={{ fontFamily: 'Cormorant Garamond, serif', color: (stats?.streak||0) > 0 ? t.textLink : t.textMuted }}>
                {stats?.streak || 0}
              </div>
              <div className="text-xs mt-1" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>Current streak 🔥</div>
            </div>
            <div className="rounded-2xl p-4 text-center" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
              <div className="text-3xl font-bold" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textLink }}>
                {stats?.longest_streak || 0}
              </div>
              <div className="text-xs mt-1" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>Longest streak</div>
            </div>
          </div>

          {/* ═══ DEVOTIONAL PROGRESS ═══ */}
          <div className="rounded-2xl p-5 mb-6" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold" style={{ color: t.textPrimary, fontFamily: 'Source Sans 3, sans-serif' }}>90-Day Journey</span>
              <span className="text-sm font-bold" style={{ color: t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}>{progressPct}%</span>
            </div>
            <div className="w-full h-3 rounded-full mb-3" style={{ background: t.border }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progressPct}%`, background: 'linear-gradient(135deg, #B8860B, #8B6914)' }} />
            </div>
            <p className="text-xs m-0" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>
              Day {stats?.current_day || 1} of {stats?.total_days || 90} · {stats?.total_days ? stats.total_days - (stats?.devos_done||0) : 90} remaining
            </p>
          </div>

          {/* ═══ BIBLE MAP ═══ */}
          <div className="rounded-2xl p-5 mb-6" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">📖</span>
              <h2 className="text-sm font-semibold uppercase tracking-wider m-0" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
                Bible Map
              </h2>
            </div>
            <p className="text-xs mb-4 m-0" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>
              Books you&apos;ve read through the devotionals light up as you go.
            </p>

            {Object.entries(BIBLE_BOOKS).map(([testament, books]) => (
              <div key={testament} className="mb-5">
                <h3 className="text-xs font-bold uppercase tracking-widest mb-2.5" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>
                  {testament}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {books.map(book => {
                    const isRead = readBooks.has(book);
                    const count = bookCounts[book] || 0;
                    return (
                      <div
                        key={book}
                        className="relative group"
                      >
                        <div
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-default"
                          style={{
                            background: isRead
                              ? count >= 3 ? 'linear-gradient(135deg, #B8860B, #8B6914)' 
                                : count >= 2 ? t.goldBg 
                                : '#FFF8E8'
                              : t.bgAccent,
                            color: isRead
                              ? count >= 3 ? 'white' : t.textLink
                              : t.textLight,
                            fontFamily: 'Source Sans 3, sans-serif',
                            border: isRead ? 'none' : `1px solid ${t.border}`,
                          }}
                        >
                          {book.replace(/^\d\s/, (m) => m.trim() + ' ')}
                          {count > 1 && <span className="ml-0.5 text-[9px] opacity-70">×{count}</span>}
                        </div>

                        {/* Tooltip on hover showing references */}
                        {isRead && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-3 py-2 rounded-lg text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                            style={{ background: '#1a1a1a', color: 'white', fontFamily: 'Source Sans 3, sans-serif' }}>
                            {readings.filter(r => r.book === book).map(r => r.scripture_reference).join(', ')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-3 rounded" style={{ background: t.bgAccent, border: `1px solid ${t.border}` }} />
                <span className="text-[10px]" style={{ color: t.textMuted }}>Not yet</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-3 rounded" style={{ background: '#FFF8E8' }} />
                <span className="text-[10px]" style={{ color: t.textMuted }}>1 reading</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-3 rounded" style={{ background: t.goldBg }} />
                <span className="text-[10px]" style={{ color: t.textMuted }}>2+</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-3 rounded" style={{ background: 'linear-gradient(135deg, #B8860B, #8B6914)' }} />
                <span className="text-[10px]" style={{ color: t.textMuted }}>3+</span>
              </div>
            </div>
          </div>

          {/* ═══ READING LOG ═══ */}
          {readings.length > 0 && (
            <div className="rounded-2xl p-5 mb-6" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📋</span>
                <h2 className="text-sm font-semibold uppercase tracking-wider m-0" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
                  Reading Log
                </h2>
              </div>
              <div className="space-y-2">
                {[...readings].reverse().map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: i % 2 === 0 ? t.bgAccent : 'transparent' }}>
                    <div>
                      <span className="text-sm font-semibold" style={{ color: t.textPrimary, fontFamily: 'Source Sans 3, sans-serif' }}>{r.scripture_reference}</span>
                    </div>
                    <span className="text-xs" style={{ color: t.textMuted }}>
                      {new Date(r.read_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ EMPTY STATE ═══ */}
          {readings.length === 0 && (
            <div className="rounded-2xl p-8 text-center" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
              <div className="text-4xl mb-3">📖</div>
              <h3 className="text-lg font-medium mb-2" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>
                Your Bible map is empty
              </h3>
              <p className="text-sm m-0 mb-4" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif', lineHeight: 1.6 }}>
                Complete your first devotional to start lighting up the map. Each day&apos;s scripture is tracked here automatically.
              </p>
              <a href="/devotional" className="inline-block px-6 py-3 rounded-full text-sm font-semibold text-white no-underline" style={{ background: 'linear-gradient(135deg, #B8860B, #8B6914)', fontFamily: 'Source Sans 3, sans-serif' }}>
                Start Day 1 →
              </a>
            </div>
          )}

          {/* Footer */}
          <div className="text-center py-8">
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
