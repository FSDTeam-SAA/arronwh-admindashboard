"use client";

import type { PropsWithChildren } from "react";
import { useEffect, useRef } from "react";
import { SessionProvider, signOut, useSession } from "next-auth/react";

type Props = PropsWithChildren;

function SessionExpiryWatcher() {
  const { data: session, status } = useSession();
  const signOutTriggeredRef = useRef(false);

  useEffect(() => {
    if (status !== "authenticated") {
      signOutTriggeredRef.current = false;
      return;
    }

    const triggerSignOut = () => {
      if (signOutTriggeredRef.current) return;
      signOutTriggeredRef.current = true;
      void signOut({ callbackUrl: "/login" });
    };

    if (session?.error === "AccessTokenExpired") {
      triggerSignOut();
      return;
    }

    if (typeof session?.accessTokenExpires !== "number") {
      return;
    }

    const msUntilExpiry = session.accessTokenExpires - Date.now();
    if (msUntilExpiry <= 0) {
      triggerSignOut();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      triggerSignOut();
    }, msUntilExpiry);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [session?.accessTokenExpires, session?.error, status]);

  return null;
}

export default function AuthSessionProvider({ children }: Props) {
  return (
    <SessionProvider>
      <SessionExpiryWatcher />
      {children}
    </SessionProvider>
  );
}
