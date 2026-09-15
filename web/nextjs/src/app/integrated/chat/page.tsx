import IntegratedChatPage from "@/components/IntegratedChatPage";
import { getValidCounselJwt } from "@/lib/server";
import { getSession } from "@/lib/session";

/**
 * Integrated chat page — thin shell that reads session credentials
 * and passes them to the client. JWT auth calls Counsel from the browser;
 * API key auth uses `/api/counsel/*` proxies with the session cookie.
 */
export default async function IntegratedChat() {
  const session = await getSession();
  const counselJwt = await getValidCounselJwt(session);

  return (
    <IntegratedChatPage
      counselApiConfig={{
        counselDirectApiBase: `${session.counselApiUrl}/v1/user`,
        counselJwt: counselJwt ?? "",
        counselUserId: session.counselUserId,
        // The host app owns the chrome here, so every signed URL renders messages and input only.
        baseSessionData: { view: { navigation: "integrated" } },
      }}
    />
  );
}
