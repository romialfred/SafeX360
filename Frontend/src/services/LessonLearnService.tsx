import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/lesson-learned";

const createLessonLearn = async (incidentData: any) => {
    return axiosInstance.post(`${url}/create`, incidentData)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const updateLessonLearn = async (incidentData: any) => {
    return axiosInstance.put(`${url}/update`, incidentData)
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

const getDetailsByIncidentId = async (id: number) => {
    return axiosInstance.get(`${url}/detailsByIncidentId/${id}`)  // ✅ Correct endpoint
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

// This is not in your API doc, but keeping it if you're using it
const GetAllDetails = async (incidentData: any) => {
    return axiosInstance.get(`${url}/getAll`, { params: incidentData })
        .then((response) => response.data)
        .catch((error) => { throw error; });
};

export { createLessonLearn, updateLessonLearn, getDetailsByIncidentId, GetAllDetails };
