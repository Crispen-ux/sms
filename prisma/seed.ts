import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { existsSync } from "fs";
import * as path from "path";

// Load `.env` (READ-ONLY — never writes to it) so ADMIN_*/SCHOOL_* values are
// visible when the seed is run through `tsx` outside Next.js or the Prisma
// CLI. Values already present in the real environment take precedence.
const envFile = path.join(process.cwd(), ".env");
if (existsSync(envFile) && typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(envFile);
  } catch {
    console.warn(`⚠ Could not parse ${envFile} — continuing with the ambient environment.`);
  }
}

const prisma = new PrismaClient();

const IS_PRODUCTION = process.env.NODE_ENV === "production";

/** Trimmed environment value, or undefined when unset/blank. */
function env(key: string): string | undefined {
  const raw = process.env[key];
  if (raw === undefined) return undefined;
  const trimmed = raw.trim();
  return trimmed === "" ? undefined : trimmed;
}

/** Environment value with a development fallback. */
function envOr(key: string, fallback: string): string {
  return env(key) ?? fallback;
}

interface Credentials {
  email: string;
  password: string;
}

/**
 * The school administrator account is mandatory.
 * Outside production it falls back to a throwaway default; in production the
 * operator MUST set the variables explicitly or the seed aborts.
 */
function requiredCredentials(
  emailKey: string,
  passwordKey: string,
  devEmail: string,
  devPassword: string,
  label: string
): Credentials {
  const email = env(emailKey);
  const password = env(passwordKey);

  if (IS_PRODUCTION) {
    if (!email || !password) {
      throw new Error(
        `${label} account is not configured. Set ${emailKey} and ${passwordKey} in the environment ` +
          `before seeding — development defaults are disabled when NODE_ENV=production.`
      );
    }
    return { email, password };
  }

  return { email: email ?? devEmail, password: password ?? devPassword };
}

/**
 * Optional accounts (teacher / parent sample data).
 * Created when explicitly configured; outside production they fall back to
 * throwaway defaults; in production they are skipped with a warning so a
 * production seed never ships known passwords.
 */
function optionalCredentials(
  emailKey: string,
  passwordKey: string,
  devEmail: string,
  devPassword: string,
  label: string
): Credentials | null {
  const email = env(emailKey);
  const password = env(passwordKey);

  if (email && password) return { email, password };

  if (email || password) {
    console.warn(
      `⚠ ${label} account skipped: set BOTH ${emailKey} and ${passwordKey} (only one is present).`
    );
    return null;
  }

  if (IS_PRODUCTION) {
    console.warn(
      `⚠ ${label} account skipped: ${emailKey} / ${passwordKey} are not set in production.`
    );
    return null;
  }

  return { email: devEmail, password: devPassword };
}

