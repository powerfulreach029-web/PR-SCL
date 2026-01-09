
import React, { useState } from 'react';
import { Card, Button, Input, Modal } from '../../components/ui/Common';
import { UserSession } from '../../types';
import * as api from '../../services/supabase';

interface LoginScreenProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schoolName, setSchoolName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSqlHelp, setShowSqlHelp] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setLoading(true);

      try {
          if (isLogin) {
              await api.signIn(email, password);
          } else {
              if (!schoolName) throw new Error("Veuillez saisir le nom de votre école.");
              await api.signUp(email, password, schoolName);
          }

          const session = await api.fetchUserSession();
          if (session) {
              onLoginSuccess(session);
          } else {
              setError("Connexion réussie mais le profil n'a pas pu être chargé.");
          }

      } catch (err: any) {
          setError(err.message || "Une erreur est survenue.");
      } finally {
          setLoading(false);
      }
  };

  const copySql = () => {
      navigator.clipboard.writeText(api.SQL_SETUP_SCRIPT);
      alert("Script copié !");
  };

  return (
    <div className="flex items-center justify-center p-4 min-h-screen">
      <div className="max-w-md w-full relative z-20">
        <div className="text-center mb-8">
            <div className="w-20 h-20 bg-[var(--primary-color)] rounded-full flex items-center justify-center mx-auto mb-4 text-white text-4xl shadow-[0_0_20px_var(--primary-color)] transition-all animate-pulse">
                <i className="fas fa-graduation-cap"></i>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white drop-shadow-md">PR-SCL</h1>
            <p className="text-gray-500 dark:text-gray-300">Gestion Scolaire Intelligente</p>
        </div>

        <Card className="backdrop-blur-md">
            <h2 className="text-xl font-bold text-center mb-6 text-gray-800 dark:text-white border-b pb-4 border-gray-100 dark:border-white/10">
                {isLogin ? 'Connexion' : 'Inscription École'}
            </h2>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
                {!isLogin && (
                    <Input 
                        label="Nom de l'établissement" 
                        placeholder="Ex: Lycée Technique PR-SCL"
                        value={schoolName}
                        onChange={e => setSchoolName(e.target.value)}
                        required
                    />
                )}
                <Input 
                    type="email"
                    label="Email" 
                    placeholder="directeur@ecole.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                />
                <Input 
                    type="password"
                    label="Mot de passe" 
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                />

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-200 p-3 rounded text-sm text-center border border-red-200 dark:border-red-500/30">
                        {error}
                    </div>
                )}

                <Button type="submit" className="w-full mt-4" size="lg" disabled={loading}>
                    {loading ? <i className="fas fa-spinner fa-spin"></i> : (isLogin ? "Se connecter" : "Créer mon école")}
                </Button>

                <div className="text-center pt-4">
                    <button 
                        type="button" 
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm text-[var(--primary-color)] hover:underline dark:text-blue-300"
                    >
                        {isLogin ? "Pas encore de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
                    </button>
                </div>
            </form>
            
            <div className="mt-8 text-center pt-4 border-t border-gray-100 dark:border-white/10">
                 <button onClick={() => setShowSqlHelp(true)} className="text-[10px] text-gray-400 hover:text-gray-300 transition-colors">
                     Besoin d'aide pour la base de données ?
                 </button>
            </div>
        </Card>
      </div>

      <Modal isOpen={showSqlHelp} onClose={() => setShowSqlHelp(false)} title="Script SQL de secours" maxWidth="max-w-2xl">
          <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                  Si vous avez des erreurs de connexion, assurez-vous d'avoir exécuté ce script dans Supabase :
              </p>
              <div className="relative">
                  <pre className="bg-gray-800 text-green-400 p-4 rounded text-xs overflow-auto h-64 font-mono whitespace-pre-wrap">
                      {api.SQL_SETUP_SCRIPT}
                  </pre>
                  <button onClick={copySql} className="absolute top-2 right-2 bg-white text-gray-800 px-3 py-1 text-xs font-bold rounded shadow">
                      COPIER
                  </button>
              </div>
          </div>
      </Modal>
    </div>
  );
};
