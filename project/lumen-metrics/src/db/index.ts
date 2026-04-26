import Dexie, { type Table } from 'dexie';

export interface LogEntry {
  id?: number;
  timestamp: number;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  context?: string;
  tenantId: string; // 租户隔离标识
}

export interface AlertEntry {
  id?: number;
  title: string;
  message: string;
  level: 'CRITICAL' | 'WARNING' | 'INFO';
  timestamp: string;
  unixTimestamp: number;
  status: 'UNPROCESSED' | 'CLAIMED' | 'RESOLVED';
  tenantId: string; // 租户隔离标识
}

export interface AuditLogEntry {
  id?: number;
  username: string;
  action: string;
  target: string;
  details: string;
  timestamp: number;
  tenantId: string;
}

export interface InspectionTask {
  id?: number;
  name: string;
  type: 'API' | 'DB' | 'SYSTEM' | 'SECURITY';
  schedule: string;
  active: boolean;
  autoRepair: boolean; // 新增：是否开启自动报修
  tenantId: string;
}

export interface InspectionResult {
  id?: number;
  taskId: number;
  taskName: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  details: string;
  timestamp: number;
  tenantId: string;
}

export class LumenMetricsDB extends Dexie {
  logs!: Table<LogEntry>;
  alerts!: Table<AlertEntry>;
  auditLogs!: Table<AuditLogEntry>;
  inspections!: Table<InspectionTask>;
  inspectionResults!: Table<InspectionResult>;

  constructor() {
    super('LumenMetricsDB');
    this.version(7).stores({
      logs: '++id, timestamp, level, tenantId',
      alerts: '++id, title, level, unixTimestamp, status, tenantId',
      auditLogs: '++id, username, action, timestamp, tenantId',
      inspections: '++id, name, type, active, tenantId',
      inspectionResults: '++id, taskId, status, timestamp, tenantId'
    });
  }
}

export const db = new LumenMetricsDB();
