import { z } from "zod";

// ─── User Management ────────────────────────────────────

export const createUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().min(1, "Name is required").max(100),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum([
    "SUPER_ADMIN",
    "SCHOOL_ADMIN",
    "PRINCIPAL",
    "TEACHER",
    "ACCOUNTANT",
    "ADMISSIONS_OFFICER",
    "PARENT",
    "STUDENT",
  ]),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum([
    "SUPER_ADMIN",
    "SCHOOL_ADMIN",
    "PRINCIPAL",
    "TEACHER",
    "ACCOUNTANT",
    "ADMISSIONS_OFFICER",
    "PARENT",
    "STUDENT",
  ]).optional(),
  active: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// ─── Login ──────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

// ─── Pagination ─────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

// ─── Admissions ─────────────────────────────────────────

export const updateAdmissionStatusSchema = z.object({
  status: z.enum([
    "NEW",
    "CONTACTED",
    "IN_PROGRESS",
    "ACCEPTED",
    "ENROLLED",
    "CLOSED",
  ]),
  notes: z.string().optional(),
});

// ─── School Structure ───────────────────────────────────

export const createAcademicYearSchema = z.object({
  name: z.string().min(1, "Year name is required"),
  startYear: z.coerce.number().min(2020).max(2100),
  endYear: z.coerce.number().min(2020).max(2100),
  active: z.boolean().optional(),
});

export const createGradeSchema = z.object({
  name: z.string().min(1, "Grade name is required"),
  phase: z.string().optional(),
  sortOrder: z.coerce.number().optional(),
});

export const createClassSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  gradeId: z.string().min(1, "Grade is required"),
  academicYearId: z.string().min(1, "Academic year is required"),
  capacity: z.coerce.number().min(1).max(100).optional(),
});

export const createSubjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  code: z.string().optional(),
});

export const createStaffSchema = z.object({
  userId: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  position: z.string().optional(),
  staffNumber: z.string().optional(),
});

// ─── Students & Parents ─────────────────────────────────

export const createStudentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  idNumber: z.string().optional(),
  studentNumber: z.string().optional(),
});

export const createParentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  relationship: z.string().optional(),
});

export const linkGuardianSchema = z.object({
  guardianId: z.string().min(1, "Guardian is required"),
  isPrimary: z.boolean().optional(),
});

// ─── Enrolments ─────────────────────────────────────────

export const createEnrolmentSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  academicYearId: z.string().min(1, "Academic year is required"),
  gradeId: z.string().min(1, "Grade is required"),
  classId: z.string().optional(),
  status: z.enum(["ACTIVE", "TRANSFERRED", "WITHDRAWN", "GRADUATED"]).optional(),
});

export const updateEnrolmentSchema = z.object({
  gradeId: z.string().optional(),
  classId: z.string().optional(),
  status: z.enum(["ACTIVE", "TRANSFERRED", "WITHDRAWN", "GRADUATED"]).optional(),
});

// ─── Attendance ─────────────────────────────────────────

export const createAttendanceSchema = z.object({
  classId: z.string().min(1, "Class is required"),
  date: z.string().min(1, "Date is required"),
});

export const updateAttendanceRecordSchema = z.object({
  studentId: z.string().min(1),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
  reason: z.string().optional(),
});

export const saveAttendanceSchema = z.object({
  classId: z.string().min(1),
  date: z.string().min(1),
  records: z.array(z.object({
    studentId: z.string(),
    status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
    reason: z.string().optional(),
  })),
});

// ─── Academics ─────────────────────────────────────────

export const createAssessmentSchema = z.object({
  academicYearId: z.string().min(1, "Academic year is required"),
  subjectId: z.string().min(1, "Subject is required"),
  title: z.string().min(1, "Title is required"),
  type: z.enum(["TEST", "EXAM", "ASSIGNMENT", "PROJECT", "QUIZ"]).optional(),
  totalMarks: z.coerce.number().min(1, "Total marks must be at least 1"),
  date: z.string().optional(),
});

export const saveResultsSchema = z.object({
  assessmentId: z.string().min(1),
  results: z.array(z.object({
    studentId: z.string(),
    marks: z.coerce.number().min(0),
    comment: z.string().optional(),
  })),
});

export const updateResultStatusSchema = z.object({
  status: z.enum(["DRAFT", "SUBMITTED", "APPROVED", "PUBLISHED"]),
});

// ─── Finance ───────────────────────────────────────────

export const createFeeStructureSchema = z.object({
  academicYearId: z.string().min(1, "Academic year is required"),
  gradeId: z.string().min(1, "Grade is required"),
  name: z.string().min(1, "Fee name is required"),
  amount: z.coerce.number().min(0, "Amount must be positive"),
  frequency: z.enum(["ONCE_OFF", "MONTHLY", "TERM", "ANNUAL"]).optional(),
  active: z.boolean().optional(),
});

export const createInvoiceSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  academicYearId: z.string().min(1, "Academic year is required"),
  feeStructureId: z.string().optional(),
  dueDate: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1),
    amount: z.coerce.number().min(0),
    quantity: z.coerce.number().min(1).optional(),
  })).min(1, "At least one item is required"),
});

// ─── Expenses ───────────────────────────────────────────

export const createExpenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  category: z.string().min(1, "Category is required"),
  date: z.string().optional(),
  reference: z.string().optional(),
  vendor: z.string().optional(),
  notes: z.string().optional(),
});

export const updateExpenseSchema = z.object({
  description: z.string().min(1).optional(),
  amount: z.coerce.number().min(0.01).optional(),
  category: z.string().min(1).optional(),
  date: z.string().optional(),
  reference: z.string().optional(),
  vendor: z.string().optional(),
  notes: z.string().optional(),
});

export const recordPaymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  method: z.enum(["EFT", "CASH", "CARD", "DEBIT_ORDER", "OTHER"]).optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});
