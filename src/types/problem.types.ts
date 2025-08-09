import type { Difficulty } from "./difficulty.types"

export type Problem = {
  id: string
  title: string
  difficulty: Difficulty
  tags: string[]
  description: string
  examples: Array<{ input: string; output: string; explanation?: string }>
}
