export const DETAIL_FIELD_DEFINITIONS = [
  { key: "courseName", label: "Course Name" },
  { key: "fullName", label: "Full Name" },
  { key: "studentId", label: "Student ID" },
  { key: "division", label: "Division" },
  { key: "subject", label: "Subject" },
  { key: "subjectCode", label: "Subject Code" },
  { key: "assignmentNumber", label: "Assignment Number" },
];

function getCustomDetails(details) {
  return Array.isArray(details?.customDetails) ? details.customDetails : [];
}

export function getOrderedFields(details, options) {
  const customDetails = getCustomDetails(details);
  const fieldMap = new Map([
    ...DETAIL_FIELD_DEFINITIONS.map((field) => [field.key, field]),
    ...customDetails.map((item) => [
      `custom:${item.id}`,
      {
        key: `custom:${item.id}`,
        label: item.label,
        custom: true,
        value: item.value || "",
      },
    ]),
  ]);
  const defaultOrder = [
    ...DETAIL_FIELD_DEFINITIONS.map(({ key }) => key),
    ...customDetails.map((item) => `custom:${item.id}`),
  ];
  return [...(options?.headerFieldOrder || []), ...defaultOrder]
    .filter(
      (key, index, list) => fieldMap.has(key) && list.indexOf(key) === index,
    )
    .map((key) => fieldMap.get(key));
}

export function getSelectedDetailRows(details, options) {
  const fields = options?.headerFields || {};
  return getOrderedFields(details, options)
    .filter((field) => Boolean(fields[field.key]))
    .map((field) => [
      field.label,
      field.custom ? field.value || "" : details?.[field.key] || "",
    ]);
}

export function getSelectedHeaderParts(details, options) {
  const fields = options?.headerFields || {};
  return getOrderedFields(details, options)
    .filter((field) => Boolean(fields[field.key]))
    .reduce((parts, field) => {
      const value = field.custom
        ? field.value || ""
        : details?.[field.key] || "";
      if (!String(value).trim()) return parts;
      if (field.key === "division") parts.push(`Division ${value}`);
      else if (field.key === "assignmentNumber")
        parts.push(`Assignment ${value}`);
      else if (field.custom) parts.push(`${field.label}: ${value}`);
      else parts.push(value);
      return parts;
    }, []);
}
