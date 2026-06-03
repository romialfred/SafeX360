import { IconBook, IconDeviceDesktop, IconDownload, IconFileText } from "@tabler/icons-react";
import { useState } from "react";
import TechnicalDocumentation from "./TechnicalDocumentation";

const TechnicalDocs = () => {
    const [currentView, setCurrentView] = useState<'main' | 'technical-docs'>('main');

    if (currentView === 'technical-docs') {
        return <TechnicalDocumentation />;
    }
    return (
        <div className="flex flex-col gap-5 p-5">
            <div className="bg-gradient-to-r from-blue-600 to-blue-900 rounded-xl p-8 text-white">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-400 rounded-lg p-2">
                        <IconDeviceDesktop size={40} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold ">System Architecture</h2>
                        <p className="text-lg text-white">
                            Microservices-based Health & Safety Management Platform.
                        </p>
                    </div>

                </div>



            </div>
            <div className="space-y-6">
                {/* System Architecture */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">


                    {/* Architecture Diagram */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 mb-8">
                        <h3 className="text-lg text-gray-900 mb-6 text-center">Microservices Architecture Overview</h3>

                        {/* Frontend Layer */}
                        <div className="mb-8">
                            <h4 className="text-lg text-blue-700 mb-4">Frontend Layer</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white p-4 rounded-lg border-2 border-blue-200 shadow-sm">
                                    <div className="text-blue-800">React SPA</div>
                                    <div className="text-sm text-gray-600">TypeScript + Tailwind CSS</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg border-2 border-blue-200 shadow-sm">
                                    <div className="text-blue-800">Mobile App</div>
                                    <div className="text-sm text-gray-600">React Native</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg border-2 border-blue-200 shadow-sm">
                                    <div className="text-blue-800">PWA</div>
                                    <div className="text-sm text-gray-600">Progressive Web App</div>
                                </div>
                            </div>
                        </div>

                        {/* API Gateway */}
                        <div className="mb-8">
                            <h4 className="text-lg text-purple-700 mb-4">API Gateway & Load Balancer</h4>
                            <div className="bg-white p-6 rounded-lg border-2 border-purple-200 shadow-sm text-center">
                                <div className="text-purple-800 mb-2">Kong API Gateway</div>
                                <div className="text-sm text-gray-600">Authentication • Rate Limiting • Load Balancing • SSL Termination</div>
                            </div>
                        </div>

                        {/* Microservices */}
                        <div className="mb-8">
                            <h4 className="text-lg text-green-700 mb-4">Microservices Layer</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                                    <div className="text-green-800 text-sm">User Management</div>
                                    <div className="text-xs text-gray-600">Authentication, Authorization, RBAC</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                                    <div className="text-green-800 text-sm">Incident Service</div>
                                    <div className="text-xs text-gray-600">Incident reporting, investigations</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                                    <div className="text-green-800 text-sm">Risk Service</div>
                                    <div className="text-xs text-gray-600">Risk assessment, chemical register</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                                    <div className="text-green-800 text-sm">Action Service</div>
                                    <div className="text-xs text-gray-600">Action plans, tracking</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                                    <div className="text-green-800 text-sm">Audit Service</div>
                                    <div className="text-xs text-gray-600">Audit planning, execution</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                                    <div className="text-green-800 text-sm">PPE Service</div>
                                    <div className="text-xs text-gray-600">PPE requests, monitoring</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                                    <div className="text-green-800 text-sm">Document Service</div>
                                    <div className="text-xs text-gray-600">Document management, validation</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                                    <div className="text-green-800 text-sm">Notification Service</div>
                                    <div className="text-xs text-gray-600">Email, SMS, push notifications</div>
                                </div>
                            </div>
                        </div>

                        {/* Data Layer */}
                        <div className="mb-8">
                            <h4 className="text-lg text-orange-700 mb-4">Data Layer</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white p-4 rounded-lg border-2 border-orange-200 shadow-sm">
                                    <div className="text-orange-800">PostgreSQL</div>
                                    <div className="text-sm text-gray-600">Primary database for transactional data</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg border-2 border-orange-200 shadow-sm">
                                    <div className="text-orange-800">Redis</div>
                                    <div className="text-sm text-gray-600">Caching and session storage</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg border-2 border-orange-200 shadow-sm">
                                    <div className="text-orange-800">Elasticsearch</div>
                                    <div className="text-sm text-gray-600">Search and analytics</div>
                                </div>
                            </div>
                        </div>

                        {/* Infrastructure */}
                        <div>
                            <h4 className="text-lg text-gray-700 mb-4">Infrastructure & DevOps</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
                                    <div className="text-gray-800 text-sm">Docker</div>
                                    <div className="text-xs text-gray-600">Containerization</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
                                    <div className="text-gray-800 text-sm">Kubernetes</div>
                                    <div className="text-xs text-gray-600">Orchestration</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
                                    <div className="text-gray-800 text-sm">Jenkins</div>
                                    <div className="text-xs text-gray-600">CI/CD Pipeline</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
                                    <div className="text-gray-800 text-sm">Prometheus</div>
                                    <div className="text-xs text-gray-600">Monitoring</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Architecture Benefits */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-blue-50 p-6 rounded-lg">
                            <h4 className="text-blue-900 mb-3">Microservices Benefits</h4>
                            <ul className="text-sm text-blue-800 space-y-2">
                                <li>• Independent deployment and scaling</li>
                                <li>• Technology diversity per service</li>
                                <li>• Fault isolation and resilience</li>
                                <li>• Team autonomy and faster development</li>
                                <li>• Better resource utilization</li>
                            </ul>
                        </div>
                        <div className="bg-green-50 p-6 rounded-lg">
                            <h4 className="text-green-900 mb-3">Scalability Features</h4>
                            <ul className="text-sm text-green-800 space-y-2">
                                <li>• Horizontal scaling per service</li>
                                <li>• Load balancing and auto-scaling</li>
                                <li>• Database sharding capabilities</li>
                                <li>• CDN for static content delivery</li>
                                <li>• Caching at multiple layers</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Database Documentation */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <div className="flex items-center mb-6">
                        <IconFileText className="w-8 h-8 text-green-600 mr-4" />
                        <div>
                            <h2 className="text-2xl text-gray-900">Database Documentation</h2>
                            <p className="text-gray-600">Entity Relationship Diagrams and Data Dictionary</p>
                        </div>
                    </div>

                    {/* Database Schema Diagram */}
                    <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-8 mb-8">
                        <h3 className="text-lg text-gray-900 mb-6 text-center">Database Schema - Entity Relationship Diagram</h3>

                        {/* Core Entities */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* Users & Authentication */}
                            <div className="bg-white p-6 rounded-lg border-2 border-blue-300 shadow-lg">
                                <h4 className="text-blue-800 mb-4 text-center">User Management</h4>
                                <div className="space-y-3">
                                    <div className="bg-blue-50 p-3 rounded border">
                                        <div className="text-blue-900">users</div>
                                        <div className="text-xs text-blue-700">id, email, first_name, last_name, role_id, is_active, created_at</div>
                                    </div>
                                    <div className="bg-blue-50 p-3 rounded border">
                                        <div className="text-blue-900">roles</div>
                                        <div className="text-xs text-blue-700">id, name, description, permissions</div>
                                    </div>
                                    <div className="bg-blue-50 p-3 rounded border">
                                        <div className="text-blue-900">user_sessions</div>
                                        <div className="text-xs text-blue-700">id, user_id, login_time, ip_address</div>
                                    </div>
                                </div>
                            </div>

                            {/* Incidents & Risks */}
                            <div className="bg-white p-6 rounded-lg border-2 border-red-300 shadow-lg">
                                <h4 className="text-red-800 mb-4 text-center">Incidents & Risks</h4>
                                <div className="space-y-3">
                                    <div className="bg-red-50 p-3 rounded border">
                                        <div className="text-red-900">incidents</div>
                                        <div className="text-xs text-red-700">id, title, description, severity, status, reported_by, date_occurred</div>
                                    </div>
                                    <div className="bg-red-50 p-3 rounded border">
                                        <div className="text-red-900">risk_assessments</div>
                                        <div className="text-xs text-red-700">id, title, likelihood, severity, risk_rating, status</div>
                                    </div>
                                    <div className="bg-red-50 p-3 rounded border">
                                        <div className="text-red-900">chemical_risks</div>
                                        <div className="text-xs text-red-700">id, chemical_name, cas_number, classification, hazard_source</div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions & Audits */}
                            <div className="bg-white p-6 rounded-lg border-2 border-green-300 shadow-lg">
                                <h4 className="text-green-800 mb-4 text-center">Actions & Audits</h4>
                                <div className="space-y-3">
                                    <div className="bg-green-50 p-3 rounded border">
                                        <div className="text-green-900">action_plans</div>
                                        <div className="text-xs text-green-700">id, title, description, assigned_to, due_date, status, progress</div>
                                    </div>
                                    <div className="bg-green-50 p-3 rounded border">
                                        <div className="text-green-900">audits</div>
                                        <div className="text-xs text-green-700">id, title, audit_date, auditor, department, findings</div>
                                    </div>
                                    <div className="bg-green-50 p-3 rounded border">
                                        <div className="text-green-900">ppe_requests</div>
                                        <div className="text-xs text-green-700">id, item_name, quantity, requestor, status, approval_date</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Relationships */}
                        <div className="bg-white p-6 rounded-lg border border-gray-300">
                            <h4 className="text-gray-800 mb-4 text-center">Key Relationships</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="text-gray-700 mb-2">One-to-Many:</div>
                                    <ul className="text-gray-600 space-y-1">
                                        <li>• users → incidents (reported_by)</li>
                                        <li>• users → action_plans (assigned_to)</li>
                                        <li>• roles → users (role_id)</li>
                                        <li>• incidents → action_plans (incident_id)</li>
                                    </ul>
                                </div>
                                <div>
                                    <div className="text-gray-700 mb-2">Many-to-Many:</div>
                                    <ul className="text-gray-600 space-y-1">
                                        <li>• users ↔ audits (audit_participants)</li>
                                        <li>• action_plans ↔ documents (action_documents)</li>
                                        <li>• risk_assessments ↔ controls (risk_controls)</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Dictionary */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <div className="flex items-center mb-6">
                        <IconBook className="w-8 h-8 text-purple-600 mr-4" />
                        <div>
                            <h2 className="text-2xl text-gray-900">Data Dictionary</h2>
                            <p className="text-gray-600">Detailed field documentation for all database tables</p>
                        </div>
                    </div>

                    {/* Core Tables Documentation */}
                    <div className="space-y-8">
                        {/* Users Table */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-blue-50 px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg text-blue-900">users</h3>
                                <p className="text-sm text-blue-700">System users and authentication information</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Field</th>
                                            <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Type</th>
                                            <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Constraints</th>
                                            <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        <tr>
                                            <td className="px-4 py-3 font-mono text-sm">id</td>
                                            <td className="px-4 py-3 text-sm">UUID</td>
                                            <td className="px-4 py-3 text-sm">PRIMARY KEY</td>
                                            <td className="px-4 py-3 text-sm">Unique identifier for user</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 font-mono text-sm">email</td>
                                            <td className="px-4 py-3 text-sm">VARCHAR(255)</td>
                                            <td className="px-4 py-3 text-sm">UNIQUE, NOT NULL</td>
                                            <td className="px-4 py-3 text-sm">User email address for authentication</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 font-mono text-sm">first_name</td>
                                            <td className="px-4 py-3 text-sm">VARCHAR(100)</td>
                                            <td className="px-4 py-3 text-sm">NOT NULL</td>
                                            <td className="px-4 py-3 text-sm">User's first name</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 font-mono text-sm">last_name</td>
                                            <td className="px-4 py-3 text-sm">VARCHAR(100)</td>
                                            <td className="px-4 py-3 text-sm">NOT NULL</td>
                                            <td className="px-4 py-3 text-sm">User's last name</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 font-mono text-sm">role_id</td>
                                            <td className="px-4 py-3 text-sm">UUID</td>
                                            <td className="px-4 py-3 text-sm">FOREIGN KEY</td>
                                            <td className="px-4 py-3 text-sm">Reference to roles table</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 font-mono text-sm">is_active</td>
                                            <td className="px-4 py-3 text-sm">BOOLEAN</td>
                                            <td className="px-4 py-3 text-sm">DEFAULT TRUE</td>
                                            <td className="px-4 py-3 text-sm">User account status</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 font-mono text-sm">created_at</td>
                                            <td className="px-4 py-3 text-sm">TIMESTAMP</td>
                                            <td className="px-4 py-3 text-sm">DEFAULT NOW()</td>
                                            <td className="px-4 py-3 text-sm">Account creation timestamp</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Incidents Table */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-red-50 px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg text-red-900">incidents</h3>
                                <p className="text-sm text-red-700">Safety incidents and near-miss reports</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Field</th>
                                            <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Type</th>
                                            <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Constraints</th>
                                            <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        <tr>
                                            <td className="px-4 py-3 font-mono text-sm">id</td>
                                            <td className="px-4 py-3 text-sm">UUID</td>
                                            <td className="px-4 py-3 text-sm">PRIMARY KEY</td>
                                            <td className="px-4 py-3 text-sm">Unique incident identifier</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 font-mono text-sm">incident_number</td>
                                            <td className="px-4 py-3 text-sm">VARCHAR(50)</td>
                                            <td className="px-4 py-3 text-sm">UNIQUE, NOT NULL</td>
                                            <td className="px-4 py-3 text-sm">Human-readable incident number (INC-2024-001)</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 font-mono text-sm">title</td>
                                            <td className="px-4 py-3 text-sm">VARCHAR(255)</td>
                                            <td className="px-4 py-3 text-sm">NOT NULL</td>
                                            <td className="px-4 py-3 text-sm">Brief incident title</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 font-mono text-sm">description</td>
                                            <td className="px-4 py-3 text-sm">TEXT</td>
                                            <td className="px-4 py-3 text-sm">NOT NULL</td>
                                            <td className="px-4 py-3 text-sm">Detailed incident description</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 font-mono text-sm">severity</td>
                                            <td className="px-4 py-3 text-sm">ENUM</td>
                                            <td className="px-4 py-3 text-sm">('minor', 'moderate', 'major', 'critical')</td>
                                            <td className="px-4 py-3 text-sm">Incident severity level</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 font-mono text-sm">status</td>
                                            <td className="px-4 py-3 text-sm">ENUM</td>
                                            <td className="px-4 py-3 text-sm">('open', 'investigating', 'closed')</td>
                                            <td className="px-4 py-3 text-sm">Current incident status</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 font-mono text-sm">reported_by</td>
                                            <td className="px-4 py-3 text-sm">UUID</td>
                                            <td className="px-4 py-3 text-sm">FOREIGN KEY</td>
                                            <td className="px-4 py-3 text-sm">Reference to users table</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 font-mono text-sm">date_occurred</td>
                                            <td className="px-4 py-3 text-sm">TIMESTAMP</td>
                                            <td className="px-4 py-3 text-sm">NOT NULL</td>
                                            <td className="px-4 py-3 text-sm">When the incident occurred</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Chemical Risks Table */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-orange-50 px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg text-orange-900">chemical_risks</h3>
                                <p className="text-sm text-orange-700">Chemical hazard identification and risk assessment</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Field</th>
                                            <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Type</th>
                                            <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Constraints</th>
                                            <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        <tr>
                                            <td className="px-4 py-3 font-mono text-sm">id</td>
                                            <td className="px-4 py-3 text-sm">UUID</td>
                                            <td className="px-4 py-3 text-sm">PRIMARY KEY</td>
                                            <td className="px-4 py-3 text-sm">Unique chemical risk identifier</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 font-mono text-sm">risk_id</td>
                                            <td className="px-4 py-3 text-sm">VARCHAR(50)</td>
                                            <td className="px-4 py-3 text-sm">UNIQUE, NOT NULL</td>
                                            <td className="px-4 py-3 text-sm">Human-readable risk ID (CHR-2024-001)</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 font-mono text-sm">chemical_name</td>
                                            <td className="px-4 py-3 text-sm">VARCHAR(255)</td>
                                            <td className="px-4 py-3 text-sm">NOT NULL</td>
                                            <td className="px-4 py-3 text-sm">Official chemical product name</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 font-mono text-sm">cas_number</td>
                                            <td className="px-4 py-3 text-sm">VARCHAR(20)</td>
                                            <td className="px-4 py-3 text-sm">NULL</td>
                                            <td className="px-4 py-3 text-sm">Chemical Abstracts Service number</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 font-mono text-sm">classification</td>
                                            <td className="px-4 py-3 text-sm">ENUM</td>
                                            <td className="px-4 py-3 text-sm">GHS classifications</td>
                                            <td className="px-4 py-3 text-sm">Chemical hazard classification</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 font-mono text-sm">likelihood</td>
                                            <td className="px-4 py-3 text-sm">INTEGER</td>
                                            <td className="px-4 py-3 text-sm">CHECK (1-5)</td>
                                            <td className="px-4 py-3 text-sm">Probability of occurrence (1-5 scale)</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 font-mono text-sm">severity</td>
                                            <td className="px-4 py-3 text-sm">INTEGER</td>
                                            <td className="px-4 py-3 text-sm">CHECK (1-5)</td>
                                            <td className="px-4 py-3 text-sm">Impact severity (1-5 scale)</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 font-mono text-sm">risk_rating</td>
                                            <td className="px-4 py-3 text-sm">INTEGER</td>
                                            <td className="px-4 py-3 text-sm">GENERATED (likelihood * severity)</td>
                                            <td className="px-4 py-3 text-sm">Calculated risk score</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* API Documentation */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <div className="flex items-center mb-6">
                        <IconFileText className="w-8 h-8 text-gray-600 mr-4" />
                        <div>
                            <h2 className="text-2xl text-gray-900">API Documentation</h2>
                            <p className="text-gray-600">RESTful API endpoints and integration guides</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-lg text-gray-900">Core APIs</h3>
                            <div className="space-y-3">
                                <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                    <IconFileText className="w-5 h-5 text-blue-600 mr-3" />
                                    <div className="flex-1">
                                        <div className="font-medium">User Management API</div>
                                        <div className="text-sm text-gray-500">Authentication, authorization, user CRUD</div>
                                    </div>
                                    <IconDownload className="w-4 h-4 text-gray-400" />
                                </div>
                                <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                    <IconFileText className="w-5 h-5 text-red-600 mr-3" />
                                    <div className="flex-1">
                                        <div className="font-medium">Incident Management API</div>
                                        <div className="text-sm text-gray-500">Incident reporting, investigation, tracking</div>
                                    </div>
                                    <IconDownload className="w-4 h-4 text-gray-400" />
                                </div>
                                <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                    <IconFileText className="w-5 h-5 text-orange-600 mr-3" />
                                    <div className="flex-1">
                                        <div className="font-medium">Risk Assessment API</div>
                                        <div className="text-sm text-gray-500">Risk identification, assessment, controls</div>
                                    </div>
                                    <IconDownload className="w-4 h-4 text-gray-400" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg text-gray-900">Integration Guides</h3>
                            <div className="space-y-3">
                                <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                    <IconFileText className="w-5 h-5 text-purple-600 mr-3" />
                                    <div className="flex-1">
                                        <div className="font-medium">HRMS Integration</div>
                                        <div className="text-sm text-gray-500">Employee data synchronization</div>
                                    </div>
                                    <IconDownload className="w-4 h-4 text-gray-400" />
                                </div>
                                <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                    <IconFileText className="w-5 h-5 text-green-600 mr-3" />
                                    <div className="flex-1">
                                        <div className="font-medium">ERP Integration</div>
                                        <div className="text-sm text-gray-500">Financial and procurement data</div>
                                    </div>
                                    <IconDownload className="w-4 h-4 text-gray-400" />
                                </div>
                                <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                    <IconFileText className="w-5 h-5 text-indigo-600 mr-3" />
                                    <div className="flex-1">
                                        <div className="font-medium">Webhook Configuration</div>
                                        <div className="text-sm text-gray-500">Real-time event notifications</div>
                                    </div>
                                    <IconDownload className="w-4 h-4 text-gray-400" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Requirements */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg text-gray-900 mb-4">System Requirements & Specifications</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <h4 className="text-gray-900 mb-2">Browser Support</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Chrome 90+</li>
                                <li>• Firefox 88+</li>
                                <li>• Safari 14+</li>
                                <li>• Edge 90+</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-gray-900 mb-2">Mobile Support</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• iOS 14+</li>
                                <li>• Android 10+</li>
                                <li>• Responsive design</li>
                                <li>• Touch optimized</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-gray-900 mb-2">Security</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• SSL/TLS encryption</li>
                                <li>• OAuth 2.0</li>
                                <li>• Role-based access</li>
                                <li>• Audit logging</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-gray-900 mb-2">Performance</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• &lt; 2s page load</li>
                                <li>• 99.9% uptime SLA</li>
                                <li>• Auto-scaling</li>
                                <li>• CDN delivery</li>
                            </ul>
                            {/* Technical Documentation */}
                            <div
                                className="rounded-xl shadow-sm border-2 bg-purple-50 border-purple-200 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 hover:scale-105"
                                onClick={() => setCurrentView('technical-docs')}
                            >
                                <div className="p-6">
                                    <div className="flex items-center mb-4">
                                        <div className="p-3 bg-purple-100 rounded-lg">
                                            <IconFileText className="w-8 h-8 text-purple-600" />
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-lg text-gray-900">Technical Documentation</h3>
                                        </div>
                                    </div>

                                    <p className="text-gray-600 mb-4 text-sm">
                                        System architecture and technical specifications
                                    </p>

                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 cursor-pointer p-1 rounded hover:bg-gray-50">
                                            <div className="w-2 h-2 rounded-full bg-purple-500 mr-3"></div>
                                            System Architecture
                                        </div>
                                        <div className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 cursor-pointer p-1 rounded hover:bg-gray-50">
                                            <div className="w-2 h-2 rounded-full bg-purple-500 mr-3"></div>
                                            Database Documentation
                                        </div>
                                        <div className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 cursor-pointer p-1 rounded hover:bg-gray-50">
                                            <div className="w-2 h-2 rounded-full bg-purple-500 mr-3"></div>
                                            Data Dictionary
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <span className="text-sm text-purple-600">
                                            View documentation →
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TechnicalDocs