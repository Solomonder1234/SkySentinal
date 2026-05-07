import React from 'react';
import Link from 'next/link';
import styles from './status.module.css';

export default function StatusPage() {
  const systems = [
    { name: 'NEXRAD Radar Relay', status: 'Operational', latency: '42ms', uptime: '99.9%' },
    { name: 'NWR Audio Intercepts', status: 'Operational', latency: '120ms', uptime: '99.8%' },
    { name: 'Discord Hub Sync', status: 'Operational', latency: '15ms', uptime: '100%' },
    { name: 'Staff Infrastructure', status: 'Operational', latency: 'N/A', uptime: '100%' },
    { name: 'Global Telemetry API', status: 'Operational', latency: '85ms', uptime: '99.7%' },
  ];

  return (
    <main className={styles.statusMain}>
      <header className={styles.statusHeader}>
        <h1 className={styles.statusTitle}>Network <span className={styles.highlight}>Status</span></h1>
        <div className={styles.overallStatus}>
          <span className={styles.dot} />
          All Systems Industrial-Grade Operational
        </div>
      </header>

      <div className={styles.statusGrid}>
        {systems.map((sys) => (
          <div key={sys.name} className={`${styles.statusCard} bento-card`}>
            <div className={styles.cardHeader}>
              <h3 className={styles.sysName}>{sys.name}</h3>
              <span className={styles.statusBadge}>{sys.status}</span>
            </div>
            <div className={styles.metrics}>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Latency</span>
                <span className={styles.metricValue}>{sys.latency}</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Uptime</span>
                <span className={styles.metricValue}>{sys.uptime}</span>
              </div>
            </div>
            <div className={styles.miniGraph}>
              {/* Simulated Uptime Bars */}
              {[...Array(20)].map((_, i) => (
                <div key={i} className={styles.graphBar} style={{ height: `${Math.random() * 10 + 15}px` }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '4rem', textAlign: 'center' }}>
        <Link href="/" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>← Back to Command Dashboard</Link>
      </div>
    </main>
  );
}
