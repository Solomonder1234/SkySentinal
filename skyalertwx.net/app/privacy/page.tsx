'use client';

import React from 'react';
import Link from 'next/link';
import styles from '../legal.module.css';

export default function PrivacyPage() {
  return (
    <main className={styles.legalMain}>
      <h1 className={styles.legalTitle}>Privacy <span style={{ color: 'var(--accent-secondary)' }}>Policy</span></h1>
      <p className={styles.legalSubtitle}>Data Transparency Protocol &bull; SkyAlert Network</p>
      
      <div className={styles.legalContent}>
        <section className={styles.legalSection}>
          <h2>1. Data Collection</h2>
          <p>
            SkyAlert aggregates public meteorological telemetry. We do not store personal telemetry of our users beyond basic synchronization authentication required for the Discord Hub.
          </p>
        </section>

        <section className={styles.legalSection}>
          <h2>2. Network Logs</h2>
          <p>
            Command logs and staff interactions are persisted for 30 days to ensure network integrity and operational accountability.
          </p>
        </section>

        <section className={styles.legalSection}>
          <h2>3. Third-Party Attribution</h2>
          <p>
            We relay data from NOAA, NWS, and NEXRAD. Their respective privacy policies apply to the source data stream.
          </p>
        </section>
      </div>

      <div className={styles.legalFooter}>
        <Link href="/" className={styles.backLink}>&larr; Return to Intelligence Hub</Link>
      </div>
    </main>
  );
}
