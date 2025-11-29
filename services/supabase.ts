
import { createClient } from '@supabase/supabase-js';
import { Student, Grade, AppSettings, Cycle, Subject, UserSession } from '../types';
import { INITIAL_CYCLES, INITIAL_SUBJECTS, INITIAL_SETTINGS } from '../constants';

// --- CONFIGURATION SAAS CENTRALISÉE ---

const supabaseUrl = 'https://jowirbbzhmldiwsbpdmo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impvd2lyYmJ6aG1sZGl3c2JwZG1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMjg2OTcsImV4cCI6MjA3OTgwNDY5N30.PRVPl6hIt8l4-SNln-YTG7NJpa-MSsaFTUhEGa1blLA';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Variable locale pour stocker l'ID de l'école après connexion
let currentSchoolId: string | null = null;

// --- SCRIPT SQL D'INITIALISATION (Pour le développeur) ---
export const SQL_SETUP_SCRIPT = `
-- 1. Table des Écoles
create table if not exists schools (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  owner_id uuid references auth.users not null
);

-- 2. Table de liaison User -> École (Profils)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  school_id uuid references schools(id) on delete cascade,
  email text
);

-- 3. Trigger : À l'inscription, on crée l'école et le profil automatiquement
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_school_id uuid;
begin
  -- Créer l'école
  insert into public.schools (name, owner_id)
  values (coalesce(new.raw_user_meta_data->>'school_name', 'Mon École'), new.id)
  returning id into new_school_id;

  -- Créer le profil
  insert into public.profiles (id, school_id, email)
  values (new.id, new_school_id, new.email);

  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to avoid duplication error
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Tables de Données
create table if not exists students (
  id text not null,
  school_id uuid references schools(id) not null,
  nom text, prenom text, "dateNaissance" text, genre text,
  adresse text, ville text, telephone text, email text,
  cycle text, classe text, serie text, photo text, notes_info text,
  "dateInscription" text,
  primary key (id, school_id)
);

create table if not exists grades (
  id text not null,
  school_id uuid references schools(id) not null,
  "studentId" text, trimestre text, type text, matiere text,
  valeur numeric, coefficient numeric, mention text, commentaire text, date text,
  primary key (id, school_id)
);

create table if not exists app_config (
  school_id uuid references schools(id) not null,
  key text not null,
  data jsonb,
  primary key (school_id, key)
);

-- 5. RLS (Sécurité)
alter table schools enable row level security;
alter table profiles enable row level security;
alter table students enable row level security;
alter table grades enable row level security;
alter table app_config enable row level security;

create or replace function get_my_school_id()
returns uuid as $$
  select school_id from profiles where id = auth.uid() limit 1;
$$ language sql stable;

-- Policies Ecoles (SELECT + INSERT pour auto-réparation)
drop policy if exists "Users can see their own school" on schools;
create policy "Users can see their own school" on schools for select using (auth.uid() = owner_id);

drop policy if exists "Users can insert their own school" on schools;
create policy "Users can insert their own school" on schools for insert with check (auth.uid() = owner_id);

-- Policies Profils (SELECT + INSERT pour auto-réparation)
drop policy if exists "Users can see their own profile" on profiles;
create policy "Users can see their own profile" on profiles for select using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on profiles;
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);

-- Policies Données
drop policy if exists "Users can all on students of their school" on students;
create policy "Users can all on students of their school" on students for all using (school_id = get_my_school_id());

drop policy if exists "Users can all on grades of their school" on grades;
create policy "Users can all on grades of their school" on grades for all using (school_id = get_my_school_id());

drop policy if exists "Users can all on config of their school" on app_config;
create policy "Users can all on config of their school" on app_config for all using (school_id = get_my_school_id());
`;

// --- AUTHENTIFICATION ---

export const signUp = async (email: string, password: string, schoolName: string) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { school_name: schoolName } // Sera utilisé par le trigger SQL pour créer l'école
        }
    });
    if (error) throw error;
    return data;
};

export const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    if (error) throw error;
    return data;
};

export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    currentSchoolId = null;
};

// Récupérer les infos étendues (Profile + École)
export const fetchUserSession = async (): Promise<UserSession | null> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        // 1. Récupération du profil (sans jointure complexe pour éviter les erreurs JSON)
        let { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('school_id')
            .eq('id', user.id)
            .maybeSingle();

        // 2. AUTO-REPARATION : Si le profil n'existe pas, on tente de le créer
        if (!profile) {
             console.warn("Profil manquant. Tentative d'auto-réparation...");
             
             // Vérifier si une école existe déjà pour ce propriétaire
             let { data: ownedSchool } = await supabase
                .from('schools')
                .select('id, name')
                .eq('owner_id', user.id)
                .maybeSingle();
             
             if (!ownedSchool) {
                 // Si pas d'école, on la crée manuellement
                 console.log("Création de l'école manquante...");
                 const schoolName = user.user_metadata?.school_name || "Mon École";
                 const { data: newSchool, error: createSchoolError } = await supabase
                    .from('schools')
                    .insert([{ name: schoolName, owner_id: user.id }])
                    .select()
                    .single();
                 
                 if (createSchoolError) {
                     // Si échec ici, c'est probablement que les tables n'existent pas
                     throw new Error("Impossible de créer l'école. Tables manquantes ?");
                 }
                 ownedSchool = newSchool;
             }

             if (ownedSchool) {
                 // Création du profil manquant
                 console.log("Création du profil manquant...");
                 const { error: createProfileError } = await supabase
                    .from('profiles')
                    .insert([{ id: user.id, school_id: ownedSchool.id, email: user.email }]);
                 
                 if (createProfileError) throw createProfileError;
                 
                 profile = { school_id: ownedSchool.id };
             }
        }
        
        if (!profile) return null;

        currentSchoolId = profile.school_id;

        // 3. Récupération du nom de l'école séparément
        const { data: school } = await supabase
            .from('schools')
            .select('name')
            .eq('id', profile.school_id)
            .maybeSingle();

        return {
            user_id: user.id,
            email: user.email!,
            school_id: profile.school_id,
            school_name: school?.name || "Mon École"
        };
    } catch (e: any) {
        console.error("Erreur session:", e.message || e);
        return null;
    }
};


