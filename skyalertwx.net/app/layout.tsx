import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import BottomDock from "./components/BottomDock";
import LiveHUD from "./components/HUD/LiveHUD";

export const metadata: Metadata = {
  title: "SkyAlert Weather Hub",
  description: "Professional weather information service and Discord hub.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
        <BottomDock />
      </body>
    </html>
  );
}
