import { Avatar, MultiSelect, Select, Text } from "@mantine/core";
import { IconEye, IconUsers, IconUser, IconPaperclip } from "@tabler/icons-react";
import FileDropzone from "../../../UtilityComp/FileDropzone";

/**
 * WitnessesSection v2 — Refonte 2.a
 *
 * Avant : 2 PrimeReact PickList dual-list (UX terrible — trop d'espace, anti-pattern marché HSE)
 * Maintenant : Mantine MultiSelect compact avec recherche, chips visibles, pattern conforme ISOMETRIX/Sphera
 */

interface WitnessesSectionProps {
    form: any;
    employees: { id: number | string; name: string; empNumber?: string; departmentName?: string }[];
}

const WitnessesSection = ({ form, employees }: WitnessesSectionProps) => {
    // Pool des employés disponibles, formatés pour Mantine
    const employeesData = employees.map((emp) => ({
        value: String(emp.id),
        label: emp.name,
        // Métadonnées pour rendu enrichi
        empNumber: emp.empNumber,
        department: emp.departmentName,
    }));

    // Valeur courante (id en string pour Mantine)
    const involvedIds: string[] = (form.values.involvedPersons || []).map((p: any) => String(p?.id ?? p));
    const witnessIds: string[] = (form.values.witnesses || []).map((w: any) => String(w?.id ?? w));

    const updateInvolved = (ids: string[]) => {
        const updated = employees.filter((e) => ids.includes(String(e.id)));
        form.setFieldValue('involvedPersons', updated);
    };

    const updateWitnesses = (ids: string[]) => {
        const updated = employees.filter((e) => ids.includes(String(e.id)));
        form.setFieldValue('witnesses', updated);
    };

    return (
        <div className="space-y-4">
            {/* Section header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                    <h2 className="text-base text-slate-900">Personnes impliquées</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Identifiez le déclarant, les personnes concernées et les témoins de l'événement.</p>
                </div>
            </div>

            {/* Déclarant — Select single */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-md bg-teal-50 border border-teal-200 flex-shrink-0">
                        <IconUser size={16} className="text-teal-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <label className="text-sm text-slate-800 block mb-0.5">
                            Déclarant <span className="text-red-500">*</span>
                        </label>
                        <p className="text-xs text-slate-500 mb-2">La personne qui rapporte l'incident — par défaut l'utilisateur connecté</p>
                        <Select
                            placeholder="Sélectionner le déclarant"
                            data={employeesData}
                            searchable
                            clearable
                            nothingFoundMessage="Aucun employé trouvé"
                            size="sm"
                            {...form.getInputProps("reporterId")}
                        />
                    </div>
                </div>
            </div>

            {/* Personnes impliquées — MultiSelect */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-md bg-red-50 border border-red-200 flex-shrink-0">
                        <IconUsers size={16} className="text-red-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <label className="text-sm text-slate-800 block mb-0.5">
                            Personnes impliquées
                        </label>
                        <p className="text-xs text-slate-500 mb-2">
                            Employés ou sous-traitants directement concernés (blessés, exposés, opérateurs).
                        </p>
                        <MultiSelect
                            placeholder="Rechercher et ajouter des personnes..."
                            data={employeesData}
                            value={involvedIds}
                            onChange={updateInvolved}
                            searchable
                            clearable
                            hidePickedOptions
                            nothingFoundMessage="Aucun employé correspondant"
                            size="sm"
                            maxDropdownHeight={280}
                        />
                        {involvedIds.length > 0 && (
                            <Text size="xs" c="dimmed" mt={6}>
                                <span className="text-red-700">{involvedIds.length}</span> personne{involvedIds.length > 1 ? 's' : ''} impliquée{involvedIds.length > 1 ? 's' : ''}
                            </Text>
                        )}
                    </div>
                </div>
            </div>

            {/* Témoins — MultiSelect */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-md bg-orange-50 border border-orange-200 flex-shrink-0">
                        <IconEye size={16} className="text-orange-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <label className="text-sm text-slate-800 block mb-0.5">
                            Témoins
                        </label>
                        <p className="text-xs text-slate-500 mb-2">
                            Personnes ayant observé l'événement sans en être impliquées. Leurs témoignages enrichissent l'analyse.
                        </p>
                        <MultiSelect
                            placeholder="Rechercher et ajouter des témoins..."
                            data={employeesData}
                            value={witnessIds}
                            onChange={updateWitnesses}
                            searchable
                            clearable
                            hidePickedOptions
                            nothingFoundMessage="Aucun employé correspondant"
                            size="sm"
                            maxDropdownHeight={280}
                        />
                        {witnessIds.length > 0 && (
                            <Text size="xs" c="dimmed" mt={6}>
                                <span className="text-orange-700">{witnessIds.length}</span> témoin{witnessIds.length > 1 ? 's' : ''} déclaré{witnessIds.length > 1 ? 's' : ''}
                            </Text>
                        )}
                    </div>
                </div>
            </div>

            {/* Preuves */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-md bg-indigo-50 border border-indigo-200 flex-shrink-0">
                        <IconPaperclip size={16} className="text-indigo-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <label className="text-sm text-slate-800 block mb-0.5">
                            Preuves &amp; pièces jointes
                        </label>
                        <p className="text-xs text-slate-500 mb-3">
                            Photos (avec géolocalisation EXIF préservée), schémas, documents ou rapports. Max. 10 Mo par fichier.
                        </p>
                        <FileDropzone form={form} id="evidence" />
                    </div>
                </div>
            </div>
        </div>
    );
};

// Avatar helper exposé si réutilisable
export const PersonAvatar = ({ name }: { name: string }) => (
    <Avatar size="sm" radius="xl" color="initials" name={name} />
);

export default WitnessesSection;
