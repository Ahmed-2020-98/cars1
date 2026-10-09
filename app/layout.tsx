import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
 title: "لمعة | عناية تليق بسيارتك",
 description: "اختر باقة العناية المناسبة لسيارتك واحجز موعد التلميع بسهولة. لمعة، عناية في كل تفصيلة.",
 icons: { icon: "/favicon.svg" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
 return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}
