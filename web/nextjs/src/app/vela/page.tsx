import type { Metadata } from "next";
import VelaApp from "@/components/vela/VelaApp";
import { getCounselSignedAppUrl } from "@/lib/server";
import { getSession } from "@/lib/session";
import { parseVelaTheme, VELA_SESSION_DATA } from "@/lib/vela";

export const metadata: Metadata = {
  title: "Vela",
};

/**
 * Partner demo: a wellness app with Counsel behind a "Get care" button. `?theme=example` swaps
 * the skin to show that a partner reskin is tokens only.
 */
export default async function Vela({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string | string[] }>;
}) {
  const session = await getSession();
  const [signedAppUrl, { theme }] = await Promise.all([
    getCounselSignedAppUrl(session, VELA_SESSION_DATA),
    searchParams,
  ]);

  return <VelaApp signedAppUrl={signedAppUrl} theme={parseVelaTheme(theme)} />;
}
