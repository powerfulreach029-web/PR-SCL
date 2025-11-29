
import React, { useState, useEffect } from 'react';
import { Student, Grade } from '../../types';
import { Card, Button, Modal, Input, Select } from '../../components/ui/Common';
import { useSchool } from '../../App';

declare const qrcode: any; // Correct global variable for qrcode-generator
declare const html2pdf: any;

interface StudentDetailsProps {
  student: Student;
  onBack: () => void;
}

export const StudentDetails: React.FC<StudentDetailsProps> = ({ student, onBack }) => {
  const { students, grades, subjects, addGrade, deleteGrade, settings } = useSchool();
  
  // Détection du cycle universitaire
  const isUniversity = student.cycle === 'universite';
  const periods = isUniversity ? ['S1', 'S2'] : ['1', '2', '3'];
  const defaultPeriod = isUniversity ? 'S1' : '1';

  const [activeTrimestre, setActiveTrimestre] = useState<string>(defaultPeriod);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [isBulletinModalOpen, setIsBulletinModalOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  
  // Grade Form State
  const [gradeForm, setGradeForm] = useState<Partial<Grade>>({
    trimestre: defaultPeriod,
    type: isUniversity ? 'dst' : 'devoir',
    coefficient: 1,
    valeur: 0,
    matiere: ''
  });

  // Récupération dynamique des matières pour la classe de l'élève
  const subjectKey = student.serie ? `${student.classe} ${student.serie}` : student.classe;
  const classSubjects = subjects[subjectKey] || [];

  // Récupérer toutes les notes de l'élève une seule fois
  const allStudentGrades = grades.filter(g => g.studentId === student.id);
  const currentTrimesterGrades = allStudentGrades.filter(g => g.trimestre === activeTrimestre);

  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gradeForm.valeur === undefined || !gradeForm.matiere) return;

    const subject = classSubjects.find(s => s.nom === gradeForm.matiere);
    const finalCoeff = subject ? subject.coefficient : (gradeForm.coefficient || 1);

    const newGrade: Grade = {
      id: Date.now().toString(),
      studentId: student.id,
      trimestre: activeTrimestre,
      type: gradeForm.type as any,
      matiere: gradeForm.matiere,
      valeur: parseFloat(gradeForm.valeur.toString()),
      coefficient: finalCoeff,
      date: new Date().toISOString().split('T')[0]
    };

    addGrade(newGrade);
    setIsGradeModalOpen(false);
    setGradeForm({ 
        trimestre: activeTrimestre, 
        type: isUniversity ? 'dst' : 'devoir', 
        valeur: 0, 
        matiere: '', 
        coefficient: 1 
    });
  };

  const handleMatiereChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedMatiereName = e.target.value;
      const selectedSubject = classSubjects.find(s => s.nom === selectedMatiereName);
      
      setGradeForm({
          ...gradeForm,
          matiere: selectedMatiereName,
          coefficient: selectedSubject ? selectedSubject.coefficient : 1
      });
  };

  // --- Moteur de Calcul ---

  const calculateSimpleAvg = (grades: Grade[]) => {
      if (!grades || grades.length === 0) return null;
      const sum = grades.reduce((acc, curr) => acc + curr.valeur, 0);
      return sum / grades.length;
  };

  // Calcul pour une matière et un trimestre/semestre donnés pour un élève spécifique
  const calculateSubjectStats = (targetStudentId: string, subjectName: string, period: string) => {
      const targetGrades = grades.filter(g => g.studentId === targetStudentId && g.matiere === subjectName && g.trimestre === period);
      
      if (isUniversity) {
          // Logique Université : DST (40%) et Sessions (60%)
          const dsts = targetGrades.filter(g => g.type === 'dst');
          const sessions = targetGrades.filter(g => g.type === 'session');

          const avgDST = calculateSimpleAvg(dsts);
          const avgSession = calculateSimpleAvg(sessions);

          let moyEleve = null;
          
          if (avgDST !== null || avgSession !== null) {
              const valDst = avgDST || 0;
              const valSession = avgSession || 0;
              moyEleve = (valDst * 0.4) + (valSession * 0.6);
          }

          return { col1: avgDST, col2: avgSession, moyEleve };

      } else {
          // Logique Standard
          const devoirs = targetGrades.filter(g => g.type === 'devoir');
          const departementaux = targetGrades.filter(g => g.type === 'departemental');
          const compositions = targetGrades.filter(g => g.type === 'composition');

          const avgDevoir = calculateSimpleAvg(devoirs);
          const avgDepart = calculateSimpleAvg(departementaux);
          
          let moyClasse = null;
          if (avgDevoir !== null && avgDepart !== null) {
              moyClasse = (avgDevoir + avgDepart) / 2;
          } else if (avgDevoir !== null) {
              moyClasse = avgDevoir;
          } else if (avgDepart !== null) {
              moyClasse = avgDepart;
          }

          const moyCompo = calculateSimpleAvg(compositions);

          let moyEleve = null;
          if (moyClasse !== null && moyCompo !== null) {
              moyEleve = (moyClasse + moyCompo) / 2;
          } else if (moyClasse !== null) {
              moyEleve = moyClasse;
          } else if (moyCompo !== null) {
              moyEleve = moyCompo;
          }

          return { col1: moyClasse, col2: moyCompo, moyEleve };
      }
  };

  // Calcul Moyenne Générale pour un élève et une période
  const calculateGeneralAverage = (targetStudentId: string, period: string) => {
      let totalPoints = 0;
      let totalCoeffs = 0;
      
      // On utilise classSubjects (les matières de la classe de l'élève actuel)
      // Cela suppose que tous les élèves de la même classe ont les mêmes matières
      classSubjects.forEach(sub => {
        const { moyEleve } = calculateSubjectStats(targetStudentId, sub.nom, period);
        if (moyEleve !== null) {
          totalPoints += moyEleve * sub.coefficient;
          totalCoeffs += sub.coefficient;
        }
      });

      const average = totalCoeffs ? (totalPoints / totalCoeffs) : null;
      return { totalPoints, totalCoeffs, average };
  };

  // Stats pour l'élève affiché
  const activeStats = calculateGeneralAverage(student.id, activeTrimestre);

  // Stats Annuelles pour l'élève affiché
  const getAnnualStats = (targetStudentId: string) => {
      const stats: Record<string, number | null> = {};
      let sum = 0;
      let count = 0;

      periods.forEach(p => {
          const avg = calculateGeneralAverage(targetStudentId, p).average;
          stats[p] = avg;
          if (avg !== null) {
              sum += avg;
              count++;
          }
      });

      const annualAverage = count > 0 ? sum / count : null;
      return { ...stats, annualAverage };
  };

  const annualStats = getAnnualStats(student.id);

  // --- CALCUL DU RANG ---
  const calculateRank = (period: string, isAnnual: boolean) => {
      // 1. Filtrer les camarades de classe
      const classmates = students.filter(s => 
          s.cycle === student.cycle && 
          s.classe === student.classe && 
          s.serie === student.serie
      );

      // 2. Calculer la moyenne pour chaque camarade
      const scores = classmates.map(mate => {
          let avg = 0;
          if (isAnnual) {
              const mateAnnualStats = getAnnualStats(mate.id);
              avg = mateAnnualStats.annualAverage || 0;
          } else {
              const mateStats = calculateGeneralAverage(mate.id, period);
              avg = mateStats.average || 0;
          }
          return { id: mate.id, avg };
      });

      // 3. Trier décroissant
      scores.sort((a, b) => b.avg - a.avg);

      // 4. Trouver l'index de l'élève actuel
      const index = scores.findIndex(s => s.id === student.id);
      
      return {
          rank: index + 1,
          total: classmates.length
      };
  };

  const currentRank = calculateRank(activeTrimestre, false);
  const annualRank = calculateRank('', true); // Period ignored if isAnnual is true

  const formatRank = (rank: number) => {
      return rank === 1 ? `${rank}er` : `${rank}ème`;
  };

  const getAppreciation = (avg: number | null): string => {
      if (avg === null) return '';
      const rules = settings.bulletin?.appreciationRules || [];
      const rule = rules.find(r => avg >= r.min && avg <= r.max);
      return rule ? rule.text : '-';
  };

  const getCouncilDecision = () => {
      const isEndYear = isUniversity ? activeTrimestre === 'S2' : activeTrimestre === '3';

      if (isEndYear) {
          const avg = annualStats.annualAverage;
          if (avg === null) return "Données insuffisantes.";
          
          if (avg >= 10) {
              return "Admis(e) en classe supérieure.";
          } else {
              return "Redouble sa classe.";
          }
      } 
      else {
          const avg = activeStats.average;
          if (avg === null) return "Données insuffisantes.";
          return avg >= 10 
              ? "Travail satisfaisant. Continuez ainsi." 
              : "Des efforts sont attendus pour la suite.";
      }
  };

  // PDF Download
  const handleDownloadPDF = () => {
      const element = document.querySelector('.bulletin-container');
      if (!element || typeof html2pdf === 'undefined') {
          alert("Erreur: Impossible de générer le PDF.");
          return;
      }
      const opt = {
          margin: 0,
          filename: `bulletin_${student.nom}_${activeTrimestre}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(element).save();
  };

  // QR Code Generation Logic
  useEffect(() => {
    if (isBulletinModalOpen) {
        setTimeout(() => {
            if (typeof qrcode !== 'undefined') {
                try {
                    const qr = qrcode(0, 'M'); 
                    
                    const secureData = {
                        ecole: settings.appName,
                        eleve: `${student.nom} ${student.prenom}`,
                        id: student.id,
                        classe: subjectKey,
                        periode: activeTrimestre,
                        moy_periode: activeStats.average?.toFixed(2) || 'N/A',
                        rang: `${currentRank.rank}/${currentRank.total}`,
                        moy_ann: (isUniversity && activeTrimestre === 'S2') || (!isUniversity && activeTrimestre === '3') ? (annualStats.annualAverage?.toFixed(2) || 'N/A') : 'N/A',
                        date: new Date().toLocaleDateString('fr-FR')
                    };
                    
                    qr.addData(JSON.stringify(secureData));
                    qr.make();
                    
                    const imgTagString = qr.createImgTag(4); 
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(imgTagString, 'text/html');
                    const img = doc.querySelector('img');
                    
                    if (img) {
                        setQrCodeDataUrl(img.src);
                    }
                } catch (e) {
                    console.error("Erreur génération QR Code", e);
                }
            }
        }, 100);
    }
  }, [isBulletinModalOpen, activeStats.average, student, subjectKey, activeTrimestre, settings.appName, currentRank]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between no-print">
        <Button variant="secondary" onClick={onBack} icon={<i className="fas fa-arrow-left"></i>}>Retour</Button>
        <div className="space-x-2">
            <Button variant="success" onClick={() => setIsGradeModalOpen(true)} icon={<i className="fas fa-plus"></i>}>Ajouter une note</Button>
            <Button variant="primary" onClick={() => setIsBulletinModalOpen(true)} icon={<i className="fas fa-print"></i>}>Bulletin</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
        {/* Profile Card */}
        <Card className="md:col-span-1">
            <div className="flex flex-col items-center text-center">
                <img src={student.photo || 'https://picsum.photos/200/200'} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-gray-100 dark:border-white/20 shadow-md mb-4"/>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{student.nom} {student.prenom}</h2>
                <p className="text-[var(--primary-color)] font-medium mb-4">{subjectKey}</p>
                <div className="w-full space-y-3 text-left text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/5 p-4 rounded-lg border dark:border-white/5">
                    <p><strong>Né(e) le:</strong> {student.dateNaissance}</p>
                    <p><strong>Matricule:</strong> {student.id.substring(0,8).toUpperCase()}</p>
                    <p><strong>Téléphone:</strong> {student.telephone}</p>
                    <p><strong>Inscrit le:</strong> {student.dateInscription}</p>
                    {isUniversity && <p className="text-xs italic text-purple-600 dark:text-purple-400 mt-2 font-bold uppercase">Cycle Universitaire</p>}
                </div>
            </div>
        </Card>

        {/* Grades Panel */}
        <div className="md:col-span-2 space-y-4">
            <div className="flex bg-white dark:bg-transparent dark:glass-card rounded-lg shadow-sm p-1 border dark:border-white/10">
                {periods.map(p => (
                    <button
                        key={p}
                        onClick={() => setActiveTrimestre(p)}
                        className={`flex-1 py-2 text-center rounded-md font-medium transition-colors ${activeTrimestre === p ? 'bg-[var(--primary-color)] text-white shadow' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                    >
                        {isUniversity ? `Semestre ${p.replace('S','')}` : `Trimestre ${p}`}
                    </button>
                ))}
            </div>

            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                        Relevé de notes ({isUniversity ? 'Semestre' : 'Trimestre'} {activeTrimestre.replace('S','')})
                    </h3>
                    {activeStats.average !== null && (
                        <div className="text-right">
                             <span className="px-4 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 rounded-full font-bold">
                                Moy: {activeStats.average.toFixed(2)} / 20
                            </span>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                                Rang: {formatRank(currentRank.rank)} / {currentRank.total}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    {classSubjects.length === 0 ? (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-4 italic bg-gray-50 dark:bg-white/5 rounded p-4 border dark:border-white/5">
                            <i className="fas fa-exclamation-circle text-yellow-500 mb-2 text-xl block"></i>
                            <p>Aucune matière configurée pour la classe <strong>"{subjectKey}"</strong>.</p>
                        </div>
                    ) : (
                        classSubjects.map(subject => {
                            const { moyEleve } = calculateSubjectStats(student.id, subject.nom, activeTrimestre);
                            const subjectGrades = currentTrimesterGrades.filter(g => g.matiere === subject.nom);
                            
                            return (
                                <div key={subject.nom} className="border-b dark:border-white/10 last:border-0 pb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-semibold text-gray-700 dark:text-gray-200">{subject.nom} <span className="text-xs text-gray-400 font-normal">(Coeff: {subject.coefficient})</span></h4>
                                        <span className={`font-bold ${moyEleve && moyEleve >= 10 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                            {moyEleve !== null ? moyEleve.toFixed(2) : '-'}
                                        </span>
                                    </div>
                                    {subjectGrades.length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {subjectGrades.map(g => (
                                                <div key={g.id} className="bg-gray-50 dark:bg-white/10 p-2 rounded text-xs flex justify-between group relative text-gray-800 dark:text-gray-200 border dark:border-white/5">
                                                    <span>{g.valeur} <span className="text-gray-400">/20</span></span>
                                                    <span className="text-gray-400 uppercase text-[10px]">{g.type.substring(0,4)}</span>
                                                    <button 
                                                        onClick={() => deleteGrade(g.id)}
                                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        &times;
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400 italic">Aucune note</p>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </Card>
        </div>
      </div>

      {/* Add Grade Modal */}
      <Modal isOpen={isGradeModalOpen} onClose={() => setIsGradeModalOpen(false)} title="Ajouter une note">
        <form onSubmit={handleGradeSubmit} className="space-y-4">
            {classSubjects.length === 0 ? (
                 <div className="text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded text-sm border border-red-200 dark:border-red-500/30">
                    <p className="font-bold mb-1">Configuration manquante</p>
                    Aucune matière n'est configurée pour la classe <strong>{subjectKey}</strong>.
                 </div>
            ) : (
                <>
                    <div>
                        <Select 
                            label="Matière"
                            options={[{value: '', label: 'Choisir une matière...'}, ...classSubjects.map(s => ({ value: s.nom, label: s.nom }))]}
                            value={gradeForm.matiere}
                            onChange={handleMatiereChange}
                            required
                        />
                        {gradeForm.matiere && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-1">
                                Coefficient appliqué : <strong>{gradeForm.coefficient}</strong>
                            </p>
                        )}
                    </div>
                    
                    <Select 
                        label="Type d'évaluation"
                        options={isUniversity ? [
                            {value: 'dst', label: 'DST (Devoir sur Table)'},
                            {value: 'session', label: 'Session (Examen)'},
                        ] : [
                            {value: 'devoir', label: 'Devoir de classe'},
                            {value: 'departemental', label: 'Devoir Départemental'},
                            {value: 'composition', label: 'Composition'},
                        ]}
                        value={gradeForm.type}
                        onChange={e => setGradeForm({...gradeForm, type: e.target.value as any})}
                    />
                    
                    <Input 
                        type="number" label="Note obtenue (/20)" step="0.25" min="0" max="20" 
                        value={gradeForm.valeur}
                        onChange={e => setGradeForm({...gradeForm, valeur: parseFloat(e.target.value)})}
                        required
                    />
                    <div className="pt-4 flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={() => setIsGradeModalOpen(false)}>Annuler</Button>
                        <Button type="submit">Enregistrer</Button>
                    </div>
                </>
            )}
        </form>
      </Modal>

      {/* Bulletin Modal (Toujours en Light Mode pour l'impression) */}
      {isBulletinModalOpen && (
        <div className="fixed inset-0 z-[60] bg-gray-900/50 backdrop-blur-sm overflow-auto flex flex-col items-center py-8">
            <div className="w-full max-w-4xl px-4 mb-4 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
                 <h2 className="text-2xl font-bold text-white shadow-sm">Aperçu du Bulletin ({activeTrimestre})</h2>
                 <div className="flex gap-2">
                     <Button variant="secondary" onClick={() => setIsBulletinModalOpen(false)} icon={<i className="fas fa-times"></i>}>Fermer</Button>
                     <Button variant="success" onClick={handleDownloadPDF} icon={<i className="fas fa-file-pdf"></i>}>Télécharger PDF</Button>
                     <Button variant="primary" onClick={() => window.print()} icon={<i className="fas fa-print"></i>}>Imprimer</Button>
                 </div>
            </div>
            
            {/* Structure A4 (Force Light Theme) */}
            <div className="bg-white p-10 w-[210mm] min-h-[297mm] shadow-2xl bulletin-container text-black font-serif relative mx-auto my-0 light">
                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none overflow-hidden">
                    <h1 className="text-9xl font-bold transform -rotate-45 whitespace-nowrap">{settings.appName}</h1>
                </div>

                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-6 relative z-10">
                    <div className="flex items-start gap-5">
                        {settings.logo && <img src={settings.logo} className="h-24 w-24 object-contain" alt="Logo"/>}
                        <div>
                            <h1 className="text-3xl font-bold uppercase tracking-wide text-gray-900">{settings.appName}</h1>
                            {settings.bulletin?.customHeaderText && <p className="text-base font-semibold italic text-gray-700 mt-1">{settings.bulletin.customHeaderText}</p>}
                            <div className="mt-3 text-sm space-y-0.5 text-gray-600">
                                <p>Année Académique : <strong>{new Date().getFullYear()}-{new Date().getFullYear()+1}</strong></p>
                                <p>Période : <strong>{isUniversity ? `Semestre ${activeTrimestre.replace('S','')}` : `${activeTrimestre}${activeTrimestre === '1' ? 'er' : 'ème'} Trimestre`}</strong></p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-center">
                        <div id="qrcode-target" className="w-[90px] h-[90px] bg-white border border-gray-200 p-1 mb-1 flex items-center justify-center">
                            {qrCodeDataUrl ? (
                                <img src={qrCodeDataUrl} alt="QR Code" className="w-full h-full object-contain" />
                            ) : (
                                <span className="text-[10px] text-gray-400">Génération...</span>
                            )}
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Scan Vérification</span>
                    </div>
                </div>

                {/* Student Info Box */}
                <div className="relative z-10 bg-gray-50 border border-gray-300 p-4 rounded-lg mb-6 grid grid-cols-2 gap-8 shadow-sm">
                    <div className="space-y-2 text-sm">
                        <p className="flex justify-between border-b border-gray-200 pb-1"><span className="text-gray-500">Nom :</span> <span className="font-bold text-base">{student.nom.toUpperCase()}</span></p>
                        <p className="flex justify-between border-b border-gray-200 pb-1"><span className="text-gray-500">Prénom :</span> <span className="font-bold text-base">{student.prenom}</span></p>
                        <p className="flex justify-between"><span className="text-gray-500">Matricule :</span> <span className="font-medium font-mono">{student.id.substring(0,8).toUpperCase()}</span></p>
                    </div>
                    <div className="space-y-2 text-sm">
                        <p className="flex justify-between border-b border-gray-200 pb-1"><span className="text-gray-500">Classe :</span> <span className="font-bold text-base">{student.classe} {student.serie ? `(${student.serie})` : ''}</span></p>
                        <p className="flex justify-between border-b border-gray-200 pb-1"><span className="text-gray-500">Cycle :</span> <span className="font-medium">{student.cycle.toUpperCase().replace('_', ' ')}</span></p>
                        <p className="flex justify-between"><span className="text-gray-500">Date d'édition :</span> <span className="font-medium">{new Date().toLocaleDateString('fr-FR')}</span></p>
                    </div>
                </div>

                {/* Grades Table */}
                <div className="relative z-10 mb-6">
                    <table className="w-full border-collapse border border-black text-sm">
                        <thead>
                            <tr className="bg-gray-100 text-gray-800">
                                <th className="border border-black p-2 text-left">Matière</th>
                                {/* Colonnes dynamiques selon Université ou Standard */}
                                <th className="border border-black p-2 text-center w-20 leading-tight">
                                    {isUniversity ? <>Moy.<br/>DST</> : <>Moy.<br/>Classe</>}
                                </th>
                                <th className="border border-black p-2 text-center w-20 leading-tight">
                                    {isUniversity ? <>Note<br/>Session</> : <>Note<br/>Compo</>}
                                </th>
                                <th className="border border-black p-2 text-center w-20 leading-tight">
                                    {isUniversity ? <>Moy.<br/>Semestre</> : <>Moy.<br/>Trimestre</>}
                                </th>
                                <th className="border border-black p-2 text-center w-14">Coeff</th>
                                <th className="border border-black p-2 text-center w-20 bg-gray-200">Total</th>
                                {settings.bulletin?.showAppreciation && <th className="border border-black p-2 text-left">Appréciation</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {classSubjects.map((sub, index) => {
                                const { col1, col2, moyEleve } = calculateSubjectStats(student.id, sub.nom, activeTrimestre);
                                return (
                                    <tr key={sub.nom} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                                        <td className="border border-black p-2 pl-3 font-medium align-middle">
                                            {sub.nom}
                                            {settings.bulletin?.showTeacher && sub.teacher && (
                                                <div className="text-[10px] font-normal text-gray-500 italic mt-0.5">{sub.teacher}</div>
                                            )}
                                        </td>
                                        <td className="border border-black p-2 text-center align-middle text-gray-700">
                                            {col1 !== null ? col1.toFixed(2) : '-'}
                                        </td>
                                        <td className="border border-black p-2 text-center align-middle text-gray-700">
                                            {col2 !== null ? col2.toFixed(2) : '-'}
                                        </td>
                                        <td className="border border-black p-2 text-center align-middle font-bold text-base">
                                            {moyEleve !== null ? moyEleve.toFixed(2) : '-'}
                                        </td>
                                        <td className="border border-black p-2 text-center align-middle">{sub.coefficient}</td>
                                        <td className="border border-black p-2 text-center align-middle bg-gray-50 font-medium">
                                            {moyEleve !== null ? (moyEleve * sub.coefficient).toFixed(2) : '-'}
                                        </td>
                                        {settings.bulletin?.showAppreciation && (
                                            <td className="border border-black p-2 pl-3 align-middle italic text-xs text-gray-600">
                                                {getAppreciation(moyEleve)}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            {/* Row 1: Totals */}
                            <tr className="bg-white">
                                <td className="border border-black p-2 text-right font-bold uppercase text-xs" colSpan={4}>
                                    Totaux
                                </td>
                                <td className="border border-black p-2 text-center font-bold text-base">{activeStats.totalCoeffs}</td>
                                <td className="border border-black p-2 text-center font-bold text-base">{activeStats.totalPoints.toFixed(2)}</td>
                                {settings.bulletin?.showAppreciation && <td className="border border-black bg-gray-100"></td>}
                            </tr>
                            
                            {/* Row 2: General Average & RANK */}
                            <tr className="bg-gray-800 text-white print:bg-gray-200 print:text-black">
                                <td className="border border-black p-3 text-right font-bold uppercase text-sm" colSpan={4}>
                                    Moyenne Générale
                                </td>
                                <td className="border border-black p-3 text-center font-bold text-xl" colSpan={2 + (settings.bulletin?.showAppreciation ? 1 : 0)}>
                                    <div className="flex justify-between items-center px-4">
                                        <div className="text-2xl">
                                            {activeStats.average !== null ? activeStats.average.toFixed(2) + ' / 20' : '-'}
                                        </div>
                                        {activeStats.average !== null && (
                                            <div className="text-base border-l border-gray-500 pl-4 ml-2">
                                                Rang : <strong>{formatRank(currentRank.rank)}</strong> <span className="text-sm opacity-70">/ {currentRank.total}</span>
                                            </div>
                                        )}
                                    </div>
                                    {activeStats.average !== null && (
                                        <div className="text-[10px] font-normal mt-1 opacity-80 uppercase tracking-widest text-center">
                                            {getAppreciation(activeStats.average)}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* --- BLOC SPÉCIFIQUE FIN D'ANNÉE : BILAN ANNUEL --- */}
                {((!isUniversity && activeTrimestre === '3') || (isUniversity && activeTrimestre === 'S2')) && (
                    <div className="relative z-10 mb-6 border-2 border-gray-800 rounded-lg overflow-hidden">
                        <div className="bg-gray-800 text-white text-center py-2 font-bold uppercase tracking-widest text-sm">Bilan Annuel</div>
                        <div className={`grid ${isUniversity ? 'grid-cols-3' : 'grid-cols-4'} divide-x divide-gray-300 bg-gray-50`}>
                            {!isUniversity ? (
                                // Standard: 3 Trimestres
                                <>
                                    <div className="p-3 text-center">
                                        <div className="text-xs text-gray-500 uppercase">Trimestre 1</div>
                                        <div className="font-bold text-lg">{annualStats['1'] !== null && annualStats['1'] !== undefined ? annualStats['1'].toFixed(2) : '-'}</div>
                                    </div>
                                    <div className="p-3 text-center">
                                        <div className="text-xs text-gray-500 uppercase">Trimestre 2</div>
                                        <div className="font-bold text-lg">{annualStats['2'] !== null && annualStats['2'] !== undefined ? annualStats['2'].toFixed(2) : '-'}</div>
                                    </div>
                                    <div className="p-3 text-center">
                                        <div className="text-xs text-gray-500 uppercase">Trimestre 3</div>
                                        <div className="font-bold text-lg">{annualStats['3'] !== null && annualStats['3'] !== undefined ? annualStats['3'].toFixed(2) : '-'}</div>
                                    </div>
                                </>
                            ) : (
                                // Université: 2 Semestres
                                <>
                                    <div className="p-3 text-center">
                                        <div className="text-xs text-gray-500 uppercase">Semestre 1</div>
                                        <div className="font-bold text-lg">{annualStats['S1'] !== null && annualStats['S1'] !== undefined ? annualStats['S1'].toFixed(2) : '-'}</div>
                                    </div>
                                    <div className="p-3 text-center">
                                        <div className="text-xs text-gray-500 uppercase">Semestre 2</div>
                                        <div className="font-bold text-lg">{annualStats['S2'] !== null && annualStats['S2'] !== undefined ? annualStats['S2'].toFixed(2) : '-'}</div>
                                    </div>
                                </>
                            )}
                            
                            <div className="p-3 text-center bg-gray-200">
                                <div className="text-xs text-gray-600 uppercase font-bold">Moyenne Annuelle</div>
                                <div className={`font-bold text-xl ${annualStats.annualAverage && annualStats.annualAverage >= 10 ? 'text-green-700' : 'text-red-700'}`}>
                                    {annualStats.annualAverage !== null ? annualStats.annualAverage.toFixed(2) : '-'}
                                </div>
                                {annualStats.annualAverage !== null && (
                                    <div className="text-xs font-bold text-gray-600 mt-1">
                                        Rang : {formatRank(annualRank.rank)} / {annualRank.total}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Section - Signatures */}
                <div className="relative z-10 grid grid-cols-2 gap-16 mt-4">
                    {/* Decision Box */}
                    <div className="p-4 h-36 flex flex-col border border-gray-300 rounded">
                        <h4 className="font-bold underline text-lg mb-4 text-gray-800">Décision du conseil</h4>
                        <div className="flex-1 italic text-gray-900 leading-relaxed font-medium">
                            {getCouncilDecision()}
                            {/* Petit rappel du rang ici aussi */}
                            <div className="mt-2 text-sm not-italic">
                                Rang de l'élève : <strong>{formatRank(currentRank.rank)}</strong> sur {currentRank.total} élèves.
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 border-t pt-1">Observations : ________________________</p>
                    </div>

                    {/* Director Signature Box */}
                    <div className="p-4 h-36 flex flex-col text-center items-center border border-gray-300 rounded">
                        <h4 className="font-bold underline text-lg mb-8 text-gray-800">Le Directeur</h4>
                        <div className="w-full flex-1">
                            <p className="text-xs italic text-gray-400 mt-auto">(Signature et Cachet)</p>
                        </div>
                    </div>
                </div>
                
                {/* Bottom Watermark / Info */}
                <div className="absolute bottom-4 left-0 w-full text-center">
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest">Document généré par PR-SCL - Système de Gestion Scolaire</p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
