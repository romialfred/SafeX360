import WorkProcessCard from "./WorkProcessCard";


const WorkProcess = () => {
    const services = [
        { title: "01", title1: "Consultation & Planning", title2: "Shaping the Foundation of Success", title3: "We begin by thoroughly understanding your needs, defining clear goals, and crafting solution.", },

        { title: "02", title1: "Execution & Implementation", title2: "Transforming Ideas into Tangible Results", title3: "Our team applies advanced techniques, innovative technology, and precise execution.", },
        { title: "03", title1: "Delivery & Support", title2: "Committed to Quality and Continued Growth", title3: "We deliver projects on time, provide continuous support, and ensure your complete satisfaction.", },

    ];
    return (
        <div className="p-15 flex flex-col items-center  bg-gray-100 gap-8">
            <div ><p className="text-9xl self-stretch font-bold">Work Process</p></div>
            <div className="grid grid-cols-3 flex-wrap gap-4">
                {services.map((service, index) => (
                    <WorkProcessCard key={index} title={service.title} title1={service.title1} title2={service.title2} title3={service.title3} />
                ))}
            </div>
        </div>
    )
}

export default WorkProcess