"use client";

import { useEffect, useState } from "react";
import { Card, PageHeader, Button, Input, Select, Table, TableHeader, TableBody, TableRow, TableCell, Badge, LoadingState, EmptyState } from "@/components/ui";
import { RefreshCw, Filter, History } from "lucide-react";

interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  metadata: string | null;
  ip: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string; role: string } | null;
}

const RESOURCE_OPTIONS = [
  { value: "", label: "All Resources" },
  { value: "student", label: "Students" },
  { value: "enrolment", label: "Enrolments" },
  { value: "attendance", label: "Attendance" },
  { value: "assessment", label: "Assessments" },
  { value: "assessmentResult", label: "Results" },
  { value: "invoice", label: "Invoices" },
  { value: "payment", label: "Payments" },
  { value: "expense", label: "Expenses" },
  { value: "document", label: "Documents" },
  { value: "admission", label: "Admissions" },
  { value: "announcement", label: "Announcements" },
  { value: "user", label: "Users" },
  { value: "staff", label: "Staff" },
  { value: "parentGuardian", label: "Parents" },
  { value: "product", label: "Products" },
  { value: "productOrder", label: "Orders" },
  { value: "school", label: "Settings" },
  { value: "invitation", label: "Invitations" },
];

const ACTION_COLORS: Record<string, string> = {
  "created": "bg-green-100 text-green-700",
  "updated": "bg-blue-100 text-blue-700",
  "deleted": "bg-red-100 text-red-700",
  "status": "bg-purple-100 text-purple-700",
  "login": "bg-amber-100 text-amber-700",
};

function getActionColor(action: string): string {
  if (action.includes("created")) return ACTION_COLORS.created;
  if (action.includes("updated") || action.includes("patched")) return ACTION_COLORS.updated;
  if (action.includes("deleted")) return ACTION_COLORS.deleted;
  if (action.includes("status") || action.includes("enrolment")) return ACTION_COLORS.status;
  if (action.includes("login")) return ACTION_COLORS.login;
  return "bg-gray-100 text-gray-600";
}

function formatAction(action: string): string {
  return action.replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [resource, setResource] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [resources, setResources] = useState<string[]>([]);

  const fetchLogs = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "30");
    if (resource) params.set("resource", resource);
    if (search) params.set("search", search);

    try {
      const res = await fetch(`/api/audit?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setResources(data.resources || []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, resource, search]);

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  return (
    <div>
      <PageHeader
        title="Audit Log"
        description={`Track all system activity · ${total.toLocaleString()} entries`}
        action={
          <Button variant="outline" onClick={fetchLogs} icon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
        }
      />

      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search actions, resources, IDs..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={resource}
              onChange={(e) => { setResource(e.target.value); setPage(1); }}
              options={RESOURCE_OPTIONS}
            />
          </div>
          <Button variant="primary" onClick={handleSearch} icon={<Filter className="w-4 h-4" />}>
            Search
          </Button>
        </div>
      </Card>

      {loading ? (
        <LoadingState message="Loading audit logs..." />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={<History className="w-12 h-12" />}
          title="No audit logs found"
          description="System activity will appear here as users interact with the platform."
        />
      ) : (
        <>
          <Card padding={false}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Resource</TableCell>
                  <TableCell>Resource ID</TableCell>
                  <TableCell>Metadata</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  let metadata: Record<string, any> = {};
                  try {
                    metadata = log.metadata ? JSON.parse(log.metadata) : {};
                  } catch {}

                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="text-xs">
                          <div className="font-medium text-brand-dark">
                            {new Date(log.createdAt).toLocaleDateString("en-ZA")}
                          </div>
                          <div className="text-brand-gray">
                            {new Date(log.createdAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.user ? (
                          <div>
                            <div className="text-sm font-medium text-brand-dark">
                              {log.user.name || log.user.email}
                            </div>
                            <div className="text-xs text-brand-gray">{log.user.role.replace("_", " ")}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-brand-gray">System</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${getActionColor(log.action)}`}>
                          {formatAction(log.action)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-brand-dark capitalize">{log.resource}</span>
                      </TableCell>
                      <TableCell>
                        {log.resourceId ? (
                          <span className="text-xs font-mono text-brand-gray">{log.resourceId.slice(0, 8)}...</span>
                        ) : (
                          <span className="text-xs text-brand-gray">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {Object.keys(metadata).length > 0 ? (
                          <div className="text-xs text-brand-gray max-w-[200px] truncate">
                            {Object.entries(metadata).map(([k, v]) => (
                              <span key={k}><span className="font-medium">{k}:</span> {String(v)} </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-brand-gray">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-brand-gray">
                Page {page} of {totalPages} · {total.toLocaleString()} entries
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
