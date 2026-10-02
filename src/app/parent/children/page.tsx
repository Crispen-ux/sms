"use client";

import { useState, useEffect } from "react";
import { Card, Badge, LoadingState } from "@/components/ui";
import { AlertCircle, User, Mail, Phone } from "lucide-react";

interface Guardian {
  firstName: string;
  lastName: string;
  relationship: string | null;
  isPrimary: boolean;
}

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  isPrimary: boolean;
  activeEnrolment: { grade: { name: string }; class: { name: string } | null; academicYear: { name: string } } | null;
  guardians: Guardian[];
}

export default function ChildrenPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/parent")
      .then((r) => r.json())
      .then((data) => setChildren(data.children || []))
      .catch(() => setError("Failed to load children"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-500 shrink-0" /><p className="text-sm text-red-700">{error}</p></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-dark mb-6">My Children</h1>

      {children.length === 0 ? (
        <Card><p className="text-brand-gray text-center py-8">No children linked to your account.</p></Card>
      ) : (
        <div className="space-y-6">
          {children.map((child) => (
            <Card key={child.id}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-brand-dark">{child.firstName} {child.lastName}</h2>
                  {child.studentNumber && <p className="text-sm text-brand-gray">Student #: {child.studentNumber}</p>}
                </div>
                {child.isPrimary && <Badge variant="success">Primary Contact</Badge>}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                {child.gender && (
                  <div>
                    <p className="text-xs text-brand-gray">Gender</p>
                    <p className="text-sm font-medium text-brand-dark">{child.gender}</p>
                  </div>
                )}
                {child.dateOfBirth && (
                  <div>
                    <p className="text-xs text-brand-gray">Date of Birth</p>
                    <p className="text-sm font-medium text-brand-dark">{new Date(child.dateOfBirth).toLocaleDateString("en-ZA")}</p>
                  </div>
                )}
                {child.activeEnrolment && (
                  <>
                    <div>
                      <p className="text-xs text-brand-gray">Grade</p>
                      <p className="text-sm font-medium text-brand-dark">{child.activeEnrolment.grade.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-brand-gray">Class</p>
                      <p className="text-sm font-medium text-brand-dark">{child.activeEnrolment.class?.name || "Not assigned"}</p>
                    </div>
                  </>
                )}
              </div>

              {child.guardians.length > 0 && (
                <div>
                  <p className="text-xs text-brand-gray mb-2">Guardians</p>
                  <div className="flex flex-wrap gap-2">
                    {child.guardians.map((g, idx) => (
                      <Badge key={idx} variant={g.isPrimary ? "success" : "default"}>
                        {g.firstName} {g.lastName} ({g.relationship || "Guardian"})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
