import Header from '@/sections/okcomputer/Header';
import Footer from '@/sections/okcomputer/Footer';
import Hero from '@/sections/okcomputer/Hero';
import Overview from '@/sections/okcomputer/Overview';
import Archive from '@/sections/okcomputer/Archive';
import Domains from '@/sections/okcomputer/Domains';
import Timeline from '@/sections/okcomputer/Timeline';
import Insights from '@/sections/okcomputer/Insights';
import Clinic from '@/sections/okcomputer/Clinic';

export default function OKComputerPage() {
  return (
    <div
      className="min-h-[100dvh]"
      style={{ background: 'var(--paper)', color: 'var(--ink)' }}
    >
      <Header />
      <main>
        <Hero />
        <Overview />
        <Archive />
        <Domains />
        <Timeline />
        <Insights />
        <Clinic />
      </main>
      <Footer />
    </div>
  );
}
