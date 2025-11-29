
import React, { useState } from 'react';
import { Card, Button, Input, Modal } from '../../components/ui/Common';
import { UserSession } from '../../types';
import * as api from '../../services/supabase';

interface LoginScreenProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schoolName, setSchoolName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Setup Help State
  const [showSqlHelp, setShowSqlHelp] = useState(false);

  // --- ACTIONS DE LOGIN ---
  const handleAuthSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setLoading(true);

      try {
          if (activeTab === 'register') {
              if (!schoolName) throw new Error("Le nom de l'école est obligatoire");
              await api.signUp(email, password, schoolName);
              // Auto login after signup attempt
              try {
                  await api.signIn(email, password);
              } catch (e) {
                  alert("Compte créé ! Connectez-vous maintenant.");
                  setActiveTab('login');
                  setLoading(false);
                  return;
              }
          } else {
              await api.signIn(email, password);
          }

          const session = await api.fetchUserSession();
          if (session) {
              onLoginSuccess(session);
          } else {
              setError("Connexion réussie mais la configuration de l'école a échoué.");
              // Si pas de session après login, c'est critique (tables manquantes probablement)
              setShowSqlHelp(true);
          }

      } catch (err: any) {
          setError(err.message || "Une erreur est survenue.");
      } finally {
          setLoading(false);
      }
  };

  const copySql = () => {
      navigator.clipboard.writeText(api.SQL_SETUP_SCRIPT);
      alert("Script copié ! Collez-le dans l'éditeur SQL de Supabase.");
  };

  // --- RENDU : LOGIN / REGISTER ---
  return (
    <div className="flex items-center justify-center p-4 min-h-screen">
      <div className="max-w-md w-full relative z-20">
        <div className="text-center mb-8">
            <div className="w-20 h-20 bg-[var(--primary-color)] rounded-full flex items-center justify-center mx-auto mb-4 text-white text-4xl shadow-[0_0_20px_var(--primary-color)] transition-all animate-pulse">
                <i className="fas fa-graduation-cap"></i>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white drop-shadow-md">PR-SCL</h1>
            <p className="text-gray-500 dark:text-gray-300">Plateforme de Gestion Scolaire</p>
        </div>

        <Card className="backdrop-blur-md">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-white/10 mb-6">
                <button 
                    className={`flex-1 py-2 font-medium text-sm transition-colors ${activeTab === 'login' ? 'text-[var(--primary-color)] border-b-2 border-[var(--primary-color)] dark:text-white dark:border-white dark:drop-shadow-[0_0_5px_white]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    onClick={() => setActiveTab('login')}
                >
                    Connexion
                </button>
                <button 
                    className={`flex-1 py-2 font-medium text-sm transition-colors ${activeTab === 'register' ? 'text-[var(--primary-color)] border-b-2 border-[var(--primary-color)] dark:text-white dark:border-white dark:drop-shadow-[0_0_5px_white]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    onClick={() => setActiveTab('register')}
                >
                    Créer une école
                </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
                {activeTab === 'register' && (
                    <Input 
                        label="Nom de l'établissement" 
                        placeholder="Ex: Lycée Moderne..." 
                        value={schoolName}
                        onChange={e => setSchoolName(e.target.value)}
                        required
                        className="dark:bg-black/20"
                    />
                )}
                
                <Input 
                    type="email"
                    label="Email administrateur" 
                    placeholder="directeur@ecole.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="dark:bg-black/20"
                />
                
                <Input 
                    type="password"
                    label="Mot de passe" 
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="dark:bg-black/20"
                />

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-200 p-3 rounded text-sm text-center border border-red-200 dark:border-red-500/30">
                        <i className="fas fa-exclamation-circle mr-2"></i>
                        {error}
                        {(error.includes("impossible") || error.includes("configuration")) && (
                             <button type="button" onClick={() => setShowSqlHelp(true)} className="block mt-2 text-xs underline mx-auto font-bold">
                                 Configurer la base de données
                             </button>
                        )}
                    </div>
                )}

                <Button type="submit" className="w-full mt-4" size="lg" disabled={loading}>
                    {loading ? <i className="fas fa-spinner fa-spin"></i> : (activeTab === 'register' ? "Créer mon école" : "Se connecter")}
                </Button>
            </form>
            
            <div className="mt-6 text-center">
                 <button onClick={() => setShowSqlHelp(true)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                     Outils configuration serveur
                 </button>
            </div>
        </Card>
      </div>

      {/* SQL Script Helper Modal */}
      <Modal isOpen={showSqlHelp} onClose={() => setShowSqlHelp(false)} title="Configuration Serveur Requise" maxWidth="max-w-2xl">
          <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-4 mb-4">
                  <div className="flex">
                      <div className="flex-shrink-0">
                          <i className="fas fa-exclamation-triangle text-yellow-500"></i>
                      </div>
                      <div className="ml-3">
                          <p className="text-sm text-yellow-700 dark:text-yellow-200">
                              L'application ne trouve pas les tables nécessaires dans la base de données Supabase.
                          </p>
                      </div>
                  </div>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-300">
                  Copiez le script ci-dessous et exécutez-le dans l'onglet <strong>SQL Editor</strong> de votre projet Supabase pour initialiser l'environnement.
              </p>
              
              <div className="relative">
                  <pre className="bg-gray-800 text-green-400 p-4 rounded text-xs overflow-auto h-64 font-mono whitespace-pre-wrap border border-gray-700 dark:glass-card">
                      {api.SQL_SETUP_SCRIPT}
                  </pre>
                  <button 
                    onClick={copySql}
                    className="absolute top-2 right-2 bg-white text-gray-800 px-3 py-1 text-xs font-bold rounded shadow hover:bg-gray-100 transition-colors neon-button"
                  >
                      COPIER
                  </button>
              </div>
              <div className="flex justify-end pt-2">
                  <Button onClick={() => setShowSqlHelp(false)}>Fermer</Button>
              </div>
          </div>
      </Modal>
    </div>
  );
};
