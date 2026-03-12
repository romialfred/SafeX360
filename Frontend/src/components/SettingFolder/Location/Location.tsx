import { Breadcrumbs, Text } from "@mantine/core"
import { Link } from "react-router-dom"
import LocationData from "./LocationData"

const Location = () => {
    return (
        <div className=' '>
            <div className="flex justify-between items-center  ">
                <div>
                    <div className="text-3xl font-medium text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text ">Locations</div>
                    <Breadcrumbs className="" mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Link className="hover:!underline" to="/settings" ><Text variant="gradient" className="hover:!underline cursor-pointer">Setting</Text></Link>
                        <Text variant="gradient">Locations</Text>
                    </Breadcrumbs>
                </div>

            </div>

            <div className='mt-5   '>
                <LocationData />
            </div>


        </div>
    )
}

export default Location