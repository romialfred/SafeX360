import { ReactNode } from 'react';

/**
 * FormSection — Pattern unifié pour grouper les champs d'un formulaire.
 *
 * Structure cohérente :
 *   - Titre serif (Source Serif 4) + description
 *   - Séparation visuelle subtile
 *   - Grille responsive (1 col mobile → 2 cols tablet+)
 *
 * Utilisation :
 *   <FormSection
 *     title="Informations générales"
 *     description="Données principales de l'incident"
 *     columns={2}
 *   >
 *     <TextInput label="Titre" />
 *     <Select label="Catégorie" />
 *   </FormSection>
 */

interface FormSectionProps {
    title?: string;
    description?: string;
    columns?: 1 | 2 | 3;
    children: ReactNode;
    /** Index numérique optionnel (ex: "1. Informations") */
    index?: number;
    /** Désactiver le séparateur en haut */
    noDivider?: boolean;
    /** Action en bas de section (ex: bouton ajouter une ligne) */
    footer?: ReactNode;
}

const COL_CLASSES = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
};

export default function FormSection({
    title,
    description,
    columns = 2,
    children,
    index,
    noDivider = false,
    footer,
}: FormSectionProps) {
    return (
        <section className={!noDivider ? 'pt-6 first:pt-0 border-t border-slate-200 first:border-t-0' : ''}>
            {(title || description) && (
                <div className="mb-5 flex items-start gap-3">
                    {typeof index === 'number' && (
                        <span
                            className="flex-shrink-0 w-7 h-7 rounded-full bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center text-[12.5px] tabular-nums"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontWeight: 500,
                            }}
                        >
                            {index}
                        </span>
                    )}
                    <div className="min-w-0 flex-1">
                        {title && (
                            <h3
                                className="text-slate-900"
                                style={{
                                    fontFamily: "'Source Serif 4', Georgia, serif",
                                    fontWeight: 500,
                                    fontSize: '16px',
                                    letterSpacing: '-0.008em',
                                }}
                            >
                                {title}
                            </h3>
                        )}
                        {description && (
                            <p className="text-[12.5px] text-slate-500 mt-0.5 leading-relaxed">
                                {description}
                            </p>
                        )}
                    </div>
                </div>
            )}

            <div className={`grid ${COL_CLASSES[columns]} gap-4`}>
                {children}
            </div>

            {footer && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                    {footer}
                </div>
            )}
        </section>
    );
}
