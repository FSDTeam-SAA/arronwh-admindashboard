"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface BookingDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingItem | null;
}

const answers = [
  { question: "Are you homeowner or a landlord?", answer: "Homeowner" },
  { question: "What kind of fuel do your boiler use?", answer: "Gas" },
  { question: "Currently, what type of boiler do you have?", answer: "Combi" },
  { question: "How old would you say your current boiler?", answer: "Not working" },
  { question: "Roughly how old is your boiler?", answer: "Up to 10 years" },
  { question: "Do you own your own boiler instead or pipes?", answer: "No" },
  { question: "How many bedrooms do you have?", answer: "2" },
  { question: "How many bathrooms do you have, or plan to have in the future?", answer: "2+" },
  { question: "How many radiators do you have?", answer: "6-9" },
  { question: "Do you have thermostatic radiator valve and all your radiator?", answer: "Yes" },
  { question: "For the job is a flue placed out of the roof?", answer: "Sloped" },
  { question: "Where on the roof is positioned?", answer: "Highest two-thirds" },
  { question: "If your boiler mounted on the wall?", answer: "Yes it is mounted on the wall" },
  { question: "Which of this best describe your new boiler?", answer: "Detached" },
  { question: "Do you have enough showers do you have, or plan to have in the future?", answer: "1+" },
  { question: "Do you have a cycle where?", answer: "Yes" },
  { question: "Where do you hear one of the room are?", answer: "Roof" },
];

const optionRows = [
  ["Worcester Bosch Greenstar 4000 30kw", "£2,499"],
  ["Hive Thermostat Mini", "£248"],
  ["Converting Standard Boiler to Worcester Wall Mounted Combi", "£450"],
  ["Disposal of your old boiler", "Included"],
  ["Shock Arrestor Boiler Protection Pack", "£50"],
  ["Worcester Bosch Vertical Flue Installation", "£500"],
  ["Worcester Bosch 100mm Flue Bend and Plume Extension", "£50"],
  ["In-line scale reducer", "£65"],
  ["Carbon Monoxide Alarm", "Included"],
  ["Condensate pipework", "Included"],
  ["Pipework alterations, electricals and upgrades", "Included"],
  ["Electrical work", "Included"],
  ["Boiler Aftercare 10 years warranty", "Included"],
  ["BOXT to register warranty & Building Control Certificate", "Included"],
  ["Sentinel Water Treatment", "Included"],
  ["Worcester Keyless Filling Link", "Included"],
];

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function buildCalendarWeeks(year: number, monthIndex: number) {
  const firstDay = new Date(year, monthIndex, 1);
  const startDayIndex = firstDay.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const weeks: Array<Array<number | null>> = [];

  let currentDay = 1;
  for (let week = 0; week < 6; week += 1) {
    const row: Array<number | null> = [];
    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      if (week === 0 && dayIndex < startDayIndex) {
        row.push(null);
      } else if (currentDay > daysInMonth) {
        row.push(null);
      } else {
        row.push(currentDay);
        currentDay += 1;
      }
    }
    weeks.push(row);
    if (currentDay > daysInMonth) {
      break;
    }
  }

  return weeks;
}

function getDayClass(day: number | null) {
  if (!day) return "invisible";
  if (day === 11) return "bg-[#00A56F] text-white";
  if (day === 14) return "bg-[#F5D64E] text-[#2D3D4D]";
  if ([6, 22, 23, 24].includes(day)) return "bg-[#F4A7A7] text-[#2D3D4D]";
  return "bg-white text-[#2D3D4D]";
}

function getDaySubLabel(day: number | null) {
  if (day === 11) return "Survey";
  if (day === 14) return "Installation";
  return "";
}

