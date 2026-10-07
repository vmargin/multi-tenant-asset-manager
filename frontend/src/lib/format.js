export const titleCase = (value) =>
  String(value || "")
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
export const dateLabel = (value) =>
  value
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "—";
export const money = (value, currency = "PHP") =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
export const initials = (value) =>
  String(value || "?")
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
export const personName = (people, id) =>
  people.find((person) => person.id === id)?.name || "Unassigned";
export const categoryName = (categories, id) =>
  categories.find((item) => item.id === id)?.name || "Uncategorized";
export const locationName = (locations, id) =>
  locations.find((item) => item.id === id)?.name || "No location";
export function assetFields(asset = {}) {
  return {
    name: asset.name || "",
    assetTag: asset.assetTag || "",
    serialNumber: asset.serialNumber || "",
    categoryId: asset.categoryId || "",
    locationId: asset.locationId || "",
    model: asset.model || "",
    purchaseDate: asset.purchaseDate?.slice(0, 10) || "",
    warrantyDate: asset.warrantyDate?.slice(0, 10) || "",
    purchaseCost: asset.purchaseCost ?? "",
    notes: asset.notes || "",
    imageKey: asset.imageKey || "",
  };
}
export const mayManage = (role) => role === "OWNER" || role === "MANAGER";
