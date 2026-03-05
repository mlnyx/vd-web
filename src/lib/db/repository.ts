import type { IDBPDatabase } from "idb";
import { initDatabase, type VDAssessmentDB } from "./schema";
import type { Patient } from "../store/patientStore";
import type { PhotoResult, VDVerdict } from "../store/assessmentStore";

// DB 평가 레코드
export interface AssessmentRecord {
  id: string;
  patientId: string | null;
  patientName?: string;
  initialPhotoUri: string | null;
  initialRatio: number | null;
  initialVerdict: VDVerdict | null;
  verifyPhotoUri: string | null;
  verifyRatio: number | null;
  verifyVerdict: VDVerdict | null;
  notes: string;
  createdAt: number;
}

let db: IDBPDatabase<VDAssessmentDB> | null = null;

async function getDb(): Promise<IDBPDatabase<VDAssessmentDB>> {
  if (!db) {
    db = await initDatabase();
  }
  return db;
}

// 고유 ID 생성
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// === 환자 CRUD ===

export async function createPatient(
  data: Omit<Patient, "id" | "createdAt">
): Promise<Patient> {
  const database = await getDb();
  const patient: Patient = {
    ...data,
    id: generateId(),
    createdAt: Date.now(),
  };

  await database.add("patients", {
    id: patient.id,
    name: patient.name,
    age: patient.age,
    gender: patient.gender,
    chartNumber: patient.chartNumber,
    notes: patient.notes,
    createdAt: patient.createdAt,
  });

  return patient;
}

export async function getAllPatients(): Promise<Patient[]> {
  const database = await getDb();
  const rows = await database.getAllFromIndex("patients", "by-createdAt");

  return rows.reverse().map((row) => ({
    id: row.id,
    name: row.name,
    age: row.age,
    gender: row.gender as "M" | "F" | undefined,
    chartNumber: row.chartNumber,
    notes: row.notes,
    createdAt: row.createdAt,
  }));
}

// === 평가 CRUD ===

export async function saveAssessment(data: {
  patientId?: string;
  initialPhoto: PhotoResult | null;
  verifyPhoto: PhotoResult | null;
  notes: string;
}): Promise<string> {
  const database = await getDb();
  const id = generateId();

  await database.add("assessments", {
    id,
    patientId: data.patientId ?? null,
    initialPhotoUri: data.initialPhoto?.uri ?? null,
    initialRatio: data.initialPhoto?.willisRatio ?? null,
    initialVerdict: data.initialPhoto?.verdict ?? null,
    initialKeypoints: data.initialPhoto?.keypoints
      ? JSON.stringify(data.initialPhoto.keypoints)
      : null,
    verifyPhotoUri: data.verifyPhoto?.uri ?? null,
    verifyRatio: data.verifyPhoto?.willisRatio ?? null,
    verifyVerdict: data.verifyPhoto?.verdict ?? null,
    verifyKeypoints: data.verifyPhoto?.keypoints
      ? JSON.stringify(data.verifyPhoto.keypoints)
      : null,
    notes: data.notes,
    createdAt: Date.now(),
  });

  return id;
}

export async function getAllAssessments(): Promise<AssessmentRecord[]> {
  const database = await getDb();
  const rows = await database.getAllFromIndex("assessments", "by-createdAt");

  // LEFT JOIN: 각 assessment에 대해 patient name을 가져옴
  const results: AssessmentRecord[] = [];
  for (const row of rows.reverse()) {
    let patientName: string | undefined;
    if (row.patientId) {
      try {
        const patient = await database.get("patients", row.patientId);
        patientName = patient?.name;
      } catch {
        // 환자 삭제된 경우
      }
    }

    results.push({
      id: row.id,
      patientId: row.patientId,
      patientName,
      initialPhotoUri: row.initialPhotoUri,
      initialRatio: row.initialRatio,
      initialVerdict: row.initialVerdict as VDVerdict | null,
      verifyPhotoUri: row.verifyPhotoUri,
      verifyRatio: row.verifyRatio,
      verifyVerdict: row.verifyVerdict as VDVerdict | null,
      notes: row.notes ?? "",
      createdAt: row.createdAt,
    });
  }

  return results;
}

export async function getAssessmentById(
  id: string
): Promise<AssessmentRecord | null> {
  const database = await getDb();
  const row = await database.get("assessments", id);

  if (!row) return null;

  let patientName: string | undefined;
  if (row.patientId) {
    try {
      const patient = await database.get("patients", row.patientId);
      patientName = patient?.name;
    } catch {
      // 환자 삭제된 경우
    }
  }

  return {
    id: row.id,
    patientId: row.patientId,
    patientName,
    initialPhotoUri: row.initialPhotoUri,
    initialRatio: row.initialRatio,
    initialVerdict: row.initialVerdict as VDVerdict | null,
    verifyPhotoUri: row.verifyPhotoUri,
    verifyRatio: row.verifyRatio,
    verifyVerdict: row.verifyVerdict as VDVerdict | null,
    notes: row.notes ?? "",
    createdAt: row.createdAt,
  };
}

export async function deleteAssessment(id: string): Promise<void> {
  const database = await getDb();
  await database.delete("assessments", id);
}
