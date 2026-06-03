import { Card, Text, Group, Badge, Divider } from "@mantine/core";
import { IconCircleCheck, IconUser, IconCalendar } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { getAllRecommendations } from "../../../../services/AuditService";

const AuditDashClosed = () => {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    getAllRecommendations()
      .then((recs: any[]) => {
        const closed = (recs || [])
          .filter((r: any) => String(r.status || '').toUpperCase() === 'COMPLETED')
          .sort((a: any, b: any) => new Date(b.updatedAt || b.deadline || 0).getTime() - new Date(a.updatedAt || a.deadline || 0).getTime())
          .slice(0, 5);
        setItems(closed);
      })
      .catch(() => setItems([]));
  }, []);

  return (
    <Card shadow="xs" radius="md" withBorder p="lg" className="w-full">
      <div className="flex items-center justify-between mb-3">
        <Text size="xl">Closed Recommendations</Text>
        <Badge color="green" variant="light" leftSection={<IconCircleCheck size={14} />}>{items.length} closed</Badge>
      </div>

      <Divider my="sm" />

      <div className="flex flex-col gap-3">
        {items.map((rec: any) => (
          <Card key={rec.id} shadow="xs" p="sm" radius="md" withBorder className="bg-green-50/40 border-green-100">
            <Text c="dark" className="!mb-1">{rec.title || rec.description || '-'}</Text>
            <Group gap="md" className="text-xs text-gray-600">
              <span className="inline-flex items-center gap-1"><IconUser size={14} /> {rec.actionManagerName || rec.actionManagerId || '-'}</span>
              <span className="inline-flex items-center gap-1"><IconCalendar size={14} /> {rec.updatedAt ? new Date(rec.updatedAt).toLocaleDateString() : (rec.deadline ? new Date(rec.deadline).toLocaleDateString() : '-')}</span>
            </Group>
          </Card>
        ))}
        {items.length === 0 && (
          <Text size="sm" c="dimmed">No closed recommendations yet.</Text>
        )}
      </div>
    </Card>
  );
};

export default AuditDashClosed;

