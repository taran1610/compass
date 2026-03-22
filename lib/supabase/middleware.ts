import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PATHS = ["/app", "/competitors", "/opportunity-map"];
const PUBLIC_PATHS = ["/login", "/auth"];

function isProtected(pathname: string) {
  return PROTECTED_PATHS.some((p) => p === pathname || pathname.startsWith(p + "/"));
}

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users from protected routes to login
  if (!user && isProtected(request.nextUrl.pathname)) {
    const redirectResponse = NextResponse.redirect(
      new URL("/login", request.url)
    );
    // Preserve session cookies on redirect so we don't lose them
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: "/",
      });
    });
    return redirectResponse;
  }

  // Redirect authenticated users from login to app
  if (user && request.nextUrl.pathname === "/login") {
    const redirectResponse = NextResponse.redirect(new URL("/app", request.url));
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, { path: "/" });
    });
    return redirectResponse;
  }

  return response;
}
