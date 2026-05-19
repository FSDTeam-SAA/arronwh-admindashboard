
// authOptions.ts
import CredentialsProvider from "next-auth/providers/credentials";
import type { AuthOptions } from "next-auth";

const parseAccessTokenExpiry = (accessToken?: string): number | undefined => {
  if (!accessToken) return undefined;

  const parts = accessToken.split(".");
  if (parts.length !== 3) return undefined;

  try {
    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");
    const decoded = JSON.parse(
      Buffer.from(payload, "base64").toString("utf-8")
    ) as { exp?: number };

    if (typeof decoded.exp !== "number") return undefined;
    return decoded.exp * 1000;
  } catch {
    return undefined;
  }
};

const isAccessTokenExpired = (expiresAt?: number): boolean =>
  typeof expiresAt === "number" && Date.now() >= expiresAt;

export interface LoginResponse {
  status?: boolean;
  success?: boolean;
  message?: string;
  data?: {
    user?: {
      _id: string;
      firstName?: string;
      lastName?: string;
      email: string;
      role: string;
      profileImage?: string;
      refreshToken?: string;
      updatedAt?: string;
      accessRoutes?: string[];
    };
    accessToken?: string;
    refreshToken?: string;
  };
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials?.email,
            password: credentials?.password,
          }),
        });

        const data: LoginResponse | null = await res.json().catch(() => null);
        const hasExplicitFailure = data?.status === false || data?.success === false;

        if (!res.ok || hasExplicitFailure || !data?.data?.accessToken || !data?.data?.user) {
          return null;
        }

        const user = data.data.user;
        const normalizedRole =
          typeof user.role === "string" ? user.role.toLowerCase() : "";

        if (normalizedRole !== "admin") {
          throw new Error("admin_only");
        }

        const firstName = user.firstName ?? "";
        const lastName = user.lastName ?? "";
        const fullName =
          [firstName, lastName].filter(Boolean).join(" ") || user.email;

        return {
          id: user._id,
          userId: user._id,
          email: user.email,
          role: normalizedRole,
          firstName: user.firstName,
          lastName: user.lastName,
          name: fullName,
          image: user.profileImage,
          profileImage: user.profileImage,
          updatedAt: user.updatedAt,
          accessRoutes: user.accessRoutes ?? [],
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken ?? user.refreshToken,
          message: data.message,
          success: data.status ?? data.success,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.userId = user.userId ?? (user as { id?: string }).id;
        token.email = user.email;
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.name = user.name;
        token.image = user.image;
        token.profileImage = user.profileImage ?? user.image;
        token.updatedAt = user.updatedAt;
        token.accessRoutes = user.accessRoutes ?? [];
        token.message = user.message;
        token.success = user.success;
        token.accessTokenExpires = parseAccessTokenExpiry(user.accessToken);
        token.error = undefined;
      }

      if (isAccessTokenExpired(token.accessTokenExpires)) {
        token.error = "AccessTokenExpired";
      }

      return token;
    },

    async session({ session, token }) {
      session.user = {
        userId: token.userId as string,
        email: token.email as string,
        role: token.role as string,
        firstName: token.firstName as string | undefined,
        lastName: token.lastName as string | undefined,
        name: token.name as string | undefined,
        image: token.image as string | undefined,
        profileImage: token.profileImage as string | undefined,
        accessRoutes: token.accessRoutes ?? [],
        updatedAt: token.updatedAt as string | undefined,
      };
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.accessTokenExpires =
        typeof token.accessTokenExpires === "number"
          ? token.accessTokenExpires
          : undefined;
      session.message = token.message;
      session.success = token.success;
      session.error = token.error;
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
