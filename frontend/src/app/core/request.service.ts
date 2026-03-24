import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { PagedResult, RequestItem, RequestStatus, RequestStatusHistory } from './request.models';

@Injectable({ providedIn: 'root' })
export class RequestService {
  private readonly api = 'http://localhost:5000/api/requests';

  constructor(private readonly http: HttpClient) {}

  getAll(filters: Record<string, string>) {
    const params = new HttpParams({ fromObject: filters });
    return this.http.get<PagedResult<RequestItem>>(this.api, { params });
  }

  getById(id: string) {
    return this.http.get<RequestItem>(`${this.api}/${id}`);
  }

  create(payload: Partial<RequestItem>) {
    return this.http.post<RequestItem>(this.api, payload);
  }

  update(id: string, payload: Partial<RequestItem>) {
    return this.http.put<RequestItem>(`${this.api}/${id}`, payload);
  }

  changeStatus(id: string, newStatus: RequestStatus, comment?: string) {
    return this.http.post(`${this.api}/${id}/status`, { newStatus, comment });
  }

  getHistory(id: string) {
    return this.http.get<RequestStatusHistory[]>(`${this.api}/${id}/history`);
  }
}
