"use client";

import { useState, useRef, useCallback } from "react";
import { useInView } from "@/lib/useInView";
import { SITE } from "@/lib/constants";
import {
  User,
  Baby,
  Users,
  Heart,
  Stethoscope,
  CreditCard,
  FileCheck,
  Upload,
  Send,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  FileText,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";

const GRADES = [
  "Grade RR","Grade R","Grade 1","Grade 2","Grade 3","Grade 4","Grade 5",
  "Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11",
];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const GENDERS = ["Male","Female"];
const RACES = ["African","Asian","Coloured","White","Other"];
const LANGUAGES = ["Zulu","Xhosa","Afrikaans","English","Sotho","Tswana","Venda","Tsonga","Swati","Ndebele","Other"];
const TRANSPORT = ["Bus","By foot","Motorcar","Taxi","Bicycle","Motor cycle"];
const MARITAL = ["Married","Divorced","Remarried","Single","Widowed","Other"];
const HOME_LANGUAGES = ["Zulu","Xhosa","Afrikaans","English","Sotho","Tswana","Venda","Tsonga","Swati","Ndebele","Other"];
const CITIZENSHIPS = ["South African","Other"];
const RELIGIONS = ["Christian","Muslim","Hindu","Jewish","None","Other"];

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  preview?: string;
  category: string;
}

interface FormData {
  // Learner
  surname: string;
  initials: string;
  fullNames: string;
  preferredName: string;
  dob: string;
  gender: string;
  race: string;
  idNumber: string;
  residentialAddress: string;
  postCode: string;
  homeLanguage: string;
  citizenship: string;
  religion: string;
  deceasedParent: string;
  modeOfTransport: string;
  previousSchoolNone: boolean;
  previousSchoolName: string;
  previousSchoolAddress: string;
  previousSchoolTel: string;
  previousSchoolEmail: string;
  highestGradePassed: string;
  highestGradeYear: string;
  previousGradesRepeated: string;
  languageOfInstruction: string;
  dexterity: string;
  socialGrant: string;
  socialGrantNumber: string;
  numberOfChildren: string;
  positionInFamily: string;
  siblingsAtPgs: string;
  applicantLivesWith: string;
  // Parents - Father
  fatherSurname: string;
  fatherFirstNames: string;
  fatherIdNumber: string;
  fatherAddress: string;
  fatherHomeLanguage: string;
  fatherRace: string;
  fatherMaritalStatus: string;
  fatherHomeTel: string;
  fatherCell: string;
  fatherWorkTel: string;
  fatherEmail: string;
  fatherOccupation: string;
  fatherCompany: string;
  fatherCompanyAddress: string;
  // Parents - Mother
  motherSurname: string;
  motherFirstNames: string;
  motherIdNumber: string;
  motherAddress: string;
  motherHomeLanguage: string;
  motherRace: string;
  motherMaritalStatus: string;
  motherHomeTel: string;
  motherCell: string;
  motherWorkTel: string;
  motherEmail: string;
  motherOccupation: string;
  motherCompany: string;
  motherCompanyAddress: string;
  // Guardian
  hasGuardian: string;
  guardianSurname: string;
  guardianFirstNames: string;
  guardianIdNumber: string;
  guardianAddress: string;
  guardianHomeLanguage: string;
  guardianRace: string;
  guardianMaritalStatus: string;
  guardianHomeTel: string;
  guardianCell: string;
  guardianWorkTel: string;
  guardianEmail: string;
  guardianOccupation: string;
  guardianCompany: string;
  guardianCompanyAddress: string;
  // Emergency
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
  // Medical
  medicalConditions: string;
  everTested: string;
  testedDetails: string;
  specialProblems: string;
  // Fees
  feeResponsibility: string;
  canAfford: string;
  // Consent
  imageConsent: string;
  popiaConsent: string;
  // Declaration
  declarationRead: boolean;
}

const emptyForm: FormData = {
  surname:"",initials:"",fullNames:"",preferredName:"",dob:"",gender:"",race:"",
  idNumber:"",residentialAddress:"",postCode:"",homeLanguage:"",citizenship:"",
  religion:"",deceasedParent:"",modeOfTransport:"",previousSchoolNone:true,
  previousSchoolName:"",previousSchoolAddress:"",previousSchoolTel:"",previousSchoolEmail:"",
  highestGradePassed:"",highestGradeYear:"",previousGradesRepeated:"",languageOfInstruction:"",
  dexterity:"",socialGrant:"",socialGrantNumber:"",numberOfChildren:"",positionInFamily:"",
  siblingsAtPgs:"",applicantLivesWith:"",
  fatherSurname:"",fatherFirstNames:"",fatherIdNumber:"",fatherAddress:"",
  fatherHomeLanguage:"",fatherRace:"",fatherMaritalStatus:"",fatherHomeTel:"",
  fatherCell:"",fatherWorkTel:"",fatherEmail:"",fatherOccupation:"",fatherCompany:"",fatherCompanyAddress:"",
  motherSurname:"",motherFirstNames:"",motherIdNumber:"",motherAddress:"",
  motherHomeLanguage:"",motherRace:"",motherMaritalStatus:"",motherHomeTel:"",
  motherCell:"",motherWorkTel:"",motherEmail:"",motherOccupation:"",motherCompany:"",motherCompanyAddress:"",
  hasGuardian:"",
  guardianSurname:"",guardianFirstNames:"",guardianIdNumber:"",guardianAddress:"",
  guardianHomeLanguage:"",guardianRace:"",guardianMaritalStatus:"",guardianHomeTel:"",
  guardianCell:"",guardianWorkTel:"",guardianEmail:"",guardianOccupation:"",guardianCompany:"",guardianCompanyAddress:"",
  emergencyName:"",emergencyRelationship:"",emergencyPhone:"",
  medicalConditions:"",everTested:"",testedDetails:"",specialProblems:"",
  feeResponsibility:"",canAfford:"",
  imageConsent:"",popiaConsent:"",
  declarationRead:false,
};

