import HomePage from "@/components/home/HomePage";
import { getHomeSessionData, parseBrand } from "@/lib/brands";
import { getCounselSignedAppUrl } from "@/lib/server";
import { getSession } from "@/lib/session";

/**
 * Dashboard home with Counsel behind a "Get care" button. `?theme=vela` or `?theme=example`
 * swaps the brand skin to show that a reskin is tokens only.
 */
export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string | string[] }>;
}) {
  const [session, { theme }] = await Promise.all([getSession(), searchParams]);
  const brand = parseBrand(theme);
  const signedAppUrl = await getCounselSignedAppUrl(
    session,
    getHomeSessionData(brand)
  );

  return <HomePage brand={brand} signedAppUrl={signedAppUrl} />;
}
