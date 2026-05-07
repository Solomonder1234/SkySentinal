'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from '../legal.module.css';

export default function NDAPage() {
  const [signed, setSigned] = useState(false);

  const handleSign = () => {
    setSigned(true);
    // Logic to update staff signature status would go here
  };

  return (
    <main className={styles.legalMain}>
      <header className={styles.legalHeader} style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 className={styles.legalTitle} style={{ fontSize: '3.5rem' }}>Staff <span style={{ color: 'var(--accent-primary)' }}>NDA</span></h1>
        <p className={styles.legalSubtitle}>Non-Disclosure & Administrative Vanguard Agreement</p>
      </header>

      <div className={styles.legalContent} style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '3rem', borderRadius: '1rem', border: '1px solid var(--border-subtle)' }}>
        <section className={styles.legalSection}>
          <h2>1. Confidential Information</h2>
          <p>
            As a member of the SkyAlert Vanguard, you will have access to proprietary telemetry aggregation methods, unlisted Icecast mount points, and internal NWR intercept coordinates. All such data is strictly <strong>Confidential</strong>.
          </p>
        </section>

        <section className={styles.legalSection}>
          <h2>2. Infrastructure Protection</h2>
          <p>
            Sharing direct stream URLs, backend server IP addresses, or localized intercept vulnerabilities with external entities or the public is a violation of this agreement.
          </p>
        </section>

        <section className={styles.legalSection}>
          <h2>3. Professional Vanguard Standards</h2>
          <p>
            Staff must maintain a professional demeanor in all public-facing channels. Disparagement of the network or its leadership structure is prohibited under the "Executive Unity" protocol.
          </p>
        </section>

        <section className={styles.legalSection} style={{ borderLeft: '4px solid var(--accent-primary)', paddingLeft: '2rem', background: 'rgba(99, 102, 241, 0.03)', borderRadius: '0.5rem' }}>
          <h2>4. Consequences of Non-Compliance</h2>
          <p>
            Failures to adhere to these standards will result in administrative action:
          </p>
          <ul style={{ listStyle: 'none', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><strong>Strike I</strong>: Formal Warning & Operational Probation.</li>
            <li><strong>Strike II</strong>: Deployment Suspension & Temporary Clearance Revocation.</li>
            <li><strong>Strike III</strong>: Permanent Demotion or Termination of Vanguard Status.</li>
          </ul>
        </section>
      </div>

      <div className={styles.legalFooter} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4rem' }}>
        <Link href="/manual" className={styles.backLink}>&larr; Return to Manual</Link>
        
        {!signed ? (
          <button 
            onClick={handleSign}
            style={{ 
              background: 'var(--accent-primary)', 
              color: '#fff', 
              padding: '1rem 2rem', 
              borderRadius: '0.5rem', 
              border: 'none', 
              fontWeight: '800',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Acknowledge & Sign Protocols
          </button>
        ) : (
          <div style={{ color: '#10b981', fontWeight: '800', textTransform: 'uppercase' }}>
            Agreement Synchronized - Vanguard Authorization Logged
          </div>
        )}
      </div>
    </main>
  );
}
