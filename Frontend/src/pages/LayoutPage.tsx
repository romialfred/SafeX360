import Articles from "../components/Landing/ArticlesPage/Articles"
import Company from "../components/Landing/CompanyInfo/Company"
import Directions from "../components/Landing/Directions/Directions"
import Footer from "../components/Landing/Footer/Footer"
import Hero from "../components/Landing/Hero/Hero"
import MissonPage from "../components/Landing/Mission/MissonPage"
import Navbar from "../components/Landing/Navbar/Navbar"
import Service from "../components/Landing/ServicePage/Service"
import Testimonials from "../components/Landing/Testimonials/Testimonials"
import WorkProcess from "../components/Landing/WorkProcess/WorkProcess"

const LayoutPage = () => {
    return (
        <div className="flex flex-col gap-20 max-w-[1440px] mx-auto">
            <div>
                <Navbar />
            </div>

            <Hero />
            <MissonPage />
            <Service />
            <WorkProcess />
            <Directions />
            <Company />
            <Testimonials />
            <Articles />

            <Footer />




        </div>

    )
}

export default LayoutPage