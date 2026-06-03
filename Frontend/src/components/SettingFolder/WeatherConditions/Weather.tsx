import { Breadcrumbs, Text } from "@mantine/core"
import { Link } from "react-router-dom"
import WeatherConditionData from "./WeatherConditionData"


const Weather = () => {
    return (
        <div className=' '>
            <div className="flex justify-between items-center  ">
                <div>
                    <div className="text-2xl font-semibold text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text "> Environmental Conditions</div>
                    <Breadcrumbs className="" mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Link className="hover:!underline" to="/settings" ><Text variant="gradient" className="hover:!underline cursor-pointer">Setting</Text></Link>
                        <Text variant="gradient"> Environmental Conditions</Text>
                    </Breadcrumbs>
                </div>

            </div>

            <div className='mt-5   '>
                <WeatherConditionData />
            </div>


        </div>
    )
}

export default Weather