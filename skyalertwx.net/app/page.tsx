import React from 'react';
import Link from 'next/link';
import NwsAlerts from './components/NwsAlerts';
import dynamic from 'next/dynamic';
import styles from './page.module.css';
import WeatherRadio from './components/WeatherRadio';
import LiveHUD from './components/HUD/LiveHUD';
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
            Atmospheric <span className={styles.highlight}>Intelligence</span>
          </h1>
          <p className={styles.subtitle}>
            The SkyAlert Network's industrial-grade meteorological gateway. Real-time satellite synchronization, advanced telemetry, and community-driven vanguard.
          </p>
          <div className={styles.heroActions}>
            <a href="#dashboard" className={styles.btnPrimaryLg}>Launch Dashboard</a>
            <a href="/staff" className={styles.btnSecondaryLg}>Network Roster</a>
          </div>
        </div>
      </section>

      {/* Trust Marquee */}
      <section className={styles.marqueeSection}>
        <h4 className={styles.marqueeTitle}>Trusted Data Sources & Infrastructure</h4>
        <div className={styles.marqueeGrid}>
          <div className={styles.partnerLabel}>NOAA</div>
          <div className={styles.partnerLabel}>NWS RELAY</div>
          <div className={styles.partnerLabel}>NEXRAD LEVEL II</div>
          <div className={styles.partnerLabel}>GOES-16/18</div>
        </div>
      </section>

      <div id="dashboard" className={styles.dashboardContainer}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Operational Dashboard</h2>
          <p className={styles.sectionSubtitle}>Synchronized industrial telemetry from official meteorological arrays.</p>
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

          <div className={`${styles.hudCard} bento-card`}>
            <LiveHUD />
          </div>

          <div className={`${styles.statusCard} bento-card`}>
            <SystemStatus />
          </div>

          <div className={`${styles.alertsCard} bento-card glow-sky`}>
            <div className={styles.sectionHeader} style={{ marginBottom: '1rem', padding: 0 }}>
              <h3 style={{ fontSize: '1.25rem' }}>Network Intelligence Relay</h3>
            </div>
            <NwsAlerts />
          </div>
        </div>
      </div>

      {/* Service Vanguard Feature Grid */}
      <section className={styles.vanguardSection}>
        <div className={styles.sectionHeader} style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 className={styles.sectionTitle}>Industrial Capabilities</h2>
          <p className={styles.sectionSubtitle}>Professional features designed for high-fidelity situational awareness.</p>
        </div>
        <div className={styles.vanguardGrid}>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>📡</span>
            <h3 className={styles.featureTitle}>Telemetry Aggregate</h3>
            <p className={styles.featureDesc}>Direct Level II telemetry from NEXRAD arrays and GOES satellite constellations, processed with sub-second latency.</p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>🔊</span>
            <h3 className={styles.featureTitle}>Broadcast Vanguard</h3>
            <p className={styles.featureDesc}>High-fidelity audio intercepts from official NWR broadcast relays, ensuring 24/7 audible situational intelligence.</p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>⚖️</span>
            <h3 className={styles.featureTitle}>Network Integrity</h3>
            <p className={styles.featureDesc}>A community-driven command structure built on professional accountability and meteorological excellence.</p>
          </div>
        </div>
      </section>
      
      <footer className={styles.footerMain}>
        <div className={styles.footerContent}>
          <div className={styles.footerCol}>
            <h3 style={{ marginBottom: '1rem', color: '#fff' }}>SKYALERT NETWORK</h3>
            <p style={{ fontSize: '0.85rem' }}>Dedicated to industrial-grade meteorological data dissemination and public safety coordination through advanced telemetry.</p>
          </div>
          <div className={styles.footerCol}>
            <h4>Operations</h4>
            <ul className={styles.footerLinks}>
              <li><Link href="/">Intelligence Hub</Link></li>
              <li><Link href="/radio">Audio Relays</Link></li>
              <li><Link href="/staff">Staff Directory</Link></li>
            </ul>
          </div>
          <div className={styles.footerCol}>
            <h4>Connect</h4>
            <ul className={styles.footerLinks}>
              <li><a href="https://discord.gg/AtwfXDQquU" target="_blank" rel="noopener noreferrer">Discord Hub</a></li>
              <li><Link href="/support">Support Center</Link></li>
              <li><Link href="/status">Network Status</Link></li>
            </ul>
          </div>
          <div className={styles.footerCol}>
            <h4>Legal</h4>
            <ul className={styles.footerLinks}>
              <li><Link href="/terms">Terms of Service</Link></li>
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/manual">Operations Manual</Link></li>
            </ul>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; {new Date().getFullYear()} SkyAlert Network. Administered under professional meteorological vanguard protocols.</p>
          <p>Radar: NOAA / NEXRAD / RainViewer • Audio: NWR Relays</p>
        </div>
      </footer>
    </main>
  );
}
