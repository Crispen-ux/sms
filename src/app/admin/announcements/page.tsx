"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card, PageHeader, Button, Input, Select, Badge,
  Table, TableHeader, TableBody, TableRow, TableCell,
  EmptyState, LoadingState, ConfirmModal, useToast,
} from "@/components/ui";
import { Plus, Search, Megaphone, Trash2, X, AlertCircle, CheckCircle, Send } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  target: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
}

const TARGET_LABELS: Record<string, string> = {
  ALL: "All Users",
  PARENTS: "Parents",
  TEACHERS: "Teachers",
  STUDENTS: "Students",
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [targetFilter, setTargetFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20", ...(search && { search }), ...(targetFilter !== "ALL" && { target: targetFilter }) });
      const res = await fetch(`/api/announcements?${params}`);
      const data = await res.json();
      setAnnouncements(data.announcements);
      setTotalPages(data.totalPages);
    } catch { setError("Failed to load"); }
    finally { setLoading(false); }
  }, [page, search, targetFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (data: any) => {
    try {
      const res = await fetch("/api/announcements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      setSuccess("Announcement created");
      setShowCreate(false);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) { setError(e.message); setTimeout(() => setError(""), 3000); }
  };

  const handlePublish = async (id: string, published: boolean) => {
    try {
      await fetch(`/api/announcements/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ published }) });
      setSuccess(published ? "Published" : "Unpublished");
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch { setError("Failed to update"); setTimeout(() => setError(""), 3000); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await fetch(`/api/announcements/${confirmDelete}`, { method: "DELETE" });
      toast("Announcement deleted successfully");
      fetchData();
    } catch {
      toast("Failed to delete announcement", "error");
    }
    setConfirmDelete(null);
  };

  return (
    <div>
      <PageHeader title="Announcements" description="Create and manage school announcements." action={<Button onClick={() => setShowCreate(true)} icon={<Plus className="w-4 h-4" />}>New Announcement</Button>} />

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-500 shrink-0" /><p className="text-sm text-red-700">{error}</p></div>}
      {success && <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500 shrink-0" /><p className="text-sm text-green-700">{success}</p></div>}

      <Card className="mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]"><Input label="Search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search announcements..." /></div>
          <div className="w-40"><Select label="Target" value={targetFilter} onChange={(e) => { setTargetFilter(e.target.value); setPage(1); }} options={[{ value: "ALL", label: "All" }, ...Object.entries(TARGET_LABELS).filter(([v]) => v !== "ALL").map(([v, l]) => ({ value: v, label: l }))]} /></div>
        </div>
      </Card>

      <Card padding={false}>
        {loading ? <LoadingState /> : announcements.length === 0 ? (
          <EmptyState icon={<Megaphone className="w-6 h-6 text-brand-gray" />} title="No announcements" description="Create your first announcement." />
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableCell className="font-semibold text-brand-dark">Title</TableCell>
              <TableCell className="font-semibold text-brand-dark">Target</TableCell>
              <TableCell className="font-semibold text-brand-dark">Status</TableCell>
              <TableCell className="font-semibold text-brand-dark">Created</TableCell>
              <TableCell className="font-semibold text-brand-dark text-right">Actions</TableCell>
            </TableRow></TableHeader>
            <TableBody>
              {announcements.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <p className="font-medium text-brand-dark">{a.title}</p>
                    <p className="text-xs text-brand-gray truncate max-w-xs">{a.content}</p>
                  </TableCell>
                  <TableCell><Badge>{TARGET_LABELS[a.target] || a.target}</Badge></TableCell>
                  <TableCell>{a.published ? <Badge variant="success">Published</Badge> : <Badge>Draft</Badge>}</TableCell>
                  <TableCell className="text-brand-gray text-sm">{new Date(a.createdAt).toLocaleDateString("en-ZA")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handlePublish(a.id, !a.published)} className="p-2 hover:bg-brand-light rounded-lg" title={a.published ? "Unpublish" : "Publish"}><Send className="w-4 h-4 text-brand-red" /></button>
                      <button onClick={() => setConfirmDelete(a.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-brand-mid/30">
            <span className="text-sm text-brand-gray">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      {showCreate && <CreateModal onSubmit={handleCreate} onClose={() => setShowCreate(false)} />}
      <ConfirmModal
        open={confirmDelete !== null}
        title="Delete Announcement"
        message="Are you sure you want to delete this announcement? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

function CreateModal({ onSubmit, onClose }: { onSubmit: (d: any) => void; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [target, setTarget] = useState("ALL");
  const [published, setPublished] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-brand-dark">New Announcement</h2>
          <button onClick={onClose} className="p-2 hover:bg-brand-light rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit({ title, content, target, published }); }} className="space-y-4">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <div>
            <label className="text-sm font-medium text-brand-dark mb-1 block">Content</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} className="w-full border border-brand-mid/30 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20" required />
          </div>
          <Select label="Target Audience" value={target} onChange={(e) => setTarget(e.target.value)} options={Object.entries(TARGET_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="rounded" />Publish immediately</label>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">Create</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
