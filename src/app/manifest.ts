import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FSM — ระบบจัดการงานบริการภาคสนาม",
    short_name: "FSM",
    description: "จัดตาราง ส่งช่าง และบันทึกงานบริการภาคสนาม",
    start_url: "/field",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111111",
    lang: "th",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
