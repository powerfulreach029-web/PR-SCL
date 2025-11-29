
import React, { useState } from 'react';
import { Card, Input, Button, Select, Modal } from '../../components/ui/Common';
import { useSchool } from '../../App';
import { AppSettings, Cycle, Subject, Classroom, AppreciationRule } from '../../types';

export const Settings: React.FC = () => {
  const { settings, updateSettings, cycles, updateCycles, subjects, updateSubjects, resetData, session, logout } = useSchool();
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  
  // Cycle Management State
  const [editingCycleId, setEditingCycleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'structure' | 'subjects'>('general');
  const [newCycleName, setNewCycleName] = useState('');

  // Bulletin Settings State
  const [newAppreciation, setNewAppreciation] = useState<AppreciationRule>({ min: 0, max: 0, text: '' });

  // Save General Settings
  const handleSaveSettings = () => {
    updateSettings(localSettings);
    alert('Paramètres enregistrés !');
  };

  // Create Cycle
  const handleAddCycle = () => {
    if (!newCycleName) return;
    const id = newCycleName.toLowerCase().replace(/\s+/g, '_');
    if (cycles[id]) {
        alert("Ce cycle existe déjà");
        return;
    }
    const newCycle: Cycle = {
        id,
        name: newCycleName,
        type: 'simple',
        levels: [],
        series: [],
        specialites: [],
        classrooms: []
    };
    updateCycles({ ...cycles, [id]: newCycle });
    setNewCycleName('');
    setEditingCycleId(id);
  };

  const deleteCycle = (id: string) => {
      if(confirm("Supprimer ce cycle ? Cela effacera toutes les configurations associées.")){
          const newCycles = {...cycles};
          delete newCycles[id];
          updateCycles(newCycles);
      }
  };

  // Logo Handler
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              setLocalSettings(prev => ({ ...prev, logo: ev.target?.result as string }));
          };
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  // Appreciation Handlers
  const handleAddAppreciation = () => {
      if (newAppreciation.text) {
          const updatedRules = [...localSettings.bulletin.appreciationRules, newAppreciation];
          // Sort by max desc
          updatedRules.sort((a, b) => b.max - a.max);
          setLocalSettings(prev => ({
              ...prev,
              bulletin: {
                  ...prev.bulletin,
                  appreciationRules: updatedRules
              }
          }));
          setNewAppreciation({ min: 0, max: 0, text: '' });
      }
  };

  const removeAppreciation = (index: number) => {
      const updatedRules = [...localSettings.bulletin.appreciationRules];
      updatedRules.splice(index, 1);
      setLocalSettings(prev => ({
          ...prev,
          bulletin: {
              ...prev.bulletin,
              appreciationRules: updatedRules
          }
      }));
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Account Info */}
      <Card title="Compte École">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                  <p className="font-bold text-lg dark:text-white drop-shadow-sm">{session?.school_name}</p>
                  <div className="text-sm text-gray-500 dark:text-gray-300 mt-1 space-y-1">
                      <p>Email: {session?.email}</p>
                      <p className="font-mono text-xs opacity-70">ID: {session?.school_id}</p>
                  </div>
              </div>
              <Button variant="secondary" onClick={logout} icon={<i className="fas fa-sign-out-alt"></i>}>Se Déconnecter</Button>
          </div>
      </Card>

      {/* General Settings */}
      <Card title="Configuration Générale">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Input 
                label="Nom de l'établissement (affichage application)"
                value={localSettings.appName}
                onChange={e => setLocalSettings({...localSettings, appName: e.target.value})}
            />
            <Select 
                label="Thème"
                options={[
                    {value: 'blue', label: 'Bleu Océan'},
                    {value: 'green', label: 'Vert Nature'},
                    {value: 'purple', label: 'Violet Royal'},
                    {value: 'red', label: 'Rouge Passion'},
                ]}
                value={localSettings.theme}
                onChange={e => setLocalSettings({...localSettings, theme: e.target.value as any})}
            />
        </div>
        
        <div className="mb-6 p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/10 transition-colors">
             <h4 className="font-bold mb-3 text-gray-700 dark:text-white">Apparence de l'application</h4>
             <div className="flex items-center gap-6">
                 <label className="flex items-center space-x-2 cursor-pointer">
                     <input 
                        type="radio" 
                        name="mode" 
                        checked={localSettings.mode === 'light'} 
                        onChange={() => setLocalSettings({...localSettings, mode: 'light'})}
                        className="text-[var(--primary-color)] focus:ring-[var(--primary-color)]"
                     />
                     <span className="text-gray-700 dark:text-gray-200"><i className="fas fa-sun mr-1 text-yellow-500"></i> Mode Clair</span>
                 </label>
                 <label className="flex items-center space-x-2 cursor-pointer">
                     <input 
                        type="radio" 
                        name="mode" 
                        checked={localSettings.mode === 'dark'} 
                        onChange={() => setLocalSettings({...localSettings, mode: 'dark'})}
                        className="text-[var(--primary-color)] focus:ring-[var(--primary-color)]"
                     />
                     <span className="text-gray-700 dark:text-gray-200"><i className="fas fa-moon mr-1 text-blue-400"></i> Mode Sombre (Ciel Étoilé)</span>
                 </label>
             </div>
        </div>

        <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Logo de l'établissement</label>
            <div className="flex items-center gap-4">
                {localSettings.logo && <img src={localSettings.logo} alt="Logo" className="h-16 w-16 object-contain border rounded bg-white"/>}
                <input type="file" accept="image/*" onChange={handleLogoChange} className="text-sm dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-white/10 dark:file:text-white"/>
                {localSettings.logo && (
                    <Button variant="danger" size="sm" onClick={() => setLocalSettings({...localSettings, logo: undefined})}>Supprimer</Button>
                )}
            </div>
        </div>
        <Button onClick={handleSaveSettings}>Enregistrer les paramètres</Button>
      </Card>

      {/* Bulletin Configuration */}
      <Card title="Personnalisation du Bulletin">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             {/* Left Column: Display Options & Header */}
             <div>
                 <h4 className="font-bold mb-4 text-gray-700 dark:text-gray-200">Options d'affichage</h4>
                 <div className="space-y-3 mb-6">
                     <label className="flex items-center space-x-3 cursor-pointer text-gray-700 dark:text-gray-300">
                         <input 
                            type="checkbox" 
                            checked={localSettings.bulletin.showTeacher} 
                            onChange={e => setLocalSettings({
                                ...localSettings, 
                                bulletin: { ...localSettings.bulletin, showTeacher: e.target.checked }
                            })}
                            className="h-4 w-4 rounded text-[var(--primary-color)] focus:ring-[var(--primary-color)]"
                         />
                         <span>Afficher le nom de l'enseignant</span>
                     </label>
                     <label className="flex items-center space-x-3 cursor-pointer text-gray-700 dark:text-gray-300">
                         <input 
                            type="checkbox" 
                            checked={localSettings.bulletin.showClassAvg} 
                            onChange={e => setLocalSettings({
                                ...localSettings, 
                                bulletin: { ...localSettings.bulletin, showClassAvg: e.target.checked }
                            })}
                            className="h-4 w-4 rounded text-[var(--primary-color)] focus:ring-[var(--primary-color)]"
                         />
                         <span>Afficher la moyenne de classe (colonne)</span>
                     </label>
                     <label className="flex items-center space-x-3 cursor-pointer text-gray-700 dark:text-gray-300">
                         <input 
                            type="checkbox" 
                            checked={localSettings.bulletin.showAppreciation} 
                            onChange={e => setLocalSettings({
                                ...localSettings, 
                                bulletin: { ...localSettings.bulletin, showAppreciation: e.target.checked }
                            })}
                            className="h-4 w-4 rounded text-[var(--primary-color)] focus:ring-[var(--primary-color)]"
                         />
                         <span>Afficher la colonne Appréciation</span>
                     </label>
                 </div>

                 <h4 className="font-bold mb-4 text-gray-700 dark:text-gray-200">En-tête personnalisé</h4>
                 <Input 
                    label="Sous-titre / Description de l'école"
                    value={localSettings.bulletin.customHeaderText || ''}
                    onChange={e => setLocalSettings({
                        ...localSettings, 
                        bulletin: { ...localSettings.bulletin, customHeaderText: e.target.value }
                    })}
                    placeholder="Ex: Ministère de l'Éducation Nationale"
                 />
             </div>

             {/* Right Column: Appreciation Rules */}
             <div>
                 <h4 className="font-bold mb-4 text-gray-700 dark:text-gray-200">Règles d'appréciation</h4>
                 <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-lg mb-4 border dark:border-white/10">
                     <p className="text-xs text-gray-500 dark:text-gray-300 mb-2">Ajouter une règle</p>
                     <div className="flex gap-2 items-end">
                         <div className="w-20">
                            <Input 
                                type="number" step="0.5" label="Min" 
                                value={newAppreciation.min} 
                                onChange={e => setNewAppreciation({...newAppreciation, min: parseFloat(e.target.value)})} 
                            />
                         </div>
                         <div className="w-20">
                            <Input 
                                type="number" step="0.5" label="Max" 
                                value={newAppreciation.max} 
                                onChange={e => setNewAppreciation({...newAppreciation, max: parseFloat(e.target.value)})} 
                            />
                         </div>
                         <div className="flex-1">
                            <Input 
                                label="Appréciation" 
                                value={newAppreciation.text} 
                                onChange={e => setNewAppreciation({...newAppreciation, text: e.target.value})} 
                            />
                         </div>
                         <div className="pb-1">
                             <Button size="sm" variant="success" onClick={handleAddAppreciation}><i className="fas fa-plus"></i></Button>
                         </div>
                     </div>
                 </div>

                 <div className="border rounded-lg overflow-hidden dark:border-white/10">
                     <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
                         <thead className="bg-gray-100 dark:bg-white/10">
                             <tr>
                                 <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-200">Intervalle</th>
                                 <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-200">Texte</th>
                                 <th className="px-4 py-2"></th>
                             </tr>
                         </thead>
                         <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-white/10">
                             {localSettings.bulletin.appreciationRules.map((rule, idx) => (
                                 <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                     <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">[{rule.min} - {rule.max}[</td>
                                     <td className="px-4 py-2 text-sm text-gray-900 dark:text-white font-medium">{rule.text}</td>
                                     <td className="px-4 py-2 text-right">
                                         <button onClick={() => removeAppreciation(idx)} className="text-red-500 hover:text-red-700 dark:text-red-400">
                                             <i className="fas fa-trash"></i>
                                         </button>
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>
             </div>
         </div>
         <div className="mt-6 flex justify-end">
            <Button onClick={handleSaveSettings}>Enregistrer les paramètres</Button>
         </div>
      </Card>

      {/* Cycles List */}
      <Card title="Gestion des Cycles Scolaires">
        <div className="flex gap-4 mb-6">
            <Input 
                placeholder="Nouveau cycle (ex: Collège, Maternelle)" 
                value={newCycleName}
                onChange={e => setNewCycleName(e.target.value)}
            />
            <Button variant="success" onClick={handleAddCycle}>Créer</Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(cycles).map((cycle: Cycle) => (
                <div key={cycle.id} className="border dark:border-white/10 rounded-xl p-4 bg-white dark:bg-white/5 dark:backdrop-blur-sm shadow-sm hover:shadow-md transition-all relative">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white drop-shadow-sm">{cycle.name}</h3>
                        <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-white/20 rounded-full capitalize text-gray-600 dark:text-gray-200 border dark:border-white/10">{cycle.type}</span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-300 space-y-1 mb-4">
                        <p><i className="fas fa-layer-group w-5"></i> {cycle.levels.length} Classes/Niveaux</p>
                        <p><i className="fas fa-door-open w-5"></i> {cycle.classrooms.length} Salles</p>
                    </div>
                    <div className="flex justify-end gap-2">
                         <Button size="sm" variant="danger" onClick={() => deleteCycle(cycle.id)}><i className="fas fa-trash"></i></Button>
                         <Button size="sm" variant="primary" onClick={() => { setEditingCycleId(cycle.id); setActiveTab('general'); }}>Configurer</Button>
                    </div>
                </div>
            ))}
        </div>
      </Card>

      <Card title="Zone de Danger">
          <p className="text-gray-600 dark:text-gray-300 mb-4">Attention, ces actions sont irréversibles.</p>
          <Button variant="danger" onClick={() => { if(confirm("TOUT EFFACER pour CETTE ÉCOLE ?")) resetData(); }}>Réinitialiser toutes les données de l'école</Button>
      </Card>

      {/* Configuration Modal */}
      {editingCycleId && cycles[editingCycleId] && (
          <CycleConfigModal 
             cycle={cycles[editingCycleId]} 
             onClose={() => setEditingCycleId(null)} 
             activeTab={activeTab}
             setActiveTab={setActiveTab}
             allSubjects={subjects}
             onUpdateCycle={(updated) => updateCycles({...cycles, [updated.id]: updated})}
             onUpdateSubjects={updateSubjects}
          />
      )}
    </div>
  );
};

// --- Sub-components for Cycle Configuration ---

interface CycleConfigModalProps {
    cycle: Cycle;
    onClose: () => void;
    activeTab: 'general' | 'structure' | 'subjects';
    setActiveTab: (tab: 'general' | 'structure' | 'subjects') => void;
    allSubjects: Record<string, Subject[]>;
    onUpdateCycle: (c: Cycle) => void;
    onUpdateSubjects: (className: string, subjects: Subject[]) => void;
}

const CycleConfigModal: React.FC<CycleConfigModalProps> = ({ cycle, onClose, activeTab, setActiveTab, allSubjects, onUpdateCycle, onUpdateSubjects }) => {
    return (
        <Modal isOpen={true} onClose={onClose} title={`Configuration : ${cycle.name}`} maxWidth="max-w-4xl">
            <div className="flex border-b dark:border-white/10 mb-6 overflow-x-auto">
                <button onClick={() => setActiveTab('general')} className={`px-4 py-2 font-medium transition-colors ${activeTab === 'general' ? 'border-b-2 border-[var(--primary-color)] text-[var(--primary-color)] dark:text-white dark:border-white dark:drop-shadow-[0_0_5px_white]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Général</button>
                <button onClick={() => setActiveTab('structure')} className={`px-4 py-2 font-medium transition-colors ${activeTab === 'structure' ? 'border-b-2 border-[var(--primary-color)] text-[var(--primary-color)] dark:text-white dark:border-white dark:drop-shadow-[0_0_5px_white]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Structure (Classes & Salles)</button>
                <button onClick={() => setActiveTab('subjects')} className={`px-4 py-2 font-medium transition-colors ${activeTab === 'subjects' ? 'border-b-2 border-[var(--primary-color)] text-[var(--primary-color)] dark:text-white dark:border-white dark:drop-shadow-[0_0_5px_white]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Matières & Enseignants</button>
            </div>

            <div className="min-h-[400px]">
                {activeTab === 'general' && (
                    <div className="space-y-4">
                        <Input label="Nom du cycle" value={cycle.name} onChange={e => onUpdateCycle({...cycle, name: e.target.value})} />
                        <Select 
                            label="Type de cycle" 
                            options={[
                                {value: 'simple', label: 'Simple (Classes uniques)'},
                                {value: 'series', label: 'Avec Séries (ex: A, C, D)'},
                                {value: 'specialites', label: 'Avec Spécialités'},
                            ]}
                            value={cycle.type}
                            onChange={e => onUpdateCycle({...cycle, type: e.target.value as any})}
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-white/5 dark:border dark:border-white/10 p-3 rounded">
                            <i className="fas fa-info-circle mr-2"></i>
                            <strong>Simple:</strong> Une classe par niveau (ex: 6ème, 5ème).<br/>
                            <strong>Séries/Spécialités:</strong> Les classes sont la combinaison d'un niveau et d'une série (ex: Terminale C, Première A).
                        </p>
                    </div>
                )}

                {activeTab === 'structure' && (
                    <StructureEditor cycle={cycle} onUpdate={onUpdateCycle} />
                )}

                {activeTab === 'subjects' && (
                    <SubjectsEditor cycle={cycle} allSubjects={allSubjects} onUpdateSubjects={onUpdateSubjects} />
                )}
            </div>
            
            <div className="flex justify-end pt-4 border-t dark:border-white/10 mt-4">
                <Button onClick={onClose} variant="secondary">Fermer</Button>
            </div>
        </Modal>
    );
};

const StructureEditor: React.FC<{ cycle: Cycle; onUpdate: (c: Cycle) => void }> = ({ cycle, onUpdate }) => {
    const [newItem, setNewItem] = useState('');

    const addLevel = () => {
        if (newItem && !cycle.levels.includes(newItem)) {
            onUpdate({...cycle, levels: [...cycle.levels, newItem]});
            setNewItem('');
        }
    };

    const addSerie = () => {
        if (newItem && !cycle.series.includes(newItem)) {
            onUpdate({...cycle, series: [...cycle.series, newItem]});
            setNewItem('');
        }
    };

    const addSpecialite = () => {
        if (newItem && !cycle.specialites.includes(newItem)) {
            onUpdate({...cycle, specialites: [...cycle.specialites, newItem]});
            setNewItem('');
        }
    };

    const addClassroom = () => {
        if (newItem) {
            const newRoom: Classroom = { id: `room_${Date.now()}`, name: newItem };
            onUpdate({...cycle, classrooms: [...cycle.classrooms, newRoom]});
            setNewItem('');
        }
    };

    return (
        <div className="space-y-8">
            {/* Levels */}
            <div>
                <h4 className="font-bold mb-2 flex items-center gap-2 dark:text-gray-200"><i className="fas fa-layer-group text-blue-500"></i> Classes / Niveaux</h4>
                <div className="flex flex-wrap gap-2 mb-3">
                    {cycle.levels.map(lvl => (
                        <div key={lvl} className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-100 border dark:border-blue-500/30 px-3 py-1 rounded-full flex items-center gap-2">
                            <span>{lvl}</span>
                            <button onClick={() => onUpdate({...cycle, levels: cycle.levels.filter(l => l !== lvl)})} className="hover:text-red-500">&times;</button>
                        </div>
                    ))}
                    {cycle.levels.length === 0 && <span className="text-gray-400 text-sm italic">Aucun niveau défini</span>}
                </div>
                <div className="flex gap-2 max-w-md">
                    <Input placeholder="Ajouter niveau (ex: 6ème)" value={newItem} onChange={e => setNewItem(e.target.value)} />
                    <Button size="sm" onClick={addLevel}>Ajouter</Button>
                </div>
            </div>

            {/* Series / Specialties */}
            {(cycle.type === 'series' || cycle.type === 'specialites') && (
                <div>
                    <h4 className="font-bold mb-2 flex items-center gap-2 dark:text-gray-200">
                        <i className="fas fa-code-branch text-purple-500"></i> 
                        {cycle.type === 'series' ? 'Séries' : 'Spécialités'}
                    </h4>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {(cycle.type === 'series' ? cycle.series : cycle.specialites).map(item => (
                            <div key={item} className="bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-100 border dark:border-purple-500/30 px-3 py-1 rounded-full flex items-center gap-2">
                                <span>{item}</span>
                                <button onClick={() => {
                                    if(cycle.type === 'series') onUpdate({...cycle, series: cycle.series.filter(s => s !== item)});
                                    else onUpdate({...cycle, specialites: cycle.specialites.filter(s => s !== item)});
                                }} className="hover:text-red-500">&times;</button>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2 max-w-md">
                        <Input placeholder={`Ajouter ${cycle.type === 'series' ? 'série' : 'spécialité'}`} value={newItem} onChange={e => setNewItem(e.target.value)} />
                        <Button size="sm" onClick={cycle.type === 'series' ? addSerie : addSpecialite}>Ajouter</Button>
                    </div>
                </div>
            )}

            {/* Classrooms */}
            <div>
                <h4 className="font-bold mb-2 flex items-center gap-2 dark:text-gray-200"><i className="fas fa-door-open text-green-500"></i> Salles de classe (Facultatif)</h4>
                <div className="flex flex-wrap gap-2 mb-3">
                    {cycle.classrooms.map(room => (
                        <div key={room.id} className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-100 border dark:border-green-500/30 px-3 py-1 rounded-full flex items-center gap-2">
                            <span>{room.name}</span>
                            <button onClick={() => onUpdate({...cycle, classrooms: cycle.classrooms.filter(c => c.id !== room.id)})} className="hover:text-red-500">&times;</button>
                        </div>
                    ))}
                    {cycle.classrooms.length === 0 && <span className="text-gray-400 text-sm italic">Aucune salle définie</span>}
                </div>
                <div className="flex gap-2 max-w-md">
                    <Input placeholder="Nom de la salle (ex: Salle 101)" value={newItem} onChange={e => setNewItem(e.target.value)} />
                    <Button size="sm" onClick={addClassroom}>Ajouter</Button>
                </div>
            </div>
        </div>
    );
};

const SubjectsEditor: React.FC<{ 
    cycle: Cycle; 
    allSubjects: Record<string, Subject[]>; 
    onUpdateSubjects: (cls: string, subs: Subject[]) => void 
}> = ({ cycle, allSubjects, onUpdateSubjects }) => {
    
    // Generate valid class combinations
    const getClassCombinations = () => {
        if (cycle.type === 'simple') return cycle.levels;
        const suffixes = cycle.type === 'series' ? cycle.series : cycle.specialites;
        const combos: string[] = [];
        cycle.levels.forEach(lvl => {
            if (suffixes.length > 0) {
                suffixes.forEach(s => combos.push(`${lvl} ${s}`));
            } else {
                combos.push(lvl); // Fallback if no series defined yet
            }
        });
        return combos;
    };

    const combinations = getClassCombinations();
    const [selectedClass, setSelectedClass] = useState<string>(combinations[0] || '');
    
    // Form State
    const [subName, setSubName] = useState('');
    const [subCoeff, setSubCoeff] = useState(1);
    const [subTeacher, setSubTeacher] = useState('');

    const currentSubjects = allSubjects[selectedClass] || [];

    const addSubject = () => {
        if (!subName || !selectedClass) return;
        const newSub: Subject = {
            id: Date.now().toString(),
            nom: subName,
            coefficient: subCoeff,
            teacher: subTeacher
        };
        onUpdateSubjects(selectedClass, [...currentSubjects, newSub]);
        setSubName('');
        setSubCoeff(1);
        setSubTeacher('');
    };

    const removeSubject = (id: string) => {
        onUpdateSubjects(selectedClass, currentSubjects.filter(s => s.id !== id));
    };

    return (
        <div className="flex flex-col md:flex-row gap-6">
            {/* Left: Select Class */}
            <div className="w-full md:w-1/3 border-r dark:border-white/10 pr-6">
                <h4 className="font-bold mb-4 dark:text-gray-200">1. Choisir la classe</h4>
                {combinations.length === 0 ? (
                    <p className="text-red-500 text-sm">Veuillez d'abord configurer les niveaux et séries dans l'onglet "Structure".</p>
                ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                        {combinations.map(c => (
                            <button
                                key={c}
                                onClick={() => setSelectedClass(c)}
                                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${selectedClass === c ? 'bg-blue-50 border-[var(--primary-color)] text-[var(--primary-color)] font-bold dark:bg-white/10 dark:text-blue-300 dark:border-blue-400' : 'hover:bg-gray-50 dark:hover:bg-white/5 dark:border-white/10 dark:text-gray-300'}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Right: Manage Subjects */}
            <div className="w-full md:w-2/3">
                <h4 className="font-bold mb-4 dark:text-gray-200">2. Matières pour : <span className="text-[var(--primary-color)] dark:text-white dark:drop-shadow-[0_0_5px_var(--primary-color)]">{selectedClass || '...'}</span></h4>
                
                {selectedClass && (
                    <>
                        <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-lg mb-6 border dark:border-white/10">
                            <h5 className="font-semibold text-sm mb-3 dark:text-gray-300">Ajouter une matière</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                <Input placeholder="Nom (ex: Maths)" value={subName} onChange={e => setSubName(e.target.value)} />
                                <Input type="number" placeholder="Coeff" min="1" value={subCoeff} onChange={e => setSubCoeff(parseInt(e.target.value))} />
                                <Input placeholder="Enseignant (facultatif)" value={subTeacher} onChange={e => setSubTeacher(e.target.value)} />
                            </div>
                            <Button size="sm" onClick={addSubject} disabled={!subName}>Ajouter</Button>
                        </div>

                        <div className="overflow-hidden border rounded-lg dark:border-white/10">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
                                <thead className="bg-gray-100 dark:bg-white/10">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase">Matière</th>
                                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-200 uppercase">Coeff</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase">Enseignant</th>
                                        <th className="px-4 py-2 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-white/10 bg-white dark:bg-transparent">
                                    {currentSubjects.map(sub => (
                                        <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors dark:text-gray-200">
                                            <td className="px-4 py-2">{sub.nom}</td>
                                            <td className="px-4 py-2 text-center">{sub.coefficient}</td>
                                            <td className="px-4 py-2 text-gray-500 dark:text-gray-400 text-sm">{sub.teacher || '-'}</td>
                                            <td className="px-4 py-2 text-right">
                                                <button onClick={() => removeSubject(sub.id)} className="text-red-500 hover:text-red-700 dark:text-red-400">
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {currentSubjects.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 italic">Aucune matière configurée pour cette classe.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
