import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/lib/auth/helpers";

// GET: Thread with messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("students.read");
  if (error) return error;

  const { id } = await params;

  // Verify user is a participant
  const participant = await db.messageThreadParticipant.findUnique({
    where: { threadId_userId: { threadId: id, userId: user.id } },
  });

  if (!participant) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const thread = await db.messageThread.findUnique({
    where: { id },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true, role: true } } },
      },
    },
  });

  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  // Mark messages from others as read
  await db.message.updateMany({
    where: {
      threadId: id,
      read: false,
      senderId: { not: user.id },
    },
    data: { read: true },
  });

  return NextResponse.json(thread);
}

// POST: Send a message in a thread
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("students.read");
  if (error) return error;

  const { id } = await params;

  // Verify user is a participant
  const participant = await db.messageThreadParticipant.findUnique({
    where: { threadId_userId: { threadId: id, userId: user.id } },
  });

  if (!participant) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    const message = await db.message.create({
      data: {
        threadId: id,
        senderId: user.id,
        content: content.trim(),
      },
      include: { sender: { select: { id: true, name: true, role: true } } },
    });

    // Update thread last message
    await db.messageThread.update({
      where: { id },
      data: {
        lastMessage: content.trim().slice(0, 100),
        lastMsgAt: new Date(),
      },
    });

    // Create notifications for other participants
    const otherParticipants = await db.messageThreadParticipant.findMany({
      where: { threadId: id, userId: { not: user.id } },
      select: { userId: true },
    });

    const thread = await db.messageThread.findUnique({ where: { id }, select: { subject: true } });

    await db.notification.createMany({
      data: otherParticipants.map((p) => ({
        userId: p.userId,
        title: `New message: ${thread?.subject || "Conversation"}`,
        message: `${user.name || "Someone"}: ${content.trim().slice(0, 100)}`,
        type: "INFO",
        link: `/admin/messages`,
      })),
    });

    return NextResponse.json(message, { status: 201 });
  } catch (e: any) {
    console.error("Error sending message:", e);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

// DELETE: Delete a thread (only if user is participant)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await apiAuth("students.read");
  if (error) return error;

  const { id } = await params;

  const participant = await db.messageThreadParticipant.findUnique({
    where: { threadId_userId: { threadId: id, userId: user.id } },
  });

  if (!participant) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  await db.messageThread.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
