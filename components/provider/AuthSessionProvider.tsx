"use client";

import type { PropsWithChildren } from "react";
import { SessionProvider } from "next-auth/react";

type Props = PropsWithChildren;

export default function AuthSessionProvider({ children }: Props) {
  return <SessionProvider>{children}</SessionProvider>;
}
