'use client';

import React, { useEffect, useState } from 'react';
import styles from './NwsAlerts.module.css';

interface NWSAlert {
  id: string;
  properties: {
    event: string;
    areaDesc: string;
    severity: string;
    urgency: string;
    effective: string;
    expires: string;
  };
}

export default function NwsAlerts() {
  const [alerts, setAlerts] = useState<NWSAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        // Fetch active actual alerts
        const res = await fetch('https://api.weather.gov/alerts/active?status=actual&message_type=alert');
        if (!res.ok) throw new Error('NWS API Unavailable');
        
        const data = await res.json();
        
        // Filter out very minor advisories, focus on high-impact severe weather globally in the US
        const severeEvents = ['Tornado Warning', 'Severe Thunderstorm Warning', 'Flash Flood Warning', 'Tsunami Warning', 'Hurricane Warning'];
        
        let activeAlerts = data.features.filter((alert: NWSAlert) => 
            severeEvents.includes(alert.properties.event) || alert.properties.severity === 'Extreme'
        );

        // Sort by severity (Extreme first)
        activeAlerts.sort((a: NWSAlert, b: NWSAlert) => {
            if (a.properties.severity === 'Extreme' && b.properties.severity !== 'Extreme') return -1;
            if (b.properties.severity === 'Extreme' && a.properties.severity !== 'Extreme') return 1;
            return 0;
        });

        // Cap to top 15 alerts to avoid DOM bloat during massive outbreaks
        setAlerts(activeAlerts.slice(0, 15));
        setLoading(false);
      } catch (err) {
        console.error('NWS Fetch Error:', err);
        setError('Telemetry Link Offline');
        setLoading(false);
      }
    };

    fetchAlerts();
    // Poll every 2 minutes
    const interval = setInterval(fetchAlerts, 120000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className={styles.loading}><span className={styles.spinner}></span> Connecting to NWS Telemetry...</div>;
  if (error) return <div className={styles.error}>⚠️ {error}</div>;

  if (alerts.length === 0) {
    return (
      <div className={styles.noAlerts}>
        ❖ No Severe Telemetry Active. Network is Clear.
      </div>
    );
  }

  return (
    <div className={styles.alertsContainer}>
      {alerts.map((alert) => {
        const isExtreme = alert.properties.severity === 'Extreme' || alert.properties.event === 'Tornado Warning';
        const isSevere = alert.properties.severity === 'Severe' || alert.properties.event === 'Severe Thunderstorm Warning';
        
        let cardClass = styles.alertModerate;
        let textClass = '';
        
        if (isExtreme) {
            cardClass = styles.alertExtreme;
            textClass = styles.extremeText;
        } else if (isSevere) {
            cardClass = styles.alertSevere;
            textClass = styles.severeText;
        }

        const expTime = new Date(alert.properties.expires).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return (
          <div key={alert.id} className={`${styles.alertCard} ${cardClass}`}>
            <div className={styles.alertHeader}>
              <h4 className={`${styles.alertEvent} ${textClass}`}>⚠️ {alert.properties.event}</h4>
            </div>
            <div className={styles.alertArea}>{alert.properties.areaDesc}</div>
            <div className={styles.alertMeta}>
              <span>Expires: {expTime}</span>
              <span>Severity: {alert.properties.severity}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
