'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'projects', label: 'Projects' },
  { id: 'skills', label: 'Skills' },
];

export default function NavBar() {
  const pathname = usePathname();
  const onHome = pathname === '/';
  const [activeSection, setActiveSection] = useState('about');

  useEffect(() => {
    if (!onHome) return undefined;

    // When scrolled to the bottom, the last section can't rise into the
    // observer's top detection band, so force it active there.
    const atBottom = () =>
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 2;

    const observer = new IntersectionObserver(
      (entries) => {
        if (atBottom()) {
          setActiveSection(navItems[navItems.length - 1].id);
          return;
        }
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-10% 0px -85% 0px' }
    );

    navItems.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (atBottom()) setActiveSection(navItems[navItems.length - 1].id);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [onHome]);

  // On the home page, intercept and smooth-scroll. On other routes the link
  // falls through to navigate to /#id, where the browser scrolls to the anchor.
  const handleClick = (e, id) => {
    if (!onHome) return;
    e.preventDefault();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(id)?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {navItems.map(({ id, label }) => (
          <Link
            key={id}
            href={onHome ? `#${id}` : `/#${id}`}
            onClick={(e) => handleClick(e, id)}
            className={`navbar-link${onHome && activeSection === id ? ' navbar-link-active' : ''}`}
          >
            {label}
          </Link>
        ))}
        <Link
          href="/chat"
          className={`navbar-link${pathname === '/chat' ? ' navbar-link-active' : ''}`}
        >
          Chat
        </Link>
      </div>
    </nav>
  );
}
