import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  JALALI_MONTHS,
  JALALI_WEEKDAYS,
  compareJalali,
  formatJalali,
  isoToJalali,
  jalaliMonthLength,
  jalaliToIso,
  jalaliWeekday,
  todayJalali,
  type JalaliDate,
} from "@/lib/jalali";

type PersianDatePickerProps = {
  id?: string;
  value: string;
  onChange: (isoDate: string) => void;
  placeholder?: string;
  /** When true, days after today cannot be selected. */
  disableFuture?: boolean;
};

function faNum(n: number) {
  return n.toLocaleString("fa-IR", { useGrouping: false });
}

export function PersianDatePicker({
  id,
  value,
  onChange,
  placeholder = "انتخاب تاریخ",
  disableFuture = true,
}: PersianDatePickerProps) {
  const selected = isoToJalali(value);
  const today = todayJalali();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<JalaliDate>(() => selected ?? today);

  const days = useMemo(() => {
    const count = jalaliMonthLength(view.jy, view.jm);
    const lead = jalaliWeekday({ jy: view.jy, jm: view.jm, jd: 1 });
    return { count, lead };
  }, [view.jy, view.jm]);

  const shiftMonth = (delta: number) => {
    setView((current) => {
      let jm = current.jm + delta;
      let jy = current.jy;
      while (jm < 1) {
        jm += 12;
        jy -= 1;
      }
      while (jm > 12) {
        jm -= 12;
        jy += 1;
      }
      return { jy, jm, jd: 1 };
    });
  };

  const years = useMemo(() => {
    const end = disableFuture ? today.jy : today.jy + 5;
    const list: number[] = [];
    for (let y = end; y >= 1300; y -= 1) list.push(y);
    return list;
  }, [disableFuture, today.jy]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setView(selected ?? today);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className="h-10 w-full justify-between px-3 font-normal"
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? formatJalali(selected) : placeholder}
          </span>
          <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(20rem,calc(100vw-1.5rem))] p-3" dir="rtl">
        <div className="mb-3 flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftMonth(-1)} aria-label="ماه قبل">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="flex min-w-0 flex-1 items-center justify-center gap-1">
            <select
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              value={view.jm}
              onChange={(e) => setView((v) => ({ ...v, jm: Number(e.target.value) }))}
              aria-label="ماه"
            >
              {JALALI_MONTHS.map((name, index) => (
                <option key={name} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>
            <select
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              value={view.jy}
              onChange={(e) => setView((v) => ({ ...v, jy: Number(e.target.value) }))}
              aria-label="سال"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {faNum(year)}
                </option>
              ))}
            </select>
          </div>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftMonth(1)} aria-label="ماه بعد">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted-foreground">
          {JALALI_WEEKDAYS.map((day) => (
            <span key={day} className="py-1">
              {day}
            </span>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: days.lead }).map((_, i) => (
            <span key={`empty-${i}`} />
          ))}
          {Array.from({ length: days.count }).map((_, i) => {
            const day: JalaliDate = { jy: view.jy, jm: view.jm, jd: i + 1 };
            const future = disableFuture && compareJalali(day, today) > 0;
            const isSelected =
              selected?.jy === day.jy && selected.jm === day.jm && selected.jd === day.jd;
            const isToday = today.jy === day.jy && today.jm === day.jm && today.jd === day.jd;
            return (
              <button
                key={day.jd}
                type="button"
                disabled={future}
                onClick={() => {
                  onChange(jalaliToIso(day));
                  setOpen(false);
                }}
                className={cn(
                  "flex h-8 items-center justify-center rounded-md text-sm transition",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                  isToday && !isSelected && "border border-primary/50",
                  future && "cursor-not-allowed opacity-30 hover:bg-transparent",
                )}
              >
                {faNum(day.jd)}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            پاک کردن
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onChange(jalaliToIso(today));
              setOpen(false);
            }}
          >
            امروز
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
