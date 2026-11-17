import { createClient } from "@base44/sdk";
import { getAppParams } from "@/lib/app-params";
import { isDemo } from "@/lib/demoFlag";

const { appId, token, functionsVersion, appBaseUrl } = getAppParams();

// Demo mode sends nothing to Base44, not even page-view analytics.
export const base44 = createClient({
  appId,
  token: token ?? undefined,
  functionsVersion,
  serverUrl: "",
  appBaseUrl,
  ...(isDemo() ? { analytics: { enabled: false } } : {}),
});
