import axiosInstance from "../interceptors/AxiosInterceptor";

// Base path for Permission Management APIs
const baseUrl = "/hns/users/permissions";

// Create a new permission profile
const createPermissionProfile = async (payload: any) => {
  return axiosInstance
    .post(`${baseUrl}/create`, payload)
    .then((res) => res.data)
    .catch((err) => {
      throw err;
    });
};

// Update an existing permission profile
const updatePermissionProfile = async (payload: any) => {
  return axiosInstance
    .put(`${baseUrl}/update`, payload)
    .then((res) => res.data)
    .catch((err) => {
      throw err;
    });
};

// Update status by id
const updatePermissionStatus = async (id: number, status: "ACTIVE" | "INACTIVE") => {
  return axiosInstance
    .put(`${baseUrl}/status/${id}`, null, { params: { status } })
    .then((res) => res.data)
    .catch((err) => {
      throw err;
    });
};

// Get permission profile by id
const getPermissionById = async (id: number) => {
  return axiosInstance
    .get(`${baseUrl}/get/${id}`)
    .then((res) => res.data)
    .catch((err) => {
      throw err;
    });
};

// Get permission profile by employee id
const getPermissionByEmployeeId = async (employeeId: number) => {
  return axiosInstance
    .get(`${baseUrl}/employee/${employeeId}`)
    .then((res) => res.data)
    .catch((err) => {
      throw err;
    });
};

// List all permission profiles
const getAllPermissions = async () => {
  return axiosInstance
    .get(`${baseUrl}/getAll`)
    .then((res) => res.data)
    .catch((err) => {
      throw err;
    });
};

export {
  createPermissionProfile,
  updatePermissionProfile,
  updatePermissionStatus,
  getPermissionById,
  getPermissionByEmployeeId,
  getAllPermissions,
};
// Get distinct employee IDs that already have permission profiles
const getRegisteredEmployeeIds = async (): Promise<number[]> => {
  return axiosInstance
    .get(`${baseUrl}/employees/registered`)
    .then((res) => res.data)
    .catch((err) => {
      throw err;
    });
};

export { getRegisteredEmployeeIds };
