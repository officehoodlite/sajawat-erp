export function materialProductLabel(familyName: string | null | undefined, productName: string) {
  const family = familyName?.trim() ?? "";
  const name = productName.trim();
  if (!family || family.toLowerCase() === name.toLowerCase()) return name;
  return `${family} — ${name}`;
}
