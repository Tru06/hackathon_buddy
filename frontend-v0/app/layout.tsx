// Hackathon Buddy Layout - v3
import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter'
})

const spaceGrotesk = Space_Grotesk({ 
  subsets: ["latin"],
  variable: '--font-space-grotesk'
})

export const metadata: Metadata = {
  title: 'Hackathon Buddy - Find Your Perfect Team',
  description: 'AI-powered platform to connect hackathon enthusiasts, form winning teams, and discover exciting hackathons. Build, collaborate, and win together.',
  keywords: ['hackathon', 'team building', 'developers', 'collaboration', 'tech community'],
  authors: [{ name: 'Hackathon Buddy Team' }],
  openGraph: {
    title: 'Hackathon Buddy - Find Your Perfect Team',
    description: 'AI-powered platform to connect hackathon enthusiasts and form winning teams.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
