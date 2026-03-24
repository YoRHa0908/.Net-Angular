export type RequestPriority = 'Low' | 'Medium' | 'High';
export type RequestStatus = 'Draft' | 'Open' | 'InProgress' | 'Done' | 'Overdue' | 'Cancelled';

export interface RequestItem {
  id: string;
  title: string;
  description: string;
  priority: RequestPriority;
  status: RequestStatus;
  deadline: string;
  createdAt: string;
  updatedAt: string;
  createdByUserId: string;
  createdByUserEmail?: string;
}

export interface RequestStatusHistory {
  id: string;
  requestId: string;
  oldStatus: RequestStatus;
  newStatus: RequestStatus;
  changedAt: string;
  changedByUserId: string;
  comment?: string;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface RequestUserLookup {
  id: string;
  email: string;
}
