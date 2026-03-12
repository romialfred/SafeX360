import React from 'react';
import {
    IconCalculator,
    IconCircleCheck,
    IconFileText,
    IconShield,
} from "@tabler/icons-react";
import GuideSidebar, { GuideSection } from "./GuideSidebar";

const guideSections: GuideSection[] = [
    {
        title: 'Assessment Field Tips',
        icon: IconFileText,
        color: 'text-blue-600',
        accentClasses: 'bg-blue-50 border-blue-200',
        tips: [
            'Explain the trigger in "Reason for Reassessment" (incident, audit finding, change in process, etc.).',
            'Gravity reflects the severity of harm. Use SDS guidance to justify your choice.',
            'Probability represents the likelihood of exposure. Base the selection on frequency and controls.',
            'Severity is calculated automatically from probability and gravity to avoid manual errors.'
        ],
    },
    {
        title: 'Scoring Guidance',
        icon: IconCalculator,
        color: 'text-orange-600',
        accentClasses: 'bg-orange-50 border-orange-200',
        tips: [
            'Risk Level is generated from the Probability × Gravity combination.',
            'Capture data or references that support your scoring decisions in the comments.',
            'Reassess whenever the chemical, process, or exposure frequency changes significantly.'
        ],
    },
    {
        title: 'Control Documentation',
        icon: IconShield,
        color: 'text-green-600',
        accentClasses: 'bg-green-50 border-green-200',
        tips: [
            'List existing controls such as engineering measures, PPE, and monitoring programmes.',
            'Proposed controls should be specific, actionable, and assigned to an owner with a due date.',
            'Preventive and improvement measures capture how you will reduce exposure or enhance resilience.'
        ],
    },
    {
        title: 'Submission Tips',
        icon: IconCircleCheck,
        color: 'text-indigo-600',
        accentClasses: 'bg-indigo-50 border-indigo-200',
        tips: [
            'Use the comments field to highlight approvals, outstanding actions, or follow-up requirements.',
            'Select "Save as Draft" if information is incomplete; submit once the assessment is ready for review.'
        ],
    },
];

interface RiskAssessmentGuideProps {
    className?: string;
}

const RiskAssessmentGuide: React.FC<RiskAssessmentGuideProps> = ({ className }) => {
    return <GuideSidebar sections={guideSections} className={className} />;
};

export default RiskAssessmentGuide;
