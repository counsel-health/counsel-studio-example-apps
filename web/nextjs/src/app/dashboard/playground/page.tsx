import PlaygroundPage from "@/components/playground/PlaygroundPage";
import { getValidCounselJwt } from "@/lib/server";
import { getSession } from "@/lib/session";
import QueryProvider from "@/providers/QueryProvider";

/** Playground for the session data accepted by `POST /v1/user/signedAppUrl`. Signed urls are minted from the browser, so launching needs no page load. */
export default async function Playground() {
  const session = await getSession();
  const counselJwt = await getValidCounselJwt(session);

  return (
    <QueryProvider>
      <PlaygroundPage
        counselApiConfig={{
          counselDirectApiBase: `${session.counselApiUrl}/v1/user`,
          counselJwt: counselJwt ?? "",
          counselUserId: session.counselUserId,
        }}
      />
    </QueryProvider>
  );
}
