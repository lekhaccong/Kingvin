import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl = process.env.KINGVIN_SERVER_URL?.trim();

if (serverUrl && !serverUrl.startsWith("https://")) {
  throw new Error("KINGVIN_SERVER_URL must start with https://");
}

const config: CapacitorConfig = {
  appId: "com.kingvin.club",
  appName: "Kim Lân",
  webDir: "mobile-shell",
  android: {
    allowMixedContent: false,
    backgroundColor: "#08150f",
  },
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          cleartext: false,
          allowNavigation: [new URL(serverUrl).hostname],
        },
      }
    : {}),
};

export default config;
