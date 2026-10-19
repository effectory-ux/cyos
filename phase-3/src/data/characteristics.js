// characteristics.js — the employee-data attributes question logic can target.
// In production these come with the organization's employee data (the EEX
// upload); the prototype ships a fixed, realistic set. A logic condition
// references an attribute by `key` and its values by index, so renaming a
// value never breaks saved conditions.
export const CHARACTERISTICS = [
  { key: "role", label: "Role type", values: ["Manager", "Non-manager"] },
  { key: "department", label: "Department", values: ["Customer Support", "Engineering", "Finance", "HR", "Marketing", "Sales"] },
  { key: "workplace", label: "Work location", values: ["On-site", "Hybrid", "Remote"] },
  { key: "gender", label: "Gender", values: ["Man", "Woman", "Non-binary"] },
  { key: "tenure", label: "Time at the organization", values: ["Less than 1 year", "1 to 3 years", "3 to 10 years", "More than 10 years"] },
];

export const characteristicOf = (key) => CHARACTERISTICS.find(c => c.key === key) || null;
