import { openDB, type IDBPDatabase } from "idb";

// DB 스키마 타입
export interface VDAssessmentDB {
  patients: {
    key: string;
    value: {
      id: string;
      name: string;
      age?: number;
      gender?: string;
      chartNumber?: string;
      notes?: string;
      createdAt: number;
    };
    indexes: { "by-createdAt": number };
  };
  assessments: {
    key: string;
    value: {
      id: string;
      patientId: string | null;
      initialPhotoUri: string | null;
      initialRatio: number | null;
      initialVerdict: string | null;
      initialKeypoints: string | null;
      verifyPhotoUri: string | null;
      verifyRatio: number | null;
      verifyVerdict: string | null;
      verifyKeypoints: string | null;
      notes: string;
      createdAt: number;
    };
    indexes: {
      "by-createdAt": number;
      "by-patientId": string;
    };
  };
}

const DB_NAME = "vd-assessment";
const DB_VERSION = 1;

export async function initDatabase(): Promise<IDBPDatabase<VDAssessmentDB>> {
  return openDB<VDAssessmentDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // patients 스토어
      if (!db.objectStoreNames.contains("patients")) {
        const patientStore = db.createObjectStore("patients", {
          keyPath: "id",
        });
        patientStore.createIndex("by-createdAt", "createdAt");
      }

      // assessments 스토어
      if (!db.objectStoreNames.contains("assessments")) {
        const assessmentStore = db.createObjectStore("assessments", {
          keyPath: "id",
        });
        assessmentStore.createIndex("by-createdAt", "createdAt");
        assessmentStore.createIndex("by-patientId", "patientId");
      }
    },
  });
}
