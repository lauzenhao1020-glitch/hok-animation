import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HOK Grand Finals Highlights Studio · Green Screen Broadcast Graphics',
  description: 'Broadcast-grade animated graphics and lower thirds generator for Honor of Kings Grand Finals highlight reels with green screen chromakey, player cards, score bugs, and WebM/GIF exports.',
  openGraph: {
    title: 'HOK Grand Finals Highlights Studio',
    description: 'Broadcast-grade animated graphics and lower thirds generator for Honor of Kings Grand Finals highlight reels with green screen chromakey.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HOK Grand Finals Highlights Studio',
    description: 'Broadcast-grade animated graphics and lower thirds generator for Honor of Kings Grand Finals highlight reels with green screen chromakey.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="bg-[#04060b] text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
