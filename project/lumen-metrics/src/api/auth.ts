import request from '../utils/request';

export interface LoginResponse {
  token: string;
  user: {
    username: string;
    role: string;
    tenantId: string;
  };
}

export const login = (data: any) => request.post('/login', data) as Promise<LoginResponse>;
export const logout = () => request.post('/logout');
export const getInfo = () => request.get('/user/info');
