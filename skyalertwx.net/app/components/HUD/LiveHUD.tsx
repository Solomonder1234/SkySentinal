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
    <div className={styles.hudContainer}>
      <div className={styles.item}>
        <span className={styles.label}>NETWORK PROTOCOL:</span>
        <span className={styles.value}>AV-INTELLIGENCE-ACTIVE</span>
      </div>
      <div className={styles.divider}>//</div>
      <div className={styles.item}>
        <span className={styles.label}>ENCRYPTION:</span>
        <span className={styles.value}>DISABLED (PUBLIC HUD)</span>
      </div>
      <div className={styles.divider}>//</div>
      <div className={styles.item}>
        <span className={styles.label}>SYSTEM TIME:</span>
        <span className={styles.value}>{time || '--:--:-- --'}</span>
      </div>
    </div>
  );
}
