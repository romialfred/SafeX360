import { IconPoint } from "@tabler/icons-react";


interface ServiceCardProps {
    icon: React.ReactNode;
    name: string;
    date: string;
    feedback: string;
    image: string;


}
const ArticlesCard = ({ name, date, feedback, image }: ServiceCardProps) => {
    return (
        <div className="flex gap-5 ">

            <div className="flex gap-5 flex-col">

                <div className="flex gap-2 items-center">
                    <p className="text-lg ">{name}</p>
                    <IconPoint stroke={2} />
                    <p className="text-xl  text-gray-500">{date}</p>
                </div>

                <div>
                    <p className="text-2xl">{feedback}</p>
                </div>
            </div>

            <div>
                <img src={image} alt="" width={320} />
            </div>
        </div>
    )
}

export default ArticlesCard