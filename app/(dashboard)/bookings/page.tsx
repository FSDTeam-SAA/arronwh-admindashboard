"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ChevronDown,
  Eye,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { CustomPagination } from "@/components/ui/common/CustomPagination";
import { BookingDetailsModal } from "./_components/BookingDetailsModal";

type BookingItem = {
  id: number;
  name: string;
  email: string;
  phone: string;
  date: string;
  revenue: string;
  bookingFor: "Survey" | "Installation";
  status: "Pending" | "Confirmation" | "Cancellation";
};

const bookingData: BookingItem[] = [
  {
    id: 1,
    name: "Savannah Nguyen",
    email: "debra.holt@example.com",
    phone: "(907) 555-0101",
    date: "November 28, 2015",
    revenue: "$00",
    bookingFor: "Survey",
    status: "Pending",
  },
  {
    id: 2,
    name: "Savannah Nguyen",
    email: "debra.holt@example.com",
    phone: "(907) 555-0101",
    date: "November 28, 2015",
    revenue: "$00",
    bookingFor: "Survey",
    status: "Pending",
  },
  {
    id: 3,
    name: "Savannah Nguyen",
    email: "debra.holt@example.com",
    phone: "(907) 555-0101",
    date: "November 28, 2015",
    revenue: "$00",
    bookingFor: "Survey",
    status: "Pending",
  },
  {
    id: 4,
    name: "Savannah Nguyen",
    email: "debra.holt@example.com",
    phone: "(907) 555-0101",
    date: "November 28, 2015",
    revenue: "£4,768",
    bookingFor: "Installation",
    status: "Confirmation",
  },
  {
    id: 5,
    name: "Savannah Nguyen",
    email: "debra.holt@example.com",
    phone: "(907) 555-0101",
    date: "November 28, 2015",
    revenue: "£4,768",
    bookingFor: "Installation",
    status: "Confirmation",
  },
  {
    id: 6,
    name: "Savannah Nguyen",
    email: "debra.holt@example.com",
    phone: "(907) 555-0101",
    date: "November 28, 2015",
    revenue: "£4,768",
    bookingFor: "Installation",
    status: "Cancellation",
  },
  {
    id: 7,
    name: "Savannah Nguyen",
    email: "debra.holt@example.com",
    phone: "(907) 555-0101",
    date: "November 28, 2015",
    revenue: "£4,768",
    bookingFor: "Installation",
    status: "Cancellation",
  },
  {
    id: 8,
    name: "Savannah Nguyen",
    email: "debra.holt@example.com",
    phone: "(907) 555-0101",
    date: "November 28, 2015",
    revenue: "£4,768",
    bookingFor: "Installation",
    status: "Confirmation",
  },
  {
    id: 9,
    name: "Savannah Nguyen",
    email: "debra.holt@example.com",
    phone: "(907) 555-0101",
    date: "November 28, 2015",
    revenue: "£4,768",
    bookingFor: "Installation",
    status: "Confirmation",
  },
  {
    id: 10,
    name: "Savannah Nguyen",
    email: "debra.holt@example.com",
    phone: "(907) 555-0101",
    date: "November 28, 2015",
    revenue: "£4,768",
    bookingFor: "Installation",
    status: "Confirmation",
  },
  {
    id: 11,
    name: "Savannah Nguyen",
    email: "debra.holt@example.com",
    phone: "(907) 555-0101",
    date: "November 28, 2015",
    revenue: "£4,768",
    bookingFor: "Installation",
    status: "Confirmation",
  },
  {
    id: 12,
    name: "Savannah Nguyen",
    email: "debra.holt@example.com",
    phone: "(907) 555-0101",
    date: "November 28, 2015",
    revenue: "£4,768",
    bookingFor: "Installation",
    status: "Cancellation",
  },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50];

function BookingForBadge({
  value,
  onChange,
}: {
  value: BookingItem["bookingFor"];
  onChange: (value: BookingItem["bookingFor"]) => void;
}) {
  const styles =
    value === "Survey"
      ? "bg-[#F5D64E] text-white"
      : "bg-[#00A56F] text-white";

  return (
    <div className="relative w-[190px]">
      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value as BookingItem["bookingFor"])
        }
        className={cn(
          "h-[35px] w-full appearance-none rounded-full px-4 pr-10 text-[16px] font-medium outline-none",
          styles
        )}
      >
        <option value="Installation">Installation</option>
        <option value="Survey">Survey</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white" />
    </div>
  );
}

