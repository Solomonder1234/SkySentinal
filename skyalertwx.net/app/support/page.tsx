'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './support.module.css';

export default function SupportPage() {
  const [ticketStatus, setTicketStatus] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTicketStatus('TRANSMITTING...');
    setTimeout(() => setTicketStatus('TICKET LOGGED - VANGUARD NOTIFIED'), 1500);
  };

  return (
    <main className={styles.supportMain}>
      <div className={styles.supportContent}>
        <header className={styles.supportHeader}>
          <h1 className={styles.supportTitle}>Intelligence <span className={styles.highlight}>Support Hub</span></h1>
          <p className={styles.supportSubtitle}>Direct link to the SkyAlert Network command structure.</p>
        </header>

        <div className={styles.supportGrid}>
          {/* Support Ticket Section */}
          <section className={`${styles.ticketSection} bento-card`}>
            <h2 className={styles.sectionTitle}>Submit Vanguard Ticket</h2>
            <form className={styles.supportForm} onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Operational Area</label>
                <select className={styles.input}>
                  <option>Radar Telemetry</option>
                  <option>Audio Broadcasts</option>
                  <option>Hub Synchronization</option>
                  <option>Staff Inquiry</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Incident Details</label>
                <textarea className={styles.textarea} placeholder="Describe the anomaly..." required />
              </div>
              <button type="submit" className={styles.submitBtn}>
                {ticketStatus || 'Synchronize Ticket'}
              </button>
            </form>
          </section>

          {/* Contact Methods */}
          <section className={styles.contactSection}>
            <div className={`${styles.contactCard} bento-card`}>
              <h3 className={styles.cardTitle}>Live Command (LiveChat)</h3>
              <p className={styles.cardDesc}>Speak directly with an available Network Administrator.</p>
              <button 
                className={styles.statusLive}
                onClick={() => {
                  // Trigger LiveChat widget if integrated
                  if ((window as any).LiveChatWidget) {
                    (window as any).LiveChatWidget.call('maximize');
                  } else {
                    alert('LiveChat Widget Initializing... Please wait or use Discord.');
                  }
                }}
              >
                Launch Live Session
              </button>
            </div>

            <div className={`${styles.contactCard} bento-card`}>
              <h3 className={styles.cardTitle}>Discord Vanguard</h3>
              <p className={styles.cardDesc}>Instant coordination via the official community backbone.</p>
              <a href="https://discord.gg/AtwfXDQquU" target="_blank" rel="noopener noreferrer" className={styles.btnSecondary}>
                Join Discord Hub
              </a>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
