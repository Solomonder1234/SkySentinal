'use client';

import React from 'react';
import styles from './Branding.module.css';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`${styles.logoContainer} ${className}`}>
      <div className={styles.logoIcon}>
        {/* Fallback SVG Icon if the generated image is not available or linked */}
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.svgLogo}>
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M12 18V18.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <span className={styles.logoText}>SkyAlert<span className={styles.corpText}>Network</span></span>
    </div>
  );
}

export function StatusBadge() {
  return (
    <div className={styles.statusBadge}>
      <span className={styles.dot} />
      <span className={styles.statusLabel}>Systems Operational</span>
    </div>
  );
}
