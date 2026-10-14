import ChatPage from "@/components/ChatPage";
import { DEFAULT_CHAT_SESSION_DATA } from "@/lib/counselSessionData";
import { getCounselSignedAppUrl } from "@/lib/server";
import { getSession } from "@/lib/session";

/**
 * Standalone Counsel chat in an iframe, opening straight into a conversation with `start_thread`.
 */
export default async function Chat() {
  const session = await getSession();
  const signedAppUrl = await getCounselSignedAppUrl(
    session,
    DEFAULT_CHAT_SESSION_DATA
  );

  return <ChatPage signedAppUrl={signedAppUrl} />;
}
