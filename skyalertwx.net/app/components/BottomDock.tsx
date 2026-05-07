'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './BottomDock.module.css';

export default function BottomDock() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: '◈' },
    { name: 'Radio', path: '/radio', icon: '📻' },
    { name: 'Roster', path: '/staff', icon: '👥' },
  ];

  return (
    <div className={styles.dockWrapper}>
      <div className={styles.dockContainer}>
        {navItems.map((item) => (
          <Link 
            key={item.path}
            href={item.path}
            className={`${styles.dockItem} ${pathname === item.path ? styles.active : ''}`}
          >
            <span className={styles.dockIcon}>{item.icon}</span>
            <span className={styles.dockLabel}>{item.name}</span>
          </Link>
        ))}
        
        <div className={styles.divider} />
        
        <a 
          href="https://discord.gg/AtwfXDQquU" 
          target="_blank" 
          rel="noopener noreferrer" 
          className={styles.dockItem}
        >
          <span className={styles.dockIcon}>✧</span>
          <span className={styles.dockLabel}>Discord</span>
        </a>
      </div>
    </div>
  );
}
