import { BadRequestException } from "@nestjs/common";

/** Iranian mobile: 09xxxxxxxxx */
export function normalizeIranPhone(input: string | null | undefined): string | null {
  if (input == null || !String(input).trim()) return null;
  let digits = String(input).replace(/\D/g, "");
  if (digits.startsWith("98") && digits.length === 12) digits = `0${digits.slice(2)}`;
  if (!/^09\d{9}$/.test(digits)) {
    throw new BadRequestException("شماره موبایل معتبر نیست (مثال: 09123456789)");
  }
  return digits;
}

/** Iranian SHABA / IBAN: IR + 24 digits */
export function normalizeBankShaba(input: string | null | undefined): string | null {
  if (input == null || !String(input).trim()) return null;
  const cleaned = String(input).replace(/\s/g, "").toUpperCase();
  const normalized = cleaned.startsWith("IR") ? cleaned : `IR${cleaned.replace(/^IR/i, "")}`;
  if (!/^IR\d{24}$/.test(normalized)) {
    throw new BadRequestException("شماره شبا معتبر نیست (IR + 24 رقم)");
  }
  return normalized;
}

/** Iranian bank card: 16 digits */
export function normalizeCardNumber(input: string | null | undefined): string | null {
  if (input == null || !String(input).trim()) return null;
  const digits = String(input).replace(/\D/g, "");
  if (!/^\d{16}$/.test(digits)) {
    throw new BadRequestException("شماره کارت باید ۱۶ رقم باشد");
  }
  return digits;
}

/** ISO date YYYY-MM-DD */
export function normalizeBirthDate(input: string | null | undefined): string | null {
  if (input == null || !String(input).trim()) return null;
  const value = String(input).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException("تاریخ تولد معتبر نیست");
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException("تاریخ تولد معتبر نیست");
  }
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (date > today) {
    throw new BadRequestException("تاریخ تولد نمی‌تواند در آینده باشد");
  }
  const minYear = 1920;
  if (date.getUTCFullYear() < minYear) {
    throw new BadRequestException("تاریخ تولد معتبر نیست");
  }
  return value;
}

export function profileContactDto(user: {
  phone: string | null;
  bankShaba: string | null;
  cardNumber: string | null;
  birthDate: string | null;
}) {
  return {
    phone: user.phone,
    bankShaba: user.bankShaba,
    cardNumber: user.cardNumber,
    birthDate: user.birthDate,
  };
}
