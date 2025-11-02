export type GreenActionId = "public-transport" | "renewable-energy" | "recycling" | "low-carbon-diet" | "community";

export type GreenActionDefinition = {
  id: GreenActionId;
  label: string;
  description: string;
  weight: number;
  bucket: number;
  unit: string;
};

export const actionDefinitions: GreenActionDefinition[] = [
  {
    id: "public-transport",
    label: "Low-carbon commute",
    description: "Trips completed with public transport, biking, or walking.",
    weight: 18,
    bucket: 0,
    unit: "rides",
  },
  {
    id: "renewable-energy",
    label: "Renewable energy",
    description: "kWh sourced from solar, wind, or green tariffs.",
    weight: 30,
    bucket: 1,
    unit: "kWh",
  },
  {
    id: "recycling",
    label: "Circular recycling",
    description: "Kg of waste sorted for recycling or upcycling.",
    weight: 12,
    bucket: 2,
    unit: "kg",
  },
  {
    id: "low-carbon-diet",
    label: "Low-carbon meals",
    description: "Number of plant-based meals replacing meat options.",
    weight: 10,
    bucket: 3,
    unit: "meals",
  },
  {
    id: "community",
    label: "Community projects",
    description: "Hours volunteered in environmental activities.",
    weight: 22,
    bucket: 4,
    unit: "hours",
  },
];

export function findActionDefinition(id: GreenActionId): GreenActionDefinition {
  const found = actionDefinitions.find((action) => action.id === id);
  if (!found) {
    throw new Error(`Unknown action id ${id}`);
  }
  return found;
}


