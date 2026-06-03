import { ReactNode } from 'react';
import { Breadcrumbs, Anchor, Text } from '@mantine/core';
import { Link } from 'react-router-dom';

/**
 * En-tête de page unifié pour SafeX360.
 * Pattern partagé entre tous les modules pour cohérence visuelle.
 *
 * Inspiré du header du formulaire de déclaration d'incident.
 *
 * Usage :
 *   <PageHeader
 *     breadcrumbs={[{ label: 'Accueil', to: '/' }, { label: 'Module', to: '/x' }]}
 *     icon={<IconShield />}
 *     iconColor="green"
 *     title="Titre principal"
 *     subtitle="Description fonctionnelle de la page"
 *     actions={<Button>Action</Button>}
 *   />
 */

interface BreadcrumbItem {
    label: string;
    to?: string;
}

interface PageHeaderProps {
    breadcrumbs: BreadcrumbItem[];
    icon?: ReactNode;
    iconColor?: 'teal' | 'green' | 'red' | 'orange' | 'yellow' | 'blue' | 'indigo' | 'slate' | 'cyan' | 'pink' | 'amber' | 'violet';
    title: string;
    subtitle?: string;
    badge?: ReactNode;
    actions?: ReactNode;
}

const iconColorMap = {
    teal: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700' },
    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
    red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
    yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
    slate: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700' },
    cyan: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700' },
    pink: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
    violet: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' },
};

const PageHeader = ({ breadcrumbs, icon, iconColor = 'teal', title, subtitle, badge, actions }: PageHeaderProps) => {
    const colors = iconColorMap[iconColor] || iconColorMap.teal;

    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 pb-3 border-b border-slate-200">
            <div className="flex-1 min-w-0">
                <Breadcrumbs separator="›" className="!text-xs">
                    {breadcrumbs.map((b, i) => {
                        const isLast = i === breadcrumbs.length - 1;
                        if (isLast || !b.to) {
                            return <Text key={i} size="xs" c={isLast ? "teal" : "dimmed"} fw={isLast ? 600 : 400}>{b.label}</Text>;
                        }
                        return <Anchor key={i} component={Link} to={b.to} size="xs" c="dimmed">{b.label}</Anchor>;
                    })}
                </Breadcrumbs>
                <div className="flex items-center gap-3 mt-2">
                    {icon && (
                        <div className={`p-2 rounded-lg ${colors.bg} border ${colors.border} flex-shrink-0`}>
                            <span className={colors.text}>{icon}</span>
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">{title}</h1>
                            {badge}
                        </div>
                        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
                    </div>
                </div>
            </div>
            {actions && (
                <div className="flex items-center gap-2 flex-shrink-0">
                    {actions}
                </div>
            )}
        </div>
    );
};

export default PageHeader;
