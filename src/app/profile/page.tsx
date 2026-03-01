'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useTheme } from '@/lib/theme';
import { NotificationSettings } from '@/components/ui/NotificationSettings';
import Link from 'next/link';

/* ═══════════════════════════════════════ TYPES ═══════════════════════════════════════ */
interface Profile { id:string; email:string; first_name:string|null; last_name:string|null; gender:string|null; date_of_birth:string|null; avatar_url:string|null; role:string; couple_id:string|null; partner_id:string|null; streak_count:number; streak_last_date:string|null; onboarding_completed:boolean; created_at:string; }
interface Partner { id:string; first_name:string|null; last_name:string|null; streak_count:number; last_active_at:string|null; }
interface CoupleInfo { id:string; tier:string; wedding_date:string|null; years_married:number|null; status:string; reset_started_at:string|null; reset_completed_at:string|null; reset_phase:number|null; }
interface Assessment { id:string; score_covenant:number; score_emotional_safety:number; score_communication:number; score_spiritual:number; score_overall:number; tier:string; completed_at:string; }
interface MilestoneItem { id:string; earned_at:string; milestones:{ title:string; icon:string; description:string; category:string }|null; }
interface ChurchAmb { id:string; role:string; churches:{ name:string }|null; }

/* ═══════════════════════════════════════ TOKENS ═══════════════════════════════════════ */
/* Theme-aware: use CSS variables so dark mode works automatically */
const V = {
  bgPrimary: 'var(--bg-primary)',
  bgCard: 'var(--bg-card)',
  bgCardHover: 'var(--bg-card-hover)',
  bgAccent: 'var(--bg-accent)',
  bgInput: 'var(--bg-input)',
  bgWarm: 'var(--bg-warm)',
  textPrimary: 'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  textMuted: 'var(--text-muted)',
  textLight: 'var(--text-light)',
  textLink: 'var(--text-link)',
  border: 'var(--border)',
  borderLight: 'var(--border-light)',
  green: 'var(--green)',
  greenBg: 'var(--green-bg)',
  red: 'var(--red)',
  redBg: 'var(--red-bg)',
  goldBg: 'var(--gold-bg)',
  pillarCovenantBg: 'var(--pillar-covenant-bg)',
  pillarCovenantText: 'var(--pillar-covenant-text)',
  pillarSafetyBg: 'var(--pillar-safety-bg)',
  pillarSafetyText: 'var(--pillar-safety-text)',
  pillarCommBg: 'var(--pillar-comm-bg)',
  pillarCommText: 'var(--pillar-comm-text)',
  pillarSpiritualBg: 'var(--pillar-spiritual-bg)',
  pillarSpiritualText: 'var(--pillar-spiritual-text)',
  shadowCard: 'var(--shadow-card)',
};

/* Static brand colours (only for hero gradient & gold accents that don't change) */
const B = {
  navy:'#0F1E2E', navyMid:'#1A2D40', navyLight:'#243A50',
  gold:'#C7A23A', goldLight:'#D4B45A',
  burgundy:'#6B2C3E',
  orange:'#E65100',
};

const PILLAR: Record<string,{label:string;icon:string;color:string;bg:string}> = {
  covenant:         {label:'Covenant',         icon:'\u{1F91D}', color:V.pillarCovenantText, bg:V.pillarCovenantBg},
  emotional_safety: {label:'Emotional Safety', icon:'\u{1F6E1}', color:V.pillarSafetyText,   bg:V.pillarSafetyBg},
  communication:    {label:'Communication',    icon:'\u{1F4AC}', color:V.pillarCommText,     bg:V.pillarCommBg},
  spiritual:        {label:'Spiritual',        icon:'\u{271D}',  color:V.pillarSpiritualText,bg:V.pillarSpiritualBg},
};
const TIER: Record<string,{label:string;color:string;icon:string}> = {
  strengthen:{label:'Strengthen',color:V.green,icon:'\u{1F33F}'},  repair:{label:'Repair',color:V.textLink,icon:'\u{1F527}'},
  restore:{label:'Restore',color:V.red,icon:'\u{1F305}'},         foundation:{label:'Foundation',color:V.pillarCovenantText,icon:'\u{1F3DB}'},
  growing:{label:'Growing',color:V.green,icon:'\u{1F331}'},       thriving:{label:'Thriving',color:V.pillarSafetyText,icon:'\u{2728}'},
  mentoring:{label:'Mentoring',color:V.textLink,icon:'\u{1F451}'},
};

/* ═══════════════════════════════════════ PAGE ═══════════════════════════════════════ */
export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: V.bgPrimary }} />}>
      <ProfileContent />
    </Suspense>
  );
}

