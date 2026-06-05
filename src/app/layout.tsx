import type { ReactNode } from "react";

import { homeJsonLd, homeMetadata } from "@/server/seo";
import "../styles/design-system.css";
import "../styles.css";
import "../styles/public-design-system.css";
import "../styles/crm-design-system.css";
import "../styles/activity-design-system.css";

export const metadata = homeMetadata();

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-AR">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(homeJsonLd()).replace(/</g, "\\u003c")
          }}
        />
      </body>
    </html>
  );
}
