import "./globals.css";
// import SWRegister from "./sw-register";

export const metadata = {
  title: "Print Manager",
  description: "Image editor and file manager",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* <link
          rel="manifest"
          href="/manifest.json"
        /> */}
        <meta
          name="theme-color"
          content="#2563eb"
        />
        {/* <link
          rel="apple-touch-icon"
          href="/icons/icon-192.png"
        /> */}
      </head>
      <body>
        {/* <SWRegister /> */}
        {children}
      </body>
    </html>
  );
}
