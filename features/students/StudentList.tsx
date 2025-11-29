
import React, { useState } from 'react';
import { Card, Button, Input, Modal } from '../../components/ui/Common';
import { useSchool } from '../../App';
import { Student, Cycle } from '../../types';
import { StudentDetails } from './StudentDetails';
import { StudentForm } from './StudentForm';

export const StudentList: React.FC = () => {
  const { students, cycles, deleteStudent } = useSchool();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCycle, setSelectedCycle] = useState<string>('all');
  
  // States pour la navigation
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Filter Logic
  const filteredStudents = students.filter(student => {
    const matchesSearch = (student.nom + ' ' + student.prenom).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCycle = selectedCycle === 'all' || student.cycle === selectedCycle;
    return matchesSearch && matchesCycle;
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`ATTENTION : Êtes-vous sûr de vouloir supprimer définitivement l'élève ${name} ?\n\nCette action supprimera également toutes ses notes et son historique. Cette action est irréversible.`)) {
      deleteStudent(id);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
  };

  if (selectedStudentId) {
    const student = students.find(s => s.id === selectedStudentId);
    if (student) {
      return <StudentDetails student={student} onBack={() => setSelectedStudentId(null)} />;
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto">
            <Button 
              variant={selectedCycle === 'all' ? 'primary' : 'secondary'} 
              size="sm"
              onClick={() => setSelectedCycle('all')}
            >
              Tous
            </Button>
            {Object.values(cycles).map((cycle: Cycle) => (
              <Button
                key={cycle.id}
                variant={selectedCycle === cycle.id ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setSelectedCycle(cycle.id)}
              >
                {cycle.name}
              </Button>
            ))}
          </div>
          <div className="w-full md:w-64">
             <Input 
               placeholder="Rechercher..." 
               value={searchTerm} 
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-300">
            <i className="fas fa-search text-4xl mb-3 text-gray-300 dark:text-gray-500"></i>
            <p>Aucun élève trouvé.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border rounded-lg dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Élève</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Classe</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-gray-700">
                {filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img className="h-10 w-10 rounded-full object-cover border dark:border-gray-500" src={student.photo || 'https://picsum.photos/100/100'} alt="" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{student.nom} {student.prenom}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{student.genre}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-200">{student.classe}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {cycles[student.cycle]?.name} 
                        {student.serie ? ` (${student.serie})` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-200">{student.telephone}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{student.ville}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Button size="sm" variant="secondary" onClick={() => setSelectedStudentId(student.id)} title="Voir détails / Bulletin">
                        <i className="fas fa-eye"></i>
                      </Button>
                      <Button size="sm" variant="warning" onClick={() => handleEdit(student)} title="Modifier les informations">
                        <i className="fas fa-pen"></i>
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(student.id, student.nom)} title="Supprimer définitivement">
                        <i className="fas fa-trash"></i>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal d'édition */}
      {editingStudent && (
        <Modal isOpen={!!editingStudent} onClose={() => setEditingStudent(null)} title="Modification de l'élève" maxWidth="max-w-4xl">
          <StudentForm 
            initialData={editingStudent} 
            onSuccess={() => setEditingStudent(null)} 
            onCancel={() => setEditingStudent(null)}
          />
        </Modal>
      )}
    </div>
  );
};
