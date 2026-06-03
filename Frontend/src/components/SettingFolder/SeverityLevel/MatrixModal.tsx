import { useEffect, useState } from 'react';
import { Modal, SegmentedControl, ScrollArea } from '@mantine/core';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { GetAllIncidentType } from '../../../services/IncidentTypeService';
import { mapIdToName } from '../../../utility/OtherUtilities';



const getRowClass = (level: string) => {
    if (level.includes('5')) return 'row-critical';
    if (level.includes('4')) return 'row-high';
    if (level.includes('3')) return 'row-medium';
    if (level.includes('2')) return 'row-low';
    if (level.includes('1')) return 'row-very-low';
    return '';
};

interface MatrixModalProps {
    opened: boolean;
    onClose: () => void;
    categories: any[];
}

const MatrixModal = ({ opened, onClose, categories }: MatrixModalProps) => {
    const [selectedTab, setSelectedTab] = useState('health');
    const [categoryMap, setCategoryMap] = useState<Record<string, any>>({});
    const [tabData, setTabData] = useState<Record<string, any[]>>({});
    const currentData = tabData[selectedTab];
    useEffect(() => {
        if (Object.keys(categoryMap).length == 0) return;
        GetAllIncidentType({})
            .then((res) => {
                const summary: Record<string, any[]> = {};
                categories.forEach((category: any) => {
                    summary[category.name] = [];
                });
                res.forEach((data: any) => {
                    const entry = summary[categoryMap[data.incidentCategoryId]?.name];
                    entry.push({ level: `Level ${data.severityLevel} (${data.severityLevelName})`, type: data.name, description: data.description });

                });

                setTabData(summary);

            }).catch((_err) => { });
    }
        , [categoryMap]);

    useEffect(() => {
        if (!categories || categories.length === 0) return;
        setCategoryMap(mapIdToName(categories))
        setSelectedTab(categories[0]?.name || 'health');
    }, [categories]);




    return (
        <Modal
            opened={opened}
            onClose={onClose}
            size="70%"
            centered
            title={<div className="text-lg text-blue-500">Severity Levels</div>}
            overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
        >
            <style>
                {`
                    .row-critical {
                        background-color: #fdecea !important;  /* Light red-pink */
                        color: #611a15 !important;
                        }
                    .row-high {
                        background-color: #fff7e6 !important; /* Light orange-yellow */
                        color: #7a4f01 !important;
                    }
                    .row-medium {
                        background-color: #e8f4fd !important; /* Light sky blue */
                        color: #0c3c60 !important;
                    }
                    .row-low {
                        background-color: #eafbf0 !important; /* Mint green */
                        color: #1d5c2f !important;
                    }
                    .row-very-low {
                        background-color: #f5f5fa !important; /* Very light gray-lavender */
                        color: #33334d !important;
                    }
            `}
            </style>

            <div className="flex flex-col gap-2">
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-300 shadow-sm">
                    <SegmentedControl
                        fullWidth
                        size="md"
                        color="primary"
                        transitionDuration={500}
                        transitionTimingFunction="linear"
                        value={selectedTab}
                        onChange={setSelectedTab}
                        data={categories.map((category) => ({
                            value: category.name,
                            label: category.name,
                        }))}
                    />
                </div>

                <div className="bg-gray-50 p-2 rounded-lg border border-gray-300 shadow-sm">
                    <ScrollArea >
                        <DataTable selectionMode="single"
                            value={currentData}
                            scrollable
                            rowClassName={(data) => getRowClass(data.level)}
                        >
                            <Column field="level" header="Severity Level" />
                            <Column field="type" header="Incident Type" />
                            <Column field="description" header="Description" />
                        </DataTable>
                    </ScrollArea>
                </div>
            </div>
        </Modal>
    );
};

export default MatrixModal;
