import React, { useEffect, useRef, useState } from "react";

const BACKEND_URL = "http://localhost:3001";
const POLICE_ID = "TP001";

function isValidGPS(latitude, longitude) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

export default function TrafficPoliceTracker() {
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState("GPS not started");
  const [error, setError] = useState("");
  const [backendStatus, setBackendStatus] =
    useState("Checking backend...");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [sending, setSending] = useState(false);
  const watchIdRef = useRef(null);

  // Check backend
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/traffic-police`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(() => {
        setBackendStatus("🟢 Backend Connected");
      })
      .catch(() => {
        setBackendStatus("🔴 Backend Not Connected");
      });

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(
          watchIdRef.current
        );
      }
    };
  }, []);

  const startGPS = () => {
    setError("");
    setLocation(null);
    setStatus("Requesting GPS permission...");

    if (!navigator.geolocation) {
      setStatus("GPS unavailable");
      setError(
        "This browser/device does not support GPS."
      );
      return;
    }

    // Stop previous watcher
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(
        watchIdRef.current
      );
    }

    watchIdRef.current =
      navigator.geolocation.watchPosition(
        async (position) => {
          const latitude = Number(
            position.coords.latitude
          );

          const longitude = Number(
            position.coords.longitude
          );

          if (!isValidGPS(latitude, longitude)) {
            setError("Invalid GPS coordinates received.");
            return;
          }

          setLocation({
            latitude,
            longitude,
            accuracy: position.coords.accuracy,
          });

          setStatus("🟢 GPS Active");
          setError("");
          setSending(true);

          try {
            const response = await fetch(
              `${BACKEND_URL}/api/traffic-police/location`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  policeId: POLICE_ID,
                  latitude,
                  longitude,
                }),
              }
            );

            const data = await response.json();

            if (!response.ok) {
              throw new Error(
                data.message || "Backend error"
              );
            }

            setBackendStatus("🟢 Backend Connected");
            setLastUpdated(new Date());
            setStatus(
              "🟢 Live GPS • Location Sent"
            );
            setError("");

            console.log(
              "🚔 Police GPS sent:",
              latitude,
              longitude
            );
          } catch (err) {
            console.error(err);

            setStatus(
              "🟢 GPS Active • Backend Error"
            );

            setError(
              "GPS मिल रहा है लेकिन Backend तक location नहीं पहुँच रही है."
            );
          } finally {
            setSending(false);
          }
        },

        (gpsError) => {
          console.error(
            "GPS ERROR:",
            gpsError.code,
            gpsError.message
          );

          if (gpsError.code === 1) {
            setStatus("Location Permission Denied");
            setError(
              "Chrome ने Location permission deny की है. Address bar में Location को Allow करके फिर नीचे START GPS दबाएँ."
            );
          } else if (gpsError.code === 2) {
            setStatus("GPS Location Unavailable");
            setError(
              "Windows/device से GPS location नहीं मिल रही है."
            );
          } else if (gpsError.code === 3) {
            setStatus("GPS Timeout");
            setError(
              "GPS location मिलने में बहुत समय लग रहा है. फिर START GPS दबाएँ."
            );
          } else {
            setStatus("GPS Error");
            setError(
              "GPS location प्राप्त नहीं हो सकी."
            );
          }

          setSending(false);
        },

        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 20000,
        }
      );
  };

  const stopGPS = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(
        watchIdRef.current
      );
      watchIdRef.current = null;
    }

    setStatus("GPS stopped");
    setSending(false);
  };

  return (
    <div
      style={{
        maxWidth: "500px",
        margin: "30px auto",
        padding: "24px",
        borderRadius: "16px",
        background: "#fff",
        boxShadow: "0 4px 20px rgba(0,0,0,.12)",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h2 style={{ marginTop: 0 }}>
        🚔 Traffic Police GPS Tracker
      </h2>

      <div
        style={{
          padding: "14px",
          borderRadius: "10px",
          background: "#f3f4f6",
          marginBottom: "12px",
        }}
      >
        <b>Police ID:</b> {POLICE_ID}
      </div>

      <div
        style={{
          padding: "14px",
          borderRadius: "10px",
          background:
            status.includes("Live") ||
            status.includes("Active")
              ? "#dcfce7"
              : "#f3f4f6",
          marginBottom: "12px",
        }}
      >
        <b>Status:</b> {status}
      </div>

      <div
        style={{
          padding: "14px",
          borderRadius: "10px",
          background: "#eff6ff",
          marginBottom: "12px",
        }}
      >
        <b>Backend:</b> {backendStatus}
      </div>

      {location ? (
        <div
          style={{
            padding: "14px",
            borderRadius: "10px",
            background: "#eff6ff",
            marginBottom: "12px",
          }}
        >
          <div>
            📍 <b>Latitude:</b>{" "}
            {location.latitude.toFixed(6)}
          </div>

          <div style={{ marginTop: "8px" }}>
            📍 <b>Longitude:</b>{" "}
            {location.longitude.toFixed(6)}
          </div>

          <div style={{ marginTop: "8px" }}>
            🎯 <b>Accuracy:</b>{" "}
            {location.accuracy
              ? `${location.accuracy.toFixed(1)} m`
              : "N/A"}
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: "14px",
            borderRadius: "10px",
            background: "#fef3c7",
            marginBottom: "12px",
          }}
        >
          📍 Waiting for GPS location...
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "15px",
        }}
      >
        <button
          onClick={startGPS}
          style={{
            flex: 1,
            padding: "13px",
            border: "none",
            borderRadius: "10px",
            background: "#16a34a",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          📍 START GPS
        </button>

        <button
          onClick={stopGPS}
          style={{
            flex: 1,
            padding: "13px",
            border: "none",
            borderRadius: "10px",
            background: "#dc2626",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          STOP GPS
        </button>
      </div>

      {sending && (
        <div
          style={{
            padding: "12px",
            borderRadius: "8px",
            background: "#dbeafe",
            marginBottom: "12px",
          }}
        >
          📡 Sending GPS location to EMMC Backend...
        </div>
      )}

      {lastUpdated && (
        <div
          style={{
            fontSize: "13px",
            opacity: 0.75,
            marginBottom: "12px",
          }}
        >
          Last GPS update:{" "}
          {lastUpdated.toLocaleTimeString()}
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "12px",
            borderRadius: "8px",
            background: "#fee2e2",
            color: "#991b1b",
            marginBottom: "12px",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <div
        style={{
          marginTop: "15px",
          fontSize: "13px",
          lineHeight: "1.6",
          opacity: 0.8,
        }}
      >
        🚔 Authorized Traffic Police: TP001
        <br />
        📡 Real GPS continuously sent to EMMC Backend
        <br />
        📏 Dashboard calculates actual ambulance-to-police distance
        <br />
        🚨 Alert when distance is within 1 km
      </div>
    </div>
  );
}