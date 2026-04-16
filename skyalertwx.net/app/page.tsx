import React from 'react';
import NwsAlerts from './components/NwsAlerts';
import dynamic from 'next/dynamic';
import styles from './page.module.css';
import WeatherRadio from './components/WeatherRadio';
import LiveTerminal from './components/LiveTerminal';
import SystemStatus from './components/SystemStatus';
// Dynamically import Leaflet map to avoid node 'window' SSR crashes
const DynamicRadarMap = dynamic(() => import('./components/RadarMap'), { 
  ssr: false,
  loading: () => <div style={{ height: 500, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#12141a', borderRadius: 16 }}>Loading Global Radar...</div>
});

export default function Home() {
  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <div className={styles.heroBg}></div>
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>
            Atmospheric <span className={styles.highlight}>Intelligence Hub</span>
          </h1>
          <p className={styles.subtitle}>
            The SkyAlert Network's professional gateway. Real-time broadcast monitoring, advanced telemetry, and community-driven weather vanguard.
          </p>
          <div className={styles.heroActions}>
            <a href="#dashboard" className={styles.btnPrimaryLg}>Launch Dashboard</a>
            <a href="/staff" className={styles.btnSecondaryLg}>Explore Roster</a>
          </div>
        </div>
      </section>

      <div id="dashboard" className={styles.dashboardContainer}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Operational Dashboard</h2>
          <p className={styles.sectionSubtitle}>Real-time synchronization with NWS relays and NEXRAD telemetry.</p>
        </div>

        <div className={styles.bentoGrid}>
          <div className={`${styles.radarCard} bento-card glow-indigo`}>
            <div style={{ position: 'relative', height: '100%', minHeight: 450 }}>
              <DynamicRadarMap />
            </div>
          </div>

          <div className={`${styles.radioCard} bento-card`}>
            <WeatherRadio />
          </div>

          <div className={`${styles.statusCard} bento-card`}>
            <SystemStatus />
          </div>

          <div className={`${styles.alertsCard} bento-card glow-sky`}>
            <div className={styles.sectionHeader} style={{ marginBottom: '1rem', padding: 0 }}>
              <h3 style={{ fontSize: '1.25rem' }}>Active Network Telemetry</h3>
            </div>
            <NwsAlerts />
          </div>
        </div>
      </div>

      <section className={styles.infoSection} id="about">
        <div className={styles.infoGrid}>
          <div className={styles.infoText}>
            <h2 className={styles.sectionTitle}>The SkyAlert Vanguard</h2>
            <p>
              The <strong>SkyAlert Network</strong> is an elite meteorological intelligence platform designed for high-fidelity data aggregation, emergency communication, and situational synchronization. 
            </p>
            <p>
              By leveraging an advanced cloud-based backbone, we intercept and relay official National Weather Service broadcasts and NEXRAD Level II radar telemetry, providing immediate, actionable metrics.
            </p>
            <p>
              SkyAlert serves as a centralized, community-driven vanguard for severe weather defense and public safety coordination across all monitored regions.
            </p>
          </div>
          
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>24/7</span>
              <span className={styles.statLabel}>Uptime Monitor</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>Global</span>
              <span className={styles.statLabel}>Radar Reach</span>
            </div>
            <div className={styles.statItem} style={{ gridColumn: 'span 2' }}>
              <span className={styles.statValue}>Direct Relay</span>
              <span className={styles.statLabel}>NWR Audio Intercepts Active</span>
            </div>
          </div>
        </div>
      </section>
      
      <footer className={styles.footer}>
        <div className={styles.attributionGrid}>
          <div className={styles.attrItem}><strong>Radar:</strong> NOAA / RainViewer</div>
          <div className={styles.attrItem}><strong>Audio:</strong> NWS Relays</div>
          <div className={styles.attrItem}><strong>Ops:</strong> SkyAlert Network</div>
        </div>
        <p style={{ opacity: 0.5, fontSize: '0.85rem' }}>&copy; {new Date().getFullYear()} SkyAlert Network. Professional meteorological data services.</p>
      </footer>
    </main>
  );
}
