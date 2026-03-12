import React from 'react';
import { Card, Grid, TextInput, Select, Button, Group, Title } from '@mantine/core';
import { IconSearch, IconFilter, IconClipboardList, IconActivity } from '@tabler/icons-react';

interface FilterBarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    departments: string[];
    selectedDepartment: string | null;
    onDepartmentChange: (value: string | null) => void;
    riskLevels: string[];
    selectedRiskLevel: string | null;
    onRiskLevelChange: (value: string | null) => void;
    statuses: string[];
    selectedStatus: string | null;
    onStatusChange: (value: string | null) => void;
    clearFilters: () => void;
    viewMode: 'table' | 'cards';
    onViewModeChange: (mode: 'table' | 'cards') => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
    searchTerm,
    onSearchChange,
    departments,
    selectedDepartment,
    onDepartmentChange,
    riskLevels,
    selectedRiskLevel,
    onRiskLevelChange,
    statuses,
    selectedStatus,
    onStatusChange,
    clearFilters,
    viewMode,
    onViewModeChange,
}) => (
    <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
        <Group justify="space-between" mb="md">
            <Title order={3}>Search and Filters</Title>
            <Group>
                <Button
                    variant={viewMode === 'table' ? 'filled' : 'outline'}
                    onClick={() => onViewModeChange('table')}
                    leftSection={<IconClipboardList size={16} />}
                    size="sm"
                >
                    Table
                </Button>
                <Button
                    variant={viewMode === 'cards' ? 'filled' : 'outline'}
                    onClick={() => onViewModeChange('cards')}
                    leftSection={<IconActivity size={16} />}
                    size="sm"
                >
                    Cards
                </Button>
            </Group>
        </Group>

        <Grid align="center">
            <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                    placeholder="Search risks by ID, title, department, owner, status..."
                    leftSection={<IconSearch size={16} />}
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.currentTarget.value)}
                />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
                <Group justify="flex-end">
                    <Button
                        variant="outline"
                        leftSection={<IconFilter size={16} />}
                        onClick={clearFilters}
                    >
                        Clear Filters
                    </Button>
                </Group>
            </Grid.Col>
        </Grid>

        <Grid mt="md">
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <Select
                    placeholder="Filter by Department"
                    data={departments}
                    value={selectedDepartment}
                    onChange={onDepartmentChange}
                    clearable
                />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <Select
                    placeholder="Filter by Risk Level"
                    data={riskLevels}
                    value={selectedRiskLevel}
                    onChange={onRiskLevelChange}
                    clearable
                />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <Select
                    placeholder="Filter by Status"
                    data={statuses}
                    value={selectedStatus}
                    onChange={onStatusChange}
                    clearable
                />
            </Grid.Col>
        </Grid>
    </Card>
);

export default FilterBar;
