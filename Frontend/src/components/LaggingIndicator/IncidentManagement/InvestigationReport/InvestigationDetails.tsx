import { Select } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { PickList } from "primereact/picklist";
import { useEffect, useState } from "react";
import { investMethod } from "../../../../Data/DropdownData";
import { INVESTIGATION_ROLE_LABELS, INVESTIGATION_ROLE_OPTIONS } from "../incidentLabels";
import { getDateDifferenceInDays } from "../../../../utility/DateFormats";


const InvestigationDetails = ({ incident, form, employees }: any) => {
    const [editingRoleId, setEditingRoleId] = useState<number | null>(null);


    useEffect(() => {
        if (!employees || employees.length === 0) return;
        if (form.values.team && form.values.team.length > 0 && !form.values.team[0].name) {
            const empIds = form.values.team.map((emp: any) => emp.id);
            const filteredEmps = employees.filter((emp: any) => empIds.includes(emp.id)).map((emp: any) => ({ ...emp, pos: "Target" }));
            form.setFieldValue('team', filteredEmps);
        }


    }, [employees, form.values.team]);
    const emps = employees.filter(
        (emp: any) => !form.values.team.some((w: any) => w.id === emp.id)
    );

    // useEffect(() => {
    //     setEmps(employees);
    // }, [employees]);
    const onChange = (event: any) => {


        form.setFieldValue('team', (event.target?.map((x: any) => ({ ...x, pos: "Target" }))));
    };

    const handleRoleChange = (id: number, value: string) => {
        let selEmp: any = form.values.team
        form.setFieldValue('team', selEmp.map((item: any) =>

            item.id === id ? { ...item, role: value } : item)

        )
        setEditingRoleId(null); // hide dropdown after selection
    };

    const itemTemplate = (item: any) => {
        return (
            <div className={` ${item.pos === "Target" ? "w-[500px]" : "w-[400px]"} flex gap-5 justify-between self-center`}>
                <div className='flex  gap-3 items-center'>
                    <span className="text-sm">{item.name}</span>
                    <span className="font-normal text-xs"> {item.empNumber}</span>
                </div>
                {item.pos === "Target" && (
                    <div className='flex items-center gap-2 w-[220px]'>
                        {editingRoleId === item.id || !item.role ? (
                            <Select
                                autoFocus
                                allowDeselect={false}
                                placeholder="Attribuer un rôle"
                                data={INVESTIGATION_ROLE_OPTIONS}
                                value={item.role}
                                onChange={(val) => handleRoleChange(item.id, val!)}
                                className="w-full"
                            />
                        ) : (
                            <div
                                className="cursor-pointer text-sm px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
                                onClick={() => setEditingRoleId(item.id)}
                            >
                                {INVESTIGATION_ROLE_LABELS[item.role] ?? item.role}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="p-5 mt-3 border rounded-lg border-gray-300 shadow-md flex flex-col gap-5">

            <div className="flex flex-col gap-2">
                <h2 className="text-lg text-gray-800 ">Méthode</h2>
                <Select {...form.getInputProps("method")} allowDeselect={false} placeholder="Sélectionner la méthode" data={investMethod} />

            </div>
            <div className="flex flex-col gap-2">
                <h2 className="text-lg text-gray-800 ">Calendrier</h2>
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4 ">
                        <DateInput minDate={incident.discoveryDate ? new Date(incident.discoveryDate) : undefined} {...form.getInputProps("startDate")} label="Date de début" maxDate={form.values.endDate ?? new Date()} placeholder="Sélectionner la date de début" withAsterisk />
                        <DateInput {...form.getInputProps("endDate")} minDate={form.values.startDate} maxDate={new Date()} label="Date de fin" placeholder="Sélectionner la date de fin" /></div>

                    {(form.values.startDate && form.values.endDate) && <div className="bg-green-50 border-green-500 border rounded-xl shadow-sm p-3">
                        <p className="text-sm text-green-700">Durée de l'investigation : <span className=" text-green-700"> {getDateDifferenceInDays(form.values.startDate, form.values.endDate)} jour(s)</span></p></div>}
                </div>

            </div>

            <div className="flex flex-col gap-3">
                <h2 className="text-lg text-gray-800 ">Équipe</h2>
                {form.errors.team && <div className="text-red-500 text-sm">{form.errors.team}</div>}
                <div className=' [&>legend]:w-fit '>
                    <PickList
                        dataKey="id"
                        filter
                        filterBy="name"
                        sourceFilterPlaceholder="Rechercher par nom"
                        targetFilterPlaceholder="Rechercher par nom"
                        showTargetControls={false}
                        showSourceControls={false}
                        source={emps}
                        target={form.values.team.map((x: any) => ({ ...x, pos: "Target" }))}
                        onChange={onChange}
                        itemTemplate={itemTemplate}
                        breakpoint="1280px"
                        sourceHeader={`Employés disponibles (${emps?.length})`}
                        targetHeader={`Équipe d'investigation (${form.values.team.length})`}
                        sourceStyle={{ height: '16rem' }}
                        targetStyle={{ height: '16rem' }}
                    />
                </div>


            </div>
        </div>
    )
}

export default InvestigationDetails