import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_PATHS = new Set([
  "/login",
  "/forgot-password",
  "/reset-password",
  "/verify-otp",
]);

const AUTH_COOKIES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
  "next-auth.csrf-token",
  "__Host-next-auth.csrf-token",
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

const parseAccessTokenExpiry = (accessToken?: string): number | undefined => {
  if (!accessToken) return undefined;

  const parts = accessToken.split(".");
  if (parts.length !== 3) return undefined;

  try {
    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");
    const decoded = JSON.parse(atob(payload)) as { exp?: number };

    if (typeof decoded.exp !== "number") return undefined;
    return decoded.exp * 1000;
  } catch {
    return undefined;
  }
};

const isExpired = (expiresAt?: number): boolean =>
  typeof expiresAt === "number" && Date.now() >= expiresAt;

const clearAuthCookies = (response: NextResponse) => {
  for (const cookieName of AUTH_COOKIES) {
    response.cookies.delete(cookieName);
  }
};

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isAuthPath = AUTH_PATHS.has(pathname);

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const accessToken =
    typeof token?.accessToken === "string" ? token.accessToken : undefined;
  const accessTokenExpires =
    typeof token?.accessTokenExpires === "number"
      ? token.accessTokenExpires
      : parseAccessTokenExpiry(accessToken);

  const hasSession = Boolean(accessToken);
  const tokenExpired = isExpired(accessTokenExpires);

  if (isAuthPath && hasSession && !tokenExpired) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isAuthPath && hasSession && tokenExpired) {
    const response = NextResponse.next();
    clearAuthCookies(response);
    return response;
  }

  if (!isAuthPath && (!hasSession || tokenExpired)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);

    const response = NextResponse.redirect(loginUrl);
    clearAuthCookies(response);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
