import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes (dashboard)
  if (request.nextUrl.pathname.startsWith("/dashboard") ||
      request.nextUrl.pathname.startsWith("/rooms") ||
      request.nextUrl.pathname.startsWith("/bookings") ||
      request.nextUrl.pathname.startsWith("/active-stays") ||
      request.nextUrl.pathname.startsWith("/invoices") ||
      request.nextUrl.pathname.startsWith("/reports") ||
      request.nextUrl.pathname.startsWith("/settings")) {
    
    if (!user) {
      // Redirect to login
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Auth routes (login, register)
  if (request.nextUrl.pathname === "/login" || 
      request.nextUrl.pathname === "/register") {
    
    if (user) {
      // Already authenticated, redirect to dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Root route
  if (request.nextUrl.pathname === "/") {
    if (user) {
      // Authenticated users go to dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      // Non-authenticated users go to login
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)",
  ],
};
