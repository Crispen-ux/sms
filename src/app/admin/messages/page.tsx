"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, PageHeader, Button, Input, Select, EmptyState, LoadingState, useToast } from "@/components/ui";
import { MessageSquare, Send, Plus, Search, X, User, Users } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface Participant {
  id: string;
  userId: string;
  user: User;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  read: boolean;
  createdAt: string;
  sender: { id: string; name: string | null; role: string };
}

interface Thread {
  id: string;
  subject: string;
  lastMessage: string | null;
  lastMsgAt: string | null;
  participants: Participant[];
  messages: Message[];
  unreadCount: number;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Admin",
  SCHOOL_ADMIN: "Admin",
  PRINCIPAL: "Principal",
  TEACHER: "Teacher",
  PARENT: "Parent",
  STUDENT: "Student",
  ACCOUNTANT: "Accountant",
  ADMISSIONS_OFFICER: "Admissions",
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-700",
  SCHOOL_ADMIN: "bg-red-100 text-red-700",
  PRINCIPAL: "bg-purple-100 text-purple-700",
  TEACHER: "bg-blue-100 text-blue-700",
  PARENT: "bg-green-100 text-green-700",
  STUDENT: "bg-amber-100 text-amber-700",
};

export default function MessagesPage() {
  const { toast } = useToast();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [threadMessages, setThreadMessages] = useState<Message[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showNewThread, setShowNewThread] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [searchUsers, setSearchUsers] = useState("");
  const [threadSubject, setThreadSubject] = useState("");
  const [threadParticipants, setThreadParticipants] = useState<string[]>([]);
  const [threadFirstMessage, setThreadFirstMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [searchThreads, setSearchThreads] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchThreads = useCallback(async () => {
    try {
      const res = await fetch("/api/messages/threads");
      const data = await res.json();
      setThreads(data.threads || []);
    } catch {
      toast("Failed to load messages", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchThreads();
    fetchUsers();
  }, [fetchThreads, fetchUsers]);

  const openThread = async (thread: Thread) => {
    setSelectedThread(thread);
    setLoadingThread(true);
    try {
      const res = await fetch(`/api/messages/threads/${thread.id}`);
      const data = await res.json();
      setThreadMessages(data.messages || []);
      // Update unread count
      setThreads((prev) =>
        prev.map((t) => (t.id === thread.id ? { ...t, unreadCount: 0 } : t))
      );
    } catch {
      toast("Failed to load messages", "error");
    } finally {
      setLoadingThread(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [threadMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThread || !newMessage.trim()) return;

    setSending(true);
    try {
      const res = await fetch(`/api/messages/threads/${selectedThread.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });
      if (!res.ok) throw new Error("Failed to send");
      const msg = await res.json();
      setThreadMessages((prev) => [...prev, msg]);
      setNewMessage("");
      // Update thread list
      setThreads((prev) =>
        prev.map((t) =>
          t.id === selectedThread.id
            ? { ...t, lastMessage: newMessage.slice(0, 100), lastMsgAt: new Date().toISOString() }
            : t
        )
      );
    } catch {
      toast("Failed to send message", "error");
    } finally {
      setSending(false);
    }
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadSubject || !threadParticipants.length || !threadFirstMessage) return;

    setCreating(true);
    try {
      const res = await fetch("/api/messages/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: threadSubject,
          participantIds: threadParticipants,
          firstMessage: threadFirstMessage,
        }),
      });
      if (!res.ok) throw new Error("Failed to create thread");
      const thread = await res.json();
      setThreads((prev) => [{ ...thread, unreadCount: 0, messages: [] }, ...prev]);
      setShowNewThread(false);
      setThreadSubject("");
      setThreadParticipants([]);
      setThreadFirstMessage("");
      toast("Conversation started");
    } catch {
      toast("Failed to create conversation", "error");
    } finally {
      setCreating(false);
    }
  };

  const getOtherParticipant = (thread: Thread) => {
    return thread.participants.find((p) => p.userId !== threads[0]?.participants[0]?.userId)?.user;
  };

  const filteredThreads = threads.filter((t) =>
    searchThreads
      ? t.subject.toLowerCase().includes(searchThreads.toLowerCase()) ||
        t.participants.some((p) => p.user.name?.toLowerCase().includes(searchThreads.toLowerCase()))
      : true
  );

  const filteredUsers = users.filter((u) =>
    searchUsers
      ? u.name?.toLowerCase().includes(searchUsers.toLowerCase()) ||
        u.email.toLowerCase().includes(searchUsers.toLowerCase())
      : true
  );

  return (
    <div>
      <PageHeader
        title="Messages"
        description="Communicate with teachers, parents, and staff."
        action={
          <Button onClick={() => { setShowNewThread(true); fetchUsers(); }} icon={<Plus className="w-4 h-4" />}>
            New Conversation
          </Button>
        }
      />

      <div className="flex gap-6 h-[calc(100vh-200px)]">
        {/* Thread List */}
        <div className="w-96 shrink-0">
          <Card padding={false} className="h-full flex flex-col">
            <div className="p-3 border-b">
              <div className="flex items-center gap-2 bg-brand-light rounded-lg px-3 py-2">
                <Search className="w-4 h-4 text-brand-gray" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchThreads}
                  onChange={(e) => setSearchThreads(e.target.value)}
                  className="bg-transparent text-sm text-brand-dark placeholder:text-brand-gray/50 focus:outline-none w-full"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <LoadingState message="Loading..." />
              ) : filteredThreads.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-10 h-10 text-brand-gray/30 mx-auto mb-3" />
                  <p className="text-sm text-brand-gray">No conversations yet</p>
                </div>
              ) : (
                filteredThreads.map((thread) => {
                  const other = thread.participants.find((p) => p.userId !== thread.participants[0]?.userId);
                  return (
                    <button
                      key={thread.id}
                      onClick={() => openThread(thread)}
                      className={`w-full text-left p-4 border-b border-brand-light/50 hover:bg-brand-light/30 transition-colors ${
                        selectedThread?.id === thread.id ? "bg-brand-light/50" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-sm font-semibold text-brand-dark truncate">{thread.subject}</span>
                        {thread.unreadCount > 0 && (
                          <span className="ml-2 shrink-0 w-5 h-5 bg-brand-red text-white text-xs font-bold rounded-full flex items-center justify-center">
                            {thread.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-brand-gray mb-1">
                        {other?.user.name || other?.user.email || "Unknown"}
                        {other?.user.role && (
                          <span className={`ml-1.5 inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${ROLE_COLORS[other.user.role] || "bg-gray-100 text-gray-500"}`}>
                            {ROLE_LABELS[other.user.role] || other.user.role}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-brand-gray/70 truncate">{thread.lastMessage}</p>
                      {thread.lastMsgAt && (
                        <p className="text-[10px] text-brand-gray/50 mt-1">
                          {new Date(thread.lastMsgAt).toLocaleDateString("en-ZA")} {new Date(thread.lastMsgAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Message Area */}
        <div className="flex-1">
          {selectedThread ? (
            <Card padding={false} className="h-full flex flex-col">
              {/* Thread Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-brand-dark">{selectedThread.subject}</h3>
                  <p className="text-xs text-brand-gray">
                    {selectedThread.participants
                      .map((p) => p.user.name || p.user.email)
                      .join(", ")}
                  </p>
                </div>
                <button onClick={() => setSelectedThread(null)} className="p-2 hover:bg-brand-light rounded-lg">
                  <X className="w-4 h-4 text-brand-gray" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingThread ? (
                  <LoadingState message="Loading messages..." />
                ) : (
                  threadMessages.map((msg) => {
                    const isMe = msg.senderId === threadMessages[0]?.senderId || msg.senderId === users[0]?.id;
                    return (
                      <div key={msg.id} className={`flex ${msg.senderId === threadMessages.find((m) => m.senderId !== msg.senderId)?.senderId ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[70%] ${msg.senderId === threadMessages.find((m) => m.senderId !== msg.senderId)?.senderId ? "" : ""}`}>
                          <div className={`rounded-2xl px-4 py-2.5 ${
                            msg.senderId === threadMessages.find((m, i) => i > 0 && m.senderId !== msg.senderId)?.senderId || (threadMessages.indexOf(msg) === 0 && msg.senderId !== threadMessages[1]?.senderId)
                              ? "bg-brand-light text-brand-dark"
                              : "bg-brand-red text-white"
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          <p className="text-[10px] text-brand-gray/60 mt-1 px-2">
                            {msg.sender.name || "Unknown"} · {new Date(msg.createdAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSend} className="p-4 border-t flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-brand-light rounded-xl px-4 py-2.5 text-sm text-brand-dark placeholder:text-brand-gray/50 focus:outline-none focus:ring-2 focus:ring-brand-red/30"
                  disabled={sending}
                />
                <Button type="submit" disabled={sending || !newMessage.trim()} icon={<Send className="w-4 h-4" />}>
                  Send
                </Button>
              </form>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-brand-gray/20 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-brand-dark mb-1">Select a conversation</h3>
                <p className="text-sm text-brand-gray">Choose a conversation from the list or start a new one.</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* New Thread Modal */}
      {showNewThread && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNewThread(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-brand-dark">New Conversation</h2>
              <button onClick={() => setShowNewThread(false)} className="p-1 hover:bg-brand-light rounded-lg">
                <X className="w-5 h-5 text-brand-gray" />
              </button>
            </div>
            <form onSubmit={handleCreateThread} className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              <Input
                label="Subject"
                value={threadSubject}
                onChange={(e) => setThreadSubject(e.target.value)}
                placeholder="e.g., Question about homework"
                required
              />
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1">Recipients</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {threadParticipants.map((userId) => {
                    const u = users.find((us) => us.id === userId);
                    return u ? (
                      <span key={userId} className="inline-flex items-center gap-1 bg-brand-red/10 text-brand-red px-2.5 py-1 rounded-full text-xs font-medium">
                        {u.name || u.email}
                        <button type="button" onClick={() => setThreadParticipants((prev) => prev.filter((id) => id !== userId))}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
                <div className="flex items-center gap-2 bg-brand-light rounded-lg px-3 py-2">
                  <Search className="w-4 h-4 text-brand-gray" />
                  <input
                    type="text"
                    placeholder="Search people..."
                    value={searchUsers}
                    onChange={(e) => setSearchUsers(e.target.value)}
                    className="bg-transparent text-sm text-brand-dark placeholder:text-brand-gray/50 focus:outline-none w-full"
                  />
                </div>
                {searchUsers && (
                  <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg">
                    {filteredUsers.filter((u) => !threadParticipants.includes(u.id)).slice(0, 10).map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => { setThreadParticipants((prev) => [...prev, u.id]); setSearchUsers(""); }}
                        className="w-full text-left p-3 hover:bg-brand-light flex items-center gap-3 border-b last:border-0"
                      >
                        <div className="w-8 h-8 bg-brand-red/10 rounded-full flex items-center justify-center">
                          <span className="text-brand-red text-xs font-bold">{(u.name || u.email).charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-brand-dark">{u.name || "No name"}</p>
                          <p className="text-xs text-brand-gray">{u.email} · {ROLE_LABELS[u.role] || u.role}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1">First Message</label>
                <textarea
                  value={threadFirstMessage}
                  onChange={(e) => setThreadFirstMessage(e.target.value)}
                  rows={4}
                  placeholder="Write your message..."
                  className="w-full bg-brand-light rounded-xl px-4 py-3 text-sm text-brand-dark placeholder:text-brand-gray/50 focus:outline-none focus:ring-2 focus:ring-brand-red/30 resize-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowNewThread(false)}>Cancel</Button>
                <Button type="submit" disabled={creating || !threadSubject || !threadParticipants.length || !threadFirstMessage} icon={<Send className="w-4 h-4" />}>
                  {creating ? "Creating..." : "Start Conversation"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
