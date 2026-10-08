import type { CapacitorConfig } from "@capacitor/cli";
const config: CapacitorConfig = {
  appId: "app.attendly.student",
  appName: "Attendly",
  webDir: "dist/client",
  android: {
    allowMixedContent: false,
    minWebViewVersion: 124,
    adjustMarginsForEdgeToEdge: "auto",
  },
  server: { androidScheme: "https", errorPath: "webview-update.html" },
};
export default config;
