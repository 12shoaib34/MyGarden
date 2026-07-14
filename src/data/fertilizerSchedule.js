export const fertilizerSchedule = [
  {
    id: "day-1-top-dressing",
    day: 1,
    title: "Organic Top Dressing",
    type: "Soil feed",
    icon: "top-dressing",
    items: [
      "Organic Compost",
      "Vermicompost (Optional)",
      "Mustard Cake Powder",
      "Banana Peel Powder",
      "Rock Phosphate (Only every 2-3 months)",
    ],
    allowNotes: true,
  },
  {
    id: "day-3-seaweed",
    day: 3,
    title: "Seaweed Extract Foliar Spray",
    type: "Foliar spray",
    icon: "foliar",
    items: [],
    allowNotes: true,
  },
  {
    id: "day-5-start-compost-tea",
    day: 5,
    title: "Start Making Compost Tea",
    type: "Preparation",
    icon: "tea",
    items: [],
    allowNotes: false,
  },
  {
    id: "day-7-apply-compost-tea",
    day: 7,
    title: "Apply Compost Tea",
    type: "Soil drench",
    icon: "drench",
    items: ["Soil Drench"],
    allowNotes: true,
  },
  {
    id: "day-10-humic-acid",
    day: 10,
    title: "Humic Acid Soil Drench",
    type: "Monthly soil drench",
    icon: "humic",
    items: ["Apply once every month."],
    allowNotes: true,
  },
  {
    id: "day-15-start-compost-tea",
    day: 15,
    title: "Start Making Compost Tea",
    type: "Preparation",
    icon: "tea",
    items: [],
    allowNotes: false,
  },
  {
    id: "day-17-apply-compost-tea",
    day: 17,
    title: "Apply Compost Tea",
    type: "Soil drench",
    icon: "drench",
    items: ["Soil Drench"],
    allowNotes: true,
  },
];

export function getFertilizerMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getFertilizerMonthLabel(monthKey) {
  const [year, month] = String(monthKey).split("-").map(Number);
  if (!year || !month) {
    return monthKey;
  }
  return new Date(year, month - 1, 1).toLocaleDateString([], {
    month: "long",
    year: "numeric",
  });
}

export function getFertilizerTaskDueDate(monthKey, day, hour = 9, minute = 0) {
  const [year, month] = String(monthKey).split("-").map(Number);
  return new Date(year, month - 1, Number(day), hour, minute, 0, 0);
}
