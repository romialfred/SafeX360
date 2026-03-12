import { Card, Group, MultiSelect, MultiSelectProps, Text } from "@mantine/core";
import TextEditor from "../../../UtilityComp/TextEditor";
import { DateTimePicker } from "@mantine/dates";

const Interview = ({ form, employee }: any) => {


    const renderMultiSelectOption: MultiSelectProps['renderOption'] = ({ option }: any) => (

        <Group wrap='nowrap' >
            <div>
                <Text size="sm">{option.label}</Text>
                <Text size="xs" color="dimmed">
                    {option.empNumber}
                </Text>
            </div>
        </Group>

    );
    return (
        <Card shadow="sm" radius="md" className="mt-4 flex  flex-col gap-5">
            <MultiSelect {...form.getInputProps("interviews.employees")} label="Employees" placeholder="Pick employees" data={employee} clearable searchable renderOption={renderMultiSelectOption} hidePickedOptions />
            <DateTimePicker {...form.getInputProps("interviews.interviewDate")} label="Interview date and time" placeholder="Pick date and time" />
            <TextEditor form={form} id={`interviews.description`} title="Description" />
        </Card>
    )
}

export default Interview