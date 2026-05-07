'use client';

import React from 'react';
import Link from 'next/link';
import styles from '../legal.module.css';

export default function TermsPage() {
  return (
    <main className={styles.legalMain}>
      <h1 className={styles.legalTitle}>Terms of <span style={{ color: 'var(--accent-primary)' }}>Service</span></h1>
      <p className={styles.legalSubtitle}>Effective Date: April 16, 2026 &bull; SkyAlert Network Operations</p>
      
      <div className={styles.legalContent}>
        <section className={styles.legalSection}>
          <h2>1. Operational Overview</h2>
          <p>
            The SkyAlert Network ("The Network") provides industrial-grade meteorological data dissemination. By accessing our synchronization Hub, you agree to abide by the professional vanguard protocols documented herein.
          </p>
        </section>

        <section className={styles.legalSection}>
          <h2>2. Data Integrity</h2>
          <p>
            All station telemetry (Radar, NWR Audio, Satellite) is provided for situational awareness only. Users must not use The Network as a primary life-safety source during active meteorological emergencies. Refer to official NOAA/NWS alerts.
          </p>
        </section>

        <section className={styles.legalSection}>
          <h2>3. Network Conduct</h2>
          <p>
            Unauthorized interception of telemetry or attempts to degrade synch-performance will result in immediate termination of network clearance.
          </p>
        </section>
      </div>

      <div className={styles.legalFooter}>
        <Link href="/" className={styles.backLink}>&larr; Return to Intelligence Hub</Link>
      </div>
    </main>
  );
}
