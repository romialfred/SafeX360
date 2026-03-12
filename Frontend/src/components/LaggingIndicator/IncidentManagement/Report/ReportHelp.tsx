import { IconHelpCircle } from '@tabler/icons-react'

const ReportHelp = ({ activeStep }: any) => {
    return (
        <div className="">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
                {activeStep === 0 ? (
                    <>
                        <div className="flex items-center space-x-2 mb-6">
                            <IconHelpCircle className="text-blue-500" size={24} />
                            <h3 className="text-xl font-bold text-blue-600">Incident Reporting Guide</h3>
                        </div>

                        {/* Field Explanations */}
                        <div className="mb-6">
                            <div className="space-y-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-blue-800 mb-2">Incident Number</h4>
                                    <p className="text-sm text-blue-700">Unique identifier generated automatically</p>
                                </div>

                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-green-800 mb-2">Incident Title</h4>
                                    <p className="text-sm text-green-700">Short text that best describes the incident</p>
                                </div>

                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-orange-800 mb-2">Incident Date and Time</h4>
                                    <p className="text-sm text-orange-700">Exact date and time of occurrence</p>
                                </div>

                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-purple-800 mb-2">Discovery Date and Time</h4>
                                    <p className="text-sm text-purple-700">When the incident was discovered or reported</p>
                                </div>
                            </div>
                        </div>

                        {/* PPE and Classification Guide */}
                        <div className="mb-6">
                            <div className="space-y-4">
                                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-teal-800 mb-2">Personal Protective Equipment</h4>
                                    <p className="text-sm text-teal-700">Equipment used or that should have been used</p>
                                </div>

                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-red-800 mb-2">Incident Category</h4>
                                    <p className="text-sm text-red-700">Classification by impact area</p>
                                </div>
                            </div>
                        </div>

                        {/* Location Context Guide */}
                        <div className="mb-6">
                            <div className="space-y-4">
                                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-indigo-800 mb-2">Incident Location</h4>
                                    <p className="text-sm text-indigo-700">Specific physical location of the incident</p>
                                </div>

                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-yellow-800 mb-2">Department & Work Area</h4>
                                    <p className="text-sm text-yellow-700">Organizational unit and work area</p>
                                </div>

                                <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-pink-800 mb-2">Work Process</h4>
                                    <p className="text-sm text-pink-700">Activity in progress during the incident</p>
                                </div>

                                <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-cyan-800 mb-2">Environmental Conditions</h4>
                                    <p className="text-sm text-cyan-700">Contributing physical conditions</p>
                                </div>
                            </div>
                        </div>
                    </>
                ) : activeStep === 2 ? (
                    <>
                        <div className="flex items-center space-x-2 mb-6">
                            <IconHelpCircle className="text-blue-500" size={24} />
                            <h3 className="text-xl font-bold text-blue-600">Incident Analysis Guide</h3>
                        </div>

                        {/* Step 3 Field Explanations */}
                        <div className="mb-6">
                            <div className="space-y-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-blue-800 mb-2">Factual Description</h4>
                                    <p className="text-sm text-blue-700">Objective account of what happened</p>
                                </div>

                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-green-800 mb-2">Immediate Causes</h4>
                                    <p className="text-sm text-green-700">Direct factors that triggered the incident</p>
                                </div>

                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-orange-800 mb-2">Root Causes</h4>
                                    <p className="text-sm text-orange-700">Underlying systemic issues</p>
                                </div>

                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-purple-800 mb-2">Contributing Factors</h4>
                                    <p className="text-sm text-purple-700">Additional elements that influenced the incident</p>
                                </div>

                                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-teal-800 mb-2">Immediate Consequences</h4>
                                    <p className="text-sm text-teal-700">Direct results of the incident</p>
                                </div>

                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-red-800 mb-2">Potential Consequences</h4>
                                    <p className="text-sm text-red-700">What could have happened</p>
                                </div>

                                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-indigo-800 mb-2">Immediate Actions Taken</h4>
                                    <p className="text-sm text-indigo-700">Response actions implemented</p>
                                </div>
                            </div>
                        </div>

                        {/* Rich Text Editor Guide */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-800 mb-2">Rich Text Editor</h4>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p>• H: Header formatting</p>
                                <p>• B: Bold text</p>
                                <p>• I: Italic text</p>
                                <p>• U: Underline text</p>
                                <p>• S: Strikethrough text</p>
                                <p>• •: Bullet list</p>
                                <p>• 1.: Numbered list</p>
                            </div>
                        </div>
                    </>
                ) : activeStep === 3 ? (
                    <>
                        <div className="flex items-center space-x-2 mb-6">
                            <IconHelpCircle className="text-blue-500" size={24} />
                            <h3 className="text-xl font-bold text-blue-600">Risk Assessment Guide</h3>
                        </div>

                        {/* Field Explanations */}
                        <div className="mb-6">
                            <div className="space-y-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-blue-800 mb-2">Probability (1–5)</h4>
                                    <p className="text-sm text-blue-700">Likelihood of occurrence based on frequency/history</p>
                                    <div className="text-xs text-blue-700 mt-1 space-y-0.5 leading-tight">
                                        <p>• 1: Very unlikely</p>
                                        <p>• 2: Unlikely</p>
                                        <p>• 3: Possible</p>
                                        <p>• 4: Likely</p>
                                        <p>• 5: Very likely</p>
                                    </div>
                                </div>

                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-green-800 mb-2">Severity (1–5)</h4>
                                    <p className="text-sm text-green-700">Potential consequence level of the event</p>
                                    <div className="text-xs text-green-700 mt-1 space-y-0.5 leading-tight">
                                        <p>• 1: Negligible</p>
                                        <p>• 2: Minor</p>
                                        <p>• 3: Moderate</p>
                                        <p>• 4: Major</p>
                                        <p>• 5: Catastrophic</p>
                                    </div>
                                </div>

                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-orange-800 mb-2">Risk Level</h4>
                                    <p className="text-sm text-orange-700">Auto-derived from selected severity for quick indication</p>
                                    <div className="text-xs text-orange-700 mt-1 space-y-0.5 leading-tight">
                                        <p>• Severity 1–2 → Low</p>
                                        <p>• Severity 3–4 → Medium</p>
                                        <p>• Severity 5 → High</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Controls & Residual Risk */}
                        <div className="mb-6">
                            <div className="space-y-4">
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-purple-800 mb-2">Existing Control Measures</h4>
                                    <p className="text-sm text-purple-700">List current preventive/protective measures (engineering, administrative, PPE) already in place.</p>
                                </div>

                                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-teal-800 mb-2">Residual Risk Assessment</h4>
                                    <p className="text-sm text-teal-700">Describe remaining risk after existing controls and note if additional actions are required.</p>
                                </div>
                            </div>
                        </div>

                        {/* Editor Tips */}
                        {/* <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-800 mb-2">Rich Text Editor</h4>
                            <div className="text-xs text-gray-600 space-y-0.5 leading-tight">
                                <p>• H: Header formatting</p>
                                <p>• B: Bold text</p>
                                <p>• I: Italic text</p>
                                <p>• U: Underline text</p>
                                <p>• S: Strikethrough text</p>
                                <p>• •: Bullet list</p>
                                <p>• 1.: Numbered list</p>
                            </div>
                        </div> */}
                    </>
                ) : (
                    <>
                        <div className="flex items-center space-x-2 mb-6">
                            <IconHelpCircle className="text-blue-500" size={24} />
                            <h3 className="text-xl font-bold text-blue-600">Witnesses & Persons Guide</h3>
                        </div>

                        {/* Step 2 Field Explanations */}
                        <div className="mb-6">
                            <div className="space-y-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-blue-800 mb-2">Reporter</h4>
                                    <p className="text-sm text-blue-700">Person who reports the incident</p>
                                </div>

                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-green-800 mb-2">Employees</h4>
                                    <p className="text-sm text-green-700">Complete list of available employees</p>
                                </div>

                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-orange-800 mb-2">Witnesses</h4>
                                    <p className="text-sm text-orange-700">People who witnessed the incident occur</p>
                                </div>

                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                    <h4 className="font-medium text-purple-800 mb-2">Action plan</h4>
                                    <p className="text-sm text-purple-600">
                                        Définir les actions correctives et préventives à mettre en place
                                    </p>
                                    <div className="mt-3 pt-3 border-t border-purple-200">
                                        <a
                                            href="#"
                                            className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center"
                                            onClick={(e) => e.preventDefault()}
                                        >
                                            Events
                                        </a>
                                    </div>
                                </div>

                                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-teal-800 mb-2">Upload Evidence</h4>
                                    <p className="text-sm text-teal-700">Photos, documents or evidence related to the incident</p>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Instructions */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-800 mb-2">Navigation</h4>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p>• Use arrows to move people</p>
                                <p>• → : To witnesses</p>
                                <p>• →→ : To involved persons</p>
                                <p>• ← : Back to employees</p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default ReportHelp
