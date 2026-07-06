import { useEffect, useState } from "react";
import { Icon } from "@iconify-icon/react";
import { Divider, Popover, ScrollArea } from "@mantine/core";
import { IconChevronDown } from "@tabler/icons-react";

import { getAllCompanies } from "../../../services/HrmsService";
import { useAppDispatch, useAppSelector } from "../../../slices/hooks";
import { COMPANY_SELECTION_STORAGE_KEY, setCompanySelection } from "../../../slices/CompanySelectionSlice";
import { Z } from "../../../constants/zIndex";

type Company = {
    id: number;
    name?: string;
    shortName?: string;
    country?: string;
    region?: string;
    locality?: string;
    status?: string;
};

interface CompanySelectorProps {
    isEnabled?: boolean;
    className?: string;
}

const UNKNOWN_COMPANY_NAME = "Toutes les Mines";
const ADMIN_ROLES = new Set(["administrator", "admin", "hse_manager", "manager"]);


const CompanySelector = ({ isEnabled = true, className }: CompanySelectorProps) => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedLabel, setSelectedLabel] = useState<string>(UNKNOWN_COMPANY_NAME);
    const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [hasUserInteracted, setHasUserInteracted] = useState<boolean>(false);
    const [initialSelectionLoaded, setInitialSelectionLoaded] = useState<boolean>(false);
    const dispatch = useAppDispatch();
    const user = useAppSelector((state: any) => state.user);
    const selectedCompanyId = useAppSelector((state) => state.companySelection.selectedCompanyId);
    // Fix Phase 2.a — accepte 'ADMIN' / 'ADMINISTRATOR' / 'MANAGER' / 'HSE_MANAGER' (au lieu d'uniquement 'administrator')
    const isAdmin = ADMIN_ROLES.has((user?.role ?? "").toLowerCase());
    const rawCompanyId = user?.company;
    const userCompanyId = rawCompanyId === null || rawCompanyId === undefined
        ? null
        : Number.isNaN(Number(rawCompanyId))
            ? null
            : Number(rawCompanyId);
    const selectedCompany = selectedCompanyId !== null
        ? companies.find((company) => company.id === selectedCompanyId)
        : undefined;
    const selectedStatusColor = selectedCompany ? resolveStatusColor(selectedCompany.status) : "bg-blue-500";
    const canSelect = isEnabled && isAdmin;
    const accessibleCountLabel = loading
        ? "Chargement..."
        : canSelect
            ? companies.length
                ? `${companies.length} mines`
                : "Aucune mine"
            : null;
    const displayLabel = loading && companies.length === 0 ? "Chargement..." : selectedLabel;

    useEffect(() => {
        if (typeof window === "undefined") {
            setInitialSelectionLoaded(true);
            return;
        }
        if (!isEnabled) {
            return;
        }
        let isMounted = true;
        const fetchCompanies = async () => {
            setLoading(true);
            try {
                const response = await getAllCompanies();
                if (!isMounted) {
                    return;
                }
                const list = Array.isArray(response) ? response : [];
                setCompanies(list);
                setHasUserInteracted(false);
                setError(null);
            } catch (_error) {
                if (isMounted) {
                    setCompanies([]);
                    setError("Unable to load companies");
                    dispatch(setCompanySelection(null));
                    setSelectedLabel(UNKNOWN_COMPANY_NAME);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };
        fetchCompanies();
        return () => {
            isMounted = false;
        };
    }, [dispatch, isEnabled]);

    useEffect(() => {
        if (!canSelect && dropdownOpen) {
            setDropdownOpen(false);
        }
    }, [canSelect, dropdownOpen]);

    useEffect(() => {
        setHasUserInteracted(false);
    }, [isAdmin, userCompanyId]);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }
        if (!isEnabled) {
            return;
        }
        if (!companies.length || initialSelectionLoaded) {
            return;
        }
        try {
            const storedValue = localStorage.getItem(COMPANY_SELECTION_STORAGE_KEY);
            if (storedValue !== null) {
                if (storedValue === "null") {
                    dispatch(setCompanySelection(null));
                    setSelectedLabel(UNKNOWN_COMPANY_NAME);
                    if (canSelect) {
                        setHasUserInteracted(true);
                    }
                    setInitialSelectionLoaded(true);
                    return;
                }
                const parsedId = Number(storedValue);
                if (!Number.isNaN(parsedId)) {
                    const matchedCompany = companies.find((company) => company.id === parsedId);
                    if (matchedCompany) {
                        dispatch(setCompanySelection(matchedCompany.id));
                        setSelectedLabel(resolveCompanyName(matchedCompany));
                        if (canSelect) {
                            setHasUserInteracted(true);
                        }
                        setInitialSelectionLoaded(true);
                        return;
                    }
                }
            }
        } catch (_error) {
            // Ignore storage errors
        }
        setInitialSelectionLoaded(true);
    }, [canSelect, companies, dispatch, initialSelectionLoaded, isEnabled]);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }
        if (!isEnabled || !initialSelectionLoaded) {
            return;
        }
        try {
            if (selectedCompanyId === null || selectedCompanyId === undefined) {
                localStorage.setItem(COMPANY_SELECTION_STORAGE_KEY, "null");
            } else {
                localStorage.setItem(COMPANY_SELECTION_STORAGE_KEY, String(selectedCompanyId));
            }
        } catch (_error) {
            // Ignore storage errors
        }
    }, [initialSelectionLoaded, isEnabled, selectedCompanyId]);

    useEffect(() => {
        if (!initialSelectionLoaded) {
            return;
        }
        if (!canSelect || !isAdmin) {
            return;
        }
        if (!companies.length) {
            return;
        }
        if (hasUserInteracted) {
            return;
        }
        const matchedCompany = userCompanyId !== null
            ? companies.find((company) => company.id === userCompanyId)
            : undefined;
        if (matchedCompany) {
            const name = resolveCompanyName(matchedCompany);
            if (selectedCompanyId !== matchedCompany.id) {
                dispatch(setCompanySelection(matchedCompany.id));
            }
            if (selectedLabel !== name) {
                setSelectedLabel(name);
            }
            return;
        }
        if (selectedCompanyId !== null) {
            dispatch(setCompanySelection(null));
        }
        if (selectedLabel !== UNKNOWN_COMPANY_NAME) {
            setSelectedLabel(UNKNOWN_COMPANY_NAME);
        }
    }, [canSelect, dispatch, hasUserInteracted, initialSelectionLoaded, isAdmin, companies, userCompanyId, selectedCompanyId, selectedLabel]);

    useEffect(() => {
        if (!initialSelectionLoaded) {
            return;
        }
        if (!isEnabled || canSelect) {
            return;
        }
        if (!companies.length) {
            return;
        }
        const matchedCompany = userCompanyId !== null
            ? companies.find((company) => company.id === userCompanyId)
            : undefined;
        const fallbackCompany = matchedCompany ?? companies[0];
        const targetId = fallbackCompany ? fallbackCompany.id : null;
        const targetLabel = fallbackCompany ? resolveCompanyName(fallbackCompany) : UNKNOWN_COMPANY_NAME;
        if (selectedCompanyId !== targetId) {
            dispatch(setCompanySelection(targetId));
        }
        if (selectedLabel !== targetLabel) {
            setSelectedLabel(targetLabel);
        }
    }, [companies, canSelect, dispatch, initialSelectionLoaded, isEnabled, selectedCompanyId, selectedLabel, userCompanyId]);

    useEffect(() => {
        if (!initialSelectionLoaded) {
            return;
        }
        if (!companies.length) {
            if (selectedCompanyId === null && selectedLabel !== UNKNOWN_COMPANY_NAME) {
                setSelectedLabel(UNKNOWN_COMPANY_NAME);
            }
            return;
        }
        if (selectedCompanyId === null) {
            if (selectedLabel !== UNKNOWN_COMPANY_NAME) {
                setSelectedLabel(UNKNOWN_COMPANY_NAME);
            }
            return;
        }
        const matchedCompany = companies.find((company) => company.id === selectedCompanyId);
        if (matchedCompany) {
            const name = resolveCompanyName(matchedCompany);
            if (selectedLabel !== name) {
                setSelectedLabel(name);
            }
            return;
        }
        if (canSelect) {
            dispatch(setCompanySelection(null));
            setSelectedLabel(UNKNOWN_COMPANY_NAME);
        }
    }, [canSelect, companies, dispatch, initialSelectionLoaded, selectedCompanyId, selectedLabel]);

    if (!isEnabled) {
        return (
            <div className={combineClassNames("bg-white/20 px-4 py-2 rounded-xl", className)}>
                <span className="text-white text-sm">Site Bordeaux - Warehouse</span>
            </div>
        );
    }

    const handleToggleDropdown = () => {
        if (canSelect) {
            setDropdownOpen((open) => !open);
        }
    };

    const handleSelectAll = () => {
        setHasUserInteracted(true);
        dispatch(setCompanySelection(null));
        setSelectedLabel(UNKNOWN_COMPANY_NAME);
        setDropdownOpen(false);
    };

    const handleSelectCompany = (company: Company) => {
        const name = resolveCompanyName(company);
        setHasUserInteracted(true);
        dispatch(setCompanySelection(company.id));
        setSelectedLabel(name);
        setDropdownOpen(false);
    };

    const isAllSelected = selectedCompanyId === null;

    /*
     * Fix 2026-06-07 : le dropdown etait positionne en absolute INSIDE le header
     * `position:fixed z-[100]` + barre `overflow-x-auto`. Sur certains contextes,
     * le popup etait clipped ou repositionne en bas de page.
     * Solution : Popover Mantine avec `withinPortal` (portail vers body) + zIndex 1100
     * (au-dessus du header z-100, au-dessous des modals Mantine).
     */
    return (
        <Popover
            opened={canSelect && dropdownOpen}
            onChange={setDropdownOpen}
            position="bottom-end"
            offset={8}
            withinPortal
            zIndex={Z.modal}
            shadow="xl"
            radius="xl"
            transitionProps={{ duration: 140 }}
            closeOnClickOutside
            closeOnEscape
        >
            <Popover.Target>
                <div className={combineClassNames("relative", className)}>
                    {/* LOT 41 — Trigger CompanySelector : pilule blanche pleine pour vraie lisibilité sur teal */}
                    <div
                        onClick={canSelect ? handleToggleDropdown : undefined}
                        className={combineClassNames(
                            "flex items-center gap-2.5 bg-white border border-white/40 px-3.5 py-2 rounded-lg transition shadow-sm",
                            canSelect ? "cursor-pointer hover:bg-slate-50 hover:border-white/60" : "cursor-default"
                        )}
                    >
                        <div className={`w-2 h-2 rounded-full ${selectedStatusColor} shadow-sm flex-shrink-0`}></div>
                        <div className="flex flex-col leading-tight min-w-0">
                            <span className="text-[10px] uppercase tracking-wider text-teal-700 font-medium">
                                {selectedCompanyId === null ? "Vue consolidée" : "Mine active"}
                            </span>
                            <span className="text-slate-900 text-[13px] font-medium truncate max-w-[200px]">
                                {displayLabel}
                            </span>
                        </div>
                        {canSelect && (
                            <IconChevronDown
                                size={16}
                                className={`text-slate-600 transition-transform duration-300 flex-shrink-0 ${dropdownOpen ? "rotate-180" : ""}`}
                            />
                        )}
                    </div>
                </div>
            </Popover.Target>

            <Popover.Dropdown p={0} className="!border-slate-200 !rounded-xl !overflow-hidden" style={{ width: 400 }}>
                <div className="bg-gradient-to-r from-teal-700 to-emerald-600 px-4 py-3">
                    <p className="text-white text-sm">Sélectionner la mine active</p>
                    <p className="text-teal-100 text-xs">Filtrez les données par site</p>
                </div>
                <Divider />

                <ScrollArea h={420}>
                    <div className="p-2">
                        <div
                            className={combineClassNames(
                                "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
                                isAllSelected ? "bg-teal-50 border-2 border-teal-300" : "border-2 border-transparent hover:bg-slate-50"
                            )}
                            onClick={handleSelectAll}
                        >
                            <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-teal-600 to-emerald-700 text-white rounded-lg shadow">
                                <Icon icon="mdi:earth" width={22} />
                            </div>

                            <div className="flex-1">
                                <p className="text-sm text-slate-900">Toutes les mines (consolidé)</p>
                                <p className="text-xs text-slate-500">Vue agrégée multi-sites</p>
                            </div>

                            {isAllSelected && <span className="text-teal-600 text-sm">✓</span>}
                        </div>

                        <p className="px-2 pt-4 pb-2 text-[10px] uppercase tracking-widest text-slate-400">
                            Mines individuelles
                        </p>

                        {loading && (
                            <div className="px-2 py-4 text-sm text-slate-500">Chargement des mines...</div>
                        )}

                        {error && !loading && (
                            <div className="px-2 py-4 text-sm text-red-500">{error}</div>
                        )}

                        {!loading && !error && companies.length === 0 && (
                            <div className="px-2 py-4 text-sm text-slate-500">Aucune mine trouvée.</div>
                        )}

                        {!loading && !error && companies.length > 0 && (
                            <div className="flex flex-col gap-1.5">
                                {companies.map((company, index) => {
                                    const name = resolveCompanyName(company);
                                    const description = resolveCompanyDescription(company);
                                    const code = resolveCompanyCode(name);
                                    const statusColor = resolveStatusColor(company.status);
                                    const isSelected = selectedCompanyId === company.id;
                                    return (
                                        <div
                                            key={company.id ? String(company.id) : `company-${index}`}
                                            onClick={() => handleSelectCompany(company)}
                                            className={combineClassNames(
                                                "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
                                                isSelected ? "bg-teal-50 border-2 border-teal-300" : "border-2 border-transparent hover:bg-slate-50"
                                            )}
                                        >
                                            <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 text-white rounded-lg text-xs shadow">
                                                {code}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-slate-900 truncate">{name}</p>
                                                {description && (
                                                    <p className="text-xs text-slate-500 truncate">{description}</p>
                                                )}
                                            </div>

                                            <div className="flex flex-col items-end gap-1">
                                                <span className={`w-2.5 h-2.5 rounded-full ${statusColor}`} title={company.status ?? "INCONNU"}></span>
                                                {isSelected && <span className="text-teal-600 text-xs">✓</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </Popover.Dropdown>
        </Popover>
    );
};

const resolveCompanyName = (company: Company | null | undefined): string => {
    if (!company) {
        return "Unnamed Company";
    }
    return company.name || company.shortName || "Unnamed Company";
};

const resolveCompanyDescription = (company: Company | null | undefined): string => {
    if (!company) {
        return "";
    }
    const structuredParts = [company.region, company.country].filter(Boolean);
    if (structuredParts.length) {
        return structuredParts.join(", ");
    }
    return "";
};

const resolveCompanyCode = (name: string): string => {
    if (!name) {
        return "ORG";
    }
    const initials = name
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word[0]?.toUpperCase())
        .join("");
    if (initials.length >= 2) {
        return initials.slice(0, 3);
    }
    return name.slice(0, 3).toUpperCase();
};

const resolveStatusColor = (status?: string): string => {
    const statusValue = (status ?? "").toLowerCase();
    if (statusValue === "active") {
        return "bg-green-500";
    }
    if (statusValue === "inactive" || statusValue === "on hold") {
        return "bg-yellow-400";
    }
    if (statusValue === "closed" || statusValue === "suspended") {
        return "bg-red-500";
    }
    return "bg-gray-400";
};

const combineClassNames = (...classes: (string | undefined)[]): string => {
    return classes.filter(Boolean).join(" ");
};

export default CompanySelector;
