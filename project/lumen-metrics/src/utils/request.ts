import axios from 'axios';
import { ElMessage } from 'element-plus';

// 统一定义后端返回的响应体结构
export interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
});

// 请求拦截器：自动注入 Token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：全局错误处理与数据提取
request.interceptors.response.use(
  (response) => {
    const res = response.data as ApiResponse;
    
    // 如果后端返回了业务状态码，并且不等于 200 (成功)
    if (res.code !== undefined && res.code !== 200) {
      ElMessage.error(res.message || 'System Error');
      return Promise.reject(new Error(res.message || 'Error'));
    }
    
    // 直接返回业务数据包
    return res.data !== undefined ? res.data : res;
  },
  (error) => {
    ElMessage.error(error.message || 'Network request failed');
    return Promise.reject(error);
  }
);

export default request;
