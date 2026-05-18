'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CustomPagination } from '@/components/ui/common/CustomPagination'
import {
  hasExplicitFailure,
  NewsletterDeleteResponse,
  NewsletterItem,
  NewsletterListResponse,
} from './newsletter-data-type'

const PAGE_SIZE = 10

const getApiBase = () => (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/+$/, '')

const resolveNewsletterCollectionEndpoint = () => {
  const apiBase = getApiBase()

  if (!apiBase) {
    return '/api/v1/newslatter'
  }

  return apiBase.endsWith('/api/v1')
    ? `${apiBase}/newslatter`
    : `${apiBase}/api/v1/newslatter`
}

const resolveNewsletterListEndpoint = (page: number, limit: number) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })
  return `${resolveNewsletterCollectionEndpoint()}?${params.toString()}`
}

const resolveNewsletterDeleteEndpoint = (id: string) =>
  `${resolveNewsletterCollectionEndpoint()}/${id}`

const formatDate = (value?: string) => {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

const NewsletterContainer = () => {
  const [newsletters, setNewsletters] = useState<NewsletterItem[]>([])
  const [page, setPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<NewsletterItem | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / PAGE_SIZE)),
    [totalItems]
  )

  const loadNewsletters = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(resolveNewsletterListEndpoint(page, PAGE_SIZE), {
        method: 'GET',
        cache: 'no-store',
        headers: {
          accept: '*/*',
        },
      })

      const result = (await response.json().catch(() => null)) as
        | NewsletterListResponse
        | null

      if (!response.ok || hasExplicitFailure(result)) {
        throw new Error(result?.message || 'Failed to fetch newsletter list.')
      }

      const list = Array.isArray(result?.data) ? result.data : []
      const totalFromMeta =
        typeof result?.meta?.total === 'number' ? result.meta.total : list.length

      setNewsletters(list)
      setTotalItems(totalFromMeta)
    } catch (fetchError) {
      setNewsletters([])
      setTotalItems(0)
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : 'Failed to fetch newsletter list.'
      )
    } finally {
      setIsLoading(false)
    }
  }, [page])

  useEffect(() => {
    void loadNewsletters()
  }, [loadNewsletters])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const handleRefresh = () => {
    void loadNewsletters()
  }

  const handleOpenDelete = (item: NewsletterItem) => {
    setDeleteTarget(item)
    setIsDeleteOpen(true)
  }

  const handleDeleteOpenChange = (nextOpen: boolean) => {
    setIsDeleteOpen(nextOpen)
    if (!nextOpen) {
      setDeleteTarget(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget?._id || deletingId) return

    const id = deleteTarget._id
    setDeletingId(id)

    try {
      const response = await fetch(resolveNewsletterDeleteEndpoint(id), {
        method: 'DELETE',
        headers: {
          accept: '*/*',
        },
      })

      const result = (await response.json().catch(() => null)) as
        | NewsletterDeleteResponse
        | null

      if (!response.ok || hasExplicitFailure(result)) {
        throw new Error(result?.message || 'Failed to delete newsletter.')
      }

      toast.success(result?.message || 'Newsletter deleted successfully.')
      setIsDeleteOpen(false)
      setDeleteTarget(null)

      const shouldMovePrevPage = newsletters.length === 1 && page > 1
      if (shouldMovePrevPage) {
        setPage((prev) => prev - 1)
      } else {
        void loadNewsletters()
      }
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error
          ? deleteError.message
          : 'Failed to delete newsletter.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="w-full">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="mt-3 text-[28px] font-bold leading-none text-[#2D3D4D]">
            Newsletter Management
          </h1>
          <div className="mt-2 flex items-center gap-2 text-[16px] font-medium text-[#2D3D4D]">
            <Link href="/" className="transition hover:text-[#00A56F]">
              Dashboard
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-[#64748B]" />
            <span>Newsletter Management</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isLoading}
          className="inline-flex h-[42px] items-center gap-2 rounded-[8px] border border-[#D5DCE3] bg-white px-4 text-sm font-medium text-[#2D3D4D] transition hover:bg-[#F7FAFC] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow className="border-b border-[#E7ECF2] bg-[#F8FAFC] hover:bg-[#F8FAFC]">
                <TableHead className="h-[42px] rounded-l-[8px] px-4 text-[16px] font-medium text-[#00A56F]">
                  #
                </TableHead>
                <TableHead className="h-[42px] px-4 text-[16px] font-medium text-[#00A56F]">
                  Email
                </TableHead>
                <TableHead className="h-[42px] px-4 text-[16px] font-medium text-[#00A56F]">
                  Created At
                </TableHead>
                <TableHead className="h-[42px] rounded-r-[8px] px-4 text-right text-[16px] font-medium text-[#00A56F]">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-[88px] text-center text-[15px] text-[#64748B]"
                  >
                    Loading newsletters...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-[88px] text-center text-[15px] text-red-500"
                  >
                    {error}
                  </TableCell>
                </TableRow>
              ) : newsletters.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-[88px] text-center text-[15px] text-[#64748B]"
                  >
                    No newsletter data found.
                  </TableCell>
                </TableRow>
              ) : (
                newsletters.map((item, index) => (
                  <TableRow
                    key={item._id}
                    className="border-b border-[#EDF1F5] hover:bg-[#FBFDFF]"
                  >
                    <TableCell className="px-4 py-3 text-[14px] font-medium text-[#2D3D4D]">
                      {(page - 1) * PAGE_SIZE + index + 1}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-[14px] text-[#2D3D4D]">
                      {item.email || 'N/A'}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-[14px] text-[#2D3D4D]">
                      {formatDate(item.createdAt)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenDelete(item)}
                        disabled={deletingId === item._id}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#E8EDF2] bg-white transition hover:bg-[#FFFCE8] disabled:cursor-not-allowed disabled:opacity-70"
                        aria-label={`Delete ${item.email}`}
                      >
                        <Trash2 className="!h-5 !w-5 text-red-500" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#EEF2F6] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-[13px] text-[#64748B]">
            Total: {totalItems} newsletter subscriber{totalItems === 1 ? '' : 's'}
          </p>

          {!isLoading && !error && newsletters.length > 0 && totalPages > 1 ? (
            <CustomPagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          ) : null}
        </div>
      </div>

      <Dialog open={isDeleteOpen} onOpenChange={handleDeleteOpenChange}>
        <DialogContent className="sm:max-w-[460px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-semibold text-[#2D3D4D]">
              Confirm Delete
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#58616B]">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-[#2D3D4D]">
              {deleteTarget?.email ?? 'this newsletter'}
            </span>
            ?
          </p>
          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => handleDeleteOpenChange(false)}
              disabled={Boolean(deletingId)}
              className="h-[42px] rounded-[8px] border border-[#D5DCE3] bg-white px-4 text-sm font-medium text-[#2D3D4D] hover:bg-[#F7FAFC] disabled:cursor-not-allowed disabled:opacity-70"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={Boolean(deletingId)}
              className="h-[42px] rounded-[8px] bg-[#FBFF26] px-4 text-sm font-semibold text-[#2D3D4D] hover:bg-[#FBFF26]/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {deletingId ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default NewsletterContainer
