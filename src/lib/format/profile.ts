import type { UserProfileContact } from "@/lib/api";

export function formatCardDisplay(digits: string) {
  return digits.replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function parseProfileContactForm(input: {
  phone: string;
  bankShaba: string;
  cardNumber: string;
  birthDate: string;
}): UserProfileContact {
  return {
    phone: input.phone.trim() || null,
    bankShaba: input.bankShaba.trim() || null,
    cardNumber: input.cardNumber.replace(/\D/g, "") || null,
    birthDate: input.birthDate.trim() || null,
  };
}

export function profileContactToForm(user: UserProfileContact) {
  return {
    phone: user.phone ?? "",
    bankShaba: user.bankShaba ?? "",
    cardNumber: user.cardNumber ? formatCardDisplay(user.cardNumber) : "",
    birthDate: user.birthDate ?? "",
  };
}
