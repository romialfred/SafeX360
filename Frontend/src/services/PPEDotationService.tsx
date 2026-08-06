import axiosInstance from "../interceptors/AxiosInterceptor";

const url = "/hns/ppe-dotation";

export interface DotationEmployee {
    empId: number; matricule: string; name: string; department: string; position: string;
    compliancePct: number; requiredCount: number; satisfiedCount: number;
    categories: { category: string; categoryLabel: string; state: string; mandatory: boolean }[];
    nextRenewalDate?: string | null; nextRenewalDays?: number | null; lastDotationDate?: string | null;
    status: string;
}

const getDotationSummary = async () =>
    axiosInstance.get(`${url}/summary`).then((r) => r.data);

const getDotationEmployees = async (params: Record<string, any>) =>
    axiosInstance.get(`${url}/employees`, { params }).then((r) => r.data);

const getDotationDetail = async (empId: number) =>
    axiosInstance.get(`${url}/employees/${empId}`).then((r) => r.data);

// Export CSV (respecte les filtres). Déclenche le téléchargement navigateur.
const exportDotations = async (params: Record<string, any>) => {
    const res = await axiosInstance.get(`${url}/export`, { params, responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href; a.download = 'suivi-dotations-epi.csv';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(href);
};

export { getDotationSummary, getDotationEmployees, getDotationDetail, exportDotations };
