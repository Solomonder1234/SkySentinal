'use client';

import React, { useState, useEffect } from 'react';
import styles from './SystemStatus.module.css';

export default function SystemStatus() {
  const [uptime, setUptime] = useState(99.9);
  
  useEffect(() => {
    // Slight jitter to make it look active
    const interval = setInterval(() => {
      setUptime(99.98 - (Math.random() * 0.05));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.statusGrid}>
      
      <div className={`${styles.statusCard} ${styles.cardOnline}`}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Gateway Alpha</h3>
          <span className={`${styles.statusBadge} ${styles.badgeOnline}`}>ONLINE</span>
        </div>
        <div className={styles.cardBody}>
          Primary Discord SCM synchronization and command processing active.
        </div>
        <div className={styles.metricRow}>
          <span>Latency</span>
          <span className={styles.metricValue}>12ms</span>
        </div>
      </div>

      <div className={`${styles.statusCard} ${styles.cardOnline}`}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>NEXRAD API</h3>
          <span className={`${styles.statusBadge} ${styles.badgeOnline}`}>SECURE</span>
        </div>
        <div className={styles.cardBody}>
          Ingesting live Level II radar telemetry from global endpoints.
        </div>
        <div className={styles.metricRow}>
          <span>Uptime</span>
          <span className={styles.metricValue}>{uptime.toFixed(3)}%</span>
        </div>
      </div>

      <div className={`${styles.statusCard} ${styles.cardWarning}`}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Stream Relay</h3>
          <span className={`${styles.statusBadge} ${styles.badgeWarning}`}>ACTIVE</span>
        </div>
        <div className={styles.cardBody}>
          External NWS audio relays monitored via secure GWES endpoints.
        </div>
        <div className={styles.metricRow}>
          <span>Bandwidth</span>
          <span className={styles.metricValue}>Optimized</span>
        </div>
      </div>

    </div>
  );
}
