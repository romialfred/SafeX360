import { Breadcrumbs, Button, Text } from "@mantine/core";
import { IconDownload } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getDocumentById } from "../../../services/ComplianceDocumentService";
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { formatDate, formatDateShort } from "../../../utility/DateFormats";
import { Tag } from "primereact/tag";
import { getMedia } from "../../../services/MediaService";
import { openPDF } from "../../../utility/DocumentUtility";
import { errorNotification } from "../../../utility/NotificationUtility";

const DetailDocument = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const [document, setDocument] = useState<any>({});
    useEffect(() => {
        dispatch(showOverlay());
        getDocumentById(id)
            .then((res) => {
                setDocument(res);
            })
            .catch((err) => {
                console.error("Failed to fetch document details:", err);
            })
            .finally(() => {
                dispatch(hideOverlay())
            });
    }, [])

    const handleDocument = () => {
        dispatch(showOverlay());
        getMedia(document.docId)
            .then((res) => {
                openPDF(res.file);
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || 'Failed to open document');
            }).finally(() => {
                dispatch(hideOverlay());
            }
            );
    }

    return (


        <div className="flex flex-col gap-10">

            <div className="flex justify-between items-center">
                <div>
                    <div className="text-3xl font-medium text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text">
                        Document Details
                    </div>
                    <Breadcrumbs mt="xs">
                        <Link className="hover:!underline" to="/">
                            <Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text>
                        </Link>
                        <Link className="hover:!underline" to="/compliance-documents">
                            <Text variant="gradient" className="hover:!underline cursor-pointer">Compliance Documents</Text>
                        </Link>
                        <Text variant="gradient">Document Details</Text>
                    </Breadcrumbs>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-gray-300 p-4 flex flex-col gap-8">

                <div className="grid grid-cols-2 gap-5">

                    <h2 className="text-xl col-span-2 font-medium text-primary">Document Information</h2>

                    <div>
                        <p className="font-medium text-lg text-gray-500">File Name</p>
                        <p className="text-blue-700 text-sm">{document.docName}</p>
                    </div>

                    <div>
                        <p className="font-medium text-lg text-gray-500">Uploaded By</p>
                        <p className="text-blue-800 font-medium">{document.uploadedBy}</p>
                    </div>
                    <div>
                        <p className="font-medium text-lg text-gray-500">Upload Date</p>
                        <p className="text-gray-600 font-medium">{formatDate(document.uploadDate)}</p>
                    </div>
                    <div>
                        <p className="font-medium text-lg text-gray-500">Expiration Date</p>
                        <p className="text-gray-600 font-medium">{formatDateShort(document.expiryDate)}</p>
                    </div>
                    <div>
                        <p className="font-medium text-lg text-gray-500">Status</p>
                        <Tag >{document.status}</Tag>
                    </div>
                    <div className="self-end">
                        <Button onClick={handleDocument} leftSection={<IconDownload size={16} />} variant="outline">
                            Download Document
                        </Button>
                    </div>




                    {/* <div className=" flex flex-col gap-5">
                        <h2 className="text-lg font-medium text-primary">Document History</h2>
                        <div className="flex flex-col gap-8 ">
                            <div className="flex gap-2 ">
                                <div>
                                    <p className="text-blue-500"><span className="font-medium text-gray-800">Valid by-</span> validator@example.com</p>
                                    <p className="text-sm text-gray-700">Document approved but expiring soon.</p>
                                </div>

                                <div>
                                    <p className=" font-medium text-gray-500">4/7/2024 09:25 am</p>
                                </div>

                            </div>
                            <div className="flex gap-2 ">
                                <div>
                                    <p className=" text-blue-700 font-medium"><span className="font-medium text-lg text-gray-600">Uploaded by-</span> Rachel Martinez</p>
                                    <p className="text-gray-600 text-sm">Document uploaded to the system.</p>
                                </div>
                                <div>
                                    <p className=" text-gray-500  font-medium">3/7/2024 09:25 am</p>
                                </div>

                            </div>
                        </div>
                    </div> */}

                </div>
                {/* <div className="border border-dashed bg-blue-50 border-gray-400 p-20 rounded-md text-center text-gray-500">
                    <p className="text-gray-600 font-medium text-xl">Document preview would be displayed here</p>
                </div> */}
            </div>
        </div >
    )
}

export default DetailDocument