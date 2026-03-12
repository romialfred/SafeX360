import Customers from "../../components/Dashboard/Customer"
import EmployeeSalary from "../../components/Dashboard/EmployeeSalary"
import MonthlyEarnings from "../../components/Dashboard/MonthlyEarnings"
import Projects from "../../components/Dashboard/Projects"
import RevenueUpdates from "../../components/Dashboard/RevenueUpdates"
import SellingProducts from "../../components/Dashboard/SellingProducts"
import Social from "../../components/Dashboard/Social"
import TopCards from "../../components/Dashboard/TopCards"
import TopPerformers from "../../components/Dashboard/TopPerformers"
import WeeklyStats from "../../components/Dashboard/WeeklyStats"
import YearlyBreakup from "../../components/Dashboard/YearlyBreakup"

const DashboardPage = () => {
    return (
        <div className="flex flex-col gap-5 ">
            <div className=" p-5 gap-5"><TopCards /></div>
            <div className=" p-5 gap-5 grid grid-cols-2  ">

                <RevenueUpdates />

                <div className="flex flex-col gap-5">
                    <YearlyBreakup />
                    <MonthlyEarnings />

                </div>
            </div>
            <div className="grid grid-cols-3  gap-5 p-5 ">

                <EmployeeSalary />

                <div className="grid grid-cols-1 gap-5">
                    <div className="grid grid-cols-2 gap-4">

                        <Customers />
                        <Projects />
                    </div>


                    <Social />

                </div>

                <SellingProducts />


            </div>
            <div>
                <div className="grid grid-cols-2 gap-5 p-5">

                    <WeeklyStats />
                    <TopPerformers />

                </div>


            </div>
        </div>
    )
}

export default DashboardPage