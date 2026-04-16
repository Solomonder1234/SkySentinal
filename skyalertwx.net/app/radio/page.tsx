'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './RadioHub.module.css';

interface Station {
  state: string;
  name: string;
  callsign: string;
  url: string;
}

const ALL_STATIONS: Station[] = [
  // Northeast
  { state: 'NY', name: 'New York City', callsign: 'KWO35', url: 'https://wxradio.org/NY-NewYork-KWO35' },
  { state: 'NY', name: 'Albany', callsign: 'WXL34', url: 'https://wxradio.org/NY-Albany-WXL34' },
  { state: 'NY', name: 'Buffalo', callsign: 'KEB98', url: 'https://wxradio.org/NY-Buffalo-KEB98' },
  { state: 'MA', name: 'Boston', callsign: 'KHB35', url: 'https://wxradio.org/MA-Boston-KHB35' },
  { state: 'PA', name: 'Philadelphia', callsign: 'KIH28', url: 'https://wxradio.org/PA-Philadelphia-KIH28' },
  { state: 'PA', name: 'Pittsburgh', callsign: 'KIH35', url: 'https://wxradio.org/PA-Pittsburgh-KIH35' },
  
  // South
  { state: 'FL', name: 'Miami', callsign: 'KHB34', url: 'https://wxradio.org/FL-Miami-KHB34' },
  { state: 'FL', name: 'Jacksonville', callsign: 'KHB39', url: 'https://wxradio.org/FL-Jacksonville-KHB39' },
  { state: 'FL', name: 'Tampa', callsign: 'KHB32', url: 'https://wxradio.org/FL-Tampa-KHB32' },
  { state: 'FL', name: 'Orlando', callsign: 'KHB31', url: 'https://wxradio.org/FL-Orlando-KHB31' },
  { state: 'GA', name: 'Atlanta', callsign: 'KEC80', url: 'https://wxradio.org/GA-Atlanta-KEC80' },
  { state: 'TX', name: 'Dallas', callsign: 'KEC56', url: 'https://wxradio.org/TX-Dallas-KEC56' },
  { state: 'TX', name: 'Houston', callsign: 'KHB40', url: 'https://wxradio.org/TX-Houston-KHB40' },
  { state: 'TX', name: 'San Antonio', callsign: 'WXK67', url: 'https://wxradio.org/TX-SanAntonio-WXK67' },
  { state: 'LA', name: 'New Orleans', callsign: 'KHB43', url: 'https://wxradio.org/LA-NewOrleans-KHB43' },
  { state: 'LA', name: 'Shreveport', callsign: 'WXJ97', url: 'https://wxradio.org/LA-Shreveport-WXJ97' },
  
  // Midwest
  { state: 'IL', name: 'Chicago', callsign: 'KZZ81', url: 'https://wxradio.org/IL-Lockport-KZZ81' },
  { state: 'MO', name: 'St. Louis', callsign: 'KDO89', url: 'https://wxradio.org/MO-StLouis-KDO89' },
  { state: 'MO', name: 'Kansas City', callsign: 'KID77', url: 'https://wxradio.org/MO-KansasCity-KID77' },
  { state: 'MI', name: 'Detroit', callsign: 'KEC63', url: 'https://wxradio.org/MI-Southfield-KEC63' },
  { state: 'OH', name: 'Cleveland', callsign: 'KHB59', url: 'https://wxradio.org/OH-Cleveland-KHB59' },
  { state: 'MN', name: 'Minneapolis', callsign: 'KEC65', url: 'https://wxradio.org/MN-Minneapolis-KEC65' },
  
  // West
  { state: 'CA', name: 'Los Angeles', callsign: 'KWO37', url: 'https://wxradio.org/CA-LosAngeles-KWO37' },
  { state: 'CA', name: 'San Francisco', callsign: 'KHB49', url: 'https://wxradio.org/CA-Monterey-KHB49' },
  { state: 'WA', name: 'Seattle', callsign: 'KHB60', url: 'https://wxradio.org/WA-Seattle-KHB60' },
  { state: 'CO', name: 'Denver', callsign: 'KEC76', url: 'https://wxradio.org/CO-Denver-KEC76' },
  { state: 'AZ', name: 'Phoenix', callsign: 'KEC94', url: 'https://wxradio.org/AZ-Phoenix-KEC94' },
  
  // Pacific/Other
  { state: 'HI', name: 'Honolulu', callsign: 'KBA99', url: 'https://wxradio.org/HI-Honolulu-KBA99' },
  { state: 'AK', name: 'Anchorage', callsign: 'KEC71', url: 'https://wxradio.org/AK-Anchorage-KEC71' },
];

export default function RadioHub() {
  const [search, setSearch] = useState('');
  const [activeStation, setActiveStation] = useState<Station | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const filteredStations = ALL_STATIONS.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.callsign.toLowerCase().includes(search.toLowerCase()) ||
    s.state.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStation = (station: Station) => {
    if (!audioRef.current) return;

    if (activeStation?.callsign === station.callsign && isPlaying) {
      audioRef.current.pause();
      audioRef.current.src = '';
      setIsPlaying(false);
    } else {
      audioRef.current.pause();
      audioRef.current.src = station.url;
      audioRef.current.volume = volume;
      audioRef.current.play().catch(e => console.error('Audio play blocked:', e));
      setActiveStation(station);
      setIsPlaying(true);
    }
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <div className={styles.header}>
          <h1 className={styles.title}>NOAA <span className={styles.highlight}>Broadcast Hub</span></h1>
          <p className={styles.subtitle}>Secure access to the National Weather Radio relay network across all US territories.</p>
        </div>

        <div className={styles.searchBox}>
          <input 
            type="text" 
            placeholder="Search by State, City, or Callsign..." 
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.gridContainer}>
        <div className={styles.grid}>
          {filteredStations.map((station) => (
            <div 
              key={station.callsign} 
              className={`${styles.stationCard} ${activeStation?.callsign === station.callsign ? styles.active : ''}`}
              onClick={() => toggleStation(station)}
            >
              <div className={styles.cardHeader}>
                <span className={styles.stateLabel}>{station.state}</span>
                <span className={styles.callsign}>{station.callsign}</span>
              </div>
              <h3 className={styles.stationName}>{station.name}</h3>
              <div className={styles.playbackIndicator}>
                {activeStation?.callsign === station.callsign && isPlaying ? (
                  <div className={styles.livePulse}>
                    <span></span> LIVE RELAY
                  </div>
                ) : (
                  <span className={styles.idleText}>Ready to stream</span>
                )}
              </div>
              <button className={styles.playBtn}>
                {activeStation?.callsign === station.callsign && isPlaying ? '⏹ STOP' : '▶ CONNECT'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {activeStation && (
        <div className={styles.globalPlayer}>
          <div className={styles.playerContent}>
            <div className={styles.playerInfo}>
              <strong>NOW MONITORING:</strong> {activeStation.name} ({activeStation.callsign})
            </div>
            <div className={styles.playerControls}>
              <div className={styles.volumeBox}>
                <span>🔈</span>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05" 
                  value={volume} 
                  onChange={handleVolume}
                />
              </div>
              <button className={styles.stopBtn} onClick={() => toggleStation(activeStation)}>
                DISCONNECT
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
