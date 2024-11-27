import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8000", // Backend URL
  withCredentials: true, // Ensures cookies are sent
});

export default axiosInstance;
