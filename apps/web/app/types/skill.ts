export interface Skill {
  id: string;
  name: string;
  description?: string;
  estimatedEffortHours: number;
  subSkills?: string[];
  relatedSkills?: string[];
  resources?: string[];
}
