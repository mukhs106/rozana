import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { DISPLAY_NAME } from "@/brand/lettering";

export const DEFAULT_APP_NAME = DISPLAY_NAME;
export const APP_NAME_KEY = "display_name";

export function useAppName() {
  const { data } = useQuery({
    queryKey: ["app-name"],
    staleTime: 30_000,
    queryFn: async () => {
      const rows = await base44.entities.AppSetting.filter({ key: APP_NAME_KEY });
      return rows?.[0]?.value || DEFAULT_APP_NAME;
    },
  });
  return data || DEFAULT_APP_NAME;
}