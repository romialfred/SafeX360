import { useState } from 'react';
import { Badge, Button, Text } from '@mantine/core';
import { IconFileX, IconMail } from '@tabler/icons-react';
import { ActionItem, notifyActionItem } from '../../../services/ComplianceDashboardService';
import { successNotification, errorNotification } from '../../../utility/NotificationUtility';

interface MissingFileProps {
    items: ActionItem[];
}

const MissingFile = ({ items }: MissingFileProps) => {
    const [sendingIds, setSendingIds] = useState<Set<string | number>>(new Set());

    const extractRequirementId = (item: ActionItem) => {
        const rawId = (item as any)?.requirementId ?? item.id;
        if (!rawId) return null;
        const parts = String(rawId).split("-");
        return parts[0] || null;
    };

    const handleNotify = async (item: ActionItem) => {
        const requirementId = extractRequirementId(item);
        if (!item.employee?.id || !requirementId) return;
        const key = `${item.employee.id}-${requirementId}`;
        setSendingIds((prev) => new Set(prev).add(key));
        try {
            await notifyActionItem({
                employeeId: item.employee.id,
                requirementId,
            });
            successNotification("Alert sent successfully");
        } catch (error: any) {
            console.error("Failed to send alert", error);
            errorNotification(error?.response?.data?.errorMessage || "Failed to send alert");
        } finally {
            setSendingIds((prev) => {
                const next = new Set(prev);
                next.delete(key);
                return next;
            });
        }
    };

    return (
        <div
            className='p-4 rounded-xl border border-gray-200'
            style={{ background: 'linear-gradient(135deg, #f9fbff 0%, #eef2ff 100%)' }}
        >
            <div className='flex flex-col gap-4'>
                {items.map((item) => (
                    <div key={item.id} className='bg-white/95 p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3 backdrop-blur-sm'>
                        <div className='flex flex-wrap items-start justify-between gap-3'>
                            <div className='flex items-start gap-3'>
                                <div className='rounded-full bg-gray-100 p-2'>
                                    <IconFileX size={20} className='text-gray-600' />
                                </div>
                                <div className='flex flex-col gap-1'>
                                    <Text fw={600} c="dark.6">{item.requirementTitle}</Text>
                                    <Text size="sm" c="gray.7">
                                        {item.employee?.name} &middot; {item.employee?.role}
                                    </Text>
                                    <Text size="xs" c="gray.5">Department: {item.employee?.department || "—"}</Text>
                                </div>
                            </div>
                            <div className='flex items-center gap-2'>
                                <Badge color="gray" variant="light" radius="sm">
                                    {item.statusDetail || "Missing"}
                                </Badge>
                                <Button
                                    variant="light"
                                    color="gray"
                                    size="xs"
                                    leftSection={<IconMail size={14} />}
                                    loading={sendingIds.has(`${item.employee?.id}-${extractRequirementId(item)}`)}
                                    onClick={() => handleNotify(item)}
                                >
                                    Send Alert
                                </Button>
                            </div>
                        </div>
                        {item.description && (
                            <Text size="sm" c="gray.6">
                                {item.description}
                            </Text>
                        )}
                    </div>
                ))}
                {!items.length && (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-white/60 p-6 text-center text-sm text-gray-600">
                        No missing documentation flagged.
                    </div>
                )}
            </div>
        </div>
    )
}

export default MissingFile;
