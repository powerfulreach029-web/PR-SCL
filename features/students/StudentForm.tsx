
import React, { useState, useEffect } from 'react';
import { Card, Input, Select, Button } from '../../components/ui/Common';
import { useSchool } from '../../App';
import { Student, Cycle } from '../../types';

interface StudentFormProps {
  onSuccess?: () => void;
  initialData?: Student; // Données pour l'édition
  onCancel?: () => void; // Pour annuler l'édition
}

export const StudentForm: React.FC<StudentFormProps> = ({ onSuccess, initialData, onCancel }) => {
  const { cycles, addStudent, updateStudent } = useSchool();
  
  // Initialisation de l'état
  const [formData, setFormData] = useState<Partial<Student>>({
    genre: 'Masculin',
    dateInscription: new Date().toLocaleDateString('fr-FR')
  });
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Effet pour charger les données initiales si on est en mode édition
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      if (initialData.photo) {
        setSelectedFile(initialData.photo);
      }
    }
  }, [initialData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSelectedFile(ev.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Reset dependent fields when cycle changes
  useEffect(() => {
    if (formData.cycle && (!initialData || formData.cycle !== initialData.cycle)) {
      const isInitialLoad = initialData && formData.cycle === initialData.cycle;
      if (!isInitialLoad) {
          setFormData(prev => ({ ...prev, classe: '', serie: '' }));
      }
    }
  }, [formData.cycle]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom || !formData.prenom || !formData.classe || !formData.cycle) {
      alert("Veuillez remplir les champs obligatoires");
      return;
    }

    const studentToSave: Student = {
      id: initialData ? initialData.id : Date.now().toString(),
      nom: formData.nom,
      prenom: formData.prenom,
      dateNaissance: formData.dateNaissance || '',
      genre: formData.genre || 'Masculin',
      adresse: formData.adresse || '',
      ville: formData.ville || '',
      telephone: formData.telephone || '',
      email: formData.email,
      cycle: formData.cycle,
      classe: formData.classe,
      serie: formData.serie,
      photo: selectedFile || undefined,
      notes_info: formData.notes_info,
      dateInscription: formData.dateInscription || new Date().toLocaleDateString('fr-FR')
    };

    if (initialData) {
      updateStudent(studentToSave);
      alert("Informations de l'élève modifiées avec succès !");
    } else {
      addStudent(studentToSave);
      alert("Élève ajouté avec succès !");
    }

    if (onSuccess) {
      onSuccess();
    } else if (!initialData) {
      // Reset form only if adding new
      setFormData({
        genre: 'Masculin',
        dateInscription: new Date().toLocaleDateString('fr-FR')
      });
      setSelectedFile(null);
    }
  };

  const activeCycle = formData.cycle ? cycles[formData.cycle] : null;
  const isEditing = !!initialData;

  return (
    <Card title={isEditing ? "Modifier les informations" : "Inscription d'un élève"} className="animate-fade-in">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input name="nom" label="Nom *" value={formData.nom || ''} onChange={handleChange} required />
          <Input name="prenom" label="Prénom *" value={formData.prenom || ''} onChange={handleChange} required />
          <Input type="date" name="dateNaissance" label="Date de naissance *" value={formData.dateNaissance || ''} onChange={handleChange} required />
          <Select 
            name="genre" 
            label="Genre *" 
            options={[{ value: 'Masculin', label: 'Masculin' }, { value: 'Féminin', label: 'Féminin' }]} 
            value={formData.genre} 
            onChange={handleChange} 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input name="adresse" label="Adresse" value={formData.adresse || ''} onChange={handleChange} />
          <Input name="ville" label="Ville" value={formData.ville || ''} onChange={handleChange} />
          <Input type="tel" name="telephone" label="Téléphone" value={formData.telephone || ''} onChange={handleChange} />
          <Input type="email" name="email" label="Email" value={formData.email || ''} onChange={handleChange} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Select 
            name="cycle" 
            label="Cycle *" 
            options={[
              { value: '', label: 'Sélectionnez...' },
              ...Object.values(cycles).map((c: Cycle) => ({ value: c.id, label: c.name }))
            ]}
            value={formData.cycle || ''}
            onChange={handleChange}
            required
          />
          
          <Select 
            name="classe" 
            label="Classe/Niveau *" 
            options={[
              { value: '', label: 'Sélectionnez...' },
              ...(activeCycle ? activeCycle.levels.map(c => ({ value: c, label: c })) : [])
            ]}
            value={formData.classe || ''}
            onChange={handleChange}
            disabled={!activeCycle}
            required
          />

          {(activeCycle?.type === 'series' || activeCycle?.type === 'specialites') && (
            <Select 
              name="serie" 
              label={activeCycle.type === 'series' ? "Série" : "Spécialité"} 
              options={[
                { value: '', label: 'Aucune' },
                ...(activeCycle.type === 'series' ? activeCycle.series : activeCycle.specialites).map(s => ({ value: s, label: s }))
              ]}
              value={formData.serie || ''}
              onChange={handleChange}
            />
          )}
        </div>

        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-gray-50 dark:bg-gray-700/50 transition-colors">
          {selectedFile ? (
            <div className="text-center">
              <img src={selectedFile} alt="Preview" className="w-32 h-32 object-cover rounded-full mx-auto mb-4 border-4 border-white dark:border-gray-600 shadow-md" />
              <Button type="button" variant="secondary" size="sm" onClick={() => setSelectedFile(null)}>Supprimer la photo</Button>
            </div>
          ) : (
            <div className="text-center">
               <i className="fas fa-camera text-4xl text-gray-400 mb-2"></i>
               <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Ajouter une photo</p>
               <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-[var(--primary-color)] hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-white dark:text-gray-400"/>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 gap-3">
           {isEditing && <Button type="button" variant="secondary" onClick={onCancel}>Annuler</Button>}
           <Button type="submit" variant="primary" icon={<i className="fas fa-save"></i>}>
             {isEditing ? "Enregistrer les modifications" : "Enregistrer l'élève"}
           </Button>
        </div>
      </form>
    </Card>
  );
};