export function BookingDetailsModal({
  open,
  onOpenChange,
  booking,
}: BookingDetailsModalProps) {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const calendarWeeks = useMemo(
    () => buildCalendarWeeks(selectedYear, selectedMonth),
    [selectedYear, selectedMonth]
  );

  const yearOptions = useMemo(() => {
    const startYear = selectedYear - 3;
    return Array.from({ length: 10 }, (_, index) => startYear + index);
  }, [selectedYear]);

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-[#2D3D4DCC]" />

        <DialogContent className="max-h-[92vh] !w-[1400px] max-w-[96vw] sm:max-w-[96vw] gap-0 overflow-hidden rounded-[14px] border-none bg-white p-0 shadow-[0_10px_30px_rgba(15,23,42,0.14)]">
          <div className="flex items-center justify-between border-b border-[#EEF2F5] px-5 py-4">
            <DialogTitle className="text-[28px] font-semibold text-[#2D3D4D]">
              Booking Details
            </DialogTitle>
          </div>

          <div className="max-h-[calc(92vh-72px)] overflow-y-auto px-4 py-4 sm:px-5">
            {/* Personal Details */}
            <div className="rounded-[8px] bg-[#F0F3F6] p-4">
              <h3 className="mb-4 text-[28px] font-semibold text-[#2D3D4D]">
                Personal Details
              </h3>

              <div className="grid grid-cols-1 gap-3 text-[16px] text-[#2D3D4D] sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Name:</span>
                  <span>{booking.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#64748B]" />
                  <span>{booking.email}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#64748B]" />
                  <span>{booking.phone}</span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#64748B]" />
                  <span>smith@gmail.com</span>
                </div>
              </div>
            </div>

            {/* Booking Calendar */}
            <div className="mt-5 rounded-[18px] bg-[#F0F3F6] p-4 sm:p-5">
              <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <h3 className="text-[28px] font-semibold text-[#2D3D4D]">
                  Booking Calendar
                </h3>

                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={String(selectedMonth)}
                    onValueChange={(value) =>
                      setSelectedMonth(Number(value))
                    }
                  >
                    <SelectTrigger className="h-[40px] w-[190px] rounded-[10px] border border-transparent bg-white px-4 text-[14px] font-semibold text-[#2D3D4D] shadow-none focus-visible:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {monthNames.map((month, index) => (
                        <SelectItem key={month} value={String(index)}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={String(selectedYear)}
                    onValueChange={(value) =>
                      setSelectedYear(Number(value))
                    }
                  >
                    <SelectTrigger className="h-[40px] w-[190px] rounded-[10px] border border-transparent bg-white px-4 text-[14px] font-semibold text-[#2D3D4D] shadow-none focus-visible:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-x-6 gap-y-4">
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="text-center text-[13px] font-medium text-[#2D3D4D]"
                  >
                    {day}
                  </div>
                ))}

                {calendarWeeks.flatMap((week, rowIndex) =>
                  week.map((value, colIndex) => {
                    const key = `${rowIndex}-${colIndex}`;
                    const subLabel = getDaySubLabel(value);

                    return (
                      <div key={key} className="flex justify-center">
                        <div
                          className={`flex h-[40px] w-[70px] flex-col items-center justify-center rounded-[8px] text-[14px] font-medium ${getDayClass(
                            value
                          )}`}
                        >
                          {value}
                          {subLabel ? (
                            <span className="mt-0.5 text-[10px] font-medium">
                              {subLabel}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quiz Answers */}
            <div className="mt-5">
              <h3 className="mb-6 text-[28px] font-semibold text-[#2D3D4D]">
                Quiz Answers
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {answers.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-[8px] bg-[#00A56F] px-3 py-2 text-white"
                  >
                    <p className="text-[14px] leading-[1.35] font-medium">
                      {item.question}
                    </p>
                    <p className="mt-2 text-[18px] font-bold">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Option chosen */}
            <div className="mt-5">
              <h3 className="mb-6 text-[28px] font-semibold text-[#2D3D4D]">
                Option chosen
              </h3>

              <div className="rounded-[8px] border-b border-[#2D3D4D] bg-white">
                {optionRows.map(([label, value], index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-4 border-b border-dashed border-[#D9E0E7] px-4 py-3 last:border-b-0"
                  >
                    <p className="text-[16px] text-[#2D3D4D]">{label}</p>
                    <p className="shrink-0 text-[13px] font-medium text-[#2D3D4D]">
                      {value}
                    </p>
                  </div>
                ))}

                <div className="border-t border-[#EEF2F5] bg-[#F4F7F9] px-4 py-3">
                  <p className="text-[12px] font-medium text-[#2D3D4D]">
                    Fixed price including installation:
                  </p>
                  <p className="mt-1 text-[14px] font-semibold text-[#2D3D4D]">
                    Total payment adjustment
                  </p>
                  <p className="mt-1 text-[14px] font-semibold text-[#2D3D4D]">
                    £3,099
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-5 space-y-3">
              <Button className="h-[48px] w-full rounded-[4px] bg-[#FFDE59] text-[16px] font-semibold text-[#2D3D4D] hover:bg-[#edcf47]">
                Email quote via email
              </Button>

              <Button className="h-[48px] w-full rounded-[4px] bg-[#00A56F] text-[16px] font-semibold text-white hover:bg-[#009562]">
                Call Your customer
              </Button>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
