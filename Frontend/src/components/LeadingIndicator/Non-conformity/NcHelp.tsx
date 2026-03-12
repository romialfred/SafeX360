import { IconHelpCircle } from '@tabler/icons-react'

type GuideSection = { title: string; description: string; color: string; bullets?: string[] };
type Guide = { title: string; sections: GuideSection[] };

const fieldGuideContent: { declaration: Guide; analysis: Guide; treatment: Guide; closure: Guide } = {
  declaration: {
    title: 'Event Declaration Guide',
    sections: [
      { title: 'Event Number', description: 'Unique identifier automatically generated for tracking and reference purposes', color: 'bg-blue-50 border-blue-200' },
      { title: 'Event Type', description: '', bullets: [
        'Non-conformity: Deviation from standards, procedures, or requirements that occurred.',
        'Near Miss: Potential incident avoided.',
        'Hazard Condition: Unsafe situation requiring attention.'
      ], color: 'bg-indigo-50 border-indigo-200' },
      { title: 'Event Title', description: "Concise, descriptive title that summarizes the nature of the event (e.g., 'Chemical spill in warehouse', 'Fall from ladder')", color: 'bg-green-50 border-green-200' },
      { title: 'Event Date and Time', description: 'Exact date and time when the event actually occurred (not when it was discovered)', color: 'bg-orange-50 border-orange-200' },
      { title: 'Detection Date and Time', description: 'Date and time when the event was first discovered, noticed, or reported (may be different from occurrence date)', color: 'bg-purple-50 border-purple-200' },
      { title: 'Reported By', description: 'Full name of the person who first reported or declared this event to management', color: 'bg-teal-50 border-teal-200' },
      { title: 'Event Category', description: 'Primary classification based on the main area of impact: Safety (injuries, accidents), Environmental (spills, emissions), Quality (defects, non-compliance), Security (theft, unauthorized access)', color: 'bg-red-50 border-red-200' },
      { title: 'Event Location', description: 'Specific physical location where the event occurred (building, room, area, equipment)', color: 'bg-blue-50 border-blue-200' },
      { title: 'Work Process', description: 'The specific work activity or process that was being performed when the event occurred', color: 'bg-violet-50 border-violet-200' },
      { title: 'Description', description: 'Detailed factual description of what happened, including sequence of events, conditions present, and any immediate consequences', color: 'bg-yellow-50 border-yellow-200' },
    ],
  },
  analysis: {
    title: 'Root Cause Analysis Guide',
    sections: [
      { title: 'Analysis Team', description: 'Select employees who will participate in the root cause analysis. Assign specific roles: Lead Investigator, Subject Matter Expert, Witness, Reviewer', color: 'bg-blue-50 border-blue-200' },
      { title: 'Analysis Dates & Priority', description: 'Start Date, Deadline, and Priority based on severity and impact', color: 'bg-green-50 border-green-200' },
      { title: 'Severity & Processing Status', description: 'Severity Level and current investigation stage', color: 'bg-orange-50 border-orange-200' },
      { title: 'ICAM Analysis Method', description: 'Systematic approach examining organizational, individual, and technical factors', color: 'bg-purple-50 border-purple-200' },
      { title: 'Contributing Factors', description: 'Individual, Technical, and Organizational factors to consider', color: 'bg-yellow-50 border-yellow-200' },
      { title: 'Root Causes & Summary', description: 'Document root causes and a structured summary of contributing factors', color: 'bg-indigo-50 border-indigo-200' },
      { title: 'Analysis Conclusions', description: 'Final conclusions with recommendations and lessons learned', color: 'bg-teal-50 border-teal-200' },
    ],
  },
  treatment: {
    title: 'Treatment & Actions Guide',
    sections: [
      { title: 'Corrective Actions', description: 'Specific actions that directly address identified root causes', color: 'bg-blue-50 border-blue-200' },
      { title: 'Responsible Person', description: 'Person accountable for implementing the actions', color: 'bg-green-50 border-green-200' },
      { title: 'Target Date', description: 'Realistic deadline based on complexity and urgency', color: 'bg-orange-50 border-orange-200' },
      { title: 'Implementation Status', description: 'Not Started, In Progress, Completed, or On Hold', color: 'bg-purple-50 border-purple-200' },
    ],
  },
  closure: {
    title: 'Closure & Distribution Guide',
    sections: [
      { title: 'Final Closure', description: 'Closing Date and Final Status (Closed, Cancelled, Transferred)', color: 'bg-blue-50 border-blue-200' },
      { title: 'Treatment Effectiveness', description: 'Assessment of corrective action success: Excellent, Good, Fair, Poor', color: 'bg-green-50 border-green-200' },
      { title: 'Risk Assessment', description: 'Risk of Recurrence and overall Efficiency Score', color: 'bg-orange-50 border-orange-200' },
      { title: 'Follow-up Planning', description: 'Next Check date and Feedback for lessons learned', color: 'bg-purple-50 border-purple-200' },
      { title: 'Validation', description: 'Validated By and Validation Date confirming effectiveness', color: 'bg-teal-50 border-teal-200' },
    ],
  },
};

const NcHelp = ({ activeStep }: { activeStep: number }) => {
  const guide = activeStep === 0
    ? fieldGuideContent.declaration
    : activeStep === 1
    ? fieldGuideContent.analysis
    : activeStep === 2
    ? fieldGuideContent.treatment
    : fieldGuideContent.closure;

  return (
    <div>
      <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
        <div className="flex items-center space-x-2 mb-6 text-blue-600">
          <IconHelpCircle className="text-blue-600" size={20} />
          <h3 className="text-lg font-semibold">{guide.title}</h3>
        </div>

        <div className="space-y-4">
          {guide.sections.map((section, idx) => (
            <div key={idx} className={`p-4 rounded-lg border ${section.color}`}>
              <h4 className="font-medium text-gray-800 mb-1">{section.title}</h4>
              {Array.isArray(section.bullets) && section.bullets.length > 0 ? (
                <ul className="text-sm text-gray-600 list-disc ml-5 space-y-1">
                  {section.bullets.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600">{section.description}</p>
              )}
            </div>
          ))}
        </div>

        {activeStep === 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Quick Tips</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Be specific and factual in descriptions</li>
              <li>• Include all relevant details</li>
              <li>• Use clear, professional language</li>
              <li>• Attach supporting documentation</li>
            </ul>
          </div>
        )}

        {activeStep === 1 && (
          <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h4 className="font-medium text-orange-800 mb-2">ICAM Analysis Tips</h4>
            <ul className="text-sm text-orange-700 space-y-1">
              <li>• Focus on facts, not blame</li>
              <li>• Consider all three factor types</li>
              <li>• Look for systemic issues</li>
              <li>• Document evidence clearly</li>
              <li>• Involve relevant stakeholders</li>
            </ul>
          </div>
        )}

        {activeStep === 2 && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Action Guidelines</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Actions should address root causes</li>
              <li>• Set realistic and achievable timelines</li>
              <li>• Assign clear responsibilities</li>
              <li>• Include monitoring mechanisms</li>
            </ul>
          </div>
        )}

        {activeStep === 3 && (
          <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="font-medium text-purple-800 mb-2">Closure Checklist</h4>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• All actions completed successfully</li>
              <li>• Effectiveness verified</li>
              <li>• Lessons learned documented</li>
              <li>• Follow-up schedule established</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default NcHelp
