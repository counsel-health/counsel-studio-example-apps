import ChatPage from "@/components/ChatPage";
import { DEFAULT_CHAT_SESSION_DATA } from "@/lib/counselSessionData";
import { getCounselSignedAppUrl } from "@/lib/server";
import { getSession } from "@/lib/session";

/**
 * Chat page renders the Counsel app inside an iframe (standalone pattern). The full Counsel experience with built-in sidebar. The signed url is minted on the server the way your backend would, and cached so repeat loads don't flash the iframe. It opens with `start_thread`, so the user lands in a conversation rather than wherever Counsel would otherwise choose.
 */
export default async function Chat() {
  const session = await getSession();
  const signedAppUrl = await getCounselSignedAppUrl(
    session,
    DEFAULT_CHAT_SESSION_DATA
  );

  return <ChatPage signedAppUrl={signedAppUrl} />;
}
