export const metadata = {
  title: 'FreeGPT',
  description: 'FreeGPT',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
