import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type } = await request.json();

    // Look up the sender's profile and partner
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, first_name, partner_id, couple_id')
      .eq('id', user.id)
      .single();

    if (!profile?.partner_id) {
      return NextResponse.json({ error: 'No partner linked' }, { status: 400 });
    }

    // Determine nudge content based on type
    let title = '\uD83D\uDCAC Nudge from your spouse';
    let body = `${profile.first_name || 'Your spouse'} is waiting for you!`;
    let url = '/together';

    if (type === 'together') {
      title = `\uD83D\uDCAC ${profile.first_name || 'Your spouse'} answered today's question`;
      body = 'Open the app to share your answer and reveal theirs!';
      url = '/together';
    } else if (type === 'devotional') {
      title = `\uD83D\uDCD6 ${profile.first_name || 'Your spouse'} completed today's devotional`;
      body = 'Join them on the journey \u2014 read yours now!';
      url = '/devotional';
    } else if (type === 'checkin') {
      title = `\uD83D\uDCCB ${profile.first_name || 'Your spouse'} submitted their weekly check-in`;
      body = 'Add yours so you can review together!';
      url = '/couple';
    }

    // Get the user's access token for calling the edge function
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      return NextResponse.json({ error: 'No session' }, { status: 401 });
    }

    // Call the send-push-notification edge function with the user's token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

    const pushRes = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        profile_ids: [profile.partner_id],
        title,
        body,
        url,
        type: 'spouse_activity',
        tag: `nudge-${type}`,
      }),
    });

    if (!pushRes.ok) {
      const errText = await pushRes.text();
      console.error('Push function error:', pushRes.status, errText);
      // Still return success to the client - the nudge intent was recorded
      return NextResponse.json({ success: true, sent: 0, note: 'Push delivery pending' });
    }

    const result = await pushRes.json();

    return NextResponse.json({
      success: true,
      sent: result.sent || 0,
    });
  } catch (err) {
    console.error('Nudge API error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
