import { IconHelpCircle } from '@tabler/icons-react'

type GuideSection = { title: string; description: string; color: string };
type Guide = { title: string; sections: GuideSection[] };

const guideContent: Guide = {
  title: 'Improvement Action Guide',
  sections: [
    {
      title: 'Action Title',
      description: 'Clear, specific improvement to implement.',
      color: 'bg-blue-50 border-blue-200',
    },
    {
      title: 'Assigned To',
      description: 'Owner responsible for completing the action.',
      color: 'bg-indigo-50 border-indigo-200',
    },
    {
      title: 'Description',
      description: 'Scope, expected outcome, key steps.',
      color: 'bg-green-50 border-green-200',
    },
    {
      title: 'Due Date',
      description: 'Realistic completion date; consider dependencies.',
      color: 'bg-orange-50 border-orange-200',
    },
  ],
};

const CaHelp = () => {
  const guide = guideContent;

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 border border-slate-200">
      <div className="flex items-center space-x-2 mb-4 text-blue-600">
        <IconHelpCircle className="text-blue-600" size={18} />
        <h3 className="text-base font-semibold">{guide.title}</h3>
      </div>

      <div className="space-y-3">
        {guide.sections.map((section, idx) => (
          <div key={idx} className={`p-3 rounded-lg border ${section.color}`}>
            <h4 className="font-medium text-gray-800 mb-1 text-sm">{section.title}</h4>
            <p className="text-xs text-gray-600">{section.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-1 text-sm">Tips</h4>
        <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
          <li>Use action verbs</li>
          <li>Define success criteria</li>
          <li>Confirm owner and support</li>
          <li>Choose a feasible due date</li>
        </ul>
      </div>
    </div>
  );
};

export default CaHelp;
