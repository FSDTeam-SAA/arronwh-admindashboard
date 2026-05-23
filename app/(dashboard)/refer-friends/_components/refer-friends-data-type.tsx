export type ReferItem = {
  _id: string
  referred_by: string
  name: string
  email: string
  phone: string
  postcode: string
  address: string
  message: string
  createdAt?: string
  updatedAt?: string
  __v?: number
}

export type ReferMeta = {
  total?: number
  page?: number
  limit?: number
}

export type ReferListResponse = {
  statusCode?: number
  success?: boolean
  status?: boolean
  message?: string
  meta?: ReferMeta
  data?: ReferItem[]
}

export type ReferDeleteResponse = {
  statusCode?: number
  success?: boolean
  status?: boolean
  message?: string
  data?: ReferItem
}

export const hasExplicitFailure = (
  payload: { success?: boolean; status?: boolean } | null
) => payload?.success === false || payload?.status === false
