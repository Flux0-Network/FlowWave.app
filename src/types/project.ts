import type { BuilderState } from "./builder";
import type { CogConfig } from "./generator";

export interface Project {
  id: string;
  name: string;
  description?: string;
  type: "builder" | "generator" | "full";
  builderState?: BuilderState;
  cogConfig?: CogConfig;
  created_at: string;
  updated_at: string;
  user_id: string;
}
