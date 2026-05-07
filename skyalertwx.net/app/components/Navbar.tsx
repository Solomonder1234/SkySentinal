'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo, StatusBadge } from './Branding';
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
        <Link href="/" className={styles.navBrand}>
          <Logo />
        </Link>
        
        <div className={styles.navActionsWrapper}>
          <StatusBadge />

          <div className={styles.divider} />

          <a 
            href="https://discord.gg/AtwfXDQquU" 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.btnDiscord}
          >
            Connect Hub
          </a>
        </div>
      </div>
    </nav>
  );
}
