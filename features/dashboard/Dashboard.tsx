
import React from 'react';
import { Card } from '../../components/ui/Common';
import { useSchool } from '../../App';
import { Cycle } from '../../types';

export const Dashboard: React.FC = () => {
  const { students, grades, cycles, subjects, settings } = useSchool();
  
  const textPrimary = "text-[var(--primary-color)] dark:text-white dark:drop-shadow-[0_0_5px_var(--primary-color)]";

  const statCards = [
    { title: 'Élèves Inscrits', value: students.length, icon: 'fa-user-graduate', color: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 dark:border dark:border-blue-400/30' },
    { title: 'Notes Enregistrées', value: grades.length, icon: 'fa-clipboard-check', color: 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-300 dark:border dark:border-green-400/30' },
    { title: 'Cycles Actifs', value: Object.keys(cycles).length, icon: 'fa-layer-group', color: 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 dark:border dark:border-purple-400/30' },
    { title: 'Niveaux/Classes', value: Object.values(cycles).reduce((acc: number, c: Cycle) => acc + c.levels.length, 0), icon: 'fa-chalkboard', color: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-300 dark:border dark:border-yellow-400/30' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <Card key={idx} className="hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-300 font-medium mb-1">{stat.title}</p>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white drop-shadow-sm">{stat.value}</h2>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.color} shadow-sm`}>
                <i className={`fas ${stat.icon} text-xl`}></i>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title={<span className={textPrimary}><i className="fas fa-chart-pie mr-2"></i>Répartition par Cycle</span>}>
          <div className="space-y-4">
            {Object.values(cycles).map((cycle: Cycle) => {
              const count = students.filter(s => s.cycle === cycle.id).length;
              const percentage = students.length ? Math.round((count / students.length) * 100) : 0;
              return (
                <div key={cycle.id}>
                  <div className="flex justify-between text-sm mb-1 text-gray-700 dark:text-gray-300">
                    <span className="font-medium">{cycle.name}</span>
                    <span className="text-gray-500 dark:text-gray-400">{count} élèves ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 border dark:border-gray-600">
                    <div 
                      className="h-2.5 rounded-full bg-[var(--primary-color)] dark:shadow-[0_0_8px_var(--primary-color)]" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
            {Object.keys(cycles).length === 0 && <p className="text-gray-500 dark:text-gray-400 text-center italic">Aucun cycle défini</p>}
          </div>
        </Card>

        <Card title={<span className={textPrimary}><i className="fas fa-info-circle mr-2"></i>Informations Système</span>}>
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
              <span className="text-gray-600 dark:text-gray-400">Nom de l'établissement</span>
              <span className="font-medium">{settings.appName}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
              <span className="text-gray-600 dark:text-gray-400">Thème Actuel</span>
              <span className="font-medium capitalize flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full bg-[var(--primary-color)] dark:shadow-[0_0_5px_var(--primary-color)]`}></span>
                  {settings.theme}
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
              <span className="text-gray-600 dark:text-gray-400">Mode d'affichage</span>
              <span className="font-medium capitalize">{settings.mode === 'dark' ? 'Sombre (Ciel Étoilé)' : 'Clair'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Date</span>
              <span className="font-medium">{new Date().toLocaleDateString('fr-FR')}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
