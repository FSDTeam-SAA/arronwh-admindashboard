"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Eye, Trash2, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { CustomPagination } from "@/components/ui/common/CustomPagination";
import { QuoteDetailsModal } from "./_components/QuoteDetailsModal";

type QuoteItem = {
  id: number;
  name: string;
  email: string;
  phone: string;
  date: string;
};

const dummyQuotes: QuoteItem[] = [
  {
    id: 1,
    name: "Savannah Nguyen",
    email: "debra.holt@example.com",
    phone: "(907) 555-0101",
    date: "November 28, 2015",
  },
  {
    id: 2,
    name: "Savannah Nguyen",
    email: "debra.holt@example.com",
    phone: "(907) 555-0101",
    date: "November 28, 2015",
  },
  {
    id: 3,
    name: "Savannah Nguyen",
    email: "debra.holt@example.com",
    phone: "(907) 555-0101",
    date: "November 28, 2015",
  },
  {
    id: 4,
    name: "Savannah Nguyen",
    email: "debra.holt@example.com",
    phone: "(907) 555-0101",
    date: "November 28, 2015",
  },
  {
    id: 5,
    name: "Savannah Nguyen",
    email: "debra.holt@example.com",
    phone: "(907) 555-0101",
    date: "November 28, 2015",
  },
  {
    id: 6,
    name: "Savannah Nguyen",
    email: "debra.holt@example.com",
    phone: "(907) 555-0101",
    date: "November 28, 2015",
  },
  {
    id: 7,
    name: "Savannah Nguyen",
    email: "debra.holt@example.com",
    phone: "(907) 555-0101",
    date: "November 28, 2015",
  },
  {
    id: 8,
    name: "Savannah Nguyen",
    email: "debra.holt@example.com",
    phone: "(907) 555-0101",
    date: "November 28, 2015",
  },
  {
    id: 9,
    name: "Savannah Nguyen",
    email: "debra.holt@example.com",
    phone: "(907) 555-0101",
    date: "November 28, 2015",
  },
  {
    id: 10,
    name: "Savannah Nguyen",
    email: "debra.holt@example.com",
    phone: "(907) 555-0101",
    date: "November 28, 2015",
  },
  {
    id: 11,
    name: "Savannah Nguyen",
    email: "debra.holt@example.com",
    phone: "(907) 555-0101",
    date: "November 28, 2015",
  },
  {
    id: 12,
    name: "Savannah Nguyen",
    email: "debra.holt@example.com",
    phone: "(907) 555-0101",
    date: "November 28, 2015",
  },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export default function QuoteGeneratedPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<QuoteItem | null>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<QuoteItem | null>(null);

  const totalItems = dummyQuotes.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return dummyQuotes.slice(start, end);
  }, [page, pageSize]);

  const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  const handleOpenDetails = (item: QuoteItem) => {
    setSelectedQuote(item);
    setOpenDetails(true);
  };

  const handleOpenDelete = (item: QuoteItem) => {
    setDeleteTarget(item);
    setOpenDelete(true);
  };

  const handleDeleteOpenChange = (nextOpen: boolean) => {
    setOpenDelete(nextOpen);
    if (!nextOpen) {
      setDeleteTarget(null);
    }
  };

  const handleConfirmDelete = () => {
    setOpenDelete(false);
    setDeleteTarget(null);
  };

  const deleteLabel = deleteTarget?.name ?? "this quote";

  return (
    <>
      <div className="min-h-screen bg-[#EEF2F5] px-4 py-5 sm:px-6 lg:px-3">
        <div className="w-full">
          <div className="mb-5">
            <h1 className="text-[20px] font-bold leading-none text-[#2D3D4D] sm:text-[32px]">
              Quote Generated
            </h1>

            <div className="mt-2 flex items-center gap-2 text-[16px] font-medium text-[#2D3D4D]">
              <Link href="/" className="transition hover:text-[#00A56F]">
                Dashboard
              </Link>
              <ChevronRight className="h-3.5 w-3.5 text-[#64748B]" />
              <span>Quote Generated</span>
            </div>
          </div>

          <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.04)] sm:p-4">
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="border-none bg-[#F4F7F9] hover:bg-[#F4F7F9]">
                    <TableHead className="h-[42px] rounded-l-[8px] px-4 text-[16px] font-medium text-[#00A56F]">
                      Name
                    </TableHead>
                    <TableHead className="h-[42px] px-4 text-[16px] font-medium text-[#00A56F]">
                      Email
                    </TableHead>
                    <TableHead className="h-[42px] px-4 text-[16px] font-medium text-[#00A56F]">
                      Phone
                    </TableHead>
                    <TableHead className="h-[42px] px-4 text-[16px] font-medium text-[#00A56F]">
                      Date
                    </TableHead>
                    <TableHead className="h-[42px] rounded-r-[8px] px-4 text-[16px] font-medium text-[#00A56F]">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedData.map((item) => (
                    <TableRow
                      key={item.id}
                      className="border-b border-[#EDF1F4] hover:bg-transparent"
                    >
                      <TableCell className="px-4 py-[14px] text-[16px] font-medium text-[#2D3D4D]">
                        {item.name}
                      </TableCell>

                      <TableCell className="px-4 py-[14px] text-[16px] font-medium text-[#2D3D4D]">
                        {item.email}
                      </TableCell>

                      <TableCell className="px-4 py-[14px] text-[16px] font-medium text-[#2D3D4D]">
                        {item.phone}
                      </TableCell>

                      <TableCell className="px-4 py-[14px] text-[16px] font-medium text-[#2D3D4D]">
                        {item.date}
                      </TableCell>

                      <TableCell className="px-4 py-[14px]">
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            onClick={() => handleOpenDetails(item)}
                            className="h-[40px] rounded-full bg-[#00A56F1A] px-3 text-[16px] font-semibold text-[#12A150] hover:bg-[#dcf4e7]"
                          >
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                            View Details
                          </Button>

                          <button
                            type="button"
                            onClick={() => handleOpenDelete(item)}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-[#F5D64E] transition hover:bg-[#FFF8DB]"
                          >
                            <Trash2 className="!h-5 !w-5 text-[#FFDE59]" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[13px] font-medium text-[#64748B]">
                Showing {startItem} to {endItem} of {totalItems} results
              </p>

              <CustomPagination
                currentPage={page}
                totalPages={totalPages}
                pageSize={pageSize}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <QuoteDetailsModal
        open={openDetails}
        onOpenChange={setOpenDetails}
        quote={selectedQuote}
      />

      <Dialog open={openDelete} onOpenChange={handleDeleteOpenChange}>
        <DialogPortal>
          <DialogOverlay className="bg-[#2D3D4DCC]" />

          <DialogContent className="w-[420px] max-w-[92vw] sm:max-w-[92vw] gap-0 rounded-[16px] border-none bg-white p-6 text-center shadow-[0_10px_30px_rgba(15,23,42,0.18)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F4F7F9] text-[#F5D64E]">
              <Trash2 className="h-6 w-6" />
            </div>

            <DialogTitle className="mt-4 text-[18px] font-semibold text-[#2D3D4D]">
              Are you sure?
            </DialogTitle>
            <p className="mt-2 text-[13px] text-[#64748B]">
              You want to delete {deleteLabel} from this Dashboard.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDeleteOpenChange(false)}
                className="h-[40px] rounded-[10px] border border-[#F5D64E] bg-transparent px-6 text-[14px] font-semibold text-[#F5D64E] hover:bg-transparent"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleConfirmDelete}
                className="h-[40px] rounded-[10px] bg-[#F5D64E] px-6 text-[14px] font-semibold text-[#2D3D4D] hover:bg-[#edcf47]"
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </>
  );
}
