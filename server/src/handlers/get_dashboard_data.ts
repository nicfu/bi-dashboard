
import { type DashboardData, type DashboardFilter } from '../schema';

export declare function getDashboardData(filter?: DashboardFilter): Promise<DashboardData[]>;
