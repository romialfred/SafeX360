import { useEffect, useState } from "react";
import { Icon } from "@iconify-icon/react";
import { Divider, ScrollArea } from "@mantine/core";
import { IconChevronDown } from "@tabler/icons-react";

import { getAllCompanies } from "../../../services/HrmsService";
import { useAppDispatch, useAppSelector } from "../../../slices/hooks";
import { COMPANY_SELECTION_STORAGE_KEY, setCompanySelection } from "../../../slices/CompanySelectionSlice";

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

const UNKNOWN_COMPANY_NAME = "All Companies";

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
    const isAdmin = (user?.role ?? "").toLowerCase() === "administrator";
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
        ? "Loading..."
        : canSelect
            ? companies.length
                ? `${companies.length} companies`
                : "No companies"
            : null;
    const displayLabel = loading && companies.length === 0 ? "Loading..." : selectedLabel;

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
                <span className="text-white font-medium text-sm">Site Bordeaux - Warehouse</span>
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
        if (typeof window !== "undefined") {
            window.location.reload();
        }
    };

    const handleSelectCompany = (company: Company) => {
        const name = resolveCompanyName(company);
        setHasUserInteracted(true);
        dispatch(setCompanySelection(company.id));
        setSelectedLabel(name);
        setDropdownOpen(false);
        if (typeof window !== "undefined") {
            window.location.reload();
        }
    };

    const isAllSelected = selectedCompanyId === null;

    return (
        <div className={combineClassNames("relative", className)}>
            <div
                onClick={canSelect ? handleToggleDropdown : undefined}
                className={combineClassNames(
                    "flex items-center gap-3 bg-white/20 px-4 py-2 rounded-xl transition",
                    canSelect ? "cursor-pointer hover:bg-white/30" : "cursor-default"
                )}
            >
                <div className="flex-1 flex flex-col">
                    <span className="text-white font-medium text-sm">{displayLabel}</span>
                </div>
                {canSelect && (
                    <IconChevronDown
                        className={`text-white transition-transform duration-700 ease-in-out ${dropdownOpen ? "rotate-180" : ""}`}
                    />
                )}
                <div className="flex items-center gap-1">
                    <div className={`w-2.5 h-2.5 rounded-full ${selectedStatusColor}`}></div>
                    {accessibleCountLabel && (
                        <p className="text-sm text-white">{accessibleCountLabel}</p>
                    )}
                </div>
            </div>

            {canSelect && dropdownOpen && (
                <div className="absolute top-14 w-[380px] bg-white rounded-xl shadow-xl border border-gray-300">
                    <div className="sticky top-0 text-gray-600 px-4 py-3 font-semibold">
                        View of the companies
                    </div>
                    <Divider />

                    <ScrollArea h={420}>
                        <div className="p-2">
                            <div
                                className={combineClassNames(
                                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                                    isAllSelected ? "bg-blue-100" : "hover:bg-blue-100"
                                )}
                                onClick={handleSelectAll}
                            >
                                <div className="w-10 h-10 flex items-center justify-center bg-gray-800 text-white rounded-lg">
                                    <Icon icon="mdi:office-building" width={20} />
                                </div>

                                <div className="flex-1">
                                    <p className="font-semibold text-sm">All companies (consolidated)</p>
                                    <p className="text-xs text-gray-500">Aggregated view of all companies</p>
                                </div>

                                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                            </div>

                            <p className="px-2 pt-4 pb-2 text-xs font-semibold text-gray-500">
                                INDIVIDUAL COMPANIES
                            </p>

                            {loading && (
                                <div className="px-2 py-4 text-sm text-gray-500">Loading companies...</div>
                            )}

                            {error && !loading && (
                                <div className="px-2 py-4 text-sm text-red-500">{error}</div>
                            )}

                            {!loading && !error && companies.length === 0 && (
                                <div className="px-2 py-4 text-sm text-gray-500">No companies found.</div>
                            )}

                            {!loading && !error && companies.length > 0 && (
                                <div className="flex flex-col gap-2">
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
                                                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                                                    isSelected ? "bg-blue-100" : "hover:bg-gray-50"
                                                )}
                                            >
                                                <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 text-white rounded-lg font-semibold">
                                                    {code}
                                                </div>

                                                <div className="flex-1">
                                                    <p className="font-semibold text-sm">{name}</p>
                                                    {description && (
                                                        <p className="text-xs text-gray-500">{description}</p>
                                                    )}
                                                </div>

                                                <span className={`w-3 h-3 rounded-full ${statusColor}`} title={company.status ?? "UNKNOWN"}></span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            )}
        </div>
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
