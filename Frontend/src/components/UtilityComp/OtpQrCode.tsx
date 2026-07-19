import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/**
 * OtpQrCode — QR code d'enrôlement TOTP, rendu en SVG INLINE.
 *
 * POURQUOI SVG ET NON CANVAS/IMAGE. La plateforme applique une CSP stricte.
 * Un `<img src="data:...">` exigerait `img-src data:` et un `<canvas>` de la
 * mémoire ; le SVG inline (chaîne de `<path>`) ne demande RIEN de tout cela et
 * reste net à toute résolution — idéal pour un QR qu'on scanne à l'écran.
 *
 * La génération est asynchrone : on rend un cadre de la bonne taille pendant le
 * calcul (aucun saut de mise en page), puis on injecte le SVG. Le contenu vient
 * de la bibliothèque `qrcode` (des chemins déterministes, pas du HTML tiers) et
 * la donnée encodée — l'URI otpauth — est déjà présente dans le DOM sous forme
 * de clé manuelle : le QR n'expose rien de nouveau.
 */
interface Props {
    /** URI `otpauth://totp/...` à encoder. */
    value: string;
    /** Côté du QR en pixels (défaut 208). */
    size?: number;
    /** Libellé d'accessibilité. */
    ariaLabel?: string;
}

export default function OtpQrCode({ value, size = 208, ariaLabel }: Props) {
    const [svg, setSvg] = useState<string | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let alive = true;
        setSvg(null);
        setFailed(false);
        QRCode.toString(value, {
            type: 'svg',
            margin: 1,
            // Correction d'erreur MEDIUM : robuste au léger flou d'un scan écran
            // sans densifier inutilement le motif.
            errorCorrectionLevel: 'M',
            color: { dark: '#0F172A', light: '#FFFFFF' }, // slate-900 sur blanc
        })
            .then((generated) => {
                if (!alive) return;
                // Le SVG de la lib porte une taille fixe : on la force à `size`
                // pour un rendu net et responsive.
                const sized = generated.replace(
                    /<svg([^>]*?)width="[^"]*"([^>]*?)height="[^"]*"/,
                    `<svg$1width="${size}"$2height="${size}"`,
                );
                setSvg(sized);
            })
            .catch(() => alive && setFailed(true));
        return () => {
            alive = false;
        };
    }, [value, size]);

    if (failed) {
        // Le QR n'est qu'un CONFORT : son échec ne doit jamais bloquer
        // l'enrôlement — la clé manuelle affichée à côté suffit.
        return (
            <div
                className="flex items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-[11.5px] text-slate-500 text-center p-3"
                style={{ width: size, height: size }}
            >
                QR indisponible — utilisez la clé manuelle ci-dessous.
            </div>
        );
    }

    if (!svg) {
        return (
            <div
                className="rounded-lg bg-slate-100 animate-pulse"
                style={{ width: size, height: size }}
                aria-busy="true"
                aria-label={ariaLabel}
            />
        );
    }

    return (
        <div
            role="img"
            aria-label={ariaLabel}
            className="rounded-lg bg-white p-2 shadow-sm border border-slate-200 inline-flex"
            // Contenu SVG déterministe issu de la lib `qrcode` (chemins, pas de
            // script) ; la donnée encodée est l'URI otpauth déjà présente à l'écran.
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
}
