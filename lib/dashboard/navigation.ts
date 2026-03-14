export const protectedAppRoutePrefixes = [
  "/dashboard",
  "/onboarding",
  "/patients",
  "/appointments",
  "/clinical-notes",
  "/documents",
  "/billing",
  "/reports",
  "/admin",
  "/team",
  "/portal",
] as const;

export const dashboardNavigationGroups = [
  {
    description: "Overview, admin setup, and launch points.",
    id: "command",
    label: "Command center",
  },
  {
    description: "Patient-facing and clinical workflow modules.",
    id: "clinical",
    label: "Clinical ops",
  },
  {
    description: "Revenue cycle and operational visibility.",
    id: "revenue",
    label: "Revenue and insight",
  },
] as const;

export const dashboardNavigationItems = [
  {
    description: "Practice launchpad and shell status",
    groupId: "command",
    href: "/dashboard",
    id: "overview",
    label: "Overview",
    status: "live",
  },
  {
    description: "Team access, locations, and setup",
    groupId: "command",
    href: "/admin",
    id: "admin",
    label: "Admin",
    status: "live",
  },
  {
    description: "Intake, demographics, insurance, and portal linkage",
    groupId: "clinical",
    href: "/patients",
    id: "patients",
    label: "Patients",
    status: "live",
  },
  {
    description: "Scheduling, providers, and visit flow",
    groupId: "clinical",
    href: "/appointments",
    id: "appointments",
    label: "Appointments",
    status: "live",
  },
  {
    description: "SOAP notes, diagnosis codes, and visibility",
    groupId: "clinical",
    href: "/clinical-notes",
    id: "clinical-notes",
    label: "Clinical notes",
    status: "live",
  },
  {
    description: "Documents, photos, and consent records",
    groupId: "clinical",
    href: "/documents",
    id: "documents",
    label: "Documents",
    status: "live",
  },
  {
    description: "Charge records, balances, and claim status",
    groupId: "revenue",
    href: "/billing",
    id: "billing",
    label: "Billing",
    status: "live",
  },
  {
    description: "Throughput, activity, and billing summaries",
    groupId: "revenue",
    href: "/reports",
    id: "reports",
    label: "Reports",
    status: "live",
  },
] as const;

type ModuleShellLink = {
  href: string;
  label: string;
  note: string;
};

export type DashboardModuleShell = {
  description: string;
  eyebrow: string;
  foundations: string[];
  href: string;
  liveNow: string[];
  nextBuild: string[];
  relatedWorkspaces: ModuleShellLink[];
  shellStatus: string;
  title: string;
};

