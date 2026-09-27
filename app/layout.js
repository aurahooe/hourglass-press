import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Hourglass Press',
  description: 'A small press that turns the page every hour.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <header className="mast">
            <div>
              <div className="mark">est. this hour</div>
              <h1 className="wordmark">Hourglass Press</h1>
            </div>
            <nav className="nav">
              <Link href="/">Front</Link>
              <Link href="/desk">Desk</Link>
              <Link href="/login">Key</Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