function ProfileContent() {
  const [profile,setProfile]=useState<Profile|null>(null);
  const [partner,setPartner]=useState<Partner|null>(null);
  const [couple,setCouple]=useState<CoupleInfo|null>(null);
  const [assessment,setAssessment]=useState<Assessment|null>(null);
  const [allAssessments,setAllAssessments]=useState<Assessment[]>([]);
  const [milestones,setMilestones]=useState<MilestoneItem[]>([]);
  const [devotionalCount,setDevotionalCount]=useState(0);
  const [assessmentCount,setAssessmentCount]=useState(0);
  const [completionDates,setCompletionDates]=useState<string[]>([]);
  const [ambassador,setAmbassador]=useState<ChurchAmb|null>(null);
  const [loading,setLoading]=useState(true);
  const [vis,setVis]=useState(false);
  const [editing,setEditing]=useState(false);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({first_name:'',last_name:'',gender:'',date_of_birth:''});
  const [signOutOpen,setSignOutOpen]=useState(false);
  const [showAllMs,setShowAllMs]=useState(false);
  const [subscription,setSubscription]=useState<{plan_type:string;status:string;cancel_at_period_end:boolean;current_period_end:string|null}|null>(null);
  const [billingLoading,setBillingLoading]=useState(false);
  const [checkoutStatus,setCheckoutStatus]=useState<'success'|'cancel'|null>(null);

  const supabase=createClient();
  const router=useRouter();
  const searchParams=useSearchParams();

  const load=useCallback(async()=>{
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){router.push('/auth');return;}
    const {data:p}=await supabase.from('profiles').select('*').eq('id',user.id).single();
    if(!p)return;
    setProfile(p);
    setForm({first_name:p.first_name||'',last_name:p.last_name||'',gender:p.gender||'',date_of_birth:p.date_of_birth||''});

    const [ptr,cp,ass,aAll,ms,dc,ac,comps,amb,sub]=await Promise.all([
      p.partner_id?supabase.from('profiles').select('id,first_name,last_name,streak_count,last_active_at').eq('id',p.partner_id).maybeSingle():{data:null},
      p.couple_id?supabase.from('couples').select('id,tier,wedding_date,years_married,status,reset_started_at,reset_completed_at,reset_phase').eq('id',p.couple_id).maybeSingle():{data:null},
      supabase.from('assessments').select('*').eq('profile_id',user.id).eq('status','completed').order('completed_at',{ascending:false}).limit(1).maybeSingle(),
      supabase.from('assessments').select('id,score_overall,tier,completed_at').eq('profile_id',user.id).eq('status','completed').order('completed_at',{ascending:true}),
      supabase.from('user_milestones').select('id,earned_at,milestones(title,icon,description,category)').eq('profile_id',user.id).order('earned_at',{ascending:false}).limit(30),
      supabase.from('devotional_completions').select('*',{count:'exact',head:true}).eq('profile_id',user.id),
      supabase.from('assessments').select('*',{count:'exact',head:true}).eq('profile_id',user.id).eq('status','completed'),
      supabase.from('devotional_completions').select('read_at').eq('profile_id',user.id).order('read_at',{ascending:false}).limit(90),
      supabase.from('church_ambassadors').select('id,role,churches(name)').eq('profile_id',user.id).limit(1).maybeSingle(),
      supabase.from('subscriptions').select('plan_type,status,cancel_at_period_end,current_period_end').eq('profile_id',user.id).eq('status','active').order('created_at',{ascending:false}).limit(1).maybeSingle(),
    ]);
    if(ptr.data)setPartner(ptr.data as Partner);
    if(cp.data)setCouple(cp.data as CoupleInfo);
    if(ass.data)setAssessment(ass.data as Assessment);
    if(aAll.data)setAllAssessments(aAll.data as Assessment[]);
    if(ms.data)setMilestones(ms.data as unknown as MilestoneItem[]);
    setDevotionalCount(dc.count||0);
    setAssessmentCount(ac.count||0);
    if(comps.data)setCompletionDates((comps.data as {read_at:string}[]).map(d=>d.read_at.split('T')[0]));
    if(amb.data)setAmbassador(amb.data as unknown as ChurchAmb);
    if(sub.data)setSubscription(sub.data as any);
    setLoading(false);
  },[]);

  useEffect(()=>{load();},[load]);
  useEffect(()=>{if(!loading)requestAnimationFrame(()=>setTimeout(()=>setVis(true),60));},[loading]);
  useEffect(()=>{
    const status=searchParams?.get('checkout');
    if(status==='success')setCheckoutStatus('success');
    else if(status==='cancel')setCheckoutStatus('cancel');
  },[searchParams]);

  async function saveProfile(){
    if(!profile)return; setSaving(true);
    await supabase.from('profiles').update({first_name:form.first_name||null,last_name:form.last_name||null,gender:form.gender||null,date_of_birth:form.date_of_birth||null}).eq('id',profile.id);
    await load(); setSaving(false); setEditing(false);
  }

  const streakAlive=useMemo(()=>{
    if(!profile?.streak_last_date)return false;
    const t=new Date().toISOString().split('T')[0];
    const y=new Date(Date.now()-86400000).toISOString().split('T')[0];
    return profile.streak_last_date===t||profile.streak_last_date===y;
  },[profile]);

  const daysOnPlatform=useMemo(()=>profile?Math.max(1,Math.floor((Date.now()-new Date(profile.created_at).getTime())/86400000)):0,[profile]);

  const anniversaryDays=useMemo(()=>{
    if(!couple?.wedding_date)return null;
    const wd=new Date(couple.wedding_date); const now=new Date();
    const ty=new Date(now.getFullYear(),wd.getMonth(),wd.getDate());
    const diff=ty.getTime()-now.getTime();
    return diff<0?Math.ceil((new Date(now.getFullYear()+1,wd.getMonth(),wd.getDate()).getTime()-now.getTime())/86400000):Math.ceil(diff/86400000);
  },[couple]);

  const {weeks:heatWeeks,set:compSet}=useMemo(()=>{
    const s=new Set(completionDates); const wks:string[][]=[];
    const today=new Date(); const start=new Date(today);
    start.setDate(start.getDate()-start.getDay()-7*11);
    for(let w=0;w<12;w++){const wk:string[]=[];for(let d=0;d<7;d++){const dt=new Date(start);dt.setDate(dt.getDate()+w*7+d);wk.push(dt.toISOString().split('T')[0]);}wks.push(wk);}
    return {weeks:wks,set:s};
  },[completionDates]);

  if(loading)return(
    <div className="min-h-screen flex items-center justify-center" style={{background:V.bgPrimary}}>
      <div className="text-center">
        <div className="relative mx-auto" style={{width:56,height:56}}>
          <div className="absolute inset-0 rounded-full animate-ping" style={{background:'rgba(199,162,58,0.08)'}}/>
          <div className="absolute inset-2 rounded-full animate-pulse" style={{background:`linear-gradient(135deg,${B.gold}30,${B.gold}10)`}}/>
        </div>
        <p className="mt-4 text-xs tracking-widest uppercase" style={{color:V.textMuted,fontFamily:'Cinzel,serif',letterSpacing:'0.2em'}}>Loading</p>
      </div>
    </div>
  );
  if(!profile)return null;

  const initials=`${(profile.first_name||'?')[0]}${(profile.last_name||'')[0]||''}`.toUpperCase();
  const fullName=profile.first_name?`${profile.first_name} ${profile.last_name||''}`.trim():'Unnamed User';
  const memberSince=new Date(profile.created_at).toLocaleDateString('en-GB',{month:'long',year:'numeric'});
  const tierKey=couple?.tier||assessment?.tier;
  const tierInfo=tierKey?TIER[tierKey]:null;
  const todayStr=new Date().toISOString().split('T')[0];
  const visibleMs=showAllMs?milestones:milestones.slice(0,6);

  return (
    <div className="min-h-screen" style={{background:V.bgPrimary}}>

      {/* HEADER */}
      <header className="sticky top-0 z-40 backdrop-blur-xl" style={{background:V.bgPrimary,backdropFilter:'blur(12px)',borderBottom:`1px solid ${V.borderLight}`}}>
        <div className="max-w-lg mx-auto flex items-center justify-between px-5 h-12">
          <Link href="/dashboard" className="flex items-center gap-1 no-underline group" style={{color:V.textMuted}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform"><path d="M15 18l-6-6 6-6"/></svg>
          </Link>
          <span className="text-xs tracking-[0.25em] uppercase" style={{fontFamily:'Cinzel,serif',color:V.textPrimary,fontWeight:600}}>Profile</span>
          <div className="w-5"/>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 pb-16">

        {/* ══════════ HERO ══════════ */}
        <section className="relative -mx-5 overflow-hidden" style={{background:`linear-gradient(165deg,${B.navy} 0%,${B.navyMid} 40%,${B.navyLight} 100%)`,minHeight:280}}>
          <div className="absolute inset-0" style={{background:`radial-gradient(ellipse at 25% 20%,${B.gold}08 0%,transparent 55%)`}}/>
          <div className="absolute inset-0" style={{background:`radial-gradient(ellipse at 75% 80%,${B.burgundy}06 0%,transparent 50%)`}}/>
          {/* Grain */}
          <div className="absolute inset-0 opacity-[0.02]" style={{backgroundImage:'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'1\'/%3E%3C/svg%3E")',backgroundSize:'128px'}}/>

          <div className="relative z-10 flex flex-col items-center pt-10 pb-16 px-6 transition-all duration-1000 ease-out" style={{opacity:vis?1:0,transform:vis?'none':'translateY(24px)'}}>
            {/* Avatar */}
            <div className="relative mb-5">
              <div className="absolute -inset-4 rounded-full animate-pulse" style={{background:`radial-gradient(circle,${B.gold}15,transparent 70%)`}}/>
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold relative" style={{background:`linear-gradient(145deg,${B.gold},${B.goldLight},${B.gold})`,color:'#0F1E2E',fontFamily:'Cinzel,serif',boxShadow:`0 8px 32px ${B.gold}30, inset 0 1px 0 ${B.goldLight}40`}}>
                {initials}
                <div className="absolute -inset-[3px] rounded-full" style={{border:`1.5px solid ${B.gold}25`}}/>
              </div>
            </div>
            <h1 className="text-2xl mb-1" style={{fontFamily:'Cormorant Garamond,serif',color:'#F4F1EA',fontWeight:600,letterSpacing:'0.02em'}}>{fullName}</h1>
            <p className="text-xs mb-4" style={{color:'rgba(244,241,234,0.55)',fontFamily:'DM Sans,sans-serif',letterSpacing:'0.04em'}}>{profile.email}</p>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {tierInfo&&<HeroBadge color={tierInfo.color} text={`${tierInfo.icon} ${tierInfo.label}`}/>}
              {profile.role==='super_admin'&&<HeroBadge color="#E57373" text="Admin"/>}
              {ambassador&&<HeroBadge color="#B39DDB" text="Ambassador"/>}
              {couple?.reset_completed_at&&<HeroBadge color={B.goldLight} text="Reset Graduate"/>}
            </div>

            <div className="flex items-center gap-2 mt-4">
              <span className="text-xs" style={{color:'rgba(244,241,234,0.3)'}}>Joined {memberSince}</span>
              <span style={{color:'rgba(244,241,234,0.12)'}}>{'\u00B7'}</span>
              <span className="text-xs" style={{color:'rgba(244,241,234,0.3)'}}>{daysOnPlatform} days</span>
            </div>
          </div>

          <svg className="absolute bottom-0 left-0 right-0 w-full" viewBox="0 0 1440 50" preserveAspectRatio="none" style={{height:28}}>
            <path d="M0,50 L0,28 Q360,0 720,28 Q1080,50 1440,20 L1440,50 Z" fill={V.bgPrimary}/>
          </svg>
        </section>

        {/* ══════════ STATS ══════════ */}
        <section className="grid grid-cols-4 gap-2.5 -mt-4 relative z-20 mb-7" style={{transition:'opacity .6s ease .2s,transform .6s ease .2s',opacity:vis?1:0,transform:vis?'none':'translateY(12px)'}}>
          <StatGem icon={streakAlive&&(profile.streak_count||0)>0?'🔥':'💤'} value={profile.streak_count||0} label="Streak" glow={streakAlive&&(profile.streak_count||0)>0?B.orange:undefined}/>
          <StatGem icon="📖" value={devotionalCount} label="Devos"/>
          <StatGem icon="📋" value={assessmentCount} label="Assessed"/>
          <StatGem icon="🏆" value={milestones.length} label="Earned"/>
        </section>

        {/* ══════════ CHECKOUT STATUS ══════════ */}
        {checkoutStatus==='success'&&(
          <div className="rounded-2xl p-4 mb-6 flex items-center gap-3" style={{background:V.greenBg,border:`1.5px solid ${V.green}30`}}>
            <span className="text-xl">🎉</span>
            <div className="flex-1">
              <div className="text-sm font-semibold" style={{color:V.textPrimary}}>Welcome to Covenant Plus!</div>
              <div className="text-xs" style={{color:V.textMuted}}>Your premium features are now unlocked.</div>
            </div>
            <button onClick={()=>setCheckoutStatus(null)} className="text-xs border-none bg-transparent cursor-pointer" style={{color:V.textMuted}}>{'\u2715'}</button>
          </div>
        )}
        {checkoutStatus==='cancel'&&(
          <div className="rounded-2xl p-4 mb-6 flex items-center gap-3" style={{background:V.bgCard,border:`1px solid ${V.border}`}}>
            <span className="text-lg">💭</span>
            <div className="flex-1">
              <div className="text-sm" style={{color:V.textMuted}}>Checkout was cancelled. No worries — upgrade anytime.</div>
            </div>
            <button onClick={()=>setCheckoutStatus(null)} className="text-xs border-none bg-transparent cursor-pointer" style={{color:V.textMuted}}>{'\u2715'}</button>
          </div>
        )}

        {/* ══════════ FOUR PILLARS ══════════ */}
        {assessment&&(
          <Sect delay={0.3} v={vis}>
            <div className="flex items-center justify-between mb-5">
              <STitle>Four Pillars</STitle>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold" style={{fontFamily:'Cormorant Garamond,serif',color:scoreClr(assessment.score_overall)}}>{assessment.score_overall.toFixed(1)}</span>
                <span className="text-xs" style={{color:V.textSecondary}}>/5</span>
              </div>
            </div>
            <div className="space-y-4">
              {([
                {key:'covenant' as const,score:assessment.score_covenant},
                {key:'emotional_safety' as const,score:assessment.score_emotional_safety},
                {key:'communication' as const,score:assessment.score_communication},
                {key:'spiritual' as const,score:assessment.score_spiritual},
              ]).map((p,i)=>{
                const cfg=PILLAR[p.key]; const pct=(p.score/5)*100; const clr=scoreClr(p.score);
                return(
                  <div key={p.key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{background:cfg.bg}}>{cfg.icon}</div>
                        <span className="text-sm font-medium" style={{color:V.textPrimary,fontFamily:'DM Sans,sans-serif'}}>{cfg.label}</span>
                      </div>
                      <span className="text-sm font-bold tabular-nums" style={{color:clr}}>{p.score.toFixed(1)}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{background:V.bgAccent}}>
                      <div className="h-full rounded-full" style={{width:vis?`${pct}%`:'0%',background:`linear-gradient(90deg,${clr}90,${clr})`,transition:`width 1.2s cubic-bezier(.4,0,.2,1) ${400+i*150}ms`}}/>
                    </div>
                  </div>
                );
              })}
            </div>
            {allAssessments.length>1&&(
              <div className="mt-6 pt-5" style={{borderTop:`1px solid ${V.borderLight}`}}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium uppercase tracking-wider" style={{color:V.textMuted,letterSpacing:'0.08em'}}>Score History</span>
                  <span className="text-xs" style={{color:V.textSecondary}}>{allAssessments.length} taken</span>
                </div>
                <div className="flex items-end gap-1 h-10">
                  {allAssessments.map((a,i)=>{
                    const h=(a.score_overall/5)*100; const clr=scoreClr(a.score_overall); const last=i===allAssessments.length-1;
                    return <div key={a.id} className="flex-1" title={`${a.score_overall.toFixed(1)}`}><div className="w-full rounded-sm" style={{height:`${h}%`,minHeight:3,background:last?clr:`${clr}30`,transition:`height .7s ease ${600+i*80}ms`}}/></div>;
                  })}
                </div>
              </div>
            )}
            <Link href="/assessment" className="flex items-center justify-center gap-1.5 mt-5 text-xs font-semibold no-underline" style={{color:B.gold}}>
              Retake Assessment <span style={{fontSize:10}}>{'\u2192'}</span>
            </Link>
          </Sect>
        )}

        {/* ══════════ ACTIVITY HEATMAP ══════════ */}
        <Sect delay={0.4} v={vis}>
          <div className="flex items-center justify-between mb-4">
            <STitle>Activity</STitle>
            <span className="text-xs" style={{color:V.textSecondary}}>12 weeks</span>
          </div>
          <div className="flex gap-[3px]">
            {heatWeeks.map((week,wi)=>(
              <div key={wi} className="flex flex-col gap-[3px] flex-1">
                {week.map(day=>{
                  const done=compSet.has(day); const today=day===todayStr; const future=day>todayStr;
                  return <div key={day} className="aspect-square rounded-[3px]" style={{background:future?'transparent':done?V.green:V.bgAccent,opacity:future?0:1,boxShadow:today?`inset 0 0 0 1.5px ${B.gold}`:done?'0 0 4px rgba(123,196,90,0.12)':'none',transition:'background .3s'}}/>;
                })}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs" style={{color:V.textMuted}}><strong style={{color:V.textPrimary}}>{completionDates.length}</strong> devotionals</span>
            <div className="flex items-center gap-1">
              <span className="text-xs" style={{color:V.textLight}}>Less</span>
              {[V.bgAccent,V.green,V.green].map((bg,i)=><div key={i} className="w-2 h-2 rounded-[2px]" style={{background:bg}}/>)}
              <span className="text-xs" style={{color:V.textLight}}>More</span>
            </div>
          </div>
        </Sect>

        {/* ══════════ COUPLE ══════════ */}
        {(partner||couple)&&(
          <Sect delay={0.5} v={vis}>
            <STitle>Covenant Partnership</STitle>
            {partner&&(
              <Link href="/couple" className="flex items-center gap-4 mt-4 p-4 rounded-2xl no-underline group relative overflow-hidden" style={{background:V.bgWarm,border:`1px solid ${V.border}`}}>
                <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full" style={{border:`6px solid ${B.gold}06`}}/>
                <div className="flex -space-x-2.5 flex-shrink-0">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold" style={{background:`linear-gradient(145deg,${B.gold},${B.goldLight})`,color:'#0F1E2E',fontFamily:'Cinzel,serif',border:`2.5px solid ${V.bgCard}`,zIndex:2}}>{(profile.first_name||'?')[0].toUpperCase()}</div>
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold" style={{background:`linear-gradient(145deg,${B.burgundy}25,${B.burgundy}50)`,color:B.burgundy,fontFamily:'Cinzel,serif',border:`2.5px solid ${V.bgCard}`,zIndex:1}}>{(partner.first_name||'?')[0].toUpperCase()}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold" style={{color:V.textPrimary}}>{profile.first_name} & {partner.first_name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {partner.last_active_at&&<span className="text-xs flex items-center gap-1" style={{color:V.green}}><span className="w-1.5 h-1.5 rounded-full inline-block" style={{background:V.green}}/>{timeAgo(partner.last_active_at)}</span>}
                    <span className="text-xs" style={{color:V.textSecondary}}>{partner.streak_count||0}d streak</span>
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={V.textMuted} strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 group-hover:translate-x-0.5 transition-transform"><path d="M9 18l6-6-6-6"/></svg>
              </Link>
            )}
            {couple&&(
              <div className="grid grid-cols-2 gap-2.5 mt-3">
                {couple.wedding_date&&<Chip icon="💍" label="Wedding" value={new Date(couple.wedding_date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}/>}
                {couple.years_married!=null&&<Chip icon="❤️" label="Together" value={`${couple.years_married} yr${couple.years_married!==1?'s':''}`}/>}
                {anniversaryDays!==null&&<Chip icon="🎂" label="Anniversary" value={anniversaryDays===0?'Today!':anniversaryDays<=7?`${anniversaryDays} days away`:`in ${anniversaryDays}d`}/>}
                {couple.reset_started_at&&<Chip icon="🔄" label="60-Day Reset" value={couple.reset_completed_at?'Completed':`Phase ${couple.reset_phase||1}`}/>}
              </div>
            )}
          </Sect>
        )}

        {/* ══════════ MILESTONES ══════════ */}
        <Sect delay={0.6} v={vis}>
          <div className="flex items-center justify-between mb-4">
            <STitle>Milestones</STitle>
            {milestones.length>0&&<span className="text-xs font-semibold" style={{color:B.gold}}>{milestones.length} earned</span>}
          </div>
          {milestones.length>0?(
            <>
              <div className="grid grid-cols-3 gap-2.5">
                {visibleMs.map(m=>(
                  <div key={m.id} className="text-center p-3.5 rounded-2xl" style={{background:V.bgWarm,border:`1px solid ${V.border}`}} title={m.milestones?.description||''}>
                    <span className="text-2xl block mb-1.5">{m.milestones?.icon||'🏆'}</span>
                    <div className="text-xs font-semibold truncate" style={{color:V.textPrimary}}>{m.milestones?.title||'Milestone'}</div>
                    <div className="text-[10px] mt-0.5" style={{color:V.textSecondary}}>{new Date(m.earned_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</div>
                  </div>
                ))}
              </div>
              {milestones.length>6&&(
                <button onClick={()=>setShowAllMs(!showAllMs)} className="w-full mt-3 py-2 rounded-xl border-none cursor-pointer text-xs font-semibold" style={{background:'rgba(199,162,58,0.05)',color:B.gold}}>
                  {showAllMs?'Show Less':`View All ${milestones.length}`}
                </button>
              )}
            </>
          ):(
            <div className="text-center py-8 rounded-2xl" style={{background:V.bgWarm,border:`1px dashed ${V.border}`}}>
              <span className="text-3xl block mb-2">🏆</span>
              <div className="text-sm font-medium" style={{color:V.textPrimary}}>No milestones yet</div>
              <div className="text-xs mt-1" style={{color:V.textMuted}}>Complete devotionals and assessments to earn badges</div>
            </div>
          )}
        </Sect>

        {/* ══════════ PERSONAL DETAILS ══════════ */}
        <Sect delay={0.7} v={vis}>
          <div className="flex items-center justify-between mb-4">
            <STitle>Personal Details</STitle>
            {!editing&&<button onClick={()=>setEditing(true)} className="text-xs font-semibold px-3 py-1.5 rounded-lg border-none cursor-pointer" style={{background:'rgba(199,162,58,0.06)',color:B.gold}}>Edit</button>}
          </div>
          {editing?(
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="First Name" value={form.first_name} onChange={v=>setForm({...form,first_name:v})}/>
                <Field label="Last Name" value={form.last_name} onChange={v=>setForm({...form,last_name:v})}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{color:V.textPrimary,fontFamily:'DM Sans,sans-serif'}}>Gender</label>
                  <select value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none" style={{border:`1px solid ${V.border}`,background:V.bgWarm,color:V.textPrimary,fontFamily:'DM Sans,sans-serif'}}>
                    <option value="">Select</option><option value="male">Male</option><option value="female">Female</option>
                  </select>
                </div>
                <Field label="Date of Birth" value={form.date_of_birth} onChange={v=>setForm({...form,date_of_birth:v})} type="date"/>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={saveProfile} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-none cursor-pointer" style={{background:B.gold,color:'#0F1E2E',opacity:saving?0.7:1}}>
                  {saving?'Saving...':'Save Changes'}
                </button>
                <button onClick={()=>{setEditing(false);setForm({first_name:profile.first_name||'',last_name:profile.last_name||'',gender:profile.gender||'',date_of_birth:profile.date_of_birth||''});}} className="px-5 py-2.5 rounded-xl text-sm border-none cursor-pointer" style={{background:V.bgWarm,color:V.textMuted}}>
                  Cancel
                </button>
              </div>
            </div>
          ):(
            <div className="grid grid-cols-2 gap-2.5">
              <Chip icon={profile.gender==='male'?'♂️':profile.gender==='female'?'♀️':'👤'} label="Name" value={fullName}/>
              <Chip icon="✉️" label="Email" value={profile.email} small/>
              <Chip icon="🎂" label="Born" value={profile.date_of_birth?new Date(profile.date_of_birth).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'Not set'}/>
              <Chip icon="🤝" label="Gender" value={profile.gender?profile.gender.charAt(0).toUpperCase()+profile.gender.slice(1):'Not set'}/>
            </div>
          )}
        </Sect>

        {/* ══════════ CHURCH ══════════ */}
        {ambassador&&(
          <Sect delay={0.8} v={vis}>
            <STitle>Church</STitle>
            <Link href="/church" className="flex items-center gap-4 mt-4 p-4 rounded-2xl no-underline group" style={{background:V.bgWarm,border:`1px solid ${V.border}`}}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:'#EDE7F6'}}>⛪</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate" style={{color:V.textPrimary}}>{(ambassador as any).churches?.name||'Your Church'}</div>
                <div className="text-xs capitalize" style={{color:V.textMuted}}>{ambassador.role} Ambassador</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={V.textMuted} strokeWidth="2" strokeLinecap="round" className="group-hover:translate-x-0.5 transition-transform"><path d="M9 18l6-6-6-6"/></svg>
            </Link>
          </Sect>
        )}

        {/* ══════════ SETTINGS ══════════ */}
        <Sect delay={0.82} v={vis}>
          <STitle>Settings</STitle>
          <div className="mt-4 flex items-center justify-between p-3.5 rounded-xl mb-3" style={{background:V.bgWarm,border:`1px solid ${V.border}`}}>
            <div className="flex items-center gap-3">
              <span className="text-base">🌙</span>
              <div>
                <span className="text-sm font-medium block" style={{color:V.textPrimary}}>Appearance</span>
                <span className="text-[11px]" style={{color:V.textSecondary}}>Toggle dark mode</span>
              </div>
            </div>
            <ThemeToggle size="sm" />
          </div>
          <NotificationSettings />
        </Sect>

        {/* ══════════ PLAN ══════════ */}
        <Sect delay={0.84} v={vis}>
          <div className="flex items-center justify-between mb-4">
            <STitle>Your Plan</STitle>
            {subscription&&subscription.plan_type!=='free'&&(
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{background:V.goldBg,color:V.textLink}}>
                {subscription.plan_type==='founding'?'Founding Member ✦':subscription.plan_type==='plus_yearly'?'Plus (Yearly)':'Plus (Monthly)'}
              </span>
            )}
          </div>
          {(!subscription||subscription.plan_type==='free')?(
            <>
              <div className="flex items-center gap-3 p-4 rounded-xl mb-3" style={{background:V.bgWarm,border:`1px solid ${V.border}`}}>
                <span className="text-2xl">🆓</span>
                <div>
                  <div className="text-sm font-semibold" style={{color:V.textPrimary}}>Covenant Preview</div>
                  <div className="text-xs" style={{color:V.textMuted}}>Free forever — devotionals, streaks, assessment</div>
                </div>
              </div>
              <button
                onClick={async()=>{setBillingLoading(true);try{const r=await fetch('/api/stripe/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan:'plus_yearly'})});const d=await r.json();if(d.url)window.location.href=d.url;}catch{}finally{setBillingLoading(false);}}}
                disabled={billingLoading}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white border-none cursor-pointer"
                style={{fontFamily:'Source Sans 3,sans-serif',background:'linear-gradient(135deg,#B8860B,#8B6914)',opacity:billingLoading?0.7:1}}
              >
                {billingLoading?'Loading...':'Upgrade to Covenant Plus — £34.99/yr'}
              </button>
            </>
          ):(
            <>
              <div className="flex items-center gap-3 p-4 rounded-xl mb-3" style={{background:V.bgWarm,border:`1px solid ${V.border}`}}>
                <span className="text-2xl">{subscription.plan_type==='founding'?'✦':'⭐'}</span>
                <div>
                  <div className="text-sm font-semibold" style={{color:V.textPrimary}}>
                    {subscription.plan_type==='founding'?'Founding Member':'Covenant Plus'}
                  </div>
                  <div className="text-xs" style={{color:V.textMuted}}>
                    {subscription.plan_type==='founding'?'Lifetime access — thank you!'
                      :subscription.cancel_at_period_end?`Cancels ${subscription.current_period_end?new Date(subscription.current_period_end).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):''}`
                      :subscription.current_period_end?`Renews ${new Date(subscription.current_period_end).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}`
                      :'Active'}
                  </div>
                </div>
              </div>
              {subscription.plan_type!=='founding'&&(
                <button
                  onClick={async()=>{setBillingLoading(true);try{const r=await fetch('/api/stripe/portal',{method:'POST'});const d=await r.json();if(d.url)window.location.href=d.url;}catch{}finally{setBillingLoading(false);}}}
                  disabled={billingLoading}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold border cursor-pointer"
                  style={{background:'transparent',borderColor:V.border,color:V.textSecondary,fontFamily:'Source Sans 3,sans-serif',opacity:billingLoading?0.7:1}}
                >
                  {billingLoading?'Loading...':'Manage Billing'}
                </button>
              )}
            </>
          )}
        </Sect>

        {/* ══════════ QUICK LINKS ══════════ */}
        <Sect delay={0.85} v={vis}>
          <STitle>Quick Links</STitle>
          <div className="mt-4 space-y-1.5">
            {profile.role==='super_admin'&&<NavRow href="/admin" icon="🛡️" label="Admin Console" sub="Manage content & users"/>}
            <NavRow href="/couple" icon="💑" label="Couple" sub="Partnership & settings"/>
            <NavRow href="/reset" icon="🔄" label="60-Day Reset" sub="Structured transformation"/>
            <NavRow href="/games" icon="🎲" label="Games" sub="Fun connection activities"/>
            <NavRow href="/emergency" icon="🛠️" label="Conflict Tools" sub="Repair & resolve"/>
          </div>
        </Sect>

        {/* ══════════ SIGN OUT ══════════ */}
        <div className="mt-6" style={{transition:'opacity .6s ease .9s',opacity:vis?1:0}}>
          <button onClick={()=>setSignOutOpen(true)} className="w-full py-3.5 rounded-2xl border-none cursor-pointer text-sm font-medium flex items-center justify-center gap-2" style={{background:V.redBg,color:V.red,border:'1px solid transparent'}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
        </div>

        {/* Scripture */}
        <div className="text-center py-10">
          <p className="text-sm italic m-0" style={{fontFamily:'Cormorant Garamond,serif',color:V.textLight}}>
            {'\u201C'}A cord of three strands is not quickly broken.{'\u201D'}
          </p>
          <p className="text-[10px] m-0 mt-1 uppercase tracking-widest" style={{color:V.textLight}}>Ecclesiastes 4:12</p>
        </div>
      </div>

      {/* ══════════ SIGN OUT MODAL ══════════ */}
      {signOutOpen&&(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{background:'rgba(15,30,46,0.55)'}} onClick={()=>setSignOutOpen(false)}>
          <div className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-7 pb-10 sm:pb-7" style={{background:V.bgCard,boxShadow:'0 -8px 40px rgba(0,0,0,0.15)'}} onClick={e=>e.stopPropagation()}>
            {/* Handle bar (mobile sheet) */}
            <div className="w-10 h-1 rounded-full mx-auto mb-5 sm:hidden" style={{background:V.border}}/>
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center" style={{background:V.redBg}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={V.red} strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </div>
              <h3 className="text-lg mb-1" style={{fontFamily:'Cormorant Garamond,serif',color:V.textPrimary,fontWeight:600}}>Sign out?</h3>
              <p className="text-sm" style={{color:V.textMuted}}>Your progress is always saved.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={async()=>{await supabase.auth.signOut();router.push('/');}} className="flex-1 py-3 rounded-xl text-sm font-semibold border-none cursor-pointer" style={{background:V.red,color:V.bgCard}}>Sign Out</button>
              <button onClick={()=>setSignOutOpen(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold border-none cursor-pointer" style={{background:V.bgWarm,color:V.textPrimary}}>Stay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════ COMPONENTS ═══════════════════════════════════════ */

function Sect({children,delay,v}:{children:React.ReactNode;delay:number;v:boolean}){
  return <section className="mb-6 rounded-2xl p-5" style={{background:V.bgCard,border:`1px solid ${V.border}`,boxShadow:'0 1px 3px rgba(0,0,0,0.02)',transition:`opacity .6s ease ${delay}s, transform .6s ease ${delay}s`,opacity:v?1:0,transform:v?'none':'translateY(14px)'}}>{children}</section>;
}
function STitle({children}:{children:React.ReactNode}){
  return <h2 className="text-base m-0" style={{fontFamily:'Cormorant Garamond,serif',color:V.textPrimary,fontWeight:600}}>{children}</h2>;
}
function HeroBadge({color,text}:{color:string;text:string}){
  return <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-semibold backdrop-blur-sm" style={{background:`${color}18`,color,border:`1px solid ${color}15`}}>{text}</span>;
}
function StatGem({icon,value,label,glow}:{icon:string;value:number;label:string;glow?:string}){
  return(
    <div className="rounded-2xl p-3 text-center relative overflow-hidden" style={{background:V.bgCard,border:`1px solid ${glow?`${glow}25`:V.border}`,boxShadow:glow?`0 2px 12px ${glow}12`:'0 1px 2px rgba(0,0,0,0.02)'}}>
      {glow&&<div className="absolute inset-0" style={{background:`radial-gradient(circle at 50% 30%,${glow}06,transparent 70%)`}}/>}
      <span className="text-lg block relative">{icon}</span>
      <div className="text-lg font-bold mt-0.5 relative" style={{color:V.textPrimary,fontFamily:'DM Sans,sans-serif'}}>{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wider relative" style={{color:glow||V.textMuted,letterSpacing:'0.06em'}}>{label}</div>
    </div>
  );
}
function Chip({icon,label,value,small}:{icon:string;label:string;value:string;small?:boolean}){
  return(
    <div className="flex items-start gap-2.5 p-3 rounded-xl" style={{background:V.bgWarm,border:`1px solid ${V.border}`}}>
      <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider font-medium" style={{color:V.textSecondary,letterSpacing:'0.06em'}}>{label}</div>
        <div className={`font-medium truncate ${small?'text-xs':'text-sm'}`} style={{color:V.textPrimary}}>{value}</div>
      </div>
    </div>
  );
}
function NavRow({href,icon,label,sub}:{href:string;icon:string;label:string;sub:string}){
  return(
    <Link href={href} className="flex items-center justify-between p-3.5 rounded-xl no-underline group" style={{background:V.bgWarm,border:`1px solid ${V.border}`}}>
      <div className="flex items-center gap-3">
        <span className="text-base">{icon}</span>
        <div>
          <span className="text-sm font-medium block" style={{color:V.textPrimary}}>{label}</span>
          <span className="text-[11px]" style={{color:V.textSecondary}}>{sub}</span>
        </div>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="group-hover:translate-x-0.5 transition-transform"><path d="M9 18l6-6-6-6"/></svg>
    </Link>
  );
}
function Field({label,value,onChange,type='text'}:{label:string;value:string;onChange:(v:string)=>void;type?:string}){
  return(
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{color:V.textPrimary,fontFamily:'DM Sans,sans-serif'}}>{label}</label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{border:`1px solid ${V.border}`,background:V.bgWarm,color:V.textPrimary,fontFamily:'DM Sans,sans-serif'}}/>
    </div>
  );
}
function scoreClr(s:number){return s>=3.5?V.green:s>=2.5?'#B8860B':V.red;}
function timeAgo(d:string):string{const ms=Date.now()-new Date(d).getTime();const m=Math.floor(ms/60000);if(m<1)return 'just now';if(m<60)return `${m}m ago`;const h=Math.floor(m/60);if(h<24)return `${h}h ago`;const dy=Math.floor(h/24);return dy===1?'yesterday':`${dy}d ago`;}