export const dashboardModuleShellContent = {
  appointments: {
    description:
      "Coordinate providers, locations, visit types, and operational status from a single protected scheduling surface.",
    eyebrow: "Scheduling",
    foundations: [
      "Practice memberships and location-aware access are already enforced.",
      "Appointment, patient, and location tables exist in the schema.",
      "Protected navigation and middleware now route staff into the correct workspace.",
    ],
    href: "/appointments",
    liveNow: [
      "Authenticated staff can reach the scheduling shell from the sidebar.",
      "The workspace is grouped with the rest of the clinical modules.",
      "The route sits behind the same tenant-aware guard as the dashboard and admin areas.",
    ],
    nextBuild: [
      "Schedule visits by patient, provider, location, appointment type, and status.",
      "Render time-based views and status transitions for check-in and completion.",
      "Use location-aware access to scope operational visibility.",
    ],
    relatedWorkspaces: [
      {
        href: "/patients",
        label: "Patients",
        note: "Visits will anchor on the patient directory and intake records.",
      },
      {
        href: "/admin",
        label: "Admin",
        note: "Provider and location access are managed from the admin workspace.",
      },
    ],
    shellStatus: "Protected shell ready",
    title: "Appointments and scheduling",
  },
  billing: {
    description:
      "Track CPT-coded charges, balances, and billing state from a dedicated protected revenue workspace.",
    eyebrow: "Billing",
    foundations: [
      "Billing records already exist in the practice-scoped schema.",
      "Appointment and insurance tables are in place for future charge linkage.",
      "The revenue routes now live inside the shared protected shell.",
    ],
    href: "/billing",
    liveNow: [
      "Billing has a dedicated route and sidebar entry.",
      "Staff can create CPT-coded billing records tied to completed visits.",
      "Status transitions and balance updates are available in the billing board.",
    ],
    nextBuild: [
      "Surface patient-facing balance summaries for the portal baseline.",
      "Add claims submission batch tooling and denial follow-up queues.",
      "Extend billing activity summaries into the reports workspace.",
    ],
    relatedWorkspaces: [
      {
        href: "/appointments",
        label: "Appointments",
        note: "Completed visits will drive billing creation.",
      },
      {
        href: "/reports",
        label: "Reports",
        note: "Operational reporting will summarize billing status and balances.",
      },
    ],
    shellStatus: "Protected shell ready",
    title: "Billing workspace",
  },
  "clinical-notes": {
    description:
      "Prepare the charting surface for SOAP-style documentation, diagnosis coding, and patient-visibility controls.",
    eyebrow: "Charting",
    foundations: [
      "Clinical notes and patient visibility flags already exist in the schema.",
      "Appointments can serve as the initial encounter anchor for notes.",
      "The charting route is now part of the protected clinical shell.",
    ],
    href: "/clinical-notes",
    liveNow: [
      "Charting is reachable from the navigation shell.",
      "The route inherits the same authenticated practice context as the dashboard.",
      "The workspace is positioned between scheduling and documents in the clinical flow.",
    ],
    nextBuild: [
      "Capture SOAP notes, diagnosis codes, and author metadata.",
      "Support draft, signed, and addendum note states.",
      "Expose patient-visible records safely under existing RLS controls.",
    ],
    relatedWorkspaces: [
      {
        href: "/appointments",
        label: "Appointments",
        note: "Notes will often originate from scheduled or completed visits.",
      },
      {
        href: "/documents",
        label: "Documents",
        note: "Clinical photos and consent records will sit alongside charting.",
      },
    ],
    shellStatus: "Protected shell ready",
    title: "Clinical notes and charting",
  },
  documents: {
    description:
      "Set up the document and imaging surface for clinical photos, consent records, and secure patient-visible files.",
    eyebrow: "Documents",
    foundations: [
      "Patient document metadata and visibility flags already exist in the schema.",
      "Practice-scoped access and portal visibility rules are in place.",
      "The documents route now sits inside the protected clinical shell.",
    ],
    href: "/documents",
    liveNow: [
      "Documents has a dedicated module route and navigation entry.",
      "Staff can save document metadata and classify records by document type.",
      "Portal visibility can be controlled per record from the documents board.",
    ],
    nextBuild: [
      "Integrate direct object upload flows with signed storage URLs.",
      "Add consent capture workflows for patient-facing document releases.",
      "Link document storage events into audit-log trails for compliance review.",
    ],
    relatedWorkspaces: [
      {
        href: "/clinical-notes",
        label: "Clinical notes",
        note: "Documents and charting will share patient-visibility controls.",
      },
      {
        href: "/patients",
        label: "Patients",
        note: "Document timelines will center on the patient record.",
      },
    ],
    shellStatus: "Protected shell ready",
    title: "Documents and clinical photos",
  },
  patients: {
    description:
      "Anchor patient intake, demographics, insurance, and portal linkage inside the shared protected shell before the full directory flow lands.",
    eyebrow: "Patients",
    foundations: [
      "Patient and insurance tables already exist under practice-scoped RLS.",
      "The dashboard layout, middleware, and navigation now guard this workspace.",
      "Admin setup covers the staff and location foundations the patient flow depends on.",
    ],
    href: "/patients",
    liveNow: [
      "Patients is a first-class route in the protected shell.",
      "The sidebar surfaces intake as the first clinical module.",
      "The route is ready for server-side patient directory and form work.",
    ],
    nextBuild: [
      "Register demographics, contact details, allergies, and dermatology flags.",
      "Link portal users and capture insurance policy records.",
      "Build a searchable patient directory with chart identifiers.",
    ],
    relatedWorkspaces: [
      {
        href: "/appointments",
        label: "Appointments",
        note: "Scheduling depends on a clean patient directory foundation.",
      },
      {
        href: "/admin",
        label: "Admin",
        note: "Practice setup and staff access stay managed outside the patient flow.",
      },
    ],
    shellStatus: "Protected shell ready",
    title: "Patient intake and directory",
  },
  reports: {
    description:
      "Reserve a protected reporting surface for throughput, billing status, and patient activity insights once the underlying workflows are live.",
    eyebrow: "Reports",
    foundations: [
      "Appointments, billing, and patient activity all share the same practice boundary.",
      "The reporting route is now part of the authenticated shell.",
      "The shell separates analytical views from day-to-day transactional work.",
    ],
    href: "/reports",
    liveNow: [
      "Reports is reachable from the revenue section of the sidebar.",
      "The workspace now summarizes appointment throughput and billing pipeline states.",
      "Patient and clinical activity snapshots are available for recent windows.",
    ],
    nextBuild: [
      "Add date-range controls and exportable report views.",
      "Layer provider and location breakdowns for operational planning.",
      "Track denial trends and payment velocity over time.",
    ],
    relatedWorkspaces: [
      {
        href: "/appointments",
        label: "Appointments",
        note: "Scheduling throughput will be one of the first report dimensions.",
      },
      {
        href: "/billing",
        label: "Billing",
        note: "Revenue reporting depends on billing status and balances.",
      },
    ],
    shellStatus: "Protected shell ready",
    title: "Operational reporting",
  },
} as const satisfies Record<string, DashboardModuleShell>;

export type DashboardModuleShellKey = keyof typeof dashboardModuleShellContent;

export function isProtectedAppPath(pathname: string) {
  return protectedAppRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