// --- API STUDENTS ---

export const fetchStudents = async (): Promise<Student[]> => {
  if (!currentSchoolId) return [];
  const { data, error } = await supabase.from('students').select('*').eq('school_id', currentSchoolId);
  if (error) {
    console.error('Error fetching students:', error.message);
    return [];
  }
  return data || [];
};

export const addStudentDB = async (student: Student) => {
  if (!currentSchoolId) return;
  const { error } = await supabase.from('students').insert([{ ...student, school_id: currentSchoolId }]);
  if (error) console.error('Error adding student:', error.message);
};

export const updateStudentDB = async (student: Student) => {
  if (!currentSchoolId) return;
  const { school_id, ...updateData } = student as any;
  const { error } = await supabase.from('students').update(updateData).eq('id', student.id);
  if (error) console.error('Error updating student:', error.message);
};

export const deleteStudentDB = async (id: string) => {
  if (!currentSchoolId) return;
  const { error } = await supabase.from('students').delete().eq('id', id);
  if (error) console.error('Error deleting student:', error.message);
};

// --- API GRADES ---

export const fetchGrades = async (): Promise<Grade[]> => {
  if (!currentSchoolId) return [];
  const { data, error } = await supabase.from('grades').select('*').eq('school_id', currentSchoolId);
  if (error) {
    console.error('Error fetching grades:', error.message);
    return [];
  }
  return data || [];
};

export const addGradeDB = async (grade: Grade) => {
  if (!currentSchoolId) return;
  const { error } = await supabase.from('grades').insert([{ ...grade, school_id: currentSchoolId }]);
  if (error) console.error('Error adding grade:', error.message);
};

export const updateGradeDB = async (grade: Grade) => {
  if (!currentSchoolId) return;
  const { school_id, ...updateData } = grade as any;
  const { error } = await supabase.from('grades').update(updateData).eq('id', grade.id);
  if (error) console.error('Error updating grade:', error.message);
};

export const deleteGradeDB = async (id: string) => {
  if (!currentSchoolId) return;
  const { error } = await supabase.from('grades').delete().eq('id', id);
  if (error) console.error('Error deleting grade:', error.message);
};

// --- API CONFIG (Settings, Cycles, Subjects) ---

const fetchConfig = async <T>(key: string, defaultValue: T): Promise<T> => {
  if (!currentSchoolId) return defaultValue;

  const { data, error } = await supabase
    .from('app_config')
    .select('data')
    .eq('key', key)
    .single();
  
  if (error || !data) {
    // Si la table n'existe pas, une erreur est levée, mais on retourne la valeur par défaut
    // Si la ligne n'existe pas (PGRST116), on l'initialise
    if (error?.code === 'PGRST116') {
       await supabase.from('app_config').insert([{ 
           school_id: currentSchoolId,
           key, 
           data: defaultValue 
       }]);
       return defaultValue;
    }
    // Autre erreur (ex: table manquante)
    if (error) console.warn(`Config fetch warning (${key}):`, error.message);
    return defaultValue;
  }
  return data.data as T;
};

const saveConfig = async (key: string, data: any) => {
  if (!currentSchoolId) return;
  
  const { error } = await supabase.from('app_config').upsert([{ 
      school_id: currentSchoolId, 
      key, 
      data 
  }], { onConflict: 'school_id, key' });
  
  if (error) console.error(`Error saving config ${key}:`, error.message);
};

export const fetchSettings = () => fetchConfig<AppSettings>('settings', INITIAL_SETTINGS);
export const saveSettingsDB = (settings: AppSettings) => saveConfig('settings', settings);

export const fetchCycles = () => fetchConfig<Record<string, Cycle>>('cycles', INITIAL_CYCLES);
export const saveCyclesDB = (cycles: Record<string, Cycle>) => saveConfig('cycles', cycles);

export const fetchSubjects = () => fetchConfig<Record<string, Subject[]>>('subjects', INITIAL_SUBJECTS);
export const saveSubjectsDB = (subjects: Record<string, Subject[]>) => saveConfig('subjects', subjects);

// Reset
export const clearDB = async () => {
    if (!currentSchoolId) return;
    await supabase.from('grades').delete().eq('school_id', currentSchoolId);
    await supabase.from('students').delete().eq('school_id', currentSchoolId);
    await supabase.from('app_config').delete().eq('school_id', currentSchoolId);
};
