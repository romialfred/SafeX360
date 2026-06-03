import UpdateImageDropzone from "../../../UtilityComp/UpdateImageDropzone";

const UploadSection = ({ form }: any) => {

    return (
        <div className="p-5 mt-5 border rounded-lg border-gray-300 shadow-md">
            <h2 className="text-lg text-gray-800 mb-4">Upload Evidence</h2>
            <UpdateImageDropzone form={form} id="evidence" />
        </div >
    )
}



export default UploadSection;
