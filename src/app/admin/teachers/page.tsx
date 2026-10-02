"use client";

import { useState, useEffect } from "react";
import {
  Card, PageHeader, Button, Input, Badge,
  Table, TableHeader, TableBody, TableRow, TableCell,
  EmptyState, LoadingState,
} from "@/components/ui";
import { Search, Award, Eye, Mail, Phone } from "lucide-react";
import Link from "next/link";

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  position: string | null;
  staffNumber: string | null;
  user: { email: string; role: string; status: string; active: boolean } | null;
  _count: { teacherClasses: number; teacherSubjects: number };
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20", ...(search && { search }) });
      const res = await fetch(`/api/staff?${params}`);
      if (res.ok) {
        const data = await res.json();
        // Filter to only teacher-role staff
        const allStaff = data.staff || [];
        const teacherStaff = allStaff.filter((s: Teacher) =>
          s.position?.toLowerCase().includes("teacher") || s.user?.role === "TEACHER"
        );
        setTeachers(teacherStaff);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeachers(); }, [page, search]);

  return (
    <div>
      <PageHeader
        title="Teachers"
        description="Manage teacher profiles, class assignments, and subject allocations."
      />

      <Card padding={false}>
        <div className="p-4 border-b border-brand-mid/30">
          <div className="flex items-center gap-2 bg-brand-light rounded-xl px-4 py-2 max-w-sm">
            <Search className="w-4 h-4 text-brand-gray" />
            <input
              type="text"
              placeholder="Search teachers..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="bg-transparent text-sm text-brand-dark placeholder:text-brand-gray/50 focus:outline-none w-full"
            />
          </div>
        </div>

        {loading ? <LoadingState /> : teachers.length === 0 ? (
          <EmptyState
            icon={<Award className="w-6 h-6 text-brand-gray" />}
            title="No teachers found"
            description="No staff members with teacher positions found."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell className="font-semibold text-brand-dark">Teacher</TableCell>
                <TableCell className="font-semibold text-brand-dark">Staff ID</TableCell>
                <TableCell className="font-semibold text-brand-dark">Contact</TableCell>
                <TableCell className="font-semibold text-brand-dark">Classes</TableCell>
                <TableCell className="font-semibold text-brand-dark">Subjects</TableCell>
                <TableCell className="font-semibold text-brand-dark">Account</TableCell>
                <TableCell className="font-semibold text-brand-dark text-right">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-brand-red/10 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-brand-red text-sm font-bold">{t.firstName.charAt(0)}{t.lastName.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-brand-dark">{t.firstName} {t.lastName}</p>
                        {t.position && <p className="text-xs text-brand-gray">{t.position}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-brand-gray font-mono text-sm">{t.staffNumber || "—"}</TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      {t.phone && <p className="text-xs text-brand-gray flex items-center gap-1"><Phone className="w-3 h-3" />{t.phone}</p>}
                      {t.user?.email && <p className="text-xs text-brand-gray flex items-center gap-1"><Mail className="w-3 h-3" />{t.user.email}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={t._count.teacherClasses > 0 ? "info" : "default"}>
                      {t._count.teacherClasses}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={t._count.teacherSubjects > 0 ? "info" : "default"}>
                      {t._count.teacherSubjects}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {t.user ? (
                      <Badge variant={t.user.status === "ACTIVE" ? "success" : "danger"}>
                        {t.user.status === "ACTIVE" ? "Active" : t.user.status}
                      </Badge>
                    ) : (
                      <Badge>No Account</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/teachers/${t.id}`} className="p-2 hover:bg-brand-light rounded-lg inline-flex">
                      <Eye className="w-4 h-4 text-brand-gray" />
                    </Link>
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
    </div>
  );
}
