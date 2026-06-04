import { Button, Card, Text } from "@mantine/core";
import { IconCircleCheck, IconInbox } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { ActionItem } from "../../../services/ComplianceDashboardService";
import EmptyState from "../../UtilityComp/EmptyState";

interface PendingProps {
    items: ActionItem[];
    label?: string;
    seeAllHref?: string;
}

const Pending = ({ items, label = "Pending Review", seeAllHref }: PendingProps) => {
    if (!items.length) {
        return (
            /* LOT 41 E: EmptyState unifié pour la liste de revue en attente */
            <div className="bg-blue-50/40 h-[250px] rounded border border-blue-100 flex justify-center items-center">
                <EmptyState
                    icon={<IconInbox size={28} />}
                    title="Aucun élément en attente de revue"
                    description="Les éléments à examiner s'afficheront ici une fois soumis."
                    iconColor="sky"
                    compact
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
                <Text c="blue.6" size="sm">{label}</Text>
                {seeAllHref && (
                    <Button
                        component={Link}
                        to={seeAllHref}
                        variant="light"
                        color="blue"
                        size="xs"
                    >
                        See all
                    </Button>
                )}
            </div>
            {items.map((item) => (
                <Card key={item.id} withBorder className="bg-blue-50 border-blue-100">
                    <div className="flex gap-3 items-start">
                        <div className="bg-blue-100 rounded-full p-2">
                            <IconCircleCheck size={18} color="#1d4ed8" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <Text>{item.requirementTitle}</Text>
                            <Text size="sm" c="gray">
                                {item.employee?.name} - {item.employee?.role}
                            </Text>
                            <Text size="xs" c="gray">
                                Department: {item.employee?.department}
                            </Text>
                            {item.statusDetail && (
                                <Text size="xs" c="blue">
                                    {item.statusDetail}
                                </Text>
                            )}
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
};

export default Pending;
