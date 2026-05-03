"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadSession } from "../lib/session";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const session = loadSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    if (session.user.role === "ADMIN") {
      router.replace("/admin");
      return;
    }

    router.replace("/dashboard");
  }, [router]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center p-8">
      <p className="text-sm opacity-70">Loading DrivePortal...</p>
    </main>
  );
}
