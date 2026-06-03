import { Breadcrumbs, Text } from "@mantine/core"
import { Link } from "react-router-dom"

const AddCorrective = () => {
    return (
        <div className="p-5">
            <div className="flex justify-between items-center">
                <div>
                    <div className="text-2xl text-home w-fit">Report Actions</div>
                    <Breadcrumbs mt="xs" mb="lg">
                        <Link className="hover:!underline" to="/">
                            <Text variant="gradient">Home</Text>
                        </Link>
                        <Link className="hover:!underline" to="/corrective">
                            <Text variant="gradient">Corrective Actions</Text>
                        </Link>
                        <Text variant="gradient">Report Actions</Text>
                    </Breadcrumbs>
                </div>
            </div>
        </div>
    )
}

export default AddCorrective