function StatusBadge({
  value,
  onChange,
}: {
  value: BookingItem["status"];
  onChange: (value: BookingItem["status"]) => void;
}) {
  const styles =
    value === "Pending"
      ? "bg-[#FFF5D6] text-[#F5C242]"
      : value === "Confirmation"
      ? "bg-[#E4F7EF] text-[#00A56F]"
      : "bg-[#FDE8E8] text-[#F87171]";

  return (
    <div className="relative w-[190px]">
      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value as BookingItem["status"])
        }
        className={cn(
          "h-[35px] w-full appearance-none rounded-full px-4 pr-10 text-[16px] font-medium outline-none",
          styles
        )}
      >
        <option value="Confirmation">Confirmation</option>
        <option value="Cancellation">Cancellation</option>
        <option value="Pending">Pending</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-current" />
    </div>
  );
}

export default function BookingManagementPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [bookings, setBookings] = useState(bookingData);
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);

  const totalItems = bookings.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return bookings.slice(start, start + pageSize);
  }, [bookings, page, pageSize]);

  const handleBookingForChange = (
    id: number,
    nextValue: BookingItem["bookingFor"]
  ) => {
    setBookings((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, bookingFor: nextValue } : item
      )
    );
  };

  const handleStatusChange = (
    id: number,
    nextValue: BookingItem["status"]
  ) => {
    setBookings((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: nextValue } : item
      )
    );
  };

  const handleOpenDetails = (item: BookingItem) => {
    setSelectedBooking(item);
    setOpenDetails(true);
  };

  const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  return (
    <>
      <div className="min-h-screen bg-[#EEF2F5] px-4 py-5 sm:px-6 lg:px-3">
        <div className="w-full">
          <div className="mb-5">
            <h1 className="text-[20px] font-bold leading-none text-[#2D3D4D] sm:text-[32px]">
              Booking Management
            </h1>

            <div className="mt-2 flex items-center gap-2 text-[16px] font-medium text-[#2D3D4D]">
              <Link href="/" className="transition hover:text-[#00A56F]">
                Dashboard
              </Link>
              <ChevronRight className="h-3.5 w-3.5 text-[#64748B]" />
              <span>Booking Management</span>
            </div>
          </div>

          <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.04)] sm:p-4">
            <div className="overflow-x-auto">
              <Table className="min-w-[1180px]">
                <TableHeader>
                  <TableRow className="border-none bg-[#F4F7F9] hover:bg-[#F4F7F9]">
                    <TableHead className="h-[42px] rounded-l-[8px] px-4 text-[16px] font-medium text-[#00A56F]">Name</TableHead>
                    <TableHead className="h-[42px] px-4 text-[16px] font-medium text-[#00A56F]">Email</TableHead>
                    <TableHead className="h-[42px] px-4 text-[16px] font-medium text-[#00A56F]">Phone</TableHead>
                    <TableHead className="h-[42px] px-4 text-[16px] font-medium text-[#00A56F]">Date</TableHead>
                    <TableHead className="h-[42px] px-4 text-[16px] font-medium text-[#00A56F]">Revenue</TableHead>
                    <TableHead className="h-[42px] px-4 text-[16px] font-medium text-[#00A56F]">Booking for</TableHead>
                    <TableHead className="h-[42px] px-4 text-[16px] font-medium text-[#00A56F]">Status</TableHead>
                    <TableHead className="h-[42px] rounded-r-[8px] px-4 text-[16px] font-medium text-[#00A56F]">Action</TableHead>
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
                      <TableCell className="max-w-[190px] px-4 py-[14px] text-[16px] font-medium leading-6 text-[#2D3D4D]">
                        <span className="break-words">{item.email}</span>
                      </TableCell>
                      <TableCell className="px-4 py-[14px] text-[16px] font-medium text-[#2D3D4D]">
                        {item.phone}
                      </TableCell>
                      <TableCell className="px-4 py-[14px] text-[16px] font-medium text-[#2D3D4D]">
                        {item.date}
                      </TableCell>
                      <TableCell className="px-4 py-[14px] text-[16px] font-medium text-[#2D3D4D]">
                        {item.revenue}
                      </TableCell>
                      <TableCell className="px-4 py-[14px]">
                        <BookingForBadge
                          value={item.bookingFor}
                          onChange={(nextValue) =>
                            handleBookingForChange(item.id, nextValue)
                          }
                        />
                      </TableCell>
                      <TableCell className="px-4 py-[14px]">
                        <StatusBadge
                          value={item.status}
                          onChange={(nextValue) =>
                            handleStatusChange(item.id, nextValue)
                          }
                        />
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
                            className="flex h-8 w-8 items-center justify-center rounded-full text-[#F5D64E] transition hover:bg-[#FFF8DB]"
                          >
                            <Trash2 className="h-5 w-5 text-[#FFDE59]" />
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

      <BookingDetailsModal
        open={openDetails}
        onOpenChange={setOpenDetails}
        booking={selectedBooking}
      />
    </>
  );
}