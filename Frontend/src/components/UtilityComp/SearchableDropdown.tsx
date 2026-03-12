import React from 'react';
import { Group, Select, SelectProps, Text } from '@mantine/core';

interface Item {
    id: string;
    name: string;
    [key: string]: any; // For additional properties
}

interface SearchableObjectDropdownProps {
    items: any[];
    onItemSelect: (item: Item) => void;
}

const SearchableObjectDropdown: React.FC<SearchableObjectDropdownProps> = ({ items, onItemSelect }) => {
    const handleSelect = (selectedValue: string | null) => {
        if (selectedValue) {
            const selectedItem = items.find(item => item.id == selectedValue);
            if (selectedItem) {
                onItemSelect(selectedItem);

            }
        }
    };
    const selectData = items.map(item => ({
        value: "" + item.id,
        label: item.name,
        description: item.description,
    }));
    const renderSelectOption: SelectProps['renderOption'] = ({ option }: any) => (

        <Group wrap='nowrap' >
            <div>
                <Text size="sm">{option.label}</Text>
                <Text size="xs" color="dimmed">
                    {option.description}
                </Text>
            </div>
        </Group>

    );
    return (
        <Select
            searchable
            placeholder="Select a checklist"

            data={selectData}
            renderOption={renderSelectOption}
            value={null} // Keeps select blank after choosing
            onChange={handleSelect}
            nothingFoundMessage="No options"
        />
    );
};

export default SearchableObjectDropdown;