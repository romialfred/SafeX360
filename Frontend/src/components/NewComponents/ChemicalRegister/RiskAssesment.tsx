import React from 'react';
import RiskAssessmentForm from "./RiskAssessmentForm";
import RiskAssessmentGuide from "./RiskAssessmentGuide";

interface RiskAssessmentTabProps {
    onCancel: () => void;
    assessments: any[];
    fetchAssessments: () => void;
}

const RiskAssesment: React.FC<RiskAssessmentTabProps> = ({ onCancel, assessments, fetchAssessments }) => {
    return (
        <div className="flex flex-col lg:flex-row lg:items-stretch lg:gap-6 lg:min-h-0">
            <div className="flex-1">
                <RiskAssessmentForm
                    onCancel={onCancel}
                    assessments={assessments}
                    fetchAssessments={fetchAssessments}
                />
            </div>
            <RiskAssessmentGuide />
        </div>
    );
};

export default RiskAssesment;
