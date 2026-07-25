import axiosInstance from "../interceptors/AxiosInterceptor";

export type ModuleStatus = "ACTIVE" | "INACTIVE";

export interface ModuleFeatureDto {
  id: number;
  module: string;
  status: ModuleStatus;
  createdAt: string;
  updatedAt: string;
}

const baseUrl = "/hns/modules";

// Create a module feature flag
const createModuleFeature = async (payload: { module: string; status: ModuleStatus }) => {
  return axiosInstance
    .post(`${baseUrl}/create`, payload)
    .then((res) => res.data as ModuleFeatureDto);
};

// Update module name or status
const updateModuleFeature = async (payload: { id: number; module: string; status: ModuleStatus }) => {
  return axiosInstance
    .put(`${baseUrl}/update`, payload)
    .then((res) => res.data as ModuleFeatureDto);
};

// Update status by id
const updateModuleFeatureStatus = async (id: number, status: ModuleStatus) => {
  return axiosInstance
    .put(`${baseUrl}/status/${id}`, null, { params: { status } })
    .then((res) => res.data as ModuleFeatureDto);
};

// Get by id
const getModuleFeature = async (id: number) => {
  return axiosInstance
    .get(`${baseUrl}/get/${id}`)
    .then((res) => res.data as ModuleFeatureDto);
};

// Get by module key
const getModuleFeatureByKey = async (module: string) => {
  return axiosInstance
    .get(`${baseUrl}/getByModule`, { params: { module } })
    .then((res) => res.data as ModuleFeatureDto);
};

// List all modules
const getAllModuleFeatures = async () => {
  return axiosInstance
    .get(`${baseUrl}/getAll`)
    .then((res) => res.data as ModuleFeatureDto[]);
};

// ── Activation PAR MINE (cloisonnement tenant) ──────────────────────────────

export interface CompanyModuleActivation {
  companyId: number;
  module: string;
  status: ModuleStatus;
}

/** Toutes les désactivations explicites, toutes mines confondues (matrice). */
const getCompanyActivations = async () => {
  return axiosInstance
    .get(`${baseUrl}/company/activations`)
    .then((res) => res.data as CompanyModuleActivation[]);
};

/** Statut de chaque module du catalogue pour une mine (défaut ACTIVE). */
const getCompanyModuleStatuses = async (companyId: number) => {
  return axiosInstance
    .get(`${baseUrl}/company/${companyId}/statuses`)
    .then((res) => res.data as CompanyModuleActivation[]);
};

/** Clés des modules ACTIFS pour une mine (grille de création + menu). */
const getActiveModulesForCompany = async (companyId: number) => {
  return axiosInstance
    .get(`${baseUrl}/company/${companyId}/active`)
    .then((res) => res.data as string[]);
};

/** Active/désactive un module pour une mine. */
const setCompanyModuleStatus = async (companyId: number, module: string, status: ModuleStatus) => {
  return axiosInstance
    .put(`${baseUrl}/company/${companyId}/${module}`, null, { params: { status } })
    .then((res) => res.data as CompanyModuleActivation);
};

export {
  createModuleFeature,
  updateModuleFeature,
  updateModuleFeatureStatus,
  getModuleFeature,
  getModuleFeatureByKey,
  getAllModuleFeatures,
  getCompanyActivations,
  getCompanyModuleStatuses,
  getActiveModulesForCompany,
  setCompanyModuleStatus,
};

