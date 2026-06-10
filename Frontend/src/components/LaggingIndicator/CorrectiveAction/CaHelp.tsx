import { IconHelpCircle } from '@tabler/icons-react';

type GuideSection = { title: string; description: string; color: string };
type Guide = { title: string; sections: GuideSection[] };

const guideContent: Guide = {
  title: "Guide du plan d'action",
  sections: [
    {
      title: "Intitulé de l'action",
      description: 'Amélioration claire et précise à mettre en œuvre.',
      color: 'bg-blue-50 border-blue-200',
    },
    {
      title: 'Responsable',
      description: "Personne chargée de mener l'action à son terme.",
      color: 'bg-indigo-50 border-indigo-200',
    },
    {
      title: 'Description',
      description: 'Périmètre, résultat attendu, étapes clés.',
      color: 'bg-green-50 border-green-200',
    },
    {
      title: 'Échéance',
      description: 'Date de réalisation réaliste, tenant compte des dépendances.',
      color: 'bg-orange-50 border-orange-200',
    },
  ],
};

const CaHelp = () => {
  const guide = guideContent;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
      <div className="flex items-center space-x-2 mb-4 text-teal-700">
        <IconHelpCircle className="text-teal-700" size={18} aria-hidden="true" />
        <h3
          className="text-slate-800"
          style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '14.5px', fontWeight: 600 }}
        >
          {guide.title}
        </h3>
      </div>

      <div className="space-y-3">
        {guide.sections.map((section, idx) => (
          <div key={idx} className={`p-3 rounded-lg border ${section.color}`}>
            <h4 className="text-slate-800 mb-1 text-[13px]">{section.title}</h4>
            <p className="text-[12px] text-slate-600">{section.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-lg">
        <h4 className="text-teal-800 mb-1 text-[13px]">Conseils</h4>
        <ul className="text-[12px] text-teal-700 space-y-1 list-disc list-inside">
          <li>Utilisez des verbes d'action</li>
          <li>Définissez des critères de réussite</li>
          <li>Validez le responsable et les appuis nécessaires</li>
          <li>Choisissez une échéance atteignable</li>
        </ul>
      </div>
    </div>
  );
};

export default CaHelp;
