/**
 * BlastPopupListener — popup globale d'avertissement de tir imminent
 * (LOT Blast P4).
 *
 * <p>S'abonne au topic STOMP {@code /topic/blast-popup} via le
 * {@link useEmergencyWebSocket} provider et affiche, sur tous les ecrans
 * (desktop + mobile), un encart Mantine sobre rouge avec :</p>
 * <ul>
 *   <li>Header rouge : « Tir imminent » / « Imminent blast »</li>
 *   <li>Reference du tir + zone + heure prevue (heure UI locale)</li>
 *   <li>Compteur temps restant (re-actualise toutes les secondes)</li>
 *   <li>Bouton « J'ai pris connaissance » (acknowledge -> dismiss)</li>
 * </ul>
 *
 * <p>Comportements :</p>
 * <ul>
 *   <li><strong>Auto-dismiss</strong> apres 3 minutes si non acquittee — laisse
 *       l'ecran libre une fois la fenetre d'attention passee.</li>
 *   <li><strong>Bilingue</strong> : tous les libelles passent par i18n
 *       ({@code blast.popup.*}). Suit la langue UI active de l'utilisateur.</li>
 *   <li><strong>Responsive</strong> : centre en desktop (max 480px), bottom-card
 *       en mobile (< sm). Aucune animation lourde, pas de plein ecran.</li>
 *   <li><strong>Reduced motion</strong> : si l'utilisateur a active
 *       {@code prefers-reduced-motion}, l'animation de progression du compteur
 *       est desactivee et seul le texte est mis a jour. Pas d'effet shake / pulse.</li>
 *   <li><strong>Idempotent</strong> : un popup re-emis pour le meme jobId / blastId
 *       n'empile pas plusieurs popups — le dernier remplace le precedent.</li>
 * </ul>
 *
 * <p>Volontairement distinct visuellement de la popup balayante d'Alerte
 * Generale (orange/rouge avec ondes concentriques) qui est elle-meme reservee
 * au declenchement T-10 et utilise le {@link GeneralAlertListener} existant.</p>
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Group, Text, Button, Badge, Box, ActionIcon } from '@mantine/core';
import { IconAlertTriangle, IconClock, IconMapPin, IconX } from '@tabler/icons-react';

import {
    useEmergencyWebSocket,
    type BlastPopupPayload,
} from '../EmergencyManagement/Sos/EmergencyWebSocketProvider';

/** Duree (ms) avant auto-dismiss si l'utilisateur n'acquitte pas. */
const AUTO_DISMISS_MS = 3 * 60 * 1000;

/**
 * Formate un nombre de secondes en {@code MM:SS} (ou {@code -MM:SS} si negatif —
 * le scheduler peut tirer un job avec quelques secondes de retard).
 */
