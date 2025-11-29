
import React, { useState, useEffect, useContext, createContext } from 'react';
import { 
  Student, Grade, Cycle, Subject, AppSettings, View, SchoolContextType, UserSession 
} from './types';
import { 
  INITIAL_CYCLES, INITIAL_SUBJECTS, INITIAL_SETTINGS, THEME_HEX_COLORS 
} from './constants';
import * as api from './services/supabase';

// Feature Components
import { Dashboard } from './features/dashboard/Dashboard';
import { StudentList } from './features/students/StudentList';
import { StudentForm } from './features/students/StudentForm';
import { Settings } from './features/settings/Settings';
import { ChatBot } from './features/chat/ChatBot';
import { LoginScreen } from './features/auth/LoginScreen';

// Context creation
const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const useSchool = () => {
  const context = useContext(SchoolContext);
  if (!context) throw new Error("useSchool must be used within a SchoolProvider");
  return context;
};

const App: React.FC = () => {
  // Session State
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [cycles, setCycles] = useState<Record<string, Cycle>>(INITIAL_CYCLES);
  const [subjects, setSubjects] = useState<Record<string, Subject[]>>(INITIAL_SUBJECTS);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  
  const [currentView, setCurrentView] = useState<View>('dashboard');

  // Check auth on load
  useEffect(() => {
    const checkSession = async () => {
        const userSession = await api.fetchUserSession();
        if (userSession) {
            setSession(userSession);
            await loadSchoolData();
        }
        setLoading(false);
    };
    checkSession();
  }, []);

  const loadSchoolData = async () => {
      try {
          // Load Data
          const [
            fetchedStudents, 
            fetchedGrades, 
            fetchedSettings, 
            fetchedCycles, 
            fetchedSubjects
          ] = await Promise.all([
            api.fetchStudents(),
            api.fetchGrades(),
            api.fetchSettings(),
            api.fetchCycles(),
            api.fetchSubjects()
          ]);

          setStudents(fetchedStudents);
          setGrades(fetchedGrades);
          setSettings(fetchedSettings);
          setCycles(fetchedCycles);
          setSubjects(fetchedSubjects);
      } catch (e) {
          console.error("Data load error", e);
          alert("Erreur lors du chargement des données. Vérifiez votre connexion.");
      }
  };

  const handleLoginSuccess = async (newSession: UserSession) => {
      setSession(newSession);
      setLoading(true);
      await loadSchoolData();
      setCurrentView('dashboard'); // Force redirection to dashboard
      setLoading(false);
  };

  const handleLogout = async () => {
      await api.signOut();
      setSession(null);
      setStudents([]);
      setGrades([]);
      setCycles(INITIAL_CYCLES);
      setSubjects(INITIAL_SUBJECTS);
      setSettings(INITIAL_SETTINGS);
  };

  // Actions (Update UI Optimistically + Call DB)
  const addStudent = (s: Student) => {
    setStudents(prev => [...prev, s]);
    api.addStudentDB(s);
  };

  const updateStudent = (s: Student) => {
    setStudents(prev => prev.map(p => p.id === s.id ? s : p));
    api.updateStudentDB(s);
  };

  const deleteStudent = (id: string) => {
    setStudents(prev => prev.filter(p => p.id !== id));
    setGrades(prev => prev.filter(g => g.studentId !== id)); // Local cleanup
    api.deleteStudentDB(id);
  };
  
  const addGrade = (g: Grade) => {
    setGrades(prev => [...prev, g]);
    api.addGradeDB(g);
  };

  const updateGrade = (g: Grade) => {
    setGrades(prev => prev.map(prevG => prevG.id === g.id ? g : prevG));
    api.updateGradeDB(g);
  };

  const deleteGrade = (id: string) => {
    setGrades(prev => prev.filter(g => g.id !== id));
    api.deleteGradeDB(id);
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    api.saveSettingsDB(newSettings);
  };

  const handleUpdateCycles = (newCycles: Record<string, Cycle>) => {
    setCycles(newCycles);
    api.saveCyclesDB(newCycles);
  };

  const handleUpdateSubjects = (cls: string, subs: Subject[]) => {
    const newSubjects = { ...subjects, [cls]: subs };
    setSubjects(newSubjects);
    api.saveSubjectsDB(newSubjects);
  };

  const resetData = async () => {
    if(confirm("Êtes-vous sûr de vouloir réinitialiser la base de données de CETTE ÉCOLE ?")) {
        setLoading(true);
        await api.clearDB();
        
        // Save initial defaults back to DB for this school
        await api.saveSettingsDB(INITIAL_SETTINGS);
        await api.saveCyclesDB(INITIAL_CYCLES);
        await api.saveSubjectsDB(INITIAL_SUBJECTS);
        
        await loadSchoolData(); // Reload clean state
        setLoading(false);
    }
  };

  const contextValue: SchoolContextType = {
    session,
    students, grades, cycles, subjects, settings,
    addStudent, updateStudent, deleteStudent,
    addGrade, updateGrade, deleteGrade,
    updateSettings: handleUpdateSettings,
    updateCycles: handleUpdateCycles,
    updateSubjects: handleUpdateSubjects,
    resetData,
    logout: handleLogout
  };

  // Theme Logic
  const activeThemeColors = THEME_HEX_COLORS[settings.theme];
  const themeStyles = {
    '--primary-color': activeThemeColors.primary,
    '--primary-hover': activeThemeColors.hover,
  } as React.CSSProperties;

  // Render Login Screen if not connected
  if (!session && !loading) {
      return (
        <div 
            className={`min-h-screen transition-all duration-300 ${settings.mode === 'dark' ? 'dark starry-bg text-gray-100' : 'bg-gray-100 text-gray-800'}`}
            style={themeStyles}
        >
            <div className="relative z-10 min-h-screen">
                <LoginScreen onLoginSuccess={handleLoginSuccess} />
            </div>
        </div>
      );
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${settings.mode === 'dark' ? 'dark starry-bg' : 'bg-gray-100'}`}>
        <div className="flex flex-col items-center relative z-10">
          <div className="w-16 h-16 border-4 border-[var(--primary-color)] border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_var(--primary-color)]"></div>
          <h2 className="text-xl font-bold text-gray-700 dark:text-white drop-shadow-md">Chargement...</h2>
        </div>
      </div>
    );
  }

  return (
    <SchoolContext.Provider value={contextValue}>
      <div 
        className={`min-h-screen transition-all duration-300 ${settings.mode === 'dark' ? 'dark starry-bg text-gray-100' : 'bg-gray-100 text-gray-800'}`}
        style={themeStyles}
      >
        <div className="flex flex-col md:flex-row font-sans min-h-screen relative z-10">
          
          {/* Mobile Header */}
          <div className="md:hidden bg-[var(--primary-color)] dark:glass-card text-white p-4 flex justify-between items-center shadow-md transition-colors duration-300 dark:border-b dark:border-white/10">
            <div className="flex items-center gap-2 font-bold text-xl">
               {settings.logo ? <img src={settings.logo} className="h-8 w-8 object-contain bg-white rounded-full"/> : <i className="fas fa-graduation-cap"></i>}
               <span>{settings.appName}</span>
            </div>
            <button className="p-2" onClick={() => {
               const nav = document.getElementById('mobile-nav');
               nav?.classList.toggle('hidden');
            }}>
               <i className="fas fa-bars"></i>
            </button>
          </div>

          {/* Sidebar Navigation */}
          <nav id="mobile-nav" className="hidden md:flex flex-col w-full md:w-64 bg-[var(--primary-color)] dark:bg-slate-900/80 dark:backdrop-blur-md dark:border-r dark:border-white/10 text-white shadow-xl transition-colors duration-300 min-h-screen fixed md:relative z-40">
            <div className="p-6 border-b border-white/10 hidden md:block">
              <div className="flex items-center gap-3 font-bold text-2xl tracking-tight">
                 {settings.logo ? <img src={settings.logo} className="h-10 w-10 object-contain bg-white rounded-full p-0.5"/> : <i className="fas fa-graduation-cap text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"></i>}
                 <span className="dark:text-white dark:drop-shadow-[0_0_5px_var(--primary-color)]">{settings.appName}</span>
              </div>
            </div>

            <div className="flex-1 py-6 space-y-2 px-3">
               <NavItem icon="fa-chart-pie" label="Tableau de bord" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
               <NavItem icon="fa-user-plus" label="Inscription" active={currentView === 'inscription'} onClick={() => setCurrentView('inscription')} />
               <NavItem icon="fa-users" label="Liste des élèves" active={currentView === 'students'} onClick={() => setCurrentView('students')} />
               <NavItem icon="fa-cogs" label="Paramètres" active={currentView === 'settings'} onClick={() => setCurrentView('settings')} />
            </div>

            <div className="p-4 border-t border-white/10 text-xs text-center text-white/60">
               &copy; {new Date().getFullYear()} {settings.appName}
               <div className="mt-1 flex items-center justify-center gap-1 text-[10px]">
                  <span className="w-2 h-2 rounded-full bg-green-400 box-shadow-[0_0_5px_#4ade80]"></span>
                  <span>{session?.school_name}</span>
               </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen scroll-smooth transition-colors duration-300">
            <div className="max-w-7xl mx-auto pb-20">
               <header className="mb-8 flex justify-between items-center">
                   <div>
                      <h1 className="text-3xl font-bold text-gray-800 dark:text-white transition-colors dark:drop-shadow-md">
                          {currentView === 'dashboard' && 'Tableau de bord'}
                          {currentView === 'inscription' && 'Nouvelle Inscription'}
                          {currentView === 'students' && 'Gestion des Élèves'}
                          {currentView === 'settings' && 'Paramètres'}
                      </h1>
                      <p className="text-gray-500 dark:text-gray-300 mt-1">Bienvenue sur votre espace de gestion.</p>
                   </div>
                   <div className="hidden md:flex items-center gap-4 bg-white dark:glass-card px-4 py-2 rounded-full shadow-sm transition-colors border dark:border-white/10">
                       <i className="far fa-calendar-alt text-gray-400 dark:text-gray-300"></i>
                       <span className="text-sm font-medium dark:text-gray-200">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                   </div>
               </header>
               
               {currentView === 'dashboard' && <Dashboard />}
               {currentView === 'inscription' && <StudentForm onSuccess={() => setCurrentView('students')} />}
               {currentView === 'students' && <StudentList />}
               {currentView === 'settings' && <Settings />}
            </div>
          </main>

          <ChatBot />
        </div>
      </div>
    </SchoolContext.Provider>
  );
};

const NavItem: React.FC<{ icon: string; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={() => {
        onClick();
        if(window.innerWidth < 768) document.getElementById('mobile-nav')?.classList.add('hidden');
    }}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${active ? 'bg-white text-gray-900 font-bold shadow-md dark:bg-white/10 dark:text-white dark:backdrop-blur-md dark:border dark:border-white/20' : 'text-white/90 hover:bg-white/10 hover:text-white'}`}
  >
    <i className={`fas ${icon} w-6 text-center ${active ? 'text-[var(--primary-color)] dark:text-white dark:drop-shadow-[0_0_5px_white]' : ''}`}></i>
    <span className={active ? 'dark:drop-shadow-md' : ''}>{label}</span>
  </button>
);

export default App;
