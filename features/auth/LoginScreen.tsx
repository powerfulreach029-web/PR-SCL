
import React, { useState } from 'react';
import { Card, Button, Input, Modal } from '../../components/ui/Common';
import { UserSession } from '../../types';
import * as api from '../../services/supabase';

interface LoginScreenProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  // Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
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
          // Uniquement connexion
          await api.signIn(email, password);

          const session = await api.fetchUserSession();
          if (session) {
              onLoginSuccess(session);
          } else {
              setError("Connexion réussie mais la configuration de l'école a échoué.");
              setShowSqlHelp(true);
          }

      } catch (err: any) {
          setError(err.message || "Email ou mot de passe incorrect.");
      } finally {
          setLoading(false);
      }
  };

  const copySql = () => {
      navigator.clipboard.writeText(api.SQL_SETUP_SCRIPT);
      alert("Script copié ! Collez-le dans l'éditeur SQL de Supabase.");
  };

  // --- RENDU : LOGIN UNIQUEMENT ---
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
            <h2 className="text-xl font-bold text-center mb-6 text-gray-800 dark:text-white border-b pb-4 border-gray-100 dark:border-white/10">
                Espace Connexion
            </h2>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
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
                    {loading ? <i className="fas fa-spinner fa-spin"></i> : "Se connecter"}
                </Button>
            </form>
            
            {/* Lien discret pour le setup DB si besoin pour admin */}
            <div className="mt-8 text-center pt-4 border-t border-gray-100 dark:border-white/10">
                 <button onClick={() => setShowSqlHelp(true)} className="text-[10px] text-gray-300 hover:text-gray-500 dark:hover:text-gray-200 transition-colors">
                     admin: setup db
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
