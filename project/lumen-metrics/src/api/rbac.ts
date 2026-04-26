import request from '../utils/request';

export interface User {
  id?: number;
  username: string;
  role: string;
  permissions: string[];
  lastLogin: string;
}

export const getUsers = () => request.get('/rbac/users') as Promise<User[]>;
export const updateUser = (id: number, data: Partial<User>) => request.put(`/rbac/users/${id}`, data);
export const inviteUser = (email: string) => request.post('/rbac/invite', { email });
