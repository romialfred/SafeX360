import { ActionIcon, Breadcrumbs, SegmentedControl, Select, Text } from "@mantine/core";
import { Column } from "primereact/column";
import { DataTable, DataTableCellClickEvent, DataTableCellSelection } from "primereact/datatable";
import { Link } from "react-router-dom";
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { Toolbar } from "primereact/toolbar";
import { useState } from "react";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { sampleData1 } from "../../../Data/IncidentsData";


const CalenderOverview = () => {
    const [selectedCell, setSelectedCell] = useState<DataTableCellSelection<any[]> | null>(null);
    const [selectedValue, setSelectedValue] = useState<string | null>(null);

    const onCellSelect = (event: DataTableCellClickEvent<any[]>) => {
        setSelectedValue(event.value);
        console.log(selectedValue);
        open();
    };

    const renderHeader = () => {
        return (
            <div className="flex font-normal gap-80 ">
                <span className="text-2xl font-bold text-blue-500">Alice Johnson</span>
                <div className="font-bold text-xl text-primary flex items-center gap-2">
                    <ActionIcon variant="subtle" color="secondary"><IconChevronLeft stroke={2} /> </ActionIcon>
                    January 2025
                    <ActionIcon variant="subtle" color="secondary"><IconChevronRight stroke={2} /> </ActionIcon>
                </div>

            </div>


        );
    };


    const header = renderHeader();

    return (
        <div className="p-5">
            <div className="flex justify-between items-center">
                <div>
                    <div className="font-semibold text-2xl text-blue-500 w-fit">Calendar Overview</div>
                    <Breadcrumbs mt="xs" mb="lg">
                        <Link className="hover:!underline" to="/">
                            <Text variant="gradient">Home</Text>
                        </Link>
                        <Link className="hover:!underline" to="/PGI">
                            <Text variant="gradient">Planned General Inspections</Text>
                        </Link>
                        <Text variant="gradient">Calendar Overview</Text>
                    </Breadcrumbs>
                </div>
            </div>


            <div className="card">
                {/* Toolbar */}
                <Toolbar className="mb-4 "
                    left={() => <SegmentedControl size="md" data={['Monthly View']} color="primary" className="!border  !border-primary" />}
                    right={() => (
                        <div className='flex items-center  rounded gap-1'>
                            <span className="text-xl font-bold text-primary">Select period:</span>
                            <Select placeholder="Jan 2025" data={['Jan 2025', 'Feb 2025', 'Nov 2024', 'Dec 2024']} searchable={false} />
                        </div>
                    )}
                />

                <DataTable value={sampleData1} cellSelection selectionMode="single"
                    selection={selectedCell!} metaKeySelection={false}
                    onSelectionChange={(e: any) => setSelectedCell(e.value as DataTableCellSelection<any[]>)}
                    onCellSelect={onCellSelect} tableStyle={{ minWidth: '50rem' }}
                    showGridlines header={header} size='large' className='[&_.p-selectable-cell]:!p-4 [&_.p-column-header]:!py-4 !text-lg'
                >
                    <Column field="day1" header="Monday"
                        body={(rowData) => rowData.day1.day}
                        headerStyle={{ backgroundColor: "#4682B4", color: "#FFF", textAlign: "center" }} />

                    <Column field="day2" header="Tuesday"
                        body={(rowData) => rowData.day2.day}
                        headerStyle={{ backgroundColor: "#4682B4", color: "#FFF", textAlign: "center" }} />

                    <Column field="day3" header="Wednesday"
                        body={(rowData) => rowData.day3.day}
                        headerStyle={{ backgroundColor: "#4682B4", color: "#FFF", textAlign: "center" }} />

                    <Column field="day4" header="Thursday"
                        body={(rowData) => rowData.day4.day}
                        headerStyle={{ backgroundColor: "#4682B4", color: "#FFF", textAlign: "center" }} />

                    <Column field="day5" header="Friday"
                        body={(rowData) => rowData.day5.day}
                        headerStyle={{ backgroundColor: "#4682B4", color: "#FFF", textAlign: "center" }} />

                    <Column field="day6" header="Saturday"
                        body={(rowData) => rowData.day6.day}
                        headerStyle={{ backgroundColor: "#4682B4", color: "#FFF", textAlign: "center" }} />

                    <Column field="day7" header="Sunday"
                        body={(rowData) => rowData.day7.day}
                        headerStyle={{ backgroundColor: "#4682B4", color: "#FFF", textAlign: "center" }} />
                </DataTable>

            </div>

        </div>
    )
}

export default CalenderOverview