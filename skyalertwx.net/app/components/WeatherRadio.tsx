'use client';

import React, { useRef, useState, useEffect } from 'react';
import styles from './WeatherRadio.module.css';

interface Station {
  label: string;
  location: string;
  url: string;
}

const STATIONS: Station[] = [
  { label: 'New York City, NY — KWO35', location: 'New York', url: 'https://stream.live.vc.noaaweatherradio.org/NY-NewYork-KWO35' },
  { label: 'Miami, FL — KHB34', location: 'Florida', url: 'https://stream.live.vc.noaaweatherradio.org/FL-Miami-KHB34' },
  { label: 'Jacksonville, FL — KHB39', location: 'Florida', url: 'https://stream.live.vc.noaaweatherradio.org/FL-Jacksonville-KHB39' },
  { label: 'Chicago, IL — KZZ81', location: 'Illinois', url: 'https://stream.live.vc.noaaweatherradio.org/IL-Lockport-KZZ81' },
  { label: 'Los Angeles, CA — KWO37', location: 'California', url: 'https://stream.live.vc.noaaweatherradio.org/CA-LosAngeles-KWO37' },
  { label: 'Atlanta, GA — KEC80', location: 'Georgia', url: 'https://stream.live.vc.noaaweatherradio.org/GA-Atlanta-KEC80' },
  { label: 'Kansas City, MO — KID77', location: 'Missouri', url: 'https://stream.live.vc.noaaweatherradio.org/MO-KansasCity-KID77' },
  { label: 'Shreveport, LA — WXJ97', location: 'Louisiana', url: 'https://stream.live.vc.noaaweatherradio.org/LA-Shreveport-WXJ97' },
  { label: 'Detroit, MI — KEC63', location: 'Michigan', url: 'https://stream.live.vc.noaaweatherradio.org/MI-Southfield-KEC63' },
  { label: 'Grand Forks, ND — WWF83', location: 'North-Dakota', url: 'https://stream.live.vc.noaaweatherradio.org/ND-GrandForks-WWF83' },
];

export default function WeatherRadio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentStation = STATIONS[selectedIdx];

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // When station changes, stop playback so user has to press play again
  const handleStationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = parseInt(e.target.value);
    setSelectedIdx(idx);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      audioRef.current.src = '';
      setIsPlaying(false);
    } else {
      audioRef.current.src = currentStation.url;
      audioRef.current.volume = volume;
      audioRef.current.play().catch(e => console.error('Playback prevented:', e));
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (audioRef.current) audioRef.current.volume = newVol;
  };

  return (
    <div className={styles.radioContainer}>
      <div className={styles.radioInfo}>
        <h3 className={styles.radioTitle}>
          NWS Broadcast <span className={styles.liveBadge}>LIVE</span>
          <div className={`${styles.eqContainer} ${isPlaying ? styles.playing : ''}`}>
            <div className={styles.eqBar}></div>
            <div className={styles.eqBar}></div>
            <div className={styles.eqBar}></div>
            <div className={styles.eqBar}></div>
            <div className={styles.eqBar}></div>
          </div>
        </h3>
        <span className={styles.radioSubtitle}>
          {currentStation.label}
        </span>

        {/* Station Selector Dropdown */}
        <select
          className={styles.stationSelect}
          value={selectedIdx}
          onChange={handleStationChange}
          aria-label="Select NOAA Weather Radio Station"
        >
          {STATIONS.map((s, i) => (
            <option key={i} value={i}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className={styles.controls}>
        <button
          className={`${styles.playBtn} ${isPlaying ? styles.playing : ''}`}
          onClick={togglePlay}
          aria-label={isPlaying ? 'Stop Broadcast' : 'Play Broadcast'}
        >
          {isPlaying ? '⏹' : '▶'}
        </button>

        <div className={styles.volumeControl}>
          <span>🔈</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            className={styles.volumeSlider}
            aria-label="Volume Control"
          />
        </div>
      </div>
    </div>
  );
}
