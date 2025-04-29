import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";
import "./dashboard.css"; // ✅ Add a CSS file

const Dashboard = () => {
  const [sensorData, setSensorData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, "sensors"));
      setSensorData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchData();
  }, []);

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">🌱 Sensor Dashboard</h2>
      <div className="card-grid">
        {sensorData.map((item) => (
          <div className="card" key={item.id}>
            <h3>Sensor ID: {item.id}</h3>
            <ul>
              {Object.entries(item).map(([key, value]) =>
                key !== "id" ? (
                  <li key={key}>
                    <strong>{key}:</strong> {value.toString()}
                  </li>
                ) : null
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
