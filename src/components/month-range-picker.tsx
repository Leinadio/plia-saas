"use client";

import { useId, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ChevronDown,
  X,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { addMonthsKey, monthRange } from "@/lib/history";
import { cn } from "@/lib/utils";
import styles from "./history-period.module.css";

const MONTHS = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];
const label = (month: string) =>
  `${MONTHS[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`;

export function MonthRangePicker({
  min,
  max,
  from,
  to,
  current,
  pendingRange,
  onCommit,
  disabled = false,
}: {
  min: string;
  max: string;
  from: string;
  to: string;
  current: string;
  pendingRange?: { from: string; to: string } | null;
  onCommit?: (from: string, to: string) => void;
  disabled?: boolean;
}) {
  const isMobile = useIsMobile(640);
  const Root = isMobile ? Sheet : Popover;
  const Trigger = isMobile ? SheetTrigger : PopoverTrigger;
  const Title = isMobile ? SheetTitle : "h2";
  const Description = isMobile ? SheetDescription : "p";
  const router = useRouter();
  const pathname = usePathname();
  const summaryId = useId();
  const headingId = useId();
  const hintId = useId();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(Number(from.slice(0, 4)));
  const [anchor, setAnchor] = useState<string | null>(null);
  const [localPending, setLocalPending] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const range = pendingRange ?? localPending ?? { from, to };
  const displayFrom = anchor ?? range.from;
  const displayTo = anchor ? null : range.to;
  const endLimit =
    anchor && addMonthsKey(anchor, 23) < max ? addMonthsKey(anchor, 23) : max;

  const changeOpen = (next: boolean) => {
    setOpen(next);
    setAnchor(null);
    if (next) setYear(Number(range.from.slice(0, 4)));
  };
  const commit = (next: { from: string; to: string }) => {
    if (disabled) return;
    setAnchor(null);
    setOpen(false);
    if (onCommit) onCommit(next.from, next.to);
    else {
      setLocalPending(next);
      router.push(`${pathname}?from=${next.from}&to=${next.to}`);
    }
  };
  const presets = [
    { name: "Ce mois-ci", from: current, to: current },
    { name: "3 mois à venir", from: current, to: addMonthsKey(current, 2) },
    { name: "6 mois à venir", from: current, to: addMonthsKey(current, 5) },
  ];
  const pick = (month: string) => {
    if (disabled) return;
    if (!anchor) {
      setAnchor(month);
      return;
    }
    if (month < anchor || month > endLimit) return;
    commit({ from: anchor, to: month });
  };

  const calendarBody = (
    <>
      <div className={styles.calendarHeading}>
        <Title id={headingId}>Choisir la période</Title>
        <Description id={hintId} aria-live="polite">
          {anchor
            ? "Choisissez le mois de fin."
            : "Choisissez le mois de départ, puis le mois de fin."}
        </Description>
      </div>
      <div className={styles.presets} aria-label="Périodes rapides">
        {presets.map((preset) => (
          <button
            type="button"
            key={preset.name}
            disabled={disabled || preset.from < min || preset.to > max}
            onClick={() => commit({ from: preset.from, to: preset.to })}
          >
            {preset.name}
          </button>
        ))}
      </div>
      <div className={styles.rangeFields}>
        <button
          type="button"
          aria-label="Modifier le mois de départ"
          aria-pressed={!anchor}
          onClick={() => {
            setAnchor(null);
            setYear(Number(range.from.slice(0, 4)));
          }}
        >
          <span>Départ</span>
          <strong>{label(displayFrom)}</strong>
        </button>
        <button
          type="button"
          aria-label="Modifier le mois de fin"
          aria-pressed={!!anchor}
          onClick={() => {
            setAnchor(displayFrom);
            setYear(Number((displayTo ?? displayFrom).slice(0, 4)));
          }}
        >
          <span>Fin</span>
          <strong>{displayTo ? label(displayTo) : "À choisir"}</strong>
        </button>
      </div>
      <div className={styles.yearNav}>
        <button
          type="button"
          aria-label="Année précédente"
          disabled={year <= Number((anchor ?? min).slice(0, 4))}
          onClick={() => setYear(year - 1)}
        >
          <ChevronLeft size={18} aria-hidden />
        </button>
        <select
          aria-label="Année du calendrier"
          value={year}
          onChange={(event) => setYear(Number(event.target.value))}
        >
          {Array.from(
            {
              length:
                Number(endLimit.slice(0, 4)) -
                Number((anchor ?? min).slice(0, 4)) +
                1,
            },
            (_, index) => Number((anchor ?? min).slice(0, 4)) + index,
          ).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <button
          type="button"
          aria-label="Année suivante"
          disabled={year >= Number(endLimit.slice(0, 4))}
          onClick={() => setYear(year + 1)}
        >
          <ChevronRight size={18} aria-hidden />
        </button>
      </div>
      <div className={styles.months}>
        {MONTHS.map((name, i) => {
          const month = `${year}-${String(i + 1).padStart(2, "0")}`;
          const selected = displayTo
            ? month >= displayFrom && month <= displayTo
            : month === displayFrom;
          const edge = month === displayFrom || month === displayTo;
          return (
            <button
              key={month}
              type="button"
              aria-pressed={selected}
              aria-current={month === current ? "date" : undefined}
              disabled={disabled || month < (anchor ?? min) || month > endLimit}
              className={cn(
                styles.month,
                selected && styles.selected,
                edge && styles.edge,
              )}
              onClick={() => pick(month)}
            >
              {name}
            </button>
          );
        })}
      </div>
      <div className={styles.calendarFooter}>
        <span>
          {anchor
            ? `Départ : ${label(anchor)}`
            : `${monthRange(range.from, range.to).length} mois affiché${range.from === range.to ? "" : "s"}`}
        </span>
        <button type="button" onClick={() => changeOpen(false)}>
          Annuler
        </button>
      </div>
    </>
  );

  return (
    <div className={styles.period} aria-busy={disabled || undefined}>
      <span id={summaryId} className="sr-only">
        {label(range.from)} — {label(range.to)}
      </span>
      <Root open={open} onOpenChange={changeOpen}>
        <Trigger asChild>
          <button
            type="button"
            className={styles.trigger}
            aria-label="Choisir la période"
            aria-describedby={summaryId}
            disabled={disabled}
          >
            <span className={styles.bound}>
              <span className={styles.label}>Mois de départ</span>
              <span className={styles.value}>{label(displayFrom)}</span>
            </span>
            <ArrowRight aria-hidden className={styles.arrow} />
            <span className={styles.bound}>
              <span className={styles.label}>Mois de fin</span>
              <span className={styles.value}>
                {displayTo ? label(displayTo) : "À choisir"}
              </span>
            </span>
            <span className={styles.calendarIcon}>
              <CalendarDays aria-hidden size={20} />
              <ChevronDown aria-hidden size={14} />
            </span>
          </button>
        </Trigger>
        {isMobile ? (
          <SheetContent
            side="bottom"
            showCloseButton={false}
            className={cn(styles.calendar, styles.calendarSheet)}
            aria-labelledby={headingId}
            aria-describedby={hintId}
          >
            <SheetClose asChild>
              <button
                type="button"
                className={styles.close}
                aria-label="Fermer le calendrier"
              >
                <X size={20} aria-hidden />
              </button>
            </SheetClose>
            {calendarBody}
          </SheetContent>
        ) : (
          <PopoverContent
            className={styles.calendar}
            sideOffset={8}
            collisionPadding={12}
            aria-labelledby={headingId}
            aria-describedby={hintId}
          >
            {calendarBody}
          </PopoverContent>
        )}
      </Root>
    </div>
  );
}
