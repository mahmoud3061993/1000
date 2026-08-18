import type { Metadata } from "next";
import { META, PRODUCT, SITE_URL } from "@/lib/config";
import "./globals.css";
import "./landing.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: PRODUCT.name,
  description: "مكتبة +1000 تصميم إعلان Canva قابل للتعديل بالكامل",
  openGraph: {
    title: PRODUCT.name,
    images: ["/images/og.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Almarai:wght@400;700;800&display=swap"
          rel="stylesheet"
        />
        {META.pixelId ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${META.pixelId}');
`,
            }}
          />
        ) : null}
      </head>
      <body>{children}</body>
    </html>
  );
}
