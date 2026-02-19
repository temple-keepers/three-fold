import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: any }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public routes — no auth required
  const publicRoutes = ['/', '/auth', '/auth/callback', '/auth/confirm', '/invite'];
  const isPublicRoute = publicRoutes.some(
    (route) => request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + '/')
  );

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth';
    return NextResponse.redirect(url);
  }

  if (user && !isPublicRoute) {
    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
    const isOnboardingRoute = request.nextUrl.pathname.startsWith('/onboarding');

    // Skip all profile-based checks for admin routes — let the page handle its own auth
    // This avoids any RLS issues in middleware
    if (isAdminRoute) {
      return supabaseResponse;
    }

    // For non-admin, non-onboarding routes, check onboarding completion
    if (!isOnboardingRoute) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed, role')
          .eq('id', user.id)
          .single();

        if (profile && !profile.onboarding_completed && profile.role !== 'super_admin') {
          const url = request.nextUrl.clone();
          url.pathname = '/onboarding';
          return NextResponse.redirect(url);
        }
      } catch {
        // If profile query fails, don't redirect — let the page handle it
      }
    }
  }

  return supabaseResponse;
}
