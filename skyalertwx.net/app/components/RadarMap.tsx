'use client';

import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './RadarMap.module.css';
import L from 'leaflet';

// ---------------------------------------------------------------------------
// AnimatedRadar — inner component that owns the tile layer lifecycle.
// Leaflet tile layers must be managed imperatively; React state swap alone
// causes a visible white-flash between frames.
// ---------------------------------------------------------------------------
function AnimatedRadar({ frames, host }: { frames: { path: string; time: number }[]; host: string }) {
  const map = useMap();
  const layerRef = useRef<L.TileLayer | null>(null);
  const frameIdx = useRef(0);

  useEffect(() => {
    if (!frames.length) return;

    const showFrame = (idx: number) => {
      const frame = frames[idx];
      const url = `${host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;

      // Add new layer first, then remove old one to prevent flicker
      const newLayer = L.tileLayer(url, { opacity: 0.85, zIndex: 10 });
      newLayer.addTo(map);

      // Small delay so the new layer has started rendering before we drop the old one
      setTimeout(() => {
        if (layerRef.current) {
          map.removeLayer(layerRef.current);
        }
        layerRef.current = newLayer;
      }, 300);
    };

    // Start at the first frame
    showFrame(0);

    const interval = setInterval(() => {
      frameIdx.current = (frameIdx.current + 1) % frames.length;
      showFrame(frameIdx.current);
    }, 600); // advance one frame every 0.6 seconds

    return () => {
      clearInterval(interval);
      if (layerRef.current) map.removeLayer(layerRef.current);
    };
  }, [frames, host, map]);

  return null;
}

// ---------------------------------------------------------------------------
// RadarMap — outer component that owns data fetching.
// ---------------------------------------------------------------------------
export default function RadarMap() {
  const [frames, setFrames] = useState<{ path: string; time: number }[]>([]);
  const [host, setHost] = useState('');
  const [latestTime, setLatestTime] = useState('Loading Radar...');

  const position: [number, number] = [39.8283, -98.5795];
  const zoom = 4;

  useEffect(() => {
    const fetchRadar = async () => {
      try {
        const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        const data = await res.json();

        const pastFrames: { path: string; time: number }[] = data.radar.past;

        setHost(data.host);
        setFrames(pastFrames);

        // Show the timestamp of the most recent frame
        const latest = pastFrames[pastFrames.length - 1];
        const date = new Date(latest.time * 1000);
        setLatestTime(
          date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short',
          })
        );
      } catch (err) {
        console.error('RainViewer Radar fetch failed:', err);
        setLatestTime('Radar Offline');
      }
    };

    fetchRadar();
    // Refresh the manifest every 2 minutes to pick up new frames
    const interval = setInterval(fetchRadar, 120000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.radarContainer}>
      <div className={styles.timestamp}>
        <span className={styles.pulse}></span> {latestTime}
      </div>
      <MapContainer
        center={position}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', background: '#12141a' }}
        zoomControl={true}
      >
        {/* Dark Mode Base Map */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> | &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Animated Radar Overlay — only mounts once host/frames are loaded */}
        {host && frames.length > 0 && (
          <AnimatedRadar frames={frames} host={host} />
        )}
      </MapContainer>
    </div>
  );
}
