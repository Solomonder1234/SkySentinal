'use client';

import React from 'react';
import Link from 'next/link';
import styles from '../legal.module.css';

export default function ManualPage() {
  return (
    <main className={styles.legalMain}>
      <h1 className={styles.legalTitle}>Operations <span style={{ color: 'var(--accent-industrial)' }}>Manual</span></h1>
      <p className={styles.legalSubtitle}>Protocol v4.0 &bull; Industrial Meteorological Vanguard</p>
      
      <div className={styles.manualGrid}>
        <aside className={styles.manualSidebar}>
          <ul>
            <li><a href="#intro" style={{ color: '#fff', fontWeight: 'bold' }}>01. Introduction</a></li>
            <li><a href="#radar">02. Radar Operations</a></li>
            <li><a href="#audio">03. Audio Intercepts</a></li>
            <li><a href="#sync">04. Network Sync</a></li>
          </ul>
        </aside>

        <div className={styles.manualContent}>
          <section id="intro">
            <h2>01. Network Introduction</h2>
            <p>
              SkyAlert is built on the principle of <strong>Atmospheric Intelligence</strong>. This manual outlines the professional standards required to operate within the Hub and maintain the integrity of our telemetry relays.
            </p>
          </section>

          <section id="radar">
            <h2>02. NEXRAD Operations</h2>
            <p>
              The Radar Hub aggregates NEXRAD Level II data. Users should monitor Base Reflectivity (0.5&deg;) for initial convective detection, transitioning to Correlation Coefficient (CC) for debris ball identification during tornadic events.
            </p>
          </section>

          <section id="audio">
            <h2>03. Audio Relays</h2>
            <p>
              NWR Audio is intercepted via regional UHF/VHF arrays. Do not attempt to re-broadcast Hub audio to external public frequencies without explicit Vanguard authorization.
            </p>
          </section>
        </div>
      </div>

      <div className={styles.legalFooter}>
        <Link href="/" className={styles.backLink}>&larr; Return to Intelligence Hub</Link>
      </div>
    </main>
  );
}
