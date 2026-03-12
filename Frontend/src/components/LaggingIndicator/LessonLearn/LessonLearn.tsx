import { Breadcrumbs, Text } from "@mantine/core"
import { Link } from "react-router-dom"
import LessonData from "./LessonData"



const LessonLearn = () => {
    return (
        <div className=' '>
            <div className="flex justify-between items-center  ">
                <div>
                    <div className="text-3xl font-medium text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text ">Lessons Learned</div>
                    <Breadcrumbs className="" mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Text variant="gradient">Lessons Learned</Text>
                    </Breadcrumbs>

                </div>

            </div>
            <p className=' italic my-3'>Documenting and sharing insights from safety incidents to prevent future occurrences and enhance workplace safety</p>
            <div className='   '>
                <LessonData />
            </div>


        </div>
    )
}

export default LessonLearn