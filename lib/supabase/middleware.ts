import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isProtectedAppPath } from "../dashboard/navigation";

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

type MiddlewareAuth = {
  getSession?: () => Promise<{
    data: {
      session: { user: { id: string } | null } | null;
    };
  }>;
  getUser?: () => Promise<{
    data: {
      user: { id: string } | null;
    };
  }>;
};

async function resolveAuthUser(auth: MiddlewareAuth) {
  if (typeof auth.getUser === "function") {
    try {
      const result = await auth.getUser();
      if (result.data.user) {
        return result.data.user;
      }
    } catch {
      // Fall through to session-based resolution for edge/runtime variance.
    }
  }

  if (typeof auth.getSession === "function") {
    try {
      const result = await auth.getSession();
      return result.data.session?.user ?? null;
    } catch {
      return null;
    }
  }

  return null;
}

export async function updateSession(request: NextRequest) {
  const isProtectedRoute = isProtectedAppPath(request.nextUrl.pathname);
  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/register");

  const supabaseEnv = getSupabaseEnv();
  if (!supabaseEnv) {
    if (isProtectedRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set(
        "next",
        `${request.nextUrl.pathname}${request.nextUrl.search}`
      );
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });
  const { url, anonKey } = supabaseEnv;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const user = await resolveAuthUser(supabase.auth as unknown as MiddlewareAuth);

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    );
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const [{ data: membership }, { data: patient }] = await Promise.all([
      supabase
        .from("practice_memberships")
        .select("practice_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle(),
      supabase
        .from("patients")
        .select("id")
        .eq("portal_user_id", user.id)
        .limit(1)
        .maybeSingle(),
    ]);
    const url = request.nextUrl.clone();
    url.pathname = membership ? "/dashboard" : patient ? "/portal" : "/onboarding";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
