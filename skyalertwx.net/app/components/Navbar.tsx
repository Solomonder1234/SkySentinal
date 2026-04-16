'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.navContainer}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>✦</span> SkyAlert
        </Link>
        
        <div className={styles.navLinks}>
          <Link href="/" className={`${styles.navLink} ${pathname === '/' ? styles.active : ''}`}>
            Dashboard
          </Link>
          <Link href="/radio" className={`${styles.navLink} ${pathname === '/radio' ? styles.active : ''}`}>
            Radio
          </Link>
          <Link href="/staff" className={`${styles.navLink} ${pathname === '/staff' ? styles.active : ''}`}>
            Roster
          </Link>
        </div>

        <a 
          href="https://discord.gg/AtwfXDQquU" 
          target="_blank" 
          rel="noopener noreferrer" 
          className={styles.btnDiscord}
        >
          Connect
        </a>
      </div>
    </nav>
  );
}
