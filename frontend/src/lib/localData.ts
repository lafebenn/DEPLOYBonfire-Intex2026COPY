export type IntakeCase = {
  id: string;
  name: string;
  program: string;
  status: "Active" | "Transitioning" | "Completed" | "Closed";
  admitted: string; // YYYY-MM-DD
  progress: number; // 0-100
  createdAt: string; // ISO
};

export type HomeVisit = {
  id: string;
  resident: string;
  address: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. 10:00 AM
  status: "Scheduled" | "Completed";
  worker: string;
  createdAt: string; // ISO
};

export type Donation = {
  id: string;
  donorName: string;
  donationType: "Monthly" | "One-time" | "Annual" | "Grant";
  amount: string; // keep as display text for now
  allocation: string;
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO
};

export type Conference = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string;
  attendees: number;
  status: "Upcoming" | "Completed";
  cases: string[];
  createdAt: string; // ISO
};

export type ProcessRecording = {
  id: string;
  resident: string;
  date: string; // YYYY-MM-DD
  type: string;
  author: string;
  summary: string;
  createdAt: string; // ISO
};

export type ReportRun = {
  id: string;
  templateTitle: string;
  notes?: string;
  generatedAt: string; // ISO
};

const storageKeys = {
  intakes: "bonfire:intakes",
  visits: "bonfire:visits",
  donations: "bonfire:donations",
  conferences: "bonfire:conferences",
  recordings: "bonfire:recordings",
  reportRuns: "bonfire:reportRuns",
} as const;

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function readArray<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  const parsed = safeJsonParse<T[]>(window.localStorage.getItem(key));
  return Array.isArray(parsed) ? parsed : [];
}

function writeArray<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export const localData = {
  listIntakes(): IntakeCase[] {
    return readArray<IntakeCase>(storageKeys.intakes);
  },
  addIntake(input: Omit<IntakeCase, "id" | "createdAt">) {
    const next: IntakeCase = { ...input, id: createId("intake"), createdAt: new Date().toISOString() };
    const all = [next, ...localData.listIntakes()];
    writeArray(storageKeys.intakes, all);
    return next;
  },

  listVisits(): HomeVisit[] {
    return readArray<HomeVisit>(storageKeys.visits);
  },
  addVisit(input: Omit<HomeVisit, "id" | "createdAt">) {
    const next: HomeVisit = { ...input, id: createId("visit"), createdAt: new Date().toISOString() };
    const all = [next, ...localData.listVisits()];
    writeArray(storageKeys.visits, all);
    return next;
  },

  listDonations(): Donation[] {
    return readArray<Donation>(storageKeys.donations);
  },
  addDonation(input: Omit<Donation, "id" | "createdAt">) {
    const next: Donation = { ...input, id: createId("donation"), createdAt: new Date().toISOString() };
    const all = [next, ...localData.listDonations()];
    writeArray(storageKeys.donations, all);
    return next;
  },

  listConferences(): Conference[] {
    return readArray<Conference>(storageKeys.conferences);
  },
  addConference(input: Omit<Conference, "id" | "createdAt">) {
    const next: Conference = { ...input, id: createId("conference"), createdAt: new Date().toISOString() };
    const all = [next, ...localData.listConferences()];
    writeArray(storageKeys.conferences, all);
    return next;
  },

  listRecordings(): ProcessRecording[] {
    return readArray<ProcessRecording>(storageKeys.recordings);
  },
  addRecording(input: Omit<ProcessRecording, "id" | "createdAt">) {
    const next: ProcessRecording = { ...input, id: createId("recording"), createdAt: new Date().toISOString() };
    const all = [next, ...localData.listRecordings()];
    writeArray(storageKeys.recordings, all);
    return next;
  },

  listReportRuns(): ReportRun[] {
    return readArray<ReportRun>(storageKeys.reportRuns);
  },
  addReportRun(input: Omit<ReportRun, "id" | "generatedAt">) {
    const next: ReportRun = { ...input, id: createId("report"), generatedAt: new Date().toISOString() };
    const all = [next, ...localData.listReportRuns()];
    writeArray(storageKeys.reportRuns, all);
    return next;
  },
};

