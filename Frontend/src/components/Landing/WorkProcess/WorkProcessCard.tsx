interface ServiceCardProps {

    title: string;
    title1: string;
    title2: string;
    title3: string;
}

const WorkProcessCard = ({ title, title1, title2, title3 }: ServiceCardProps) => {
    return (
        <div className="flex flex-col gap-7 p-10 bg-white shadow-2xl w-[400px]">
            <div>
                <p className="text-8xl">{title}</p>
            </div>
            <div>
                <p className="text-xl text-primary">{title1}</p>
            </div>
            <div>
                <p className="text-2xl font-semibold max-w-[400px] ">{title2}</p>
            </div>
            <div>
                <p className="text-lg text-gray-400 max-w-[300px] ">{title3}</p>
            </div>
        </div>
    )
}

export default WorkProcessCard