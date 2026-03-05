import type { Patient } from "@/lib/store/patientStore";

interface PatientCardProps {
  patient: Patient;
}

export function PatientCard({ patient }: PatientCardProps) {
  return (
    <div className="glass shadow-glass rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100/60 backdrop-blur-sm">
            <span className="text-base font-bold text-primary-700">
              {patient.name.charAt(0)}
            </span>
          </div>
          <div>
            <span className="text-base font-semibold text-foreground">
              {patient.name}
            </span>
            <p className="text-xs text-muted-foreground">
              {patient.age ? `${patient.age}세` : ""}
              {patient.gender
                ? ` / ${patient.gender === "M" ? "남" : "여"}`
                : ""}
              {patient.chartNumber ? ` / ${patient.chartNumber}` : ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
