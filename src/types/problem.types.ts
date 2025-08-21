import type { Difficulty } from "./difficulty.types"

export type Problem = {
  id: string
  title: string
  difficulty: Difficulty
  tags: string[]
  description: string
  examples: Array<{ input: string; output: string; explanation?: string }>
  category?: "programming" | "breadboarding"
  requiredDeliverables?: Array<"truth_table" | "sop" | "pos" | "diagram">
}
