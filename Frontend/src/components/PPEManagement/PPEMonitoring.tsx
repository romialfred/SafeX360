import { ActionIcon, Badge, Button, Select, Text, Tooltip } from "@mantine/core";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEmployeesWithPosition } from "../../services/HrmsService";
import { mapIdToName } from "../../utility/OtherUtilities";
import { getAllAssignmentCounts } from "../../services/PpeEmpService";
import { getAllPPE } from "../../services/PPEService";
import { IconEye, IconHelmet, IconPackage, IconPlus } from "@tabler/icons-react";
import PageHeader from "../UtilityComp/PageHeader";

const PPEMonitoring = () => {
    const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const navigate = useNavigate();
    const [ppe, setPpe] = useState<any[]>([]);
    const [ppeEmp, setPpeEmp] = useState<any[]>([]);
    const [empMap, setEmpMap] = useState<Record<string, any>>({});

    useEffect(() => {
        getAllPPE().then((res) => {
            setPpe(res);
        }).catch((err) => {
            console.error(err);
        });

        getAllAssignmentCounts().then((res) => {
            setPpeEmp(res);
        }).catch((err) => {
            console.error(err);
        });

        getEmployeesWithPosition().then((data) => {
            setEmpMap(mapIdToName(data));
        }).catch((err) => {
            console.error(err);
        });
    }, []);

    const employeesTableData = useMemo(() => {
        return ppeEmp.map((emp) => ({
            ...emp,
            name: empMap[emp?.empId]?.name ?? '—',
            department: empMap[emp?.empId]?.department ?? 'Non assigné',
            position: empMap[emp?.empId]?.position ?? '—',
        }));
    }, [ppeEmp, empMap]);

    const departments = useMemo(() => {
        return [...new Set(employeesTableData.map(emp => emp.department || 'Non assigné'))];
    }, [employeesTableData]);

    const categories = useMemo(() => {
        return [...new Set(ppe.map(epp => epp.category))];
    }, [ppe]);

    const filteredEmployees = useMemo(() => {
        return employeesTableData.filter(emp => !selectedDepartment || emp.department === selectedDepartment);
    }, [employeesTableData, selectedDepartment]);

    const tableData = ppe.filter((x) => !selectedCategory || selectedCategory == x.category).map((epp) => {
        const stockStatus =
            epp.stock === 0
                ? "Rupture"
                : epp.stock <= epp.minStock
                    ? "Stock faible"
                    : "Normal";

        const stockColor =
            stockStatus === "Rupture"
                ? "red"
                : stockStatus === "Stock faible"
                    ? "orange"
                    : "green";

        return {
            ...epp,
            stockStatus,
            stockColor,
        };
    });

    const actionBodyTemplate = (rowData: any) => {
        return (
            <div className="flex gap-2">
                <Tooltip label="Voir le détail">
                    {/* LOT 40 P1: aria-label ajouté pour l'accessibilité */}
                    <ActionIcon
                        aria-label="Voir les détails de la dotation EPI"
                        onClick={() => navigate(`details/${rowData.empId}`)}
                        color="teal"
                        variant="light"
                        size="sm"
                    >
                        <IconEye className="!w-4/5 !h-4/5" stroke={1.75} />
                    </ActionIcon>
                </Tooltip>
            </div>
        );
    };

    return (
        <div className="p-5 space-y-5 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Gestion des EPI' },
                    { label: 'Suivi des EPI' },
                ]}
                icon={<IconHelmet size={22} stroke={2} />}
                iconColor="amber"
                title="Suivi des EPI"
                subtitle="Tracer la dotation, les inspections et la conformité des équipements de protection individuelle"
                actions={
                    <>
                        <Button
                            leftSection={<IconPlus size={15} />}
                            onClick={() => navigate('/ppe-management/create-ppe')}
                            size="sm"
                            radius="md"
                            color="blue"
                            variant="light"
                        >
                            Nouvel EPI
                        </Button>
                        <Button
                            leftSection={<IconPackage size={15} />}
                            onClick={() => navigate('/ppe-management/stock-form')}
                            size="sm"
                            radius="md"
                            color="teal"
                        >
                            Entrée de stock
                        </Button>
                    </>
                }
            />

            {/* === Section 1 : Dotations EPI par employé === */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <header className="px-4 py-2.5 bg-amber-50/60 border-b border-amber-200/70 flex flex-wrap items-center gap-3">
                    <div className="p-1 rounded bg-amber-100">
                        <IconHelmet size={14} className="text-amber-700" />
                    </div>
                    <h2 className="text-xs text-slate-800 uppercase tracking-wider">
                        Dotations EPI par employé
                    </h2>
                    <span className="text-[11px] text-slate-500">
                        {filteredEmployees.length} {filteredEmployees.length > 1 ? 'employés' : 'employé'}
                    </span>
                    <div className="ml-auto">
                        <Select
                            placeholder="Filtrer par département"
                            data={departments}
                            value={selectedDepartment}
                            onChange={setSelectedDepartment}
                            clearable
                            size="sm"
                            radius="md"
                            w={220}
                        />
                    </div>
                </header>
                <div className="p-3">
                    <DataTable
                        value={filteredEmployees}
                        stripedRows
                        paginator
                        rows={10}
                        size="small"
                        tableStyle={{ minWidth: '50rem' }}
                        dataKey="empId"
                        emptyMessage="Aucune dotation EPI enregistrée"
                    >
                        <Column field="name" header="Employé" sortable />
                        <Column field="department" header="Département" sortable />
                        <Column field="position" header="Poste" sortable />
                        <Column
                            header="EPI dotés"
                            body={(row) => (
                                <Badge color="blue" variant="light" size="sm" radius="sm">
                                    {row.count} EPI
                                </Badge>
                            )}
                        />
                        <Column
                            headerStyle={{ width: '5rem', textAlign: 'center' }}
                            bodyStyle={{ textAlign: 'center', overflow: 'visible' }}
                            header="Actions"
                            body={actionBodyTemplate}
                        />
                    </DataTable>
                </div>
            </div>

            {/* === Section 2 : Suivi des stocks EPI === */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <header className="px-4 py-2.5 bg-blue-50/60 border-b border-blue-200/70 flex flex-wrap items-center gap-3">
                    <div className="p-1 rounded bg-blue-100">
                        <IconPackage size={14} className="text-blue-700" />
                    </div>
                    <h2 className="text-xs text-slate-800 uppercase tracking-wider">
                        Suivi des stocks EPI
                    </h2>
                    <span className="text-[11px] text-slate-500">
                        {tableData.length} {tableData.length > 1 ? 'références' : 'référence'}
                    </span>
                    <div className="ml-auto">
                        <Select
                            placeholder="Filtrer par catégorie"
                            data={categories}
                            value={selectedCategory}
                            onChange={setSelectedCategory}
                            clearable
                            size="sm"
                            radius="md"
                            w={220}
                        />
                    </div>
                </header>
                <div className="p-3">
                    <DataTable
                        value={tableData}
                        stripedRows
                        paginator
                        rows={10}
                        size="small"
                        tableStyle={{ minWidth: '70rem' }}
                        emptyMessage="Aucun EPI enregistré"
                    >
                        <Column
                            field="name"
                            header="EPI"
                            sortable
                            body={(row) => (
                                <Text size="sm">{row.name}</Text>
                            )}
                        />
                        <Column field="category" header="Catégorie" sortable />
                        <Column
                            align="center"
                            header="Stock actuel"
                            sortable
                            body={(row) => (
                                <Text c={row.stockColor} size="sm">{row.stock}</Text>
                            )}
                        />
                        <Column align="center" field="minStock" header="Stock minimum" sortable />
                        <Column
                            align="center"
                            header="Statut stock"
                            body={(row) => (
                                <Badge color={row.stockColor} variant="light" size="sm" radius="sm">
                                    {row.stockStatus}
                                </Badge>
                            )}
                        />
                        <Column
                            align="center"
                            header="Statut EPI"
                            body={(row) => (
                                <Badge
                                    color={row.status === 'ACTIVE' ? 'green' : 'gray'}
                                    variant="filled"
                                    size="sm"
                                    radius="sm"
                                >
                                    {row.status === 'ACTIVE' ? 'Actif' : 'Inactif'}
                                </Badge>
                            )}
                        />
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default PPEMonitoring;
