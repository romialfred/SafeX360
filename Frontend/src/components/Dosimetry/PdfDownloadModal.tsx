/**
 * PdfDownloadModal — Phase 9-B Frontend (LOT Dosimetrie & Expositions).
 *
 * Modal reutilisable pour les telechargements de rapports nominatifs (RGPD
 * strict). Avant de declencher le download Blob, l'utilisateur doit :
 *   1. Saisir un motif d'acces (Textarea, min 10 caracteres) — sera transmis
 *      au backend via le header {@code X-Reason} et journalise dans
 *      {@code DosimetryAuditLog} (RGPD art.30 + AIEA GSR Part 3).
 *   2. Cocher la confirmation "Je confirme que cette demande est legitime"
 *      (engagement professionnel + tracabilite forensique).
 *
 * Props :
 *   - opened       : boolean — controle d'ouverture.
 *   - onClose      : callback ferme le modal.
 *   - title        : titre i18n du modal (ex. "Attestation individuelle de dose").
 *   - subtitle     : sous-titre optionnel (description de la donnee fournie).
 *   - filename     : nom du fichier propose pour le download (ex. attestation_M001_2026.pdf).
 *   - onConfirm    : function (reason) => Promise<Blob> — appel au service de download.
 *                    Le modal s'occupe ensuite de declencher le download navigateur via
 *                    {@code triggerBrowserDownload} puis ferme la modale + toast success.
 *   - lockReason   : optionnel — si fourni, le textarea est pre-rempli + non-editable
 *                    (cas SELF : motif "Acces personnel art.15 RGPD" force).
 *
 * Accessibilite :
 *   - Bouton "Generer le PDF" disable tant que :
 *       - reason.trim().length < 10
 *       - !legitimacyChecked
 *       - loading en cours
 *   - Loader spinner pendant l'appel reseau, blocage des actions.
 *   - Notifications success/error via NotificationUtility.
 *
 * Contrainte : tsc strict + vite EXIT 0.
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Textarea, Checkbox, Button, Group } from '@mantine/core';
import {
    IconShieldLock,
    IconDownload,
    IconInfoCircle,
    IconFileCertificate,
} from '@tabler/icons-react';
import {
    successNotification,
    errorNotification,
} from '../../utility/NotificationUtility';
import { triggerBrowserDownload } from '../../services/DosimetryService';

// ─────────────────────────────────────────────────────────────────────────────
//  Props
// ─────────────────────────────────────────────────────────────────────────────

export interface PdfDownloadModalProps {
    /** Etat ouvert / ferme. */
    opened: boolean;
    /** Callback de fermeture. */
    onClose: () => void;
    /** Titre i18n du modal. */
    title: string;
    /** Sous-titre / description optionnelle. */
    subtitle?: string;
    /** Nom du fichier propose pour le download. */
    filename: string;
    /**
     * Action de download proprement dite — recoit le motif RGPD valide,
     * retourne le Blob du fichier (PDF / XML / CSV). Le modal se charge ensuite
     * du download via {@link triggerBrowserDownload}.
     */
    onConfirm: (reason: string) => Promise<Blob>;
    /**
     * Optionnel — motif force (lecture seule). Cas SELF : pre-rempli avec
     * le motif "Acces personnel" et non editable.
     */
    lockReason?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Composant
// ─────────────────────────────────────────────────────────────────────────────

