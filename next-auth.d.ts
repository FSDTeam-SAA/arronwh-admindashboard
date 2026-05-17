/* eslint-disable */
import NextAuth, { DefaultSession } from "next-auth";

type SessionError = "AccessTokenExpired";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      userId?: string;
      email?: string;
      name?: string;
      image?: string;
      role?: string;
      firstName?: string;
      lastName?: string;
      profileImage?: string;
      accessRoutes?: string[];
      updatedAt?: string;
    };

    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    message?: string;
    success?: boolean;
    statusCode?: number;
    role?: string;
    error?: SessionError;
  }

  interface User {
    userId?: string;
    email?: string;
    name?: string;
    image?: string;
    role?: string;
    firstName?: string;
    lastName?: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    profileImage?: string;
    accessRoutes?: string[]; 
    updatedAt?: string;
    message?: string;
    success?: boolean;
    statusCode?: number;
    error?: SessionError;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    email?: string;
    name?: string;
    image?: string;
    role?: string;
    firstName?: string;
    lastName?: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    profileImage?: string;
    accessRoutes?: string[]; 
    updatedAt?: string;
    message?: string;
    success?: boolean;
    statusCode?: number;
    error?: SessionError;
  }
}
