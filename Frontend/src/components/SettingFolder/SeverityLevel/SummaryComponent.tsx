
import { BarChart, PieChart } from '@mantine/charts';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Box, Card, Grid, Stack, Text } from '@mantine/core';
import { useEffect, useState } from 'react';


const pieMap: Record<string, string> = {
    1: "green",
    4: "red",
    3: "orange",
    2: "yellow",
    5: "brown"
}

const colors = ['green', 'yellow', 'orange', 'red', 'blue', 'cyan', 'pink'];


const renderLevelCell = (value: number, bgColor: string, textColor: string) => (
    <div
        className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold mx-auto`}
        style={{ backgroundColor: bgColor, color: textColor }}
    >
        {value}
    </div>
);

const normalize = (str: any) => str.toLowerCase().replace(/[^a-z]/g, '');

const SummaryComponent = ({ severityLevelCount, categoryCount, categorySeverityCount, categories }: any) => {

    const [pieData, setPieData] = useState<any[]>([]);
    const [totalIncidents, setTotalIncidents] = useState(0);
    const [categoryData, setCategoryData] = useState<any[]>([]);
    const [series, setSeries] = useState<any[]>([]);
    // const [colorMap, setColorMap] = useState<Record<string, string>>({});
    const [tableData, setTableData] = useState<any[]>([]);

    useEffect(() => {
        setPieData(severityLevelCount.map((x: any) => ({
            name: `Level ${x.level}`,
            value: x.count,
            color: pieMap[x.level] || 'gray',
        })));
        setTotalIncidents(severityLevelCount.reduce((acc: number, curr: any) => acc + curr.count, 0));
    }, [severityLevelCount]);

    useEffect(() => {
        setCategoryData(categoryCount.map((x: any) => ({
            name: x.name,
            [normalize(x.name)]: x.count,
        })));
    }, [categoryCount]);

    useEffect(() => {
        if (!categorySeverityCount || categorySeverityCount === 0 || !categories || categories.length === 0) return;
        const summaryMap = new Map();
        categories.forEach((category: any) => {
            summaryMap.set(category.name, {
                category: category.name,
                level1: 0,
                level2: 0,
                level3: 0,
                level4: 0,
                level5: 0,
                total: 0
            });
        });
        if (categorySeverityCount && categorySeverityCount.length > 0) {

            categorySeverityCount.forEach(({ name, level, count }: any) => {

                const entry = summaryMap.get(name);
                if (level >= 1 && level <= 5) {
                    entry[`level${level}`] += count;
                    entry.total += count;
                }
            });

            const result = Array.from(summaryMap.values());
            setTableData(result);
        }
    }, [categorySeverityCount, categories]);

    useEffect(() => {
        setSeries(categories.map((x: any, index: any) => ({
            name: normalize(x.name),
            label: x.name,
            color: colors[index % colors.length],
        })))
        // setColorMap(categories.reduce((acc: any, curr: any, index: number) => {
        //     const normalizedKey = normalize(curr.name);
        //     const color = colors[index % colors.length];
        //     return { ...acc, [normalizedKey]: color };
        // }, {}))
    }, [categories])




    return (
        <div className="space-y-6 ">

            <div className='grid grid-cols-2 gap-6'>
                <Card shadow="sm" p="lg" radius="md" withBorder className=" ">
                    <Stack gap="sm">
                        <div className="flex justify-between p-5">
                            <div>

                                <Text size="xl" fw={700}>Severity Levels Distribution</Text>
                            </div>

                        </div>
                    </Stack>
                    <div className="flex mx-auto flex-wrap gap-4 px-5">
                        {Object.keys(pieMap).map((item) => (
                            <div key={item} className="flex items-center gap-2">
                                <div
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: pieMap[item] }}
                                ></div>
                                <span className="text-sm font-medium">Level {item}</span>
                            </div>
                        ))}
                    </div>
                    <div className='flex justify-center items-center mt-4'>

                        <PieChart
                            h={400}
                            data={pieData}
                            size={298}
                            withTooltip
                        />
                    </div>


                    <div className=" font-semibold mx-auto text-gray-700">
                        Total Incident Type: <span className="text-blue-600 font-bold">{totalIncidents}</span>
                    </div>
                </Card>

                <Card shadow="sm" p="lg" radius="md" withBorder className=" ">
                    <Stack gap="sm">
                        <div className="flex justify-between p-5">
                            <div>

                                <Text size="xl" fw={700}>Incident Types by Category</Text>
                            </div>

                        </div>
                    </Stack>

                    <Grid mt="md" grow gutter={50}>
                        <Grid.Col span={8}>
                            <Box>
                                <BarChart
                                    h={400}
                                    type="stacked"
                                    data={categoryData}
                                    dataKey="name"
                                    yAxisProps={{ domain: [0, 2, 4, 8, 10, 12, 14, 16, 18, 20] }}
                                    series={series}
                                    tickLine="xy"
                                    withLegend


                                    legendProps={{ verticalAlign: 'top' }}



                                />
                            </Box>
                        </Grid.Col>
                    </Grid>
                </Card>
            </div>


            <Card shadow="sm" p="lg" radius="md" withBorder>
                <h2 className="text-xl font-bold mt-8 mb-4">Incident Type Severity Summary</h2>
                <DataTable selectionMode="single" rows={5} responsiveLayout="scroll" value={tableData} className='[&_.p-datatable-tbody]:!text-sm'>
                    <Column style={{ fontWeight: 'normal', fontSize: "14px" }} field="category" header="Category" />
                    <Column style={{ fontWeight: 'normal', fontSize: "14px" }} align="center" field="level1" header="Level 1" body={(row) => renderLevelCell(row.level1, '#e3f2fd', '#1565c0')} />
                    <Column style={{ fontWeight: 'normal', fontSize: "14px" }} align="center" field="level2" header="Level 2" body={(row) => renderLevelCell(row.level2, '#e8f5e9', '#2e7d32')} />
                    <Column style={{ fontWeight: 'normal', fontSize: "14px" }} align="center" field="level3" header="Level 3" body={(row) => renderLevelCell(row.level3, '#fff3e0', '#ef6c00')} />
                    <Column style={{ fontWeight: 'normal', fontSize: "14px" }} align="center" field="level4" header="Level 4" body={(row) => renderLevelCell(row.level4, '#fce4ec', '#ad1457')} />
                    <Column style={{ fontWeight: 'normal', fontSize: "14px" }} align="center" field="level5" header="Level 5" body={(row) => renderLevelCell(row.level5, '#f3e5f5', '#6a1b9a')} />
                    <Column style={{ fontWeight: 'normal', fontSize: "14px" }} align="center" field="total" header="Total" />
                </DataTable>
            </Card>
        </div>
    )
}

export default SummaryComponent