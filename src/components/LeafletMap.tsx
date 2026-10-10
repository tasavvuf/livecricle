import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '../theme';

export interface LeafletMapRef {
  recenter: (lat: number, lng: number) => void;
  fitAll: () => void;
}

interface LeafletMapProps {
  currentLocation?: { lat: number; lng: number; accuracy?: number } | null;
  user?: { id: string; name: string } | null;
  memberLocations: Record<string, { userId: string; name: string; lat: number; lng: number; ts?: string }>;
  geofences: Array<{ _id: string; name: string; lat: number; lng: number; radiusM: number }>;
  isAddingGeofence: boolean;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
}

export const LeafletMap = forwardRef<LeafletMapRef, LeafletMapProps>(({
  currentLocation,
  user,
  memberLocations,
  geofences,
  isAddingGeofence,
  onMapClick,
}, ref) => {
  const webViewRef = useRef<WebView | null>(null);

  const initialLat = currentLocation?.lat || 37.7749;
  const initialLng = currentLocation?.lng || -122.4194;

  useImperativeHandle(ref, () => ({
    recenter: (lat: number, lng: number) => {
      const script = `
        if (window.map) {
          window.map.flyTo([${lat}, ${lng}], 16, { animate: true, duration: 1.0 });
        }
        true;
      `;
      webViewRef.current?.injectJavaScript(script);
    },
    fitAll: () => {
      const script = `
        if (window.fitAllMarkers) {
          window.fitAllMarkers();
        }
        true;
      `;
      webViewRef.current?.injectJavaScript(script);
    },
  }));

  // Update map data dynamically without reloading the web page
  useEffect(() => {
    const payload = JSON.stringify({
      currentLocation: currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lng } : null,
      userName: user?.name || 'You',
      memberLocations: Object.values(memberLocations).map((m) => ({
        id: m.userId,
        name: m.name,
        lat: m.lat,
        lng: m.lng,
        ts: m.ts,
      })),
      geofences: geofences.map((g) => ({
        id: g._id,
        name: g.name,
        lat: g.lat,
        lng: g.lng,
        radiusM: g.radiusM,
      })),
      isAddingGeofence,
    });

    const script = `
      if (window.updateMapData) {
        window.updateMapData(${payload});
      }
      true;
    `;
    webViewRef.current?.injectJavaScript(script);
  }, [currentLocation, user, memberLocations, geofences, isAddingGeofence]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MAP_CLICK' && onMapClick) {
        onMapClick({ lat: data.lat, lng: data.lng });
      }
    } catch (err) {
      // Ignore parse errors
    }
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html, body, #map { width: 100%; height: 100%; background: #FAF8F1; overflow: hidden; }
          .leaflet-control-attribution { font-size: 8px; opacity: 0.6; }
          .leaflet-control-zoom { display: none; }
          
          /* User Marker Pulse */
          .user-pulse-marker {
            position: relative;
            width: 28px;
            height: 28px;
          }
          .user-pulse-outer {
            position: absolute;
            top: 0; left: 0;
            width: 28px; height: 28px;
            border-radius: 50%;
            background: rgba(49, 88, 216, 0.25);
            animation: pulse-ring 2s infinite ease-out;
          }
          .user-pulse-inner {
            position: absolute;
            top: 6px; left: 6px;
            width: 16px; height: 16px;
            border-radius: 50%;
            background: #3158D8;
            border: 2.5px solid #FAF8F1;
            box-shadow: 0 2px 6px rgba(23, 36, 61, 0.3);
          }
          @keyframes pulse-ring {
            0% { transform: scale(0.6); opacity: 1; }
            100% { transform: scale(1.6); opacity: 0; }
          }

          /* Member Marker Badge */
          .member-badge-marker {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #17243D;
            border: 2px solid #FAF8F1;
            color: #FAF8F1;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 11px;
            font-weight: 700;
            box-shadow: 0 2px 6px rgba(23, 36, 61, 0.25);
            position: relative;
          }
          .member-badge-dot {
            position: absolute;
            bottom: -1px;
            right: -1px;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #1E824C;
            border: 1.5px solid #FAF8F1;
          }

          /* Geofence Center Pin */
          .geofence-pin {
            background: #FAF8F1;
            border: 1px solid #E5E0D5;
            border-radius: 12px;
            padding: 2px 8px;
            font-size: 10px;
            font-weight: 600;
            color: #17243D;
            white-space: nowrap;
            box-shadow: 0 1px 4px rgba(23, 36, 61, 0.15);
            display: flex;
            align-items: center;
            gap: 3px;
          }

          /* Cursor on adding mode */
          body.adding-mode #map {
            cursor: crosshair !important;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          window.isAddingGeofence = false;

          // Initialize Leaflet Map
          const map = L.map('map', {
            center: [${initialLat}, ${initialLng}],
            zoom: 15,
            zoomControl: false,
          });
          window.map = map;

          // CartoDB Voyager clean tile layer
          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            subdomains: 'abcd',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          }).addTo(map);

          let userMarker = null;
          let memberMarkers = {};
          let geofenceLayers = {};

          // Handle click on map
          map.on('click', function(e) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'MAP_CLICK',
                lat: e.latlng.lat,
                lng: e.latlng.lng
              }));
            }
          });

          // Function called by React Native to update markers and circles
          window.updateMapData = function(data) {
            if (!data) return;
            window.isAddingGeofence = !!data.isAddingGeofence;
            if (window.isAddingGeofence) {
              document.body.classList.add('adding-mode');
            } else {
              document.body.classList.remove('adding-mode');
            }

            // 1. Current User Marker
            if (data.currentLocation) {
              const userLatLng = [data.currentLocation.lat, data.currentLocation.lng];
              if (!userMarker) {
                const userIcon = L.divIcon({
                  className: 'user-pulse-marker',
                  html: '<div class="user-pulse-outer"></div><div class="user-pulse-inner"></div>',
                  iconSize: [28, 28],
                  iconAnchor: [14, 14]
                });
                userMarker = L.marker(userLatLng, { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
                userMarker.bindTooltip(data.userName + ' (You)', { permanent: false, direction: 'top' });
              } else {
                userMarker.setLatLng(userLatLng);
              }
            }

            // 2. Member Markers
            const activeMemberIds = new Set();
            if (data.memberLocations && Array.isArray(data.memberLocations)) {
              data.memberLocations.forEach(function(m) {
                activeMemberIds.add(m.id);
                const memberLatLng = [m.lat, m.lng];
                const initials = (m.name || 'LC').substring(0, 2).toUpperCase();

                if (!memberMarkers[m.id]) {
                  const memberIcon = L.divIcon({
                    className: '',
                    html: '<div class="member-badge-marker">' + initials + '<div class="member-badge-dot"></div></div>',
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                  });
                  const marker = L.marker(memberLatLng, { icon: memberIcon, zIndexOffset: 500 }).addTo(map);
                  marker.bindTooltip(m.name, { permanent: false, direction: 'top' });
                  memberMarkers[m.id] = marker;
                } else {
                  memberMarkers[m.id].setLatLng(memberLatLng);
                }
              });
            }

            // Remove disconnected members
            Object.keys(memberMarkers).forEach(function(id) {
              if (!activeMemberIds.has(id)) {
                map.removeLayer(memberMarkers[id]);
                delete memberMarkers[id];
              }
            });

            // 3. Geofences
            const activeGfIds = new Set();
            if (data.geofences && Array.isArray(data.geofences)) {
              data.geofences.forEach(function(gf) {
                activeGfIds.add(gf.id);
                if (!geofenceLayers[gf.id]) {
                  const circle = L.circle([gf.lat, gf.lng], {
                    radius: gf.radiusM,
                    color: '#3158D8',
                    weight: 2,
                    dashArray: '5, 5',
                    fillColor: '#3158D8',
                    fillOpacity: 0.12
                  }).addTo(map);

                  const pinIcon = L.divIcon({
                    className: '',
                    html: '<div class="geofence-pin">📍 ' + gf.name + ' (' + gf.radiusM + 'm)</div>',
                    iconSize: [80, 20],
                    iconAnchor: [40, 10]
                  });
                  const pin = L.marker([gf.lat, gf.lng], { icon: pinIcon }).addTo(map);

                  geofenceLayers[gf.id] = { circle: circle, pin: pin };
                }
              });
            }

            // Remove deleted geofences
            Object.keys(geofenceLayers).forEach(function(id) {
              if (!activeGfIds.has(id)) {
                map.removeLayer(geofenceLayers[id].circle);
                map.removeLayer(geofenceLayers[id].pin);
                delete geofenceLayers[id];
              }
            });
          };

          // Fit all visible points in viewport
          window.fitAllMarkers = function() {
            const bounds = [];
            if (userMarker) bounds.push(userMarker.getLatLng());
            Object.values(memberMarkers).forEach(function(m) { bounds.push(m.getLatLng()); });
            Object.values(geofenceLayers).forEach(function(g) { bounds.push(g.circle.getLatLng()); });
            if (bounds.length > 0) {
              map.fitBounds(L.latLngBounds(bounds), { padding: [60, 60], maxZoom: 17 });
            }
          };
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webView}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={true}
        onMessage={handleMessage}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.cobalt} />
          </View>
        )}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  webView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
