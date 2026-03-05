import { create } from "zustand";

export interface Patient {
  id: string;
  name: string;
  age?: number;
  gender?: "M" | "F";
  chartNumber?: string;
  notes?: string;
  createdAt: number;
}

interface PatientState {
  patients: Patient[];
  selectedPatient: Patient | null;
  setSelectedPatient: (patient: Patient | null) => void;
  addPatient: (patient: Patient) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
}

export const usePatientStore = create<PatientState>((set) => ({
  patients: [],
  selectedPatient: null,

  setSelectedPatient: (patient) => set({ selectedPatient: patient }),

  addPatient: (patient) =>
    set((state) => ({ patients: [...state.patients, patient] })),

  updatePatient: (id, updates) =>
    set((state) => ({
      patients: state.patients.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),
}));
