import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, query, onSnapshot } from "firebase/firestore";
import "./dashboard.css"; // ✅ Add a CSS file

const Dashboard = () => {
  const [sensorData, setSensorData] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "sensors"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newSensorData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      newSensorData.sort((a, b) => {
        const timeA = new Date(a.createTime).getTime();
        const timeB = new Date(b.createTime).getTime();
        return timeB - timeA; 
      });

      setSensorData(newSensorData);
    });

    return () => unsubscribe();
  }, []); // Empty dependency array to set up the listener once when component mounts

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">🌱 Sensor Dashboard</h2>
      <table className="sensor-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Altitude (BMP)</th>
            <th>Pressure (BMP)</th>
            <th>Temperature (BMP)</th>
            <th>Latitude (GPS)</th>
            <th>Longitude (GPS)</th>
            <th>Accel X (MPU)</th>
            <th>Accel Y (MPU)</th>
            <th>Accel Z (MPU)</th>
            <th>Gyro X (MPU)</th>
            <th>Gyro Y (MPU)</th>
            <th>Gyro Z (MPU)</th>
            <th>Temperature (MPU)</th>
          </tr>
        </thead>
        <tbody>
          {sensorData.map((item) => (
            <tr key={item.id}>
              <td>{new Date(item.createTime).toLocaleString()}</td>
              <td>{item.BMP?.altitude}</td>
              <td>{item.BMP?.pressure}</td>
              <td>{item.BMP?.temperature}</td>
              <td>{item.GPS?.lat}</td>
              <td>{item.GPS?.lon}</td>
              <td>{item.MPU?.accelX}</td>
              <td>{item.MPU?.accelY}</td>
              <td>{item.MPU?.accelZ}</td>
              <td>{item.MPU?.gyroX}</td>
              <td>{item.MPU?.gyroY}</td>
              <td>{item.MPU?.gyroZ}</td>
              <td>{item.MPU?.temp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Dashboard;
