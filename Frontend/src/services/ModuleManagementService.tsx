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
    .then((res) => res.data as ModuleFeatureDto)
    .catch((error) => {
      throw error;
    });
};

// Update module name or status
const updateModuleFeature = async (payload: { id: number; module: string; status: ModuleStatus }) => {
  return axiosInstance
    .put(`${baseUrl}/update`, payload)
    .then((res) => res.data as ModuleFeatureDto)
    .catch((error) => {
      throw error;
    });
};

// Update status by id
const updateModuleFeatureStatus = async (id: number, status: ModuleStatus) => {
  return axiosInstance
    .put(`${baseUrl}/status/${id}`, null, { params: { status } })
    .then((res) => res.data as ModuleFeatureDto)
    .catch((error) => {
      throw error;
    });
};

// Get by id
const getModuleFeature = async (id: number) => {
  return axiosInstance
    .get(`${baseUrl}/get/${id}`)
    .then((res) => res.data as ModuleFeatureDto)
    .catch((error) => {
      throw error;
    });
};

// Get by module key
const getModuleFeatureByKey = async (module: string) => {
  return axiosInstance
    .get(`${baseUrl}/getByModule`, { params: { module } })
    .then((res) => res.data as ModuleFeatureDto)
    .catch((error) => {
      throw error;
    });
};

// List all modules
const getAllModuleFeatures = async () => {
  return axiosInstance
    .get(`${baseUrl}/getAll`)
    .then((res) => res.data as ModuleFeatureDto[])
    .catch((error) => {
      throw error;
    });
};

export {
  createModuleFeature,
  updateModuleFeature,
  updateModuleFeatureStatus,
  getModuleFeature,
  getModuleFeatureByKey,
  getAllModuleFeatures,
};

