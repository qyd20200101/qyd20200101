import request from '../utils/request';

export interface Rule {
  id?: number;
  name: string;
  condition: string;
  level: 'INFO' | 'WARNING' | 'CRITICAL';
  active: boolean;
  webhook?: string;
}

export const getRules = () => request.get('/rules') as Promise<Rule[]>;
export const createRule = (data: Rule) => request.post('/rules', data);
export const updateRule = (id: number, data: Partial<Rule>) => request.put(`/rules/${id}`, data);
export const deleteRule = (id: number) => request.delete(`/rules/${id}`);
