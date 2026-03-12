import ActiveTask from "../components/OHS dashboard/ActiveTask"
import ClosureRateGraph from "../components/OHS dashboard/ClosureRateGraph"
import DashboardIndicators from "../components/OHS dashboard/DashboardIndicators"
import DepartmentStatistics from "../components/OHS dashboard/DepartmentStatistics"
import Header from "../components/OHS dashboard/Header"
import MonthlyTraining from "../components/OHS dashboard/MonthlyTraining"
import UpcomingEvents from "../components/OHS dashboard/UpcomingEvents"

const OhsDashboardPage = () => {
    return (
        <div className="p-5 flex flex-col gap-5 ">
            <Header />
            <DashboardIndicators />
            <DepartmentStatistics />
            <ClosureRateGraph />
            <ActiveTask />
            <UpcomingEvents />
            <MonthlyTraining />
        </div>
    )
}

export default OhsDashboardPage