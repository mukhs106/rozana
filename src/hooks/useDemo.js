import { useEffect, useState } from "react";
import { isDemo } from "@/lib/demo";

/** True in demo mode. Read after mount so server and browser markup match. */
export function useIsDemo() {
  const [demo, setDemo] = useState(false);
  useEffect(() => setDemo(isDemo()), []);
  return demo;
}
