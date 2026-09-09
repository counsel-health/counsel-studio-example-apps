import { getUser } from "@/db/actions/getUser";
import { DBRowNotFoundError } from "@/db/lib/dbErrors";
import { getCounselSignedAppUrl } from "@/lib/counsel";
import { safePromise } from "@/lib/promise";
import { createUser } from "@/db/actions/createUser";
import type { User } from "@/lib/user-session";
import { getAccessCodeConfig } from "@/envConfig";
import { z } from "zod";

// Optional session data (`action`, `view`, `metadata`, `agent_context`) passed through to Counsel unchanged. See the README.
export const SessionDataSchema = z.record(z.string(), z.unknown());

export const SignedAppUrlResponseSchema = z.object({ url: z.string() });

export async function getOrCreateUser(userId: string, accessCode: string) {
  const [user, error] = await safePromise(getUser(userId));
  if (error instanceof DBRowNotFoundError) {
    const config = getAccessCodeConfig(accessCode);
    if (!config) {
      throw new Error(
        `No access code config found for access code "${accessCode}".`
      );
    }
    return await createUser({ userId, accessCode, userType: config.userType });
  }
  if (error) {
    throw error;
  }
  return user;
}

/**
 * @description Get the signed app url for the user
 * @route POST /user/signedAppUrl
 */
export async function signedAppUrlHandler({
  user,
  body,
}: {
  user: User;
  body: z.infer<typeof SessionDataSchema>;
}) {
  // 1. Check the user exists - if not, create them (this is an edge case bc we don't persist the user across server restarts)
  // Don't use this as an example in your logic, instead just get the user from the database
  const u = await getOrCreateUser(user.userId, user.accessCode);

  // 2. Call the Counsel API to get the signed app url
  // Forward any session data (e.g. view.navigation) from the request body
  const { url } = await getCounselSignedAppUrl({
    userId: u.counsel_user_id,
    accessCode: user.accessCode,
    sessionData: body,
  });

  return { url };
}
