import { z } from "zod";

export const AgentTaskSchema = z.object({
  id: z.string(),
  payload: z.any(),
  timestamp: z.number(),
});
