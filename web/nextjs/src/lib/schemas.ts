import { z } from "zod";

export const SignedAppUrlResponseSchema = z.object({
  url: z.string(),
});

export const CounselTokenResponseSchema = z.object({
  token: z.string(),
});

export const ThreadItemSchema = z.object({
  id: z.string(),
  display_name: z.string().nullable(),
  last_activity_time: z.string(),
  mode: z.string(),
});

export const ThreadListResponseSchema = z.object({
  threads: z.array(ThreadItemSchema),
});

export type ThreadItem = z.infer<typeof ThreadItemSchema>;

export const SignUpResponseSchema = z.object({
  token: z.string(),
  userType: z.enum(["main", "onboarding"]),
  counselUserId: z.string(),
  authType: z.enum(["apiKey", "jwt"]),
  navMode: z.enum(["standalone", "integrated"]).default("standalone"),
  counselApiUrl: z.url(),
});