const formatRemaining = (secs: number): string => {
    const sign = secs < 0 ? '-' : '';
    const abs = Math.abs(Math.floor(secs));
    const m = Math.floor(abs / 60);
    const s = abs % 60;
    return `${sign}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

/** Formate l'heure prevue ({@code scheduledAt} ISO) en {@code HH:mm} UI locale. */
const formatScheduledAt = (iso: string | null | undefined): string => {
    if (!iso) return '--:--';
    try {
        // L'ISO du backend est un LocalDateTime sans timezone (« 2026-06-18T14:00:00 »).
        // On parse en local pour eviter un decalage UTC accidentel.
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
        return iso;
    }
};

/**
 * Calcule les secondes restantes a partir d'un payload. Privilegie le
 * {@code timeRemainingSeconds} du serveur (autoritatif), mais retombe sur le
 * calcul local {@code scheduledAt - now} si absent.
 */
const computeRemaining = (popup: BlastPopupPayload, now: number): number => {
    if (typeof popup.timeRemainingSeconds === 'number') {
        // Le compteur derive a partir de l'instant ou le serveur a calcule
        // la valeur — qu'on approxime au moment de la reception (now au push).
        // Pour eviter de stocker un instant de reception separe, on prend
        // simplement timeRemainingSeconds tel quel et on decremente localement
        // via le tick (cf. ci-dessous).
        return popup.timeRemainingSeconds;
    }
    if (popup.scheduledAt) {
        const t0 = new Date(popup.scheduledAt).getTime();
        if (!Number.isNaN(t0)) return Math.floor((t0 - now) / 1000);
    }
    return 0;
};

/** Detecte la preference {@code prefers-reduced-motion} (lazy + reactive). */
const useReducedMotion = (): boolean => {
    const [reduced, setReduced] = useState<boolean>(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });
    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const handler = (ev: MediaQueryListEvent) => setReduced(ev.matches);
        try {
            mq.addEventListener('change', handler);
            return () => mq.removeEventListener('change', handler);
        } catch {
            // Safari < 14 : addListener legacy.
            mq.addListener?.(handler);
            return () => mq.removeListener?.(handler);
        }
    }, []);
    return reduced;
};

const BlastPopupListener = () => {
    const { t } = useTranslation('blast');
    const { subscribeBlastPopup } = useEmergencyWebSocket();
    const reducedMotion = useReducedMotion();

    const [popup, setPopup] = useState<BlastPopupPayload | null>(null);
    // Compteur local re-actualise par le tick — ne sert qu'a l'affichage.
    const [remaining, setRemaining] = useState<number>(0);
    // Cle d'unicite pour ignorer un re-broadcast identique consecutif.
    const lastKeyRef = useRef<string | null>(null);

    // ── Subscribe WebSocket ──────────────────────────────────────────────
    useEffect(() => {
        const unsub = subscribeBlastPopup((p) => {
            // Cle = jobId si dispo, sinon blastId + minutesToBlast.
            const key = p.jobId != null
                ? `job:${p.jobId}`
                : `blast:${p.blastId}:m${p.minutesToBlast ?? '?'}`;
            // Si on recoit un re-broadcast du meme job alors qu'on est deja
            // affiche, on remplace simplement le payload (rafraichissement
            // du temps restant) sans rejouer l'animation d'apparition.
            lastKeyRef.current = key;
            setPopup(p);
            setRemaining(computeRemaining(p, Date.now()));
        });
        return unsub;
    }, [subscribeBlastPopup]);

    // ── Tick 1s du compteur ──────────────────────────────────────────────
    useEffect(() => {
        if (!popup) return;
        const id = window.setInterval(() => {
            setRemaining((prev) => prev - 1);
        }, 1000);
        return () => window.clearInterval(id);
    }, [popup]);

    // ── Auto-dismiss apres AUTO_DISMISS_MS ───────────────────────────────
    useEffect(() => {
        if (!popup) return;
        const id = window.setTimeout(() => {
            setPopup(null);
        }, AUTO_DISMISS_MS);
        return () => window.clearTimeout(id);
    }, [popup]);

    const dismiss = useCallback(() => {
        setPopup(null);
    }, []);

    // Libelles bilingues memoizes (eviter recompute par tick du compteur).
    const labels = useMemo(() => ({
        title: t('popup.title', 'Tir imminent'),
        eyebrow: t('popup.eyebrow', 'Annonce de tir — Module Dynamitages'),
        scheduled: t('popup.scheduledLabel', 'Heure prevue'),
        zone: t('popup.zoneLabel', 'Zone concernee'),
        remaining: t('popup.remainingLabel', 'Temps restant'),
        reference: t('popup.referenceLabel', 'Reference'),
        ack: t('popup.ackButton', "J'ai pris connaissance"),
        close: t('popup.closeAriaLabel', 'Fermer la popup'),
    }), [t]);

    if (!popup) return null;

    const reference = popup.reference || popup.blastReference || '—';
    const zone = popup.zone || popup.pit || reference;
    const scheduledStr = formatScheduledAt(popup.scheduledAt);
    const remainingStr = formatRemaining(remaining);

    // Pourcentage de progression de l'auto-dismiss (visuel discret) — pas
    // d'animation si reduced-motion (CSS transition skipped).
    return (
        <div
            role="alertdialog"
            aria-live="assertive"
            aria-labelledby="blast-popup-title"
            aria-describedby="blast-popup-body"
            className="fixed z-[9500] left-1/2 -translate-x-1/2
                       bottom-4 sm:bottom-auto sm:top-20
                       w-[calc(100%-1.5rem)] sm:w-auto sm:max-w-[480px]"
        >
            <Card
                shadow="xl"
                radius="md"
                padding={0}
                withBorder
                style={{
                    overflow: 'hidden',
                    borderColor: '#b91c1c',
                    borderWidth: 2,
                    backgroundColor: '#ffffff',
                }}
            >
                {/* Header rouge */}
                <Box
                    style={{
                        background: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)',
                        padding: '0.875rem 1rem',
                        color: 'white',
                    }}
                >
                    <Group justify="space-between" wrap="nowrap" align="flex-start">
                        <Group gap={10} wrap="nowrap" align="flex-start">
                            <IconAlertTriangle size={26} stroke={2.4} />
                            <div>
                                <Text
                                    size="xs"
                                    fw={700}
                                    style={{
                                        letterSpacing: '0.12em',
                                        textTransform: 'uppercase',
                                        opacity: 0.9,
                                        lineHeight: 1,
                                        marginBottom: 4,
                                    }}
                                >
                                    {labels.eyebrow}
                                </Text>
                                <Text
                                    id="blast-popup-title"
                                    size="lg"
                                    fw={700}
                                    style={{ lineHeight: 1.15 }}
                                >
                                    {labels.title}
                                </Text>
                            </div>
                        </Group>
                        <ActionIcon
                            variant="subtle"
                            color="gray"
                            radius="xl"
                            onClick={dismiss}
                            aria-label={labels.close}
                            style={{ color: 'white' }}
                        >
                            <IconX size={18} />
                        </ActionIcon>
                    </Group>
                </Box>

                {/* Corps */}
                <Box id="blast-popup-body" px="md" py="md">
                    <Group gap={8} mb={10} wrap="wrap">
                        <Badge color="red" variant="light" radius="sm">
                            {labels.reference} : {reference}
                        </Badge>
                        {popup.minutesToBlast != null && (
                            <Badge color="orange" variant="light" radius="sm">
                                T-{popup.minutesToBlast} min
                            </Badge>
                        )}
                    </Group>

                    <Group gap={6} mb={6} wrap="nowrap">
                        <IconMapPin size={14} stroke={1.8} color="#64748b" />
                        <Text size="sm" c="dimmed">
                            {labels.zone} :
                        </Text>
                        <Text size="sm" fw={600}>{zone}</Text>
                    </Group>

                    <Group gap={6} mb={6} wrap="nowrap">
                        <IconClock size={14} stroke={1.8} color="#64748b" />
                        <Text size="sm" c="dimmed">
                            {labels.scheduled} :
                        </Text>
                        <Text size="sm" fw={600}>{scheduledStr}</Text>
                    </Group>

                    <Box
                        mt={10}
                        p={10}
                        style={{
                            backgroundColor: '#fef2f2',
                            borderRadius: 8,
                            border: '1px solid #fecaca',
                        }}
                    >
                        <Text size="xs" c="dimmed" mb={2}>
                            {labels.remaining}
                        </Text>
                        <Text
                            size="xl"
                            fw={700}
                            style={{
                                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                                color: '#991b1b',
                                lineHeight: 1.1,
                            }}
                            // Annonce vocale a chaque mise a jour majeure pour les
                            // lecteurs d'ecran — limitee a aria-live polite pour
                            // ne pas saturer.
                            aria-live="polite"
                        >
                            {remainingStr}
                        </Text>
                    </Box>

                    <Button
                        fullWidth
                        mt="md"
                        color="red"
                        size="md"
                        radius="md"
                        onClick={dismiss}
                        // Pas d'animation sur le bouton si reduced-motion.
                        styles={{
                            root: {
                                transition: reducedMotion ? 'none' : undefined,
                            },
                        }}
                    >
                        {labels.ack}
                    </Button>
                </Box>
            </Card>
        </div>
    );
};

export default BlastPopupListener;