async function main() {
  console.log("🌱 Seeding database...\n");

  // Resolve credentials BEFORE touching the database so a misconfigured
  // production environment fails fast.
  const adminCreds = requiredCredentials(
    "ADMIN_EMAIL",
    "ADMIN_PASSWORD",
    "admin@example.com",
    "admin123",
    "School administrator"
  );
  const teacherCreds = optionalCredentials(
    "TEACHER_EMAIL",
    "TEACHER_PASSWORD",
    "teacher@example.com",
    "teacher123",
    "Teacher"
  );
  const parentCreds = optionalCredentials(
    "PARENT_EMAIL",
    "PARENT_PASSWORD",
    "parent@example.com",
    "parent123",
    "Parent"
  );

  // ── School ─────────────────────────────────────────────────────────────
  // Reuse the id of the existing school row: the app loads the school with
  // `findFirst()` everywhere, so creating a second row would break it.
  const existingSchool = await prisma.school.findFirst({ select: { id: true } });
  const schoolId = existingSchool?.id ?? "school-main";

  const envName = env("SCHOOL_NAME");
  const envAddress = env("SCHOOL_ADDRESS");
  const envCity = env("SCHOOL_CITY");
  const envPhone = env("SCHOOL_PHONE");
  const envEmail = env("SCHOOL_EMAIL");
  const envWebsite = env("SCHOOL_WEBSITE");
  const primaryColor = env("PRIMARY_COLOR");
  const secondaryColor = env("SECONDARY_COLOR");

  const schoolName = envName ?? "My School";
  const schoolAddress = envAddress ?? "";
  const schoolCity = envCity ?? "";
  const schoolPhone = envPhone ?? "";
  const schoolEmail = envEmail ?? "";
  const schoolWebsite = envWebsite ?? "";

  const addressLine = [schoolAddress, schoolCity].filter(Boolean).join(", ");
  const emailSignature = `Kind regards,\n${schoolName}`;
  const emailFooter = addressLine ? `${schoolName} | ${addressLine}` : schoolName;
  const identityConfigured =
    envName !== undefined || envAddress !== undefined || envCity !== undefined;

  const school = await prisma.school.upsert({
    where: { id: schoolId },
    // Only overwrite fields the operator configured explicitly in the
    // environment — applying development defaults here would wipe branding
    // that was set through System Configuration → Branding.
    update: {
      ...(envName !== undefined ? { name: schoolName } : {}),
      ...(envAddress !== undefined ? { address: schoolAddress } : {}),
      ...(envCity !== undefined ? { city: schoolCity } : {}),
      ...(envPhone !== undefined ? { phone: schoolPhone } : {}),
      ...(envEmail !== undefined ? { email: schoolEmail } : {}),
      ...(envWebsite !== undefined ? { website: schoolWebsite } : {}),
      ...(primaryColor !== undefined ? { accentColor: primaryColor } : {}),
      ...(secondaryColor !== undefined ? { secondaryColor: secondaryColor } : {}),
      ...(identityConfigured ? { emailSignature, emailFooter } : {}),
    },
    create: {
      id: schoolId,
      name: schoolName,
      address: schoolAddress || null,
      city: schoolCity || null,
      phone: schoolPhone || null,
      email: schoolEmail || null,
      website: schoolWebsite || null,
      logoUrl: null,
      emailSignature,
      emailFooter,
      ...(primaryColor !== undefined ? { accentColor: primaryColor } : {}),
      ...(secondaryColor !== undefined ? { secondaryColor: secondaryColor } : {}),
    },
  });
  console.log("✅ School:", school.name);

  // Create academic year
  const academicYear = await prisma.academicYear.upsert({
    where: { id: "year-2027" },
    update: {},
    create: {
      id: "year-2027",
      schoolId: school.id,
      name: "2027",
      startYear: 2027,
      endYear: 2028,
      active: true,
    },
  });
  console.log("✅ Academic Year:", academicYear.name);

  // Create grades
  const gradeNames = [
    "Grade RR", "Grade R", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5",
    "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11",
  ];

  const phases: Record<string, string> = {
    "Grade RR": "Early Years",
    "Grade R": "Early Years",
    "Grade 1": "Primary Phase",
    "Grade 2": "Primary Phase",
    "Grade 3": "Primary Phase",
    "Grade 4": "Primary Phase",
    "Grade 5": "Primary Phase",
    "Grade 6": "Primary Phase",
    "Grade 7": "Primary Phase",
    "Grade 8": "High School",
    "Grade 9": "High School",
    "Grade 10": "High School",
    "Grade 11": "High School",
  };

  const grades = [];
  for (let i = 0; i < gradeNames.length; i++) {
    const grade = await prisma.grade.upsert({
      where: { id: `grade-${i}` },
      update: {},
      create: {
        id: `grade-${i}`,
        schoolId: school.id,
        name: gradeNames[i],
        phase: phases[gradeNames[i]],
        sortOrder: i,
      },
    });
    grades.push(grade);
  }
  console.log("✅ Grades:", grades.length, "created");

  // ── Primary administrator ──────────────────────────────────────────────
  const adminPasswordHash = await bcrypt.hash(adminCreds.password, 12);
  const adminUser = await prisma.user.upsert({
    where: { email: adminCreds.email },
    update: {},
    create: {
      email: adminCreds.email,
      name: "Admin User",
      passwordHash: adminPasswordHash,
      role: "SCHOOL_ADMIN",
    },
  });
  console.log("✅ Admin user:", adminUser.email);

  // ── Demo accounts (demo instances only) ────────────────────────────────
  let demoCreds: Credentials | null = null;
  if (process.env.DEMO_MODE === "true") {
    const demoEmail = envOr("DEMO_ADMIN_EMAIL", "demo@schoolos.demo");
    const demoPassword =
      env("DEMO_ADMIN_PASSWORD") ?? (IS_PRODUCTION ? undefined : "demo123");

    if (demoPassword === undefined) {
      console.warn(
        "⚠ DEMO_MODE is enabled but DEMO_ADMIN_PASSWORD is not set — skipping demo accounts."
      );
    } else {
      demoCreds = { email: demoEmail, password: demoPassword };
      const demoPasswordHash = await bcrypt.hash(demoPassword, 12);
      const demoUser = await prisma.user.upsert({
        where: { email: demoEmail },
        update: {},
        create: {
          email: demoEmail,
          name: "Demo Administrator",
          passwordHash: demoPasswordHash,
          role: "SCHOOL_ADMIN",
        },
      });
      console.log("✅ Demo admin user:", demoUser.email);
    }
  }

  // ── Teacher + staff record ─────────────────────────────────────────────
  if (teacherCreds) {
    const teacherPasswordHash = await bcrypt.hash(teacherCreds.password, 12);
    const teacherUser = await prisma.user.upsert({
      where: { email: teacherCreds.email },
      update: {},
      create: {
        email: teacherCreds.email,
        name: "Demo Teacher",
        passwordHash: teacherPasswordHash,
        role: "TEACHER",
      },
    });
    console.log("✅ Teacher user:", teacherUser.email);

    const staff = await prisma.staff.upsert({
      where: { id: "staff-1" },
      update: {},
      create: {
        id: "staff-1",
        userId: teacherUser.id,
        schoolId: school.id,
        staffNumber: "TCH001",
        firstName: "Demo",
        lastName: "Teacher",
        phone: "+27 82 000 0001",
        position: "Teacher",
      },
    });
    console.log("✅ Staff:", staff.firstName, staff.lastName);
  } else {
    console.warn("⚠ Teacher account not configured — staff sample record skipped.");
  }

  // ── Parent + guardian record ───────────────────────────────────────────
  let guardianId: string | null = null;
  if (parentCreds) {
    const parentPasswordHash = await bcrypt.hash(parentCreds.password, 12);
    const parentUser = await prisma.user.upsert({
      where: { email: parentCreds.email },
      update: {},
      create: {
        email: parentCreds.email,
        name: "Demo Parent",
        passwordHash: parentPasswordHash,
        role: "PARENT",
      },
    });
    console.log("✅ Parent user:", parentUser.email);

    const guardian = await prisma.parentGuardian.upsert({
      where: { userId: parentUser.id },
      update: {},
      create: {
        userId: parentUser.id,
        firstName: "Demo",
        lastName: "Parent",
        phone: "+27 82 000 0002",
        email: parentCreds.email,
        relationship: "Mother",
      },
    });
    guardianId = guardian.id;
    console.log("✅ Guardian record:", guardian.firstName, guardian.lastName);
  } else {
    console.warn("⚠ Parent account not configured — guardian sample record skipped.");
  }

  // Create demo students
  const students = [];
  for (let i = 1; i <= 5; i++) {
    const student = await prisma.student.upsert({
      where: { id: `student-${i}` },
      update: {},
      create: {
        id: `student-${i}`,
        studentNumber: `STU2027${String(i).padStart(4, "0")}`,
        firstName: `Demo Student`,
        lastName: `${String(i).padStart(2, "0")}`,
        gender: i % 2 === 0 ? "Female" : "Male",
      },
    });
    students.push(student);
  }
  console.log("✅ Students:", students.length, "created");

  // Create parent-guardian links
  if (guardianId) {
    for (const student of students.slice(0, 2)) {
      await prisma.studentGuardian.upsert({
        where: { id: `link-${student.id}-${guardianId}` },
        update: {},
        create: {
          id: `link-${student.id}-${guardianId}`,
          studentId: student.id,
          guardianId,
          isPrimary: true,
        },
      });
    }
    console.log("✅ Parent-student links created");
  } else {
    console.warn("⚠ Parent-student links skipped (no guardian record).");
  }

  // Create enrolments for demo students
  for (let i = 0; i < students.length; i++) {
    await prisma.enrolment.upsert({
      where: { id: `enrolment-${students[i].id}` },
      update: {},
      create: {
        id: `enrolment-${students[i].id}`,
        studentId: students[i].id,
        academicYearId: academicYear.id,
        gradeId: grades[i + 2].id, // Start from Grade 1
        status: "ACTIVE",
      },
    });
  }
  console.log("✅ Enrolments created");

  // Create subjects
  const subjectNames = ["Mathematics", "English", "Afrikaans", "Science", "Social Studies", "Life Skills"];
  const subjects = [];
  for (let i = 0; i < subjectNames.length; i++) {
    const subject = await prisma.subject.upsert({
      where: { id: `subject-${i}` },
      update: {},
      create: {
        id: `subject-${i}`,
        schoolId: school.id,
        name: subjectNames[i],
      },
    });
    subjects.push(subject);
  }
  console.log("✅ Subjects:", subjects.length, "created");

  console.log("\n🎉 Seed complete!\n");
  console.log("📋 Login credentials (as configured for this run):");
  console.log(`   Admin:   ${adminCreds.email} / ${adminCreds.password}`);
  if (teacherCreds) {
    console.log(`   Teacher: ${teacherCreds.email} / ${teacherCreds.password}`);
  }
  if (parentCreds) {
    console.log(`   Parent:  ${parentCreds.email} / ${parentCreds.password}`);
  }
  if (demoCreds) {
    console.log(`   Demo:    ${demoCreds.email} / ${demoCreds.password}`);
  }
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
