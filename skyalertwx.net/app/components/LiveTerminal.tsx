'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './LiveTerminal.module.css';

interface LogEntry {
  id: number;
  timestamp: string;
  type: 'INFO' | 'WARN' | 'CRIT';
  message: string;
}

const STATIC_LOGS = [
  { type: 'INFO', message: '[SCM_CORE] Handshake established with NOAA Gateway 0x8A4B' },
  { type: 'INFO', message: '[NEXRAD] Sweeping Level II Data (Sector 4)...' },
  { type: 'WARN', message: '[TELEMETRY] Minor latency spike detected in WXB26 proxy port' },
  { type: 'INFO', message: 'KNYC 152151Z 24012KT 10SM BKN040 18/06 A2992 RMK AO2' },
  { type: 'INFO', message: 'KMIA 152153Z 16008KT 10SM FEW025 SCT045 28/22 A3001' },
  { type: 'CRIT', message: '[WATCHDOG] Parsing Severe Thunderstorm Warning Polygon (NWS_TB_88)' },
  { type: 'INFO', message: '[AUTH] 5 inbound connections verified through Cloudflare SSL' },
  { type: 'INFO', message: '[RADAR] Ingesting CartoDB matrix frames...' },
];

export default function LiveTerminal() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const streamRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Initial boot sequence
    setLogs([{
      id: Date.now(),
      timestamp: new Date().toISOString().substring(11, 19),
      type: 'INFO',
      message: 'SKYALERT OS v4.2.0 BOOT SEQUENCE INITIATED...'
    }]);

    let count = 0;
    const interval = setInterval(() => {
      const randomLog = STATIC_LOGS[Math.floor(Math.random() * STATIC_LOGS.length)];
      
      setLogs(prev => {
        const newLogs = [...prev, {
          id: Date.now() + Math.random(),
          timestamp: new Date().toISOString().substring(11, 19),
          type: randomLog.type as 'INFO' | 'WARN' | 'CRIT',
          message: randomLog.message
        }];
        // Keep array small to prevent DOM overload
        if (newLogs.length > 50) return newLogs.slice(newLogs.length - 50);
        return newLogs;
      });

      count++;
    }, 2500); // New log every 2.5 seconds

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className={styles.terminalContainer}>
      <div className={styles.terminalHeader}>
        <span>SkyAlert Core Proxy Terminal</span>
        <div className={styles.controls}>
          <div className={`${styles.dot} ${styles.dotGreen}`}></div>
          <div className={`${styles.dot} ${styles.dotYellow}`}></div>
          <div className={`${styles.dot} ${styles.dotRed}`}></div>
        </div>
      </div>
      <div className={styles.logStream} ref={streamRef}>
        {logs.map(log => {
          let typeClass = styles.logTypeInfo;
          if (log.type === 'WARN') typeClass = styles.logTypeWarn;
          if (log.type === 'CRIT') typeClass = styles.logTypeCrit;

          return (
            <div key={log.id} className={styles.logLine}>
              <span className={styles.logTimestamp}>[{log.timestamp}]</span>
              <span className={typeClass}>[{log.type}]&nbsp;</span>
              <span className={styles.logMessage}>{log.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
