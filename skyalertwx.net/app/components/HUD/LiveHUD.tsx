'use client';

import React, { useState, useEffect } from 'react';
import styles from './LiveHUD.module.css';

export default function LiveHUD() {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    // Initial time set
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }));
    };
    
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={styles.hudCard}>
      <div className={styles.cardHeader}>
        <span className={styles.protocolLabel}>Network Protocol</span>
        <h3 className={styles.protocolValue}>AV-INTELLIGENCE-ACTIVE</h3>
      </div>
      
      <div className={styles.gridContainer}>
        <div className={styles.item}>
          <span className={styles.label}>Encryption</span>
          <span className={styles.value}>Disabled (Public)</span>
        </div>
        <div className={styles.item}>
          <span className={styles.label}>System Time</span>
          <span className={styles.value}>{time || '--:--:-- --'}</span>
        </div>
      </div>
    </div>
  );
}
