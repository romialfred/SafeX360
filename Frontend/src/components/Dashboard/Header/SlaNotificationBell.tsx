import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Drawer, Indicator, ScrollArea, SegmentedControl, Tooltip } from "@mantine/core";
import { IconBellRinging, IconAlertTriangle, IconClockExclamation, IconArrowBigUpLines, IconChecks } from "@tabler/icons-react";
import { useSelector } from "react-redux";
import {
    getHseNotifications,
    getHseUnreadCount,
    markAllHseNotificationsRead,
    markHseNotificationRead,
    HseNotification,
} from "../../../services/HseNotificationService";

// Cloche de notifications SLA HSE (ISO 45001 §9.1) — fil réel des ruptures de
// délai (actions correctives / recommandations en retard ou bientôt dues),
// cloisonné par mine. Remplace l'ancien bloc « notifications » factice.

const SEVERITY_STYLE: Record<string, { border: string; badge: string; label: string }> = {
    CRITICAL: { border: "border-l-red-500", badge: "red", label: "Critique" },
    WARNING: { border: "border-l-amber-500", badge: "orange", label: "Alerte" },
    INFO: { border: "border-l-blue-400", badge: "blue", label: "Info" },
};

const typeIcon = (type: string) => {
    if (type?.includes("ESCALATED")) return <IconArrowBigUpLines size={18} className="text-red-600" />;
    if (type?.includes("OVERDUE")) return <IconAlertTriangle size={18} className="text-amber-600" />;
    return <IconClockExclamation size={18} className="text-blue-500" />;
};

const relativeTime = (iso: string): string => {
    if (!iso) return "";
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return "";
    const diffMin = Math.round((Date.now() - then) / 60000);
    if (diffMin < 1) return "à l'instant";
    if (diffMin < 60) return `il y a ${diffMin} min`;
    const diffH = Math.round(diffMin / 60);
    if (diffH < 24) return `il y a ${diffH} h`;
    const diffD = Math.round(diffH / 24);
    return `il y a ${diffD} j`;
};

const SlaNotificationBell = () => {
    const selectedCompanyId = useSelector((state: any) => state.companySelection?.selectedCompanyId ?? null);
    const [opened, setOpened] = useState(false);
    const [unread, setUnread] = useState(0);
    const [items, setItems] = useState<HseNotification[]>([]);
    const [filter, setFilter] = useState<"all" | "unread">("all");
    const [loading, setLoading] = useState(false);

    const refreshCount = useCallback(() => {
        getHseUnreadCount().then(setUnread).catch(() => {});
    }, []);

    const refreshList = useCallback(() => {
        setLoading(true);
        getHseNotifications(filter === "unread", 30)
            .then((res) => setItems(Array.isArray(res) ? res : []))
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, [filter]);

    // Compteur : au montage, quand la mine change, puis toutes les 60 s.
    useEffect(() => {
        refreshCount();
        const id = window.setInterval(refreshCount, 60000);
        return () => window.clearInterval(id);
    }, [refreshCount, selectedCompanyId]);

    // Liste : à l'ouverture, au changement de filtre ou de mine (si ouvert).
    useEffect(() => {
        if (opened) refreshList();
    }, [opened, filter, selectedCompanyId, refreshList]);

    const handleOpenItem = (n: HseNotification) => {
        if (!n.read) {
            markHseNotificationRead(n.id)
                .then(() => {
                    setItems((prev) => prev.map((it) => (it.id === n.id ? { ...it, read: true } : it)));
                    setUnread((c) => Math.max(0, c - 1));
                })
                .catch(() => {});
        }
    };

    const handleMarkAll = () => {
        markAllHseNotificationsRead()
            .then(() => {
                setItems((prev) => prev.map((it) => ({ ...it, read: true })));
                setUnread(0);
            })
            .catch(() => {});
    };

    const visible = filter === "unread" ? items.filter((i) => !i.read) : items;

    return (
        <>
            <Indicator inline color="red" label={unread > 99 ? "99+" : unread} disabled={unread === 0} offset={6} size={16}>
                <button
                    type="button"
                    className="flex items-center cursor-pointer transition-colors duration-200 justify-center rounded-full hover:bg-slate-100 p-2"
                    onClick={() => setOpened(true)}
                    aria-label="Notifications SLA HSE"
                >
                    <IconBellRinging stroke={1.8} size={22} strokeLinecap="round" strokeLinejoin="round" className="text-slate-600" />
                </button>
            </Indicator>

            <Drawer
                opened={opened}
                onClose={() => setOpened(false)}
                padding="md"
                size="md"
                position="right"
                title={<span className="font-semibold text-slate-800">Alertes SLA — délais HSE</span>}
            >
                <div className="flex flex-col h-full">
                    <div className="bg-white z-10 pb-3 sticky top-0 flex items-center gap-2">
                        <SegmentedControl
                            value={filter}
                            onChange={(v) => setFilter(v as "all" | "unread")}
                            color="teal"
                            size="xs"
                            data={[
                                { label: "Toutes", value: "all" },
                                { label: "Non lues", value: "unread" },
                            ]}
                        />
                        <Tooltip label="Tout marquer comme lu">
                            <Button
                                variant="light"
                                color="teal"
                                size="xs"
                                leftSection={<IconChecks size={16} />}
                                onClick={handleMarkAll}
                                disabled={unread === 0}
                            >
                                Tout lire
                            </Button>
                        </Tooltip>
                    </div>

                    <ScrollArea className="flex-grow w-full">
                        {loading && <p className="text-sm text-slate-400 p-4 text-center">Chargement…</p>}
                        {!loading && visible.length === 0 && (
                            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-slate-400">
                                <IconBellRinging size={40} stroke={1.3} />
                                <p className="text-sm">
                                    {selectedCompanyId
                                        ? "Aucune alerte de délai pour cette mine."
                                        : "Sélectionnez une mine pour voir ses alertes SLA."}
                                </p>
                            </div>
                        )}
                        <div className="flex flex-col gap-2 py-1">
                            {visible.map((n) => {
                                const style = SEVERITY_STYLE[n.severity] ?? SEVERITY_STYLE.INFO;
                                return (
                                    <button
                                        type="button"
                                        key={n.id}
                                        onClick={() => handleOpenItem(n)}
                                        className={`text-left w-full border-l-4 ${style.border} rounded-r-md px-3 py-2.5 transition-colors ${
                                            n.read ? "bg-slate-50 hover:bg-slate-100" : "bg-amber-50/60 hover:bg-amber-50"
                                        }`}
                                    >
                                        <div className="flex items-start gap-2">
                                            <span className="mt-0.5 shrink-0">{typeIcon(n.type)}</span>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm ${n.read ? "text-slate-600" : "text-slate-900 font-semibold"}`}>
                                                        {n.title}
                                                    </span>
                                                    {!n.read && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />}
                                                </div>
                                                <p className="text-xs text-slate-600 mt-0.5 break-words">{n.message}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge size="xs" color={style.badge} variant="light">
                                                        {style.label}
                                                    </Badge>
                                                    <span className="text-[11px] text-slate-400">{relativeTime(n.createdAt)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </div>
            </Drawer>
        </>
    );
};

export default SlaNotificationBell;
