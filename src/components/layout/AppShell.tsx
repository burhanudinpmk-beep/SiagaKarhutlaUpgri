import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TopNavBar } from './TopNavBar';
import { SiteFooter } from './SiteFooter';
import { getBgmMoodForRoute, setBgmMood } from '../../utils/soundEffects';

export function AppShell() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    setBgmMood(getBgmMoodForRoute(pathname));
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-[#0F172A]">
      <TopNavBar />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
