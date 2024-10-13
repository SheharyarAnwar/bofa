export interface Skill {
  _id: string;
  name: string;
  description?: string;
  estimatedEffortHours: number;
  prerequisites?: string[];
  resources?: string[];
}
