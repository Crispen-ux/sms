"use client";

import { useSession } from "next-auth/react";
import MessagesView from "@/components/MessagesView";
import { LoadingState } from "@/components/ui";

export default function ParentMessagesPage() {
  const { data: session, status } = useSession();
  const user = session?.user as any;

  if (status === "loading") return <LoadingState message="Loading..." />;
  if (!user) return null;

  return <MessagesView currentUserId={user.id} />;
}
