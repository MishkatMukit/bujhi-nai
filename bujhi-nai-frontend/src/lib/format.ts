const banglaNumber = new Intl.NumberFormat("bn-BD");

/** Bangla numerals for counts; falls back to Latin digits if unsupported. */
export const formatCount = (value: number): string => {
  try {
    return banglaNumber.format(value);
  } catch {
    return String(value);
  }
};

const dateFormatter = new Intl.DateTimeFormat("bn-BD", {
  day: "numeric",
  month: "short",
  timeZone: "Asia/Dhaka",
});

/** Deterministic short date (fixed timezone) so SSR and hydration agree. */
export const formatShortDate = (iso: string): string => {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  try {
    return dateFormatter.format(date);
  } catch {
    return date.toLocaleDateString();
  }
};

export const fileSizeLabel = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
