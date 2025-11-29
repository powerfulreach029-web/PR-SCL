
import { Cycle, Subject, AppSettings } from './types';

export const INITIAL_CYCLES: Record<string, Cycle> = {
  "college": {
    id: "college",
    name: "Collège",
    levels: ["6ème", "5ème", "4ème", "3ème"],
    series: [],
    specialites: [],
    classrooms: [
      { id: "salle_101", name: "Salle 101" },
      { id: "salle_102", name: "Salle 102" }
    ],
    type: "simple"
  },
  "lycee": {
    id: "lycee",
    name: "Lycée Général",
    levels: ["Seconde", "Première", "Terminale"],
    series: ["A", "C", "D"],
    specialites: [],
    classrooms: [
        { id: "salle_201", name: "Amphi A" },
        { id: "labo_phys", name: "Labo Physique" }
    ],
    type: "series"
  },
  "lycee_technique": {
    id: "lycee_technique",
    name: "Lycée Technique",
    type: "series",
    levels: ["Seconde", "Première", "Terminale"],
    series: ["G1", "G2", "G3"],
    specialites: [],
    classrooms: []
  },
  "universite": {
    id: "universite",
    name: "Université",
    type: "specialites",
    levels: ["Licence 1", "Licence 2", "Licence 3", "Master 1", "Master 2", "Doctorat"],
    series: [],
    specialites: [], // Les spécialités seront définies par l'utilisateur
    classrooms: []
  }
};

export const INITIAL_SUBJECTS: Record<string, Subject[]> = {
  "6ème": [
    { id: "fr_6", nom: "Français", coefficient: 3, teacher: "M. Dupont" },
    { id: "math_6", nom: "Mathématiques", coefficient: 3, teacher: "Mme. Curie" },
    { id: "hg_6", nom: "Histoire-Géographie", coefficient: 2, teacher: "M. Michelet" },
    { id: "svt_6", nom: "SVT", coefficient: 2 },
    { id: "ang_6", nom: "Anglais", coefficient: 2 },
    { id: "eps_6", nom: "EPS", coefficient: 1 }
  ],
  "3ème": [
    { id: "fr_3", nom: "Français", coefficient: 3 },
    { id: "math_3", nom: "Mathématiques", coefficient: 3 },
    { id: "hg_3", nom: "Histoire-Géographie", coefficient: 2 },
    { id: "svt_3", nom: "SVT", coefficient: 2 },
    { id: "pc_3", nom: "Physique-Chimie", coefficient: 2 },
    { id: "ang_3", nom: "Anglais", coefficient: 2 },
    { id: "eps_3", nom: "EPS", coefficient: 1 }
  ],
  "Terminale A": [
    { id: "philo_ta", nom: "Philosophie", coefficient: 4, teacher: "M. Kant" },
    { id: "fr_ta", nom: "Français", coefficient: 4 },
    { id: "ang_ta", nom: "Anglais", coefficient: 3 },
    { id: "hg_ta", nom: "Histoire-Géographie", coefficient: 3 },
    { id: "math_ta", nom: "Mathématiques", coefficient: 2 },
    { id: "eps_ta", nom: "EPS", coefficient: 1 }
  ],
  "Terminale C": [
    { id: "math_tc", nom: "Mathématiques", coefficient: 5, teacher: "M. Euler" },
    { id: "pc_tc", nom: "Physique-Chimie", coefficient: 5 },
    { id: "svt_tc", nom: "SVT", coefficient: 2 },
    { id: "philo_tc", nom: "Philosophie", coefficient: 2 },
    { id: "ang_tc", nom: "Anglais", coefficient: 2 },
    { id: "hg_tc", nom: "Histoire-Géographie", coefficient: 2 },
    { id: "eps_tc", nom: "EPS", coefficient: 1 }
  ]
};

export const INITIAL_SETTINGS: AppSettings = {
  appName: "PR-SCL",
  theme: 'blue',
  mode: 'light', // Par défaut
  bulletin: {
    showTeacher: true,
    showClassAvg: true,
    showAppreciation: true,
    customHeaderText: "Établissement d'Enseignement Général et Technique",
    appreciationRules: [
      { min: 18, max: 21, text: "Excellent travail" },
      { min: 16, max: 18, text: "Très Bien" },
      { min: 14, max: 16, text: "Bien" },
      { min: 12, max: 14, text: "Assez Bien" },
      { min: 10, max: 12, text: "Passable" },
      { min: 8, max: 10, text: "Insuffisant" },
      { min: 0, max: 8, text: "Faible" }
    ]
  }
};

// Couleurs Hexadécimales pour les variables CSS
export const THEME_HEX_COLORS = {
  blue: { primary: '#2563eb', hover: '#1d4ed8' },   // blue-600, blue-700
  green: { primary: '#16a34a', hover: '#15803d' },  // green-600, green-700
  purple: { primary: '#9333ea', hover: '#7e22ce' }, // purple-600, purple-700
  red: { primary: '#dc2626', hover: '#b91c1c' },    // red-600, red-700
};

// Gardé pour compatibilité si nécessaire, mais on privilégiera les variables CSS
export const THEME_COLORS = {
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  purple: 'bg-purple-600',
  red: 'bg-red-600',
};

export const THEME_TEXT_COLORS = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  purple: 'text-purple-600',
  red: 'text-red-600',
};

export const THEME_HOVER_COLORS = {
  blue: 'hover:bg-blue-700',
  green: 'hover:bg-green-700',
  purple: 'hover:bg-purple-700',
  red: 'hover:bg-red-700',
};
