import { Group, MultiSelect, MultiSelectProps, Text } from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import TextEditor from "../../../UtilityComp/TextEditor";

/**
 * Entretiens employés réalisés pendant l'inspection : personnes rencontrées,
 * date de l'entretien et compte rendu.
 */
const Interview = ({ form, employee }: any) => {

    const renderMultiSelectOption: MultiSelectProps['renderOption'] = ({ option }: any) => (
        <Group wrap='nowrap'>
            <div>
                <Text size="sm">{option.label}</Text>
                <Text size="xs" c="dimmed">
                    {option.empNumber}
                </Text>
            </div>
        </Group>
    );

    return (
        <div className="flex flex-col gap-4">
            <MultiSelect
                {...form.getInputProps("interviews.employees")}
                label="Employés rencontrés"
                placeholder="Sélectionner les employés"
                data={employee}
                clearable
                searchable
                renderOption={renderMultiSelectOption}
                hidePickedOptions
                size="sm"
            />
            <DateTimePicker
                {...form.getInputProps("interviews.interviewDate")}
                label="Date et heure de l'entretien"
                placeholder="Sélectionner la date et l'heure"
                size="sm"
            />
            <TextEditor form={form} id={`interviews.description`} title="Compte rendu" />
        </div>
    )
}

export default Interview