const STEPS = [
  { label: "Learner", icon: Baby },
  { label: "Parents", icon: Users },
  { label: "Emergency & Medical", icon: Heart },
  { label: "Fees & Consent", icon: CreditCard },
  { label: "Documents", icon: Upload },
  { label: "Review", icon: FileCheck },
];

const DOCUMENT_CATEGORIES = [
  { id: "latest_report", label: "Latest Report from Present School", required: false, note: "If applicable" },
  { id: "transfer_docs", label: "Transfer Documents", required: false, note: "If applicable" },
  { id: "birth_cert", label: "Copy of Birth Certificate", required: true, note: "" },
  { id: "immunization", label: "Proof of Immunization", required: true, note: "" },
  { id: "parent_id_father", label: "Father's ID/Passport Copy", required: true, note: "" },
  { id: "parent_id_mother", label: "Mother's ID/Passport Copy", required: true, note: "" },
];

export default function EnrolForm() {
  const [ref, inView] = useInView(0.03);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const set = (field: keyof FormData, value: string | boolean) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) {
      setErrors((p) => { const n = { ...p }; delete n[field]; return n; });
    }
  };

  const input = (field: string, extra = "") =>
    `w-full px-4 py-3 rounded-xl border ${errors[field] ? "border-red-400 bg-red-50/50" : "border-brand-mid bg-white"} text-brand-dark placeholder:text-brand-gray/40 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all text-sm ${extra}`;

  const lbl = "block text-sm font-semibold text-brand-dark mb-1.5";
  const sublbl = "block text-xs font-medium text-brand-gray mb-1";
  const grid2 = "grid grid-cols-1 sm:grid-cols-2 gap-4";
  const grid3 = "grid grid-cols-1 sm:grid-cols-3 gap-4";
  const sectionTitle = "flex items-center gap-2 text-lg font-bold text-brand-dark mb-5";
  const divider = <div className="border-t border-brand-mid/50 my-6" />;

  const validateStep = (): boolean => {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (!form.fullNames.trim()) e.fullNames = "Required";
      if (!form.surname.trim()) e.surname = "Required";
      if (!form.dob) e.dob = "Required";
      if (!form.gender) e.gender = "Required";
    }
    if (step === 1) {
      if (!form.fatherFirstNames && !form.motherFirstNames && !form.guardianFirstNames)
        e.fatherFirstNames = "At least one parent/guardian required";
      if (form.fatherFirstNames && !form.fatherCell && !form.fatherHomeTel)
        e.fatherCell = "Phone required";
      if (form.motherFirstNames && !form.motherCell && !form.motherHomeTel)
        e.motherCell = "Phone required";
    }
    if (step === 2) {
      if (!form.emergencyName) e.emergencyName = "Required";
      if (!form.emergencyPhone) e.emergencyPhone = "Required";
    }
    if (step === 3) {
      if (!form.feeResponsibility) e.feeResponsibility = "Required";
      if (!form.imageConsent) e.imageConsent = "Required";
      if (!form.popiaConsent) e.popiaConsent = "Required";
    }
    if (step === 4) {
      const required = DOCUMENT_CATEGORIES.filter((d) => d.required);
      for (const cat of required) {
        if (!files.some((f) => f.category === cat.id)) {
          e[`doc_${cat.id}`] = "Required";
        }
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const handleFiles = useCallback((newFiles: FileList | File[], category: string) => {
    const arr = Array.from(newFiles);
    const mapped: UploadedFile[] = arr.map((f) => ({
      id: Math.random().toString(36).slice(2),
      name: f.name,
      type: f.type,
      size: f.size,
      category,
      preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
    }));
    setFiles((p) => [...p, ...mapped]);
  }, []);

  const removeFile = (id: string) => setFiles((p) => p.filter((f) => f.id !== id));

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files, "general");
  };

  const buildWhatsApp = (): string => {
    const f = form;
    let m = `*APPLICATION FOR ADMISSION*\n\n`;
    m += `*A. LEARNER DETAILS*\n`;
    m += `Full Names: ${f.fullNames}\nSurname: ${f.surname}\nInitials: ${f.initials}\nPreferred Name: ${f.preferredName}\n`;
    m += `DOB: ${f.dob}\nGender: ${f.gender}\nRace: ${f.race}\nID/Passport: ${f.idNumber}\n`;
    m += `Address: ${f.residentialAddress} ${f.postCode}\nHome Language: ${f.homeLanguage}\n`;
    m += `Citizenship: ${f.citizenship}\nReligion: ${f.religion}\n`;
    m += `Deceased Parent: ${f.deceasedParent || "None"}\nTransport: ${f.modeOfTransport}\n`;
    m += `Lives With: ${f.applicantLivesWith}\n`;
    if (!f.previousSchoolNone) {
      m += `Previous School: ${f.previousSchoolName}\nAddress: ${f.previousSchoolAddress}\n`;
      m += `Tel: ${f.previousSchoolTel}\nHighest Grade: ${f.highestGradePassed} (${f.highestGradeYear})\n`;
    }
    if (f.numberOfChildren) m += `Children in family: ${f.numberOfChildren}, Position: ${f.positionInFamily}\n`;
    if (f.siblingsAtPgs) m += `Siblings at PGS: ${f.siblingsAtPgs}\n`;
    m += `\n*PARENT/GUARDIAN DETAILS*\n`;
    if (f.fatherFirstNames) {
      m += `Father: ${f.fatherFirstNames} ${f.fatherSurname}\nID: ${f.fatherIdNumber}\nCell: ${f.fatherCell}\nEmail: ${f.fatherEmail}\nOccupation: ${f.fatherOccupation}\n`;
    }
    if (f.motherFirstNames) {
      m += `Mother: ${f.motherFirstNames} ${f.motherSurname}\nID: ${f.motherIdNumber}\nCell: ${f.motherCell}\nEmail: ${f.motherEmail}\nOccupation: ${f.motherOccupation}\n`;
    }
    if (f.hasGuardian === "Yes" && f.guardianFirstNames) {
      m += `Guardian: ${f.guardianFirstNames} ${f.guardianSurname}\nID: ${f.guardianIdNumber}\nCell: ${f.guardianCell}\n`;
    }
    m += `\n*EMERGENCY CONTACT*\n${f.emergencyName} (${f.emergencyRelationship}) — ${f.emergencyPhone}\n`;
    if (f.medicalConditions) m += `\nMedical: ${f.medicalConditions}\n`;
    if (f.everTested === "Yes") m += `Therapist/Doctor tested: ${f.testedDetails}\n`;
    if (f.specialProblems) m += `Special problems: ${f.specialProblems}\n`;
    m += `\n*FEES & CONSENT*\nFee responsibility confirmed: ${f.feeResponsibility}\nCan afford: ${f.canAfford}\n`;
    m += `Image consent: ${f.imageConsent}\nPOPIA consent: ${f.popiaConsent}\n`;
    m += `\nSigned: ${f.declarationRead ? "Yes" : "No"}\n`;
    m += `\nNote: ${files.length} document(s) attached — please bring certified copies to the school office.`;
    return m;
  };

  const handleSubmit = () => {
    const msg = encodeURIComponent(buildWhatsApp());
    window.open(`${SITE.whatsappLink}?text=${msg}`, "_blank");
    setSubmitted(true);
  };

  // ——— RENDER ———

  if (submitted) {
    return (
      <section ref={ref} className="py-20 lg:py-28">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className={`card-premium py-16 transition-all duration-700 ${inView ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-brand-dark mb-3">Application Submitted!</h3>
            <p className="text-brand-gray text-lg mb-2">Your application has been sent via WhatsApp.</p>
            <p className="text-brand-gray mb-6">Our admissions team will contact you shortly.</p>
            <p className="text-brand-gray/60 text-sm mb-8">Please bring certified copies of all uploaded documents to the school office to complete your application.</p>
            <button onClick={() => { setSubmitted(false); setForm(emptyForm); setFiles([]); setStep(0); }} className="btn-outline">
              Submit Another Application
            </button>
          </div>
        </div>
      </section>
    );
  }

  const renderInput = (field: keyof FormData, label: string, type = "text", opts?: { placeholder?: string; required?: boolean; grid?: string }) => (
    <div className={opts?.grid || ""}>
      <label className={lbl}>{label}{opts?.required !== false && <span className="text-brand-red ml-0.5">*</span>}</label>
      <input type={type} value={form[field] as string} onChange={(e) => set(field, e.target.value)}
        placeholder={opts?.placeholder || ""} className={input(field)} />
      {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]}</p>}
    </div>
  );

  const renderSelect = (field: keyof FormData, label: string, options: string[], opts?: { required?: boolean; grid?: string }) => (
    <div className={opts?.grid || ""}>
      <label className={lbl}>{label}{opts?.required !== false && <span className="text-brand-red ml-0.5">*</span>}</label>
      <select value={form[field] as string} onChange={(e) => set(field, e.target.value)} className={input(field)}>
        <option value="">Select...</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]}</p>}
    </div>
  );

  const renderRadio = (field: keyof FormData, label: string, options: string[], opts?: { required?: boolean }) => (
    <div>
      <label className={lbl}>{label}{opts?.required !== false && <span className="text-brand-red ml-0.5">*</span>}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o} type="button" onClick={() => set(field, o)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${form[field] === o ? "bg-brand-red text-white border-brand-red" : "bg-white text-brand-dark border-brand-mid hover:border-brand-red/40"}`}>
            {o}
          </button>
        ))}
      </div>
      {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]}</p>}
    </div>
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  // STEP INDICATOR
  const StepIndicator = () => (
    <div className="mb-10">
      {/* Desktop */}
      <div className="hidden sm:flex items-center justify-center gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = i === step;
          const done = i < step;
          return (
            <div key={s.label} className="flex items-center">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 ${active ? "bg-brand-red text-white shadow-lg shadow-brand-red/20" : done ? "bg-green-100 text-green-700" : "bg-brand-light text-brand-gray"}`}>
                {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                <span className="text-xs font-semibold">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-brand-gray/30 mx-1" />}
            </div>
          );
        })}
      </div>
      {/* Mobile */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-brand-dark">Step {step + 1} of {STEPS.length}</span>
          <span className="text-sm font-semibold text-brand-red">{STEPS[step].label}</span>
        </div>
        <div className="h-2 bg-brand-light rounded-full overflow-hidden">
          <div className="h-full bg-brand-red rounded-full transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>
    </div>
  );

  // ——— STEP 0: LEARNER ———
  const StepLearner = () => (
    <div className="space-y-6">
      <div><h3 className={sectionTitle}><Baby className="w-5 h-5 text-brand-red" />A. Details of Learner</h3></div>

      <div className={grid3}>
        {renderInput("surname", "Surname", "text", { placeholder: "e.g. Mokoena" })}
        {renderInput("initials", "Initials", "text", { placeholder: "e.g. T.M.", required: false })}
        {renderInput("fullNames", "Full Names", "text", { placeholder: "e.g. Thabo Michael" })}
      </div>
      <div className={grid3}>
        {renderInput("preferredName", "Preferred Name", "text", { placeholder: "e.g. Thabo", required: false })}
        {renderInput("dob", "Date of Birth", "date")}
        {renderSelect("gender", "Gender", GENDERS)}
      </div>
      <div className={grid3}>
        {renderSelect("race", "Race", RACES)}
        {renderInput("idNumber", "ID / Passport Number", "text", { placeholder: "e.g. 9001011234567" })}
        {renderSelect("homeLanguage", "Home Language", HOME_LANGUAGES)}
      </div>
      <div className={grid2}>
        {renderInput("residentialAddress", "Residential Address", "text", { placeholder: "Street address, suburb", required: false })}
        {renderInput("postCode", "Postal Code", "text", { placeholder: "e.g. 2000", required: false })}
      </div>
      <div className={grid3}>
        {renderSelect("citizenship", "Citizenship", CITIZENSHIPS, { required: false })}
        {renderSelect("religion", "Religion", RELIGIONS, { required: false })}
        {renderSelect("deceasedParent", "Deceased Parent", ["Mother","Father","Both","None"], { required: false })}
      </div>
      {divider}
      <div className={grid2}>
        {renderSelect("modeOfTransport", "Mode of Transport to School", TRANSPORT, { required: false })}
        {renderSelect("applicantLivesWith", "Applicant Lives With", ["Both parents","Father","Mother","Guardian","Other"], { required: false })}
      </div>
      <div className={grid3}>
        {renderInput("numberOfChildren", "Number of Children in Family", "number", { placeholder: "e.g. 3", required: false })}
        {renderInput("positionInFamily", "Position (e.g. first)", "text", { placeholder: "e.g. first", required: false })}
        {renderInput("siblingsAtPgs", "Brothers/Sisters at PGS", "text", { placeholder: "Name & Grade", required: false })}
      </div>
      {divider}
      <h4 className="font-bold text-brand-dark text-sm mb-3">Previous School Details</h4>
      <div>
        <label className="flex items-center gap-3 cursor-pointer mb-4">
          <input type="checkbox" checked={form.previousSchoolNone} onChange={(e) => set("previousSchoolNone", e.target.checked)}
            className="w-4 h-4 rounded border-brand-mid text-brand-red focus:ring-brand-red" />
          <span className="text-sm font-medium text-brand-dark">No previous school (first school entry)</span>
        </label>
      </div>
      {!form.previousSchoolNone && (
        <div className="space-y-4">
          <div className={grid2}>
            {renderInput("previousSchoolName", "Name of Previous School", "text", { required: false })}
            {renderInput("previousSchoolAddress", "Address of Previous School", "text", { required: false })}
          </div>
          <div className={grid3}>
            {renderInput("previousSchoolTel", "Tel. of Previous School", "tel", { required: false })}
            {renderInput("previousSchoolEmail", "Email of Previous School", "email", { required: false })}
            {renderSelect("languageOfInstruction", "Language of Instruction", LANGUAGES, { required: false })}
          </div>
          <div className={grid3}>
            {renderInput("highestGradePassed", "Highest Grade Passed", "text", { required: false })}
            {renderInput("highestGradeYear", "Year", "text", { required: false })}
            {renderInput("previousGradesRepeated", "Grades Repeated", "text", { placeholder: "e.g. Grade 4", required: false })}
          </div>
        </div>
      )}
      {divider}
      <div className={grid3}>
        {renderSelect("dexterity", "Handedness", ["Right Handed","Left Handed"], { required: false })}
        {renderSelect("socialGrant", "Registered for Social Grant?", ["Yes","No"], { required: false })}
        {form.socialGrant === "Yes" && renderInput("socialGrantNumber", "Social Grant Number", "text", { required: false })}
      </div>
    </div>
  );

  // ——— STEP 1: PARENTS ———
  const ParentFields = (prefix: "father" | "mother" | "guardian", label: string) => (
    <div className="space-y-4">
      <h4 className="font-bold text-brand-dark text-sm">{label}</h4>
      <div className={grid2}>
        {renderInput(`${prefix}Surname` as keyof FormData, "Surname", "text", { required: prefix !== "guardian" })}
        {renderInput(`${prefix}FirstNames` as keyof FormData, "First Name(s)", "text", { required: prefix !== "guardian" })}
      </div>
      <div className={grid2}>
        {renderInput(`${prefix}IdNumber` as keyof FormData, "ID Number", "text", { required: false })}
        {renderSelect(`${prefix}Race` as keyof FormData, "Race", RACES, { required: false })}
      </div>
      {renderInput(`${prefix}Address` as keyof FormData, "Address", "text", { required: false })}
      <div className={grid3}>
        {renderSelect(`${prefix}HomeLanguage` as keyof FormData, "Home Language", HOME_LANGUAGES, { required: false })}
        {renderSelect(`${prefix}MaritalStatus` as keyof FormData, "Marital Status", MARITAL, { required: false })}
        {renderInput(`${prefix}HomeTel` as keyof FormData, "Home Tel", "tel", { required: false })}
      </div>
      <div className={grid2}>
        {renderInput(`${prefix}Cell` as keyof FormData, "Cell Phone", "tel", { required: prefix !== "guardian" })}
        {renderInput(`${prefix}WorkTel` as keyof FormData, "Work Tel", "tel", { required: false })}
      </div>
      <div className={grid2}>
        {renderInput(`${prefix}Email` as keyof FormData, "Email", "email", { required: false })}
        {renderInput(`${prefix}Occupation` as keyof FormData, "Occupation", "text", { required: false })}
      </div>
      <div className={grid2}>
        {renderInput(`${prefix}Company` as keyof FormData, "Company", "text", { required: false })}
        {renderInput(`${prefix}CompanyAddress` as keyof FormData, "Company Address", "text", { required: false })}
      </div>
    </div>
  );

  const StepParents = () => (
    <div className="space-y-8">
      <div><h3 className={sectionTitle}><Users className="w-5 h-5 text-brand-red" />B. Parent / Guardian Details</h3></div>
      {ParentFields("father", "Biological Father")}
      {divider}
      {ParentFields("mother", "Biological Mother")}
      {divider}
      <div>
        {renderRadio("hasGuardian", "Is there a guardian?", ["Yes","No"], { required: false })}
      </div>
      {form.hasGuardian === "Yes" && (
        <>{divider}{ParentFields("guardian", "Guardian Details")}</>
      )}
    </div>
  );

  // ——— STEP 2: EMERGENCY & MEDICAL ———
  const StepEmergency = () => (
    <div className="space-y-6">
      <div><h3 className={sectionTitle}><Heart className="w-5 h-5 text-brand-red" />D. Emergency Contact</h3></div>
      <div className={grid3}>
        {renderInput("emergencyName", "Name & Surname", "text", { placeholder: "e.g. Sipho Mokoena" })}
        {renderInput("emergencyRelationship", "Relationship", "text", { placeholder: "e.g. Uncle" })}
        {renderInput("emergencyPhone", "Telephone Number", "tel", { placeholder: "e.g. 071 234 5678" })}
      </div>
      {divider}
      <div><h3 className={sectionTitle}><Stethoscope className="w-5 h-5 text-brand-red" />E. Medical Information</h3></div>
      <div>
        <label className={lbl}>Any special medical conditions the school should be aware of?</label>
        <textarea value={form.medicalConditions} onChange={(e) => set("medicalConditions", e.target.value)}
          rows={3} placeholder="e.g. Asthma, allergies, medication..." className={input("medicalConditions")} />
      </div>
      <div>
        {renderRadio("everTested", "Has your child been tested by any therapist/doctor for attention difficulty, hearing, or speech?", ["Yes","No"])}
      </div>
      {form.everTested === "Yes" && (
        <div>
          <label className={lbl}>Please provide details</label>
          <textarea value={form.testedDetails} onChange={(e) => set("testedDetails", e.target.value)}
            rows={3} placeholder="Therapist/doctor name, date, findings..." className={input("testedDetails")} />
        </div>
      )}
      <div>
        <label className={lbl} style={{ fontWeight: 400 }}>Special problems requiring counselling</label>
        <textarea value={form.specialProblems} onChange={(e) => set("specialProblems", e.target.value)}
          rows={3} placeholder="Any concerns..." className={input("specialProblems")} />
      </div>
    </div>
  );

  // ——— STEP 3: FEES & CONSENT ———
  const StepFees = () => (
    <div className="space-y-6">
      <div><h3 className={sectionTitle}><CreditCard className="w-5 h-5 text-brand-red" />F. School Fees</h3></div>
      <div className="bg-brand-light rounded-2xl p-5 mb-4">
        <h4 className="font-bold text-brand-dark text-sm mb-3">2026 Fee Structure (Paid for 12 months Jan–Dec)</h4>
        <div className="space-y-2">
          {[
            { grade: "Grade RR – Grade 3", monthly: "R800", annual: "R9,600", discount: "R8,640" },
            { grade: "Grade 4 – Grade 7", monthly: "R800", annual: "R9,600", discount: "R8,640" },
            { grade: "Grade 8 – Grade 10", monthly: "R900", annual: "R10,800", discount: "R9,720" },
            { grade: "Grade 11", monthly: "R900", annual: "R10,800", discount: "R9,720" },
          ].map((r) => (
            <div key={r.grade} className="flex items-center justify-between text-sm py-2 border-b border-brand-mid/30 last:border-0">
              <span className="font-medium text-brand-dark">{r.grade}</span>
              <span className="text-brand-gray">{r.monthly}/mo &middot; {r.annual}/yr &middot; <span className="text-green-600 font-semibold">{r.discount} early bird</span></span>
            </div>
          ))}
        </div>
      </div>
      <div className={grid2}>
        {renderRadio("feeResponsibility", "I take note that it is my responsibility to ensure my school fee account is up to date", ["Yes","No"])}
        {renderRadio("canAfford", "I can afford the school fees", ["Yes","No"])}
      </div>

      {divider}

      <div><h3 className={sectionTitle}><FileCheck className="w-5 h-5 text-brand-red" />G. Consent & Declaration</h3></div>

      <div className="bg-brand-cream rounded-2xl p-5 mb-2">
        <p className="text-sm text-brand-dark leading-relaxed">
          The school may take photos/images/videos of all our learners to display on various platforms including classroom teaching, school web pages and social media (including Facebook, Twitter, newspapers). I understand that the school may use these images for purposes such as celebrating achievements and publishing education events, as deemed appropriate by the School Governing Body and the Principal.
        </p>
      </div>
      {renderRadio("imageConsent", "Consent for learner images/videos", ["AGREE","DISAGREE"])}

      <div className="bg-brand-cream rounded-2xl p-5 mb-2">
        <p className="text-sm text-brand-dark leading-relaxed">
          I consent to the processing of personal information as defined in the Protection of Personal Information Act (POPIA). I understand that the school will collect, store and process personal information for the purpose of enrolment and school administration.
        </p>
      </div>
      {renderRadio("popiaConsent", "POPIA and Policies of the School", ["AGREE","DISAGREE"])}

      {divider}

      <div><h3 className="sectionTitle text-base"><FileCheck className="w-4 h-4 text-brand-red" />Declaration</h3></div>
      <div className="bg-brand-cream rounded-2xl p-5 mb-2">
        <p className="text-sm text-brand-dark leading-relaxed">
          I/We the undersigned, hereby confirm that the contents of this application have been read and understood, that the information supplied herein is correct, and that all documents attached hereto are authentic. On behalf of my child and on my own behalf, I agree to: accept the ethos of the school; accept the behaviour and uniform rules; accept the authority of the principal, teachers and prefects; understand that payment of school fees is compulsory; oversee my child&apos;s involvement in extra-mural programmes; give 30 days written notice if my child leaves the school; and abide by the school&apos;s Code of Conduct.
        </p>
      </div>
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" checked={form.declarationRead} onChange={(e) => set("declarationRead", e.target.checked)}
          className="w-4 h-4 mt-0.5 rounded border-brand-mid text-brand-red focus:ring-brand-red" />
        <span className="text-sm font-medium text-brand-dark">I have read and agree to the declaration above *</span>
      </label>
      {errors.declarationRead && <p className="text-red-500 text-xs">{errors.declarationRead}</p>}
    </div>
  );

  // ——— STEP 4: DOCUMENTS ———
  const StepDocuments = () => (
    <div className="space-y-6">
      <div><h3 className={sectionTitle}><Upload className="w-5 h-5 text-brand-red" />Required Documents</h3></div>
      <p className="text-sm text-brand-gray leading-relaxed">
        Upload clear photos or scans of the required documents. You can also bring certified copies to the school office.
      </p>

      <div className="space-y-4">
        {DOCUMENT_CATEGORIES.map((cat) => {
          const catFiles = files.filter((f) => f.category === cat.id);
          return (
            <div key={cat.id} className="bg-white rounded-2xl border border-brand-mid/50 p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-brand-dark text-sm">
                    {cat.label} {cat.required && <span className="text-brand-red">*</span>}
                  </p>
                  {cat.note && <p className="text-xs text-brand-gray mt-0.5">{cat.note}</p>}
                </div>
                {errors[`doc_${cat.id}`] && <span className="text-red-500 text-xs">{errors[`doc_${cat.id}`]}</span>}
              </div>
              <div className="flex flex-wrap gap-3">
                {catFiles.map((f) => (
                  <div key={f.id} className="relative group">
                    {f.preview ? (
                      <img src={f.preview} alt={f.name} className="w-20 h-20 object-cover rounded-xl border border-brand-mid" />
                    ) : (
                      <div className="w-20 h-20 bg-brand-light rounded-xl border border-brand-mid flex items-center justify-center">
                        <FileText className="w-6 h-6 text-brand-gray" />
                      </div>
                    )}
                    <button onClick={() => removeFile(f.id)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                    <p className="text-[10px] text-brand-gray mt-1 max-w-[80px] truncate">{f.name}</p>
                  </div>
                ))}
                <label className="w-20 h-20 border-2 border-dashed border-brand-mid hover:border-brand-red rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors">
                  <Upload className="w-5 h-5 text-brand-gray" />
                  <span className="text-[10px] text-brand-gray mt-1">Upload</span>
                  <input type="file" className="hidden" accept="image/*,.pdf"
                    onChange={(e) => e.target.files && handleFiles(e.target.files, cat.id)} />
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {/* General drag & drop zone */}
      <div
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${dragActive ? "border-brand-red bg-brand-red/5" : "border-brand-mid hover:border-brand-red/40"}`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-8 h-8 text-brand-gray mx-auto mb-3" />
        <p className="text-sm font-semibold text-brand-dark mb-1">Drag & drop additional files here</p>
        <p className="text-xs text-brand-gray">or click to browse (images & PDFs)</p>
        <input ref={fileInputRef} type="file" className="hidden" multiple accept="image/*,.pdf"
          onChange={(e) => e.target.files && handleFiles(e.target.files, "general")} />
      </div>

      {files.filter((f) => f.category === "general").length > 0 && (
        <div className="flex flex-wrap gap-3">
          {files.filter((f) => f.category === "general").map((f) => (
            <div key={f.id} className="relative group">
              {f.preview ? (
                <img src={f.preview} alt={f.name} className="w-20 h-20 object-cover rounded-xl border border-brand-mid" />
              ) : (
                <div className="w-20 h-20 bg-brand-light rounded-xl border border-brand-mid flex items-center justify-center">
                  <FileText className="w-6 h-6 text-brand-gray" />
                </div>
              )}
              <button onClick={() => removeFile(f.id)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-3 h-3" />
              </button>
              <p className="text-[10px] text-brand-gray mt-1 max-w-[80px] truncate">{f.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ——— STEP 5: REVIEW ———
  const ReviewRow = ({ label, value }: { label: string; value?: string }) =>
    value ? <div className="flex justify-between py-1.5 border-b border-brand-mid/30 last:border-0"><span className="text-brand-gray text-sm">{label}</span><span className="text-brand-dark text-sm font-medium text-right">{value}</span></div> : null;

  const StepReview = () => (
    <div className="space-y-6">
      <div><h3 className={sectionTitle}><FileCheck className="w-5 h-5 text-brand-red" />Review Your Application</h3></div>
      <p className="text-sm text-brand-gray">Please review all details before submitting.</p>

      <div className="bg-white rounded-2xl p-5 border border-brand-mid/50">
        <h4 className="font-bold text-brand-dark text-sm mb-3">A. Learner Details</h4>
        <ReviewRow label="Full Names" value={form.fullNames} />
        <ReviewRow label="Surname" value={form.surname} />
        <ReviewRow label="Initials" value={form.initials} />
        <ReviewRow label="Preferred Name" value={form.preferredName} />
        <ReviewRow label="Date of Birth" value={form.dob} />
        <ReviewRow label="Gender" value={form.gender} />
        <ReviewRow label="Race" value={form.race} />
        <ReviewRow label="ID/Passport" value={form.idNumber} />
        <ReviewRow label="Address" value={form.residentialAddress} />
        <ReviewRow label="Home Language" value={form.homeLanguage} />
        <ReviewRow label="Transport" value={form.modeOfTransport} />
        <ReviewRow label="Lives With" value={form.applicantLivesWith} />
        {!form.previousSchoolNone && <>
          <ReviewRow label="Previous School" value={form.previousSchoolName} />
          <ReviewRow label="Highest Grade" value={`${form.highestGradePassed} (${form.highestGradeYear})`} />
        </>}
      </div>

      <div className="bg-white rounded-2xl p-5 border border-brand-mid/50">
        <h4 className="font-bold text-brand-dark text-sm mb-3">B. Parent/Guardian Details</h4>
        {form.fatherFirstNames && <ReviewRow label="Father" value={`${form.fatherFirstNames} ${form.fatherSurname} — ${form.fatherCell}`} />}
        {form.motherFirstNames && <ReviewRow label="Mother" value={`${form.motherFirstNames} ${form.motherSurname} — ${form.motherCell}`} />}
        {form.hasGuardian === "Yes" && form.guardianFirstNames && <ReviewRow label="Guardian" value={`${form.guardianFirstNames} ${form.guardianSurname} — ${form.guardianCell}`} />}
      </div>

      <div className="bg-white rounded-2xl p-5 border border-brand-mid/50">
        <h4 className="font-bold text-brand-dark text-sm mb-3">D. Emergency Contact</h4>
        <ReviewRow label="Name" value={form.emergencyName} />
        <ReviewRow label="Relationship" value={form.emergencyRelationship} />
        <ReviewRow label="Phone" value={form.emergencyPhone} />
      </div>

      <div className="bg-white rounded-2xl p-5 border border-brand-mid/50">
        <h4 className="font-bold text-brand-dark text-sm mb-3">E. Medical</h4>
        <ReviewRow label="Medical Conditions" value={form.medicalConditions || "None"} />
        <ReviewRow label="Tested by therapist" value={form.everTested} />
        {form.everTested === "Yes" && <ReviewRow label="Details" value={form.testedDetails} />}
      </div>

      <div className="bg-white rounded-2xl p-5 border border-brand-mid/50">
        <h4 className="font-bold text-brand-dark text-sm mb-3">F. Fees & Consent</h4>
        <ReviewRow label="Fee responsibility" value={form.feeResponsibility} />
        <ReviewRow label="Can afford" value={form.canAfford} />
        <ReviewRow label="Image consent" value={form.imageConsent} />
        <ReviewRow label="POPIA consent" value={form.popiaConsent} />
      </div>

      <div className="bg-white rounded-2xl p-5 border border-brand-mid/50">
        <h4 className="font-bold text-brand-dark text-sm mb-3">Documents ({files.length} uploaded)</h4>
        {files.length === 0 && <p className="text-sm text-brand-gray">No documents uploaded</p>}
        {files.map((f) => (
          <div key={f.id} className="flex items-center gap-2 py-1.5 border-b border-brand-mid/30 last:border-0">
            <FileText className="w-4 h-4 text-brand-red shrink-0" />
            <span className="text-sm text-brand-dark truncate">{f.name}</span>
            <span className="text-xs text-brand-gray ml-auto shrink-0">{formatSize(f.size)}</span>
          </div>
        ))}
      </div>

      <div className="bg-brand-red/5 border border-brand-red/10 rounded-2xl p-5 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-brand-red shrink-0 mt-0.5" />
        <p className="text-sm text-brand-dark leading-relaxed">
          Please bring <strong>certified copies</strong> of all required documents to the school office to complete your application. No copies will be made at the school office.
        </p>
      </div>
    </div>
  );

  // ——— MAIN ———
  const stepComponents = [StepLearner, StepParents, StepEmergency, StepFees, StepDocuments, StepReview];
  const CurrentStep = stepComponents[step];

  return (
    <section ref={ref} className="py-16 lg:py-24 bg-brand-light">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-10 transition-all duration-1000 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brand-dark mb-3">
            APPLICATION <span className="text-gradient">FOR ADMISSION</span>
          </h2>
          <p className="text-brand-gray text-base max-w-xl mx-auto">
            Complete all sections below. Fields marked with <span className="text-brand-red font-semibold">*</span> are required.
          </p>
        </div>

        <StepIndicator />

        {/* Form card */}
        <div className={`bg-white rounded-3xl p-5 sm:p-8 lg:p-10 shadow-card-hover transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
          <CurrentStep />

          {/* Navigation */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-brand-mid/50">
            <button type="button" onClick={prev} disabled={step === 0}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${step === 0 ? "opacity-30 cursor-not-allowed text-brand-gray" : "text-brand-dark hover:bg-brand-light"}`}>
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            {step < STEPS.length - 1 ? (
              <button type="button" onClick={next}
                className="btn-primary !py-3 group">
                Continue <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit}
                className="btn-primary !py-3 group">
                <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /> Submit Application
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
