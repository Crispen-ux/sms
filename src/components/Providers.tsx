"use client";

import { SessionProvider } from "next-auth/react";
import { authClient } from "@/lib/auth/neon-client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  if (!authClient) {
    return <SessionProvider>{children}</SessionProvider>;
  }

  const { NeonAuthUIProvider } = require("@neondatabase/auth-ui");

  return (
    <SessionProvider>
      <NeonAuthUIProvider
        authClient={authClient}
        navigate={router.push}
        replace={router.replace}
        onSessionChange={router.refresh}
        Link={Link}
      >
        {children}
      </NeonAuthUIProvider>
    </SessionProvider>
  );
}
