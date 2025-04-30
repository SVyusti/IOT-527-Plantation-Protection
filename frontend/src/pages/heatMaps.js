import React, { useRef, useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { db } from "../firebase"; // Firebase import
import "leaflet/dist/leaflet.css";
import { collection, getDocs } from "firebase/firestore";
import L from "leaflet"; // Import Leaflet to handle the default icon

const HeatMaps = () => {
  const mapRef = useRef(null);
  const defaultLatitude = 29.86; // Default latitude
  const defaultLongitude = 77.89; // Default longitude
  const [sensorData, setSensorData] = useState([]);

  // Fetch data from Firebase
  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, "sensors"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSensorData(data);
    };
    fetchData();
  }, []);

  return (
    <MapContainer
      center={[defaultLatitude, defaultLongitude]}
      zoom={13}
      ref={mapRef}
      style={{ height: "100vh", width: "100vw" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Loop through the sensor data to render markers */}
      {sensorData.map((sensor) => {
        const { BMP_batch, GPS } = sensor;
        const temperature = BMP_batch?.[0]?.temperature || 0; // Extract temperature
        const gps = GPS ? GPS.split(",") : null; // GPS format "lat,lon"

        const lat = gps ? parseFloat(gps[0]) : defaultLatitude; // Default if no GPS
        const lon = gps ? parseFloat(gps[1]) : defaultLongitude; // Default if no GPS

        return (
          <Marker
            key={sensor.id}
            position={[lat, lon]}
            icon={L.divIcon({
              className: 'leaflet-heat-icon',
              html: `<div style="background-color: rgba(255, 0, 0, 0.5); padding: 5px; border-radius: 50%; color: white;">${temperature}°C</div>`,
              iconSize: [30, 30],
            })}
          >
            <Popup>
              <div>
                <h3>Temperature: {temperature}°C</h3>
                <p>Location: {lat}, {lon}</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default HeatMaps;
