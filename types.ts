
export interface Student {
  id: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  genre: string;
  adresse: string;
  ville: string;
  telephone: string;
  email?: string;
  cycle: string;
  classe: string;
  serie?: string;
  photo?: string;
  notes_info?: string;
  dateInscription: string;
}

export interface Grade {
  id: string;
  studentId: string;
  trimestre: string; // '1', '2', '3' ou 'S1', 'S2'
  type: string; // 'devoir', 'composition', 'departemental' ou 'dst', 'session'
  matiere: string;
  valeur: number;
  coefficient: number;
  mention?: string;
  commentaire?: string;
  date?: string;
}

export interface Subject {
  id: string;
  nom: string;
  coefficient: number;
  teacher?: string; // Nom de l'enseignant
}

export interface Classroom {
  id: string;
  name: string;
  capacity?: number;
}

export interface Cycle {
  id: string;
  name: string;
  type: 'simple' | 'series' | 'specialites';
  levels: string[]; // Ex: ["6ème", "5ème"] ou ["Seconde", "Première"]
  series: string[]; // Ex: ["A", "C", "D"]
  specialites: string[]; // Ex: ["Maths", "Physique"]
  classrooms: Classroom[]; // Salles de classe
}

export interface AppreciationRule {
  min: number;
  max: number;
  text: string;
}

export interface BulletinSettings {
  showTeacher: boolean;
  showClassAvg: boolean;
  showAppreciation: boolean;
  customHeaderText?: string; // Texte supplémentaire sous le nom de l'école
  appreciationRules: AppreciationRule[];
}

export interface AppSettings {
  appName: string;
  theme: 'blue' | 'green' | 'purple' | 'red';
  mode: 'light' | 'dark';
  logo?: string;
  bulletin: BulletinSettings;
}

export type View = 'dashboard' | 'students' | 'inscription' | 'settings';

// Nouveau type pour la session utilisateur
export interface UserSession {
  user_id: string;
  email: string;
  school_id: string;
  school_name: string;
}

export interface SchoolContextType {
  session: UserSession | null;
  students: Student[];
  grades: Grade[];
  cycles: Record<string, Cycle>;
  subjects: Record<string, Subject[]>;
  settings: AppSettings;
  addStudent: (student: Student) => void;
  updateStudent: (student: Student) => void;
  deleteStudent: (id: string) => void;
  addGrade: (grade: Grade) => void;
  updateGrade: (grade: Grade) => void;
  deleteGrade: (id: string) => void;
  updateSettings: (settings: AppSettings) => void;
  updateCycles: (cycles: Record<string, Cycle>) => void;
  updateSubjects: (className: string, subjects: Subject[]) => void;
  resetData: () => void;
  logout: () => void;
}
