import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

export const authApi = axios.create({
    baseURL: API,
    withCredentials: true,
});

export async function withAuthRefresh(request) {
    try {
        return await request();
    } catch (error) {
        if (error.response?.status !== 401) {
            throw error;
        }
        await authApi.post("/api/auth/refresh");
        return request();
    }
}
