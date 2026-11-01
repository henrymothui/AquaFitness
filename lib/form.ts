const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function requiredText(formData: FormData, key: string, label: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) throw new Error(`${label} is required`);
  return value;
}

export function optionalText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

export function requiredId(formData: FormData, key: string, label: string) {
  const value = requiredText(formData, key, label);
  if (!UUID.test(value)) throw new Error(`${label} is not valid`);
  return value;
}

export function optionalId(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) return null;
  if (!UUID.test(value)) throw new Error("That selection is not valid");
  return value;
}

export function idList(formData: FormData, key: string) {
  return [...new Set(formData.getAll(key).map(String).filter((id) => UUID.test(id)))];
}

export function intField(
  formData: FormData,
  key: string,
  label: string,
  min: number,
  max: number,
) {
  const raw = String(formData.get(key) ?? "").trim();
  if (!/^-?\d+$/.test(raw)) {
    throw new Error(`${label} must be a whole number from ${min} to ${max}`);
  }
  const value = Number(raw);
  if (value < min || value > max) {
    throw new Error(`${label} must be a whole number from ${min} to ${max}`);
  }
  return value;
}

export function optionalInt(
  formData: FormData,
  key: string,
  label: string,
  min: number,
  max: number,
) {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  if (!/^-?\d+$/.test(raw)) {
    throw new Error(`${label} must be a whole number from ${min} to ${max}`);
  }
  const value = Number(raw);
  if (value < min || value > max) {
    throw new Error(`${label} must be a whole number from ${min} to ${max}`);
  }
  return value;
}

export function dollarsToCents(formData: FormData, key: string, label: string) {
  const raw = String(formData.get(key) ?? "").trim();
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > 100000) {
    throw new Error(`${label} must be a valid price`);
  }
  return Math.round(value * 100);
}

export function timeField(formData: FormData, key: string, label: string) {
  const value = requiredText(formData, key, label);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw new Error(`${label} must be a valid time`);
  }
  return value;
}

export function dateField(formData: FormData, key: string, label: string) {
  const value = requiredText(formData, key, label);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${label} must be a valid date`);
  }
  return value;
}

export function checked(formData: FormData, key: string) {
  return formData.get(key) === "on";
}
