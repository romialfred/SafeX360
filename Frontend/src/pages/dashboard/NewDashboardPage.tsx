import ActivityTask from "../../components/NewDashboard/ActivityTask"
import Events from "../../components/NewDashboard/Events"
import IncidentGraph from "../../components/NewDashboard/IncidentGraph"
import Metrics from "../../components/NewDashboard/Metrics"
import NewDashboard from "../../components/NewDashboard/NewDashboard"
import Rate from "../../components/NewDashboard/Rate"
import RiskAssessments from "../../components/NewDashboard/RiskAssessments"
import RiskGraph from "../../components/NewDashboard/RiskGraph"
import Safety from "../../components/NewDashboard/Safety"

const NewDashboardPage = () => {
    return (
        <div className="p-5 flex flex-col gap-10">

            <div>
                <NewDashboard />
            </div>
            <div>
                <Safety />
            </div>
            <div>
                <Rate />
            </div>
            <div className="grid grid-cols-2 gap-5">
                <RiskGraph />
                <IncidentGraph />
            </div>

            <div>
                <Events />
            </div>
            <div className=" grid grid-cols-2 gap-2">
                <ActivityTask />
                <RiskAssessments />
            </div>

            <div>
                <Metrics />
            </div>

        </div>
    )
}

export default NewDashboardPage