import { Divider, Select } from "@mantine/core";
import { PickList } from "primereact/picklist";
import { useEffect } from "react";
import UpdateFileDropzone from "../../../UtilityComp/FileUpdateDropzone";

const WitnessesSection = ({ form, employees }: any) => {
    useEffect(() => {
        if (!employees || employees.length === 0) return;
        if (form.values.witnesses && form.values.witnesses.length > 0 && !form.values.witnesses[0].name) {
            const empIds = form.values.witnesses.map((emp: any) => emp.id);
            const filteredEmps = employees.filter((emp: any) => empIds.includes(emp.id));
            form.setFieldValue('witnesses', filteredEmps);
        }
        if (form.values.involvedPersons && form.values.involvedPersons.length > 0 && !form.values.involvedPersons[0].name) {

            const empIds = form.values.involvedPersons.map((emp: any) => emp.id);
            const filteredEmps = employees.filter((emp: any) => empIds.includes(emp.id));
            form.setFieldValue('involvedPersons', filteredEmps);
        }

    }, [employees, form.values.witnesses, form.values.involvedPersons]);
    const emps = employees.filter(
        (emp: any) => !form.values.witnesses.some((w: any) => w.id === emp.id)
    );

    const emps1 = employees.filter(
        (emp: any) => !form.values.involvedPersons.some((p: any) => p.id === emp.id)
    );

    const itemTemplate = (item: any) => {
        return (
            <div className={`  flex gap-5 justify-between`}>
                <span className="font-semibold text-sm">{item.name}</span>
                <span className="text-400 text-xs">{item.empNumber}</span>

            </div>
        );
    };
    const onChange = (event: any) => {
        form.setFieldValue('witnesses', event.target);
    };
    const onPersonChange = (event: any) => {
        form.setFieldValue('involvedPersons', event.target);
    };
    return (
        <div className="p-5 mt-5 border rounded-lg border-gray-300 shadow-md flex flex-col gap-5">

            <h2 className="text-xl font-semibold text-gray-800 mb-4">Witnesses & Involved Persons</h2>
            <div className="flex flex-col gap-2 border border-gray-300  rounded-lg p-4">
                <h1 className="text-xl font-semibold text-gray-800">Reporter</h1>
                <Select {...form.getInputProps("reporterId")} label="Select Reporter" placeholder="Choose an employee" withAsterisk data={employees.map((x: any) => ({ label: x.name, value: "" + x.id }))} />
            </div>
            <PickList
                dataKey="id"
                filter
                filterBy="name"
                sourceFilterPlaceholder="Search by name"
                showTargetControls={false}
                showSourceControls={false}
                targetFilterPlaceholder="Search by name"
                source={emps}
                target={form.values.witnesses}
                onChange={onChange}
                itemTemplate={itemTemplate}
                breakpoint="1280px"
                sourceHeader={`Employees (${emps.length})`}
                targetHeader={`Witnesses (${form.values.witnesses.length})`}
                sourceStyle={{ height: '24rem' }}
                targetStyle={{ height: '24rem' }}
            />
            <Divider my="lg" />

            <PickList
                dataKey="id"
                filter
                filterBy="name"
                sourceFilterPlaceholder="Search by name"
                showTargetControls={false}
                showSourceControls={false}
                targetFilterPlaceholder="Search by name"
                source={emps1}
                target={form.values.involvedPersons}
                onChange={onPersonChange}
                itemTemplate={itemTemplate}
                breakpoint="1280px"
                sourceHeader={`Employees ${emps1.length})`}
                targetHeader={`Involved Persons (${form.values.involvedPersons.length})`}
                sourceStyle={{ height: '24rem' }}
                targetStyle={{ height: '24rem' }}
            />
            <div className="p-5 mt-5 border rounded-lg border-gray-300 shadow-md">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Evidence</h2>
                {/* <UpdateImageDropzone form={form} id="evidence" /> */}
                <UpdateFileDropzone form={form} id="evidence" />
            </div >
        </div>
    )
}

export default WitnessesSection