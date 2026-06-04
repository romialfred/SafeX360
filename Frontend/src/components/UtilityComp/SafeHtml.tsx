import DOMPurify from 'dompurify';
import { useMemo } from 'react';

/**
 * SafeHtml — Wrapper sécurisé pour le contenu HTML utilisateur.
 *
 * LOT 41 P0 SECURITY : remplace dangerouslySetInnerHTML brut par une
 * version qui passe par DOMPurify.sanitize() pour bloquer toute injection
 * XSS (script, iframe, on* handlers, javascript: URLs).
 *
 * Configuration DOMPurify alignée avec TipTap (l'éditeur utilisé) :
 *  - balises formatage texte autorisées (p, h1-h6, ul, ol, li, strong, em, u, blockquote, code, pre)
 *  - liens autorisés mais sanitizés (pas de javascript:)
 *  - images autorisées (data: et https: seulement)
 *  - tableaux autorisés (table, thead, tbody, tr, td, th)
 *  - tout le reste est strippé
 *
 * Utilisation :
 *   <SafeHtml html={item.description} />
 *   <SafeHtml html={item.description} className="prose prose-sm" />
 */
interface Props {
    html: string | null | undefined;
    className?: string;
    /** Si true, autorise les balises de tableau (utile pour les rapports). Défaut: true. */
    allowTables?: boolean;
}

const DEFAULT_CONFIG = {
    ALLOWED_TAGS: [
        'p', 'br', 'span', 'div',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li',
        'strong', 'b', 'em', 'i', 'u', 's', 'mark',
        'blockquote', 'code', 'pre',
        'a', 'img',
        'table', 'thead', 'tbody', 'tr', 'td', 'th',
        'hr',
    ],
    ALLOWED_ATTR: [
        'href', 'target', 'rel',
        'src', 'alt', 'title', 'width', 'height',
        'class', 'style',
        'colspan', 'rowspan',
    ],
    // LOT 41 P1 audit fix : retire `data:` du regex pour éviter XSS via
    // <a href="data:text/html,...">. Les images data: URI sont traitées
    // séparément via les ALLOWED_ATTR + DOMPurify ALLOWED_DATA_URI hooks
    // si nécessaire au cas par cas.
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
};

export default function SafeHtml({ html, className }: Props) {
    const sanitized = useMemo(() => {
        if (!html || typeof html !== 'string') return '';
        return DOMPurify.sanitize(html, DEFAULT_CONFIG);
    }, [html]);

    if (!sanitized) {
        return <span className="text-slate-400 text-sm">—</span>;
    }
    return (
        <div
            className={className ?? 'prose prose-sm max-w-none'}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: sanitized }}
        />
    );
}
