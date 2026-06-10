import AuditDashChart from "./AuditDashChart"
import AuditDashHeader from "./AuditDashHeader"
import AuditDashPlanned from "./AuditDashPlanned"
import AuditDashTable from "./AuditDashTable"

const AuditDashboard = ({ audits = [], auditAreaMap = {} as Record<string, any> }: { audits?: any[]; auditAreaMap?: Record<string, any> }) => {
    return (
        <div className="flex flex-col gap-4">
            <AuditDashHeader />
            <AuditDashPlanned />
            <AuditDashChart audits={audits} auditAreaMap={auditAreaMap} />
            <AuditDashTable />
        </div>
    )
}

export default AuditDashboard
