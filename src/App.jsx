import React from "react";
import LiveMap from "./LiveMap";
import TrafficPoliceTracker from "./TrafficPoliceTracker";

export default function App() {
  const isTracker =
    new URLSearchParams(window.location.search).get("tracker") === "1";

  // Traffic Police GPS Tracker
  if (isTracker) {
    return (
      <main className="app">
        <header>
          <h1>🚔 EMMC — Traffic Police GPS</h1>
          <p>Authorized Traffic Police Live GPS Tracker</p>
        </header>

        <TrafficPoliceTracker />
      </main>
    );
  }

  // Existing EMMC Dashboard
  return (
    <main className="app">
      <header>
        <h1>🚑 EMMC — Maps + GPS</h1>
        <p>Live Ambulance Tracking & Police Traffic Alert</p>
      </header>

      <LiveMap />
    </main>
  );
}