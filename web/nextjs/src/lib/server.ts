import { serverEnv } from "@/envConfig";
import { serverLogger } from "@/lib/logger";
import {
  CounselTokenResponseSchema,
  SignedAppUrlResponseSchema,
  SignUpResponseSchema,
} from "@/lib/schemas";
import { SessionData } from "@/lib/session";
import { UserType } from "@/types/user";
import { IronSession } from "iron-session";
import { decodeJwt } from "jose";
import { fetchWithRetry } from "./http";

//================================================================================
// Counsel Demo Server API Calls
//================================================================================

const CACHE_TAG_CHAT_SIGNED_APP_URL = "chat-signed-app-url";

export const getChatSignedAppUrlCacheKey = (counselUserId: string) =>
  `${CACHE_TAG_CHAT_SIGNED_APP_URL}-${counselUserId}`;

// Refresh 5 min before expiry to avoid using a JWT that's about to expire mid-request
const JWT_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

function getAuthorizationHeader(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

function isCounselJwtValid(jwt: string): boolean {
  try {
    const payload = decodeJwt(jwt);
    return (
      typeof payload.exp === "number" && Date.now() < payload.exp * 1000 - JWT_EXPIRY_BUFFER_MS
    );
  } catch {
    return false;
  }
}

async function fetchCounselJwt(sessionToken: string): Promise<string> {
  const resp = await fetchWithRetry(`${serverEnv.SERVER_HOST}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthorizationHeader(sessionToken),
    },
    body: JSON.stringify({}),
  });
  if (!resp.ok) {
    const detail = await readHttpErrorDetail(resp);
    throw new Error(
      `Failed to fetch Counsel JWT: ${resp.status} ${resp.statusText}${detail ? ` ${detail}` : ""}`,
    );
  }
  const { token } = CounselTokenResponseSchema.parse(await resp.json());
  return token;
}

/**
 * Returns a valid Counsel JWT for the session.
 * Uses the cached session JWT if still valid; otherwise fetches a fresh one in-memory.
 * Returns null if the session is not using JWT auth.
 */
export async function getValidCounselJwt(
  session: IronSession<SessionData>,
): Promise<string | null> {
  if (session.authType !== "jwt") return null;
  if (session.counselJwt && isCounselJwtValid(session.counselJwt)) {
    return session.counselJwt;
  }
  return fetchCounselJwt(session.token);
}

/**
 * Pre-warms the Counsel JWT into the session at login so the first chat page load is fast.
 * Mutates session.counselJwt but does NOT call session.save() — the caller (handleLogin,
 * a Server Action) is responsible for saving.
 */
export async function prewarmSessionJwt(session: IronSession<SessionData>): Promise<void> {
  if (session.authType !== "jwt") return;
  session.counselJwt = await fetchCounselJwt(session.token);
}

/**
 * @description Get the signed app url for a user.
 *
 * Always proxied through the demo server (demo server calls Counsel with the access code API key).
 * Issuer/JWT browser-direct traffic uses session.counselJwt from {@link getValidCounselJwt}, not this helper.
 *
 * The url is cached per user, so passing sessionData that differs per request needs its own cache tag.
 */
export async function getCounselSignedAppUrl(
  session: IronSession<SessionData>,
  sessionData?: Record<string, unknown>,
) {
  const { token, counselUserId } = session;

  const resp = await fetchWithRetry(`${serverEnv.SERVER_HOST}/user/signedAppUrl`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthorizationHeader(token),
    },
    body: JSON.stringify(sessionData ?? {}),
    cache: "default",
    next: {
      revalidate: 3600,
      tags: [getChatSignedAppUrlCacheKey(counselUserId)],
    },
  });
  if (!resp.ok) {
    const detail = await readHttpErrorDetail(resp);
    throw new Error(
      `Failed to get signed app url: ${resp.status} ${resp.statusText}${
        detail ? ` ${detail}` : ""
      }`,
    );
  }
  return SignedAppUrlResponseSchema.parse(await resp.json()).url;
}

/**
 * @description Sign up a new user in the demo server
 * The user info is mocked out in the demo server and we just create new users based on the userId each time.
 * In your app you would likely want to pass the full user object to your API + Counsel API.
 * In the future, once our demo app has a full sign up flow with user info, we'll swap this to pass the full user object.
 *
 * Returns a JWT token that can be used to authenticate the user in the demo app.
 */
export async function signUpCounselUser(
  userId: string,
  accessCode: string,
): Promise<
  | {
      success: true;
      data: {
        token: string;
        userType: UserType;
        counselUserId: string;
        authType: "apiKey" | "jwt";
        navMode: "standalone" | "integrated";
        counselApiUrl: string;
      };
    }
  | { success: false; error: unknown }
> {
  try {
    const data = await fetchFromCounselServer("user/signUp", "POST", {
      userId,
      accessCode,
    });
    return { success: true, data: SignUpResponseSchema.parse(data) };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * @description Sign out a user from the demo server
 */
export async function signOutCounselUser(token: string) {
  serverLogger.debug("Signing out user");
  await fetchFromCounselServer("user/signOut", "POST", {}, token);
}

//================================================================================
// Helper Functions
//================================================================================

const ERROR_BODY_MAX_LEN = 500;

async function readHttpErrorDetail(response: Response): Promise<string> {
  const text = await response.text();
  if (!text) return "";
  const trimmed = text.trim();
  try {
    return JSON.stringify(JSON.parse(trimmed));
  } catch {
    return trimmed.length > ERROR_BODY_MAX_LEN
      ? `${trimmed.slice(0, ERROR_BODY_MAX_LEN)}…`
      : trimmed;
  }
}

async function fetchFromCounselServer<T>(
  path: `${string}/${string}`,
  method: "POST",
  body: unknown,
  // If the request is authenticated, pass the auth token in the headers
  token?: string,
  cache?: {
    tags: string[];
    revalidate?: number;
  },
): Promise<T> {
  const url = `${serverEnv.SERVER_HOST}/${path}`;
  serverLogger.debug({ url }, "Fetching from counsel server");
  const response = await fetchWithRetry(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? getAuthorizationHeader(token) : {}),
    },
    body: JSON.stringify(body),
    cache: cache ? "default" : "no-store",
    next: cache ? { revalidate: cache.revalidate, tags: cache.tags } : undefined,
  });

  if (!response.ok) {
    const detail = await readHttpErrorDetail(response);
    serverLogger.error(
      {
        responseStatus: response.status,
        responseStatusText: response.statusText,
        detail,
      },
      "Failed to fetch from counsel server",
    );
    throw new Error(
      `Failed to fetch from counsel server: ${response.status} ${response.statusText}${
        detail ? ` ${detail}` : ""
      }`,
    );
  }

  const data = await response.json();
  serverLogger.debug({ data }, "Fetched from counsel server");
  return data;
}
