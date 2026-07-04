import axiosInstance from "../interceptors/AxiosInterceptor";
const url = "/hns/position-assignment";


const createPostionAssignment = async (incidentData: any) => {
    return axiosInstance.post(`${url}/create`, incidentData)
        .then((response) => {
            return response.data;
        });
}

const updatePostionAssignment = async (incidentData: any) => {
    return axiosInstance.put(`${url}/update`, incidentData)
        .then((response) => {
            return response.data;
        });
}
const GetAllPostionAssignment = async (incidentData: any) => {
    const response = await axiosInstance.get(`${url}/getAll`, { params: incidentData });
    return response.data;
};
const getPostionAssignmentById = async (id: any) => {
    return axiosInstance.get(`${url}/get/${id}`)
        .then((response) => response.data);
}


const activatePostionAssignment = async (id: string | number) => {
    return axiosInstance.put(`${url}/activate/${id}`)
        .then((response) => response.data);
}

const deactivatePostionAssignment = async (id: string | number) => {
    return axiosInstance.put(`${url}/deactivate/${id}`)
        .then((response) => response.data);
}
export { createPostionAssignment, updatePostionAssignment, GetAllPostionAssignment, activatePostionAssignment, deactivatePostionAssignment, getPostionAssignmentById };