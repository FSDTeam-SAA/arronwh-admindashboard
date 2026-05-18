export interface IssueItem {
  _id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface IssueApiMeta {
  page: number;
  limit: number;
  total: number;
}

export interface IssueApiResponse {
  statusCode: number;
  success: boolean;
  message: string;
  meta: IssueApiMeta;
  data: IssueItem[];
}

export interface DeleteIssueApiResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: IssueItem;
}
