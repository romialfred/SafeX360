import { QRCodeSVG } from 'qrcode.react';

/**
 * OtpQrCode — QR code d'enrôlement TOTP.
 *
 * Rendu via `qrcode.react` (QRCodeSVG) : un vrai `<svg>` DIMENSIONNÉ (width +
 * height), sans canvas ni `data:` URI — donc compatible avec la CSP stricte de
 * la plateforme et net à toute résolution.
 *
 * HISTORIQUE — pourquoi ce composant a été refait. La 1re version utilisait la
 * lib `qrcode` dont le build NAVIGATEUR émet un SVG SANS attributs width/height
 * (seulement un viewBox) : placé dans un conteneur flex, il s'effondrait à 0×0
 * et restait INVISIBLE. `qrcode.react` pose explicitement width/height : plus
 * de triturage de chaîne, plus d'angle mort.
 */
interface Props {
    /** URI `otpauth://totp/...` à encoder. */
    value: string;
    /** Côté du QR en pixels (défaut 200). */
    size?: number;
    /** Libellé d'accessibilité. */
    ariaLabel?: string;
}

export default function OtpQrCode({ value, size = 200, ariaLabel }: Props) {
    return (
        <div
            role="img"
            aria-label={ariaLabel}
            className="rounded-lg bg-white p-3 shadow-sm border border-slate-200 inline-flex items-center justify-center"
        >
            <QRCodeSVG
                value={value}
                size={size}
                // Correction d'erreur MEDIUM : robuste au léger flou d'un scan
                // à l'écran sans densifier inutilement le motif.
                level="M"
                marginSize={2}
                fgColor="#0F172A" // slate-900
                bgColor="#FFFFFF"
            />
        </div>
    );
}
