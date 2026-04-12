/* eslint-disable */
import NextAuth, { DefaultSession } from "next-auth";

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
    message?: string;
    success?: boolean;
    statusCode?: number;
    role?: string;
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
    profileImage?: string;
    accessRoutes?: string[]; 
    updatedAt?: string;
    message?: string;
    success?: boolean;
    statusCode?: number;
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
    profileImage?: string;
    accessRoutes?: string[]; 
    updatedAt?: string;
    message?: string;
    success?: boolean;
    statusCode?: number;
  }
}