const PdfDownloadModal = ({
    opened,
    onClose,
    title,
    subtitle,
    filename,
    onConfirm,
    lockReason,
}: PdfDownloadModalProps) => {
    const { t } = useTranslation('dosimetry');

    const [reason, setReason] = useState<string>(lockReason ?? '');
    const [legitimacyChecked, setLegitimacyChecked] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    // Reset interne a chaque ouverture (et chaque changement de lockReason).
    useEffect(() => {
        if (opened) {
            setReason(lockReason ?? '');
            setLegitimacyChecked(false);
            setLoading(false);
        }
    }, [opened, lockReason]);

    const effectiveReason = (lockReason ?? reason).trim();
    const reasonValid = effectiveReason.length >= 10;
    const canSubmit = reasonValid && legitimacyChecked && !loading;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setLoading(true);
        try {
            const blob = await onConfirm(effectiveReason);
            triggerBrowserDownload(blob, filename);
            successNotification(
                t('reports.modal.successToast', { filename }),
            );
            onClose();
        } catch (err: any) {
            // 403 → permission refusee, 404 → ressource introuvable, autres → generique.
            const status = err?.response?.status;
            let message = t('reports.modal.errorGeneric');
            if (status === 403) {
                message = t('reports.modal.errorForbidden');
            } else if (status === 404) {
                message = t('reports.modal.errorNotFound');
            } else if (status === 400) {
                message = t('reports.modal.errorBadRequest');
            }
            errorNotification(message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (loading) return; // ne pas fermer pendant un download en cours
        onClose();
    };

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            centered
            size="md"
            withCloseButton={!loading}
            closeOnClickOutside={!loading}
            closeOnEscape={!loading}
            title={
                <span
                    style={{
                        fontFamily: "'Source Serif 4', Georgia, serif",
                        fontWeight: 600,
                        fontSize: '15px',
                    }}
                    className="text-slate-900 inline-flex items-center gap-2"
                >
                    <IconFileCertificate size={16} className="text-indigo-600" />
                    {title}
                </span>
            }
        >
            <div className="space-y-3">
                {subtitle && (
                    <p className="text-[12px] text-slate-500">{subtitle}</p>
                )}

                {/* ─── Notice RGPD ─── */}
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-[11.5px]">
                    <IconShieldLock
                        size={14}
                        stroke={1.8}
                        className="mt-0.5 flex-shrink-0"
                    />
                    <span>{t('reports.modal.rgpdNotice')}</span>
                </div>

                {/* ─── Textarea motif ─── */}
                <Textarea
                    label={t('reports.modal.reasonLabel')}
                    description={t('reports.modal.reasonDescription')}
                    placeholder={t('reports.modal.reasonPlaceholder')}
                    value={lockReason ?? reason}
                    onChange={(e) => setReason(e.currentTarget.value)}
                    minRows={3}
                    autosize
                    required
                    disabled={loading || Boolean(lockReason)}
                    error={
                        !lockReason && reason.length > 0 && !reasonValid
                            ? t('reports.modal.reasonTooShort')
                            : undefined
                    }
                />

                {/* ─── Filename hint ─── */}
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-[11.5px]">
                    <IconInfoCircle
                        size={13}
                        stroke={1.8}
                        className="mt-0.5 flex-shrink-0 text-slate-500"
                    />
                    <span>
                        {t('reports.modal.filenameHint')}{' '}
                        <span className="font-mono text-slate-900">{filename}</span>
                    </span>
                </div>

                {/* ─── Checkbox legitimite ─── */}
                <Checkbox
                    checked={legitimacyChecked}
                    onChange={(e) =>
                        setLegitimacyChecked(e.currentTarget.checked)
                    }
                    disabled={loading}
                    label={
                        <span className="text-[12.5px] text-slate-800">
                            {t('reports.modal.legitimacyLabel')}
                        </span>
                    }
                />

                {/* ─── Actions ─── */}
                <Group justify="flex-end" gap="sm" mt="md">
                    <Button
                        variant="default"
                        size="xs"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        {t('reports.modal.cancel')}
                    </Button>
                    <Button
                        size="xs"
                        color="indigo"
                        loading={loading}
                        disabled={!canSubmit}
                        onClick={handleSubmit}
                        leftSection={<IconDownload size={13} />}
                    >
                        {t('reports.modal.submit')}
                    </Button>
                </Group>
            </div>
        </Modal>
    );
};

export default PdfDownloadModal;
