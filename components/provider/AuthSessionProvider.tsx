"use client";

import type { PropsWithChildren } from "react";

type Props = PropsWithChildren;

export default function AuthSessionProvider({ children }: Props) {
  return <>{children}</>;
}
