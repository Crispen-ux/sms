import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";

// GET: List threads for current user
export async function GET(request: NextRequest) {
  const { user, error } = await apiAuth("students.read");
  if (error) return error;

  const threads = await db.messageThread.findMany({
    where: {
      participants: { some: { userId: user.id } },
    },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { sender: { select: { name: true } } },
      },
    },
    orderBy: { lastMsgAt: "desc" },
  });

  // Count unread messages per thread
  const threadsWithUnread = await Promise.all(
    threads.map(async (thread) => {
      const unreadCount = await db.message.count({
        where: {
          threadId: thread.id,
          read: false,
          senderId: { not: user.id },
        },
      });
      return { ...thread, unreadCount };
    })
  );

  return NextResponse.json({ threads: threadsWithUnread });
}

// POST: Create a new thread
export async function POST(request: NextRequest) {
  const { user, error } = await apiAuth("students.read");
  if (error) return error;

  try {
    const body = await request.json();
    const { subject, participantIds, studentId, firstMessage } = body;

    if (!subject || !participantIds?.length || !firstMessage) {
      return NextResponse.json(
        { error: "subject, participantIds, and firstMessage are required" },
        { status: 400 }
      );
    }

    // Ensure current user is included in participants
    const allParticipantIds = [...new Set([user.id, ...participantIds])];

    // Create thread with participants and first message
    const thread = await db.messageThread.create({
      data: {
        subject,
        studentId: studentId || null,
        lastMessage: firstMessage.slice(0, 100),
        lastMsgAt: new Date(),
        participants: {
          create: allParticipantIds.map((id) => ({ userId: id })),
        },
        messages: {
          create: {
            senderId: user.id,
            content: firstMessage,
          },
        },
      },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
        },
      },
    });

    return NextResponse.json(thread, { status: 201 });
  } catch (e: any) {
    console.error("Error creating thread:", e);
    return NextResponse.json({ error: "Failed to create thread" }, { status: 500 });
  }
}
