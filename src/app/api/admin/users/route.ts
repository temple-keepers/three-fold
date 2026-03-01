import { createClient as createServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function DELETE(request: Request) {
  // Authenticate via session
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify super_admin
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || profile.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { profileId } = await request.json();
  if (!profileId) return NextResponse.json({ error: 'Missing profileId' }, { status: 400 });
  if (profileId === user.id) {
    return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
  }

  try {
    // Step 1: Database cleanup via RPC (uses session so auth.uid() works in the RPC)
    const { error: rpcError } = await supabase.rpc('admin_prepare_user_deletion', {
      target_profile_id: profileId,
    });
    if (rpcError) throw rpcError;

    // Step 2: Delete auth user (cascades to profile + CASCADE FK tables)
    const adminClient = getServiceRoleClient();
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(profileId);
    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Admin delete user error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete user' },
      { status: 500 },
    );
  }
}
