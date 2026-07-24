/** Compose catalog/manufacturing display name: "418 - 78 x 60" */
export function formatCatalogModelName(modelNumber: string, size: string): string {
  return `${modelNumber.trim()} - ${size.trim()}`;
}

/** Split a stored modelName back into number + size for edit forms. */
export function parseCatalogModelName(modelName: string): {
  modelNumber: string;
  size: string;
} {
  const raw = modelName.trim();
  const sep = " - ";
  const idx = raw.indexOf(sep);
  if (idx === -1) {
    return { modelNumber: raw, size: "" };
  }
  return {
    modelNumber: raw.slice(0, idx).trim(),
    size: raw.slice(idx + sep.length).trim(),
  };
}
