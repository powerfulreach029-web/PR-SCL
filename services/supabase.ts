
import { createClient } from '@supabase/supabase-js';
import { Student, Grade, AppSettings, Cycle, Subject, UserSession } from '../types';
import { INITIAL_CYCLES, INITIAL_SUBJECTS, INITIAL_SETTINGS } from '../constants';

// --- CONFIGURATION SAAS CENTRALISÉE ---

const supabaseUrl = 'https://dlomslvbxochwujbjsyi.supabase.co';
const supabaseKey = 'sb_publishable_u1yRb9Na-VOgZQCHQa1pig_Fa3o7UgB';

// Nettoyage des clés pour éviter les erreurs d'espaces invisibles
export const supabase = createClient(supabaseUrl.trim(), supabaseKey.trim());

// Variable locale pour stocker l'ID de l'école après connexion
let currentSchoolId: string | null = null;

// --- SCRIPT SQL D'INITIALISATION (Pour référence dans l'interface) ---
export const SQL_SETUP_SCRIPT = `
-- Table des Écoles
create table if not exists schools (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  owner_id uuid references auth.users not null
);

-- Table des Profils
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  school_id uuid references schools(id) on delete cascade,
  email text
);

-- Trigger de création automatique
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_school_id uuid;
begin
  insert into public.schools (name, owner_id)
  values (coalesce(new.raw_user_meta_data->>'school_name', 'Mon École'), new.id)
  returning id into new_school_id;

  insert into public.profiles (id, school_id, email)
  values (new.id, new_school_id, new.email);

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Tables de données
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

-- RLS (Sécurité par école)
alter table schools enable row level security;
alter table profiles enable row level security;
alter table students enable row level security;
alter table grades enable row level security;
alter table app_config enable row level security;

create or replace function get_my_school_id()
returns uuid as $$
  select school_id from profiles where id = auth.uid() limit 1;
$$ language sql stable;

drop policy if exists "All school access" on students;
create policy "All school access" on students for all using (school_id = get_my_school_id());

drop policy if exists "All school access" on grades;
create policy "All school access" on grades for all using (school_id = get_my_school_id());

drop policy if exists "All school access" on app_config;
create policy "All school access" on app_config for all using (school_id = get_my_school_id());
`;

// --- AUTHENTIFICATION ---

export const signUp = async (email: string, password: string, schoolName: string) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { school_name: schoolName }
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

export const fetchUserSession = async (): Promise<UserSession | null> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        let { data: profile } = await supabase
            .from('profiles')
            .select('school_id')
            .eq('id', user.id)
            .maybeSingle();

        if (!profile) return null;

        currentSchoolId = profile.school_id;

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
    } catch (e) {
        return null;
    }
};

// --- API STUDENTS ---

export const fetchStudents = async (): Promise<Student[]> => {
  if (!currentSchoolId) return [];
  const { data, error } = await supabase.from('students').select('*').eq('school_id', currentSchoolId);
  if (error) throw error;
  return data || [];
};

export const addStudentDB = async (student: Student) => {
  if (!currentSchoolId) return;
  await supabase.from('students').insert([{ ...student, school_id: currentSchoolId }]);
};

export const updateStudentDB = async (student: Student) => {
  if (!currentSchoolId) return;
  const { school_id, ...updateData } = student as any;
  await supabase.from('students').update(updateData).eq('id', student.id).eq('school_id', currentSchoolId);
};

export const deleteStudentDB = async (id: string) => {
  if (!currentSchoolId) return;
  await supabase.from('students').delete().eq('id', id).eq('school_id', currentSchoolId);
};

// --- API GRADES ---

export const fetchGrades = async (): Promise<Grade[]> => {
  if (!currentSchoolId) return [];
  const { data, error } = await supabase.from('grades').select('*').eq('school_id', currentSchoolId);
  if (error) throw error;
  return data || [];
};

export const addGradeDB = async (grade: Grade) => {
  if (!currentSchoolId) return;
  await supabase.from('grades').insert([{ ...grade, school_id: currentSchoolId }]);
};

export const updateGradeDB = async (grade: Grade) => {
  if (!currentSchoolId) return;
  const { school_id, ...updateData } = grade as any;
  await supabase.from('grades').update(updateData).eq('id', grade.id).eq('school_id', currentSchoolId);
};

export const deleteGradeDB = async (id: string) => {
  if (!currentSchoolId) return;
  await supabase.from('grades').delete().eq('id', id).eq('school_id', currentSchoolId);
};

// --- API CONFIG ---

const fetchConfig = async <T>(key: string, defaultValue: T): Promise<T> => {
  if (!currentSchoolId) return defaultValue;
  try {
      const { data, error } = await supabase.from('app_config').select('data').eq('key', key).eq('school_id', currentSchoolId).single();
      if (error || !data) return defaultValue;
      return data.data as T;
  } catch {
      return defaultValue;
  }
};

const saveConfig = async (key: string, data: any) => {
  if (!currentSchoolId) return;
  await supabase.from('app_config').upsert([{ school_id: currentSchoolId, key, data }], { onConflict: 'school_id, key' });
};

export const fetchSettings = () => fetchConfig<AppSettings>('settings', INITIAL_SETTINGS);
export const saveSettingsDB = (settings: AppSettings) => saveConfig('settings', settings);
export const fetchCycles = () => fetchConfig<Record<string, Cycle>>('cycles', INITIAL_CYCLES);
export const saveCyclesDB = (cycles: Record<string, Cycle>) => saveConfig('cycles', cycles);
export const fetchSubjects = () => fetchConfig<Record<string, Subject[]>>('subjects', INITIAL_SUBJECTS);
export const saveSubjectsDB = (subjects: Record<string, Subject[]>) => saveConfig('subjects', subjects);

export const clearDB = async () => {
    if (!currentSchoolId) return;
    await supabase.from('grades').delete().eq('school_id', currentSchoolId);
    await supabase.from('students').delete().eq('school_id', currentSchoolId);
    await supabase.from('app_config').delete().eq('school_id', currentSchoolId);
};
