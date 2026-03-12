import React from 'react';
import { Button, Badge, Tooltip, ActionIcon } from '@mantine/core';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { RiskData } from '../../../Data/dummyData/riskData';
import { IconEye } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

interface RiskTableProps {
    filteredRisks: RiskData[];
    onSelect: (risk: RiskData) => void;
    getStatusColor: (status: string) => string;
}

const RiskTable: React.FC<RiskTableProps> = ({ filteredRisks, onSelect, getStatusColor }) => {
    const navigate = useNavigate();


    const actionBodyTemplate = (rowData: RiskData) => {
        if (!rowData?.id) return null;
        return (
            <div className="flex gap-3">
                <Tooltip label="View Details ">
                    <ActionIcon
                        onClick={() => navigate(`risk-details/${rowData.id}`)}
                        color="yellow"
                        size="sm"
                    >
                        <IconEye className="!w-4/5 !h-4/5" stroke={1.5} />
                    </ActionIcon>
                </Tooltip>
            </div>
        );
    };

    return (
        <DataTable
            value={filteredRisks}
            paginator
            rows={10}
            responsiveLayout="scroll"
            size="small"
            className="p-mt-4"
        >
            <Column
                field="id"
                header="ID"
                body={(rowData: RiskData) => (
                    <Button variant="subtle" onClick={() => onSelect(rowData)}>
                        {rowData.id}
                    </Button>
                )}
            />
            <Column field="title" header="Title" />
            <Column field="department" header="Department" />
            <Column
                field="status"
                header="Status"
                body={(rowData: RiskData) => (
                    <Badge color={getStatusColor(rowData.status)} variant="dot">
                        {rowData.status}
                    </Badge>
                )}
            />
            <Column
                style={{ fontWeight: 'normal', fontSize: '14px' }}
                headerStyle={{ width: '5rem', textAlign: 'center' }}
                bodyStyle={{ textAlign: 'center', overflow: 'visible' }}
                header="Actions"
                body={actionBodyTemplate}
            />
        </DataTable>
    );
};

export default RiskTable;
