export type NewsletterItem = {
  _id: string
  email: string
  createdAt?: string
  updatedAt?: string
  __v?: number
}

export type NewsletterMeta = {
  total?: number
  page?: number
  limit?: number
}

export type NewsletterListResponse = {
  statusCode?: number
  success?: boolean
  status?: boolean
  message?: string
  meta?: NewsletterMeta
  data?: NewsletterItem[]
}

export type NewsletterDeleteResponse = {
  statusCode?: number
  success?: boolean
  status?: boolean
  message?: string
  data?: NewsletterItem
}

export const hasExplicitFailure = (
  payload: { success?: boolean; status?: boolean } | null
) => payload?.success === false || payload?.status === false
