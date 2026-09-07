import React, { useEffect, useRef, useState } from "react";


const BACKEND_URL = "https://emmc-backend.onrender.com";
const AUTHORIZED_POLICE_ID = "TP001";

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
  const [policeId, setPoliceId] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState("Police Login Required");
  const [error, setError] = useState("");
  const [backendStatus, setBackendStatus] =
    useState("Checking Backend...");

  const [lastUpdated, setLastUpdated] = useState(null);

  const watchIdRef = useRef(null);

  // BACKEND CHECK
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

  // LOGIN
  const handleLogin = () => {
    if (policeId.trim() !== AUTHORIZED_POLICE_ID) {
      setError("❌ Unauthorized Traffic Police ID");
      return;
    }

    setError("");
    setLoggedIn(true);
    setStatus("Ready to start GPS");
  };

  // START GPS
  const startGPS = () => {
    setError("");

    if (!navigator.geolocation) {
      setStatus("GPS unavailable");
      setError(
        "This device/browser does not support GPS."
      );
      return;
    }

    setStatus("Requesting GPS permission...");

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
            setError("Invalid GPS coordinates.");
            return;
          }

          setLocation({
            latitude,
            longitude,
            accuracy: position.coords.accuracy,
          });

          setStatus("🟢 Live GPS");
          setError("");

          try {
            const response = await fetch(
              `${BACKEND_URL}/api/traffic-police/location`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  policeId: AUTHORIZED_POLICE_ID,
                  latitude,
                  longitude,
                }),
              }
            );

            const data = await response.json();

            if (!response.ok) {
              throw new Error(
                data.message || "Backend Error"
              );
            }

            setBackendStatus(
              "🟢 Backend Connected • GPS Sent"
            );

            setLastUpdated(new Date());

            setStatus(
              "🟢 Live GPS • Location Sent"
            );

            console.log(
              "🚔 REAL POLICE GPS:",
              latitude,
              longitude
            );
          } catch (err) {
            console.error(err);

            setStatus(
              "GPS Active • Backend Error"
            );

            setBackendStatus(
              "🔴 Backend Connection Error"
            );

            setError(
              "GPS मिल रहा है लेकिन Backend तक नहीं पहुँच रहा।"
            );
          }
        },

        (gpsError) => {
          console.error(
            "GPS Error:",
            gpsError.code,
            gpsError.message
          );

          if (gpsError.code === 1) {
            setStatus("Location Permission Denied");
            setError(
              "Location permission Allow करें।"
            );
          } else if (gpsError.code === 2) {
            setStatus("GPS Unavailable");
            setError(
              "Actual GPS location नहीं मिल रही है।"
            );
          } else if (gpsError.code === 3) {
            setStatus("GPS Timeout");
            setError(
              "GPS location मिलने में timeout हुआ।"
            );
          } else {
            setStatus("GPS Error");
            setError(
              "Actual GPS location प्राप्त नहीं हुई।"
            );
          }
        },

        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 20000,
        }
      );
  };

  // STOP GPS
  const stopGPS = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(
        watchIdRef.current
      );

      watchIdRef.current = null;
    }

    setStatus("GPS Stopped");
  };

  // LOGOUT
  const logout = () => {
    stopGPS();

    setLoggedIn(false);
    setPoliceId("");
    setLocation(null);
    setStatus("Police Login Required");
    setError("");
  };

  return (
    <div
      style={{
        maxWidth: "500px",
        margin: "20px auto",
        padding: "24px",
        borderRadius: "16px",
        background: "#ffffff",
        boxShadow:
          "0 4px 20px rgba(0,0,0,.12)",
        fontFamily: "Arial, sans-serif",
      }}
    >

      {!loggedIn ? (
        <>
          <h2 style={{ marginTop: 0 }}>
            🚔 Traffic Police Mode
          </h2>

          <p style={{ color: "#667085" }}>
            Authorized Traffic Police Login
          </p>

          <input
            value={policeId}
            onChange={(e) =>
              setPoliceId(e.target.value)
            }
            placeholder="Enter Police ID"
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: "10px",
              border: "1px solid #d1d5db",
              marginBottom: "12px",
              fontSize: "15px",
              boxSizing: "border-box",
            }}
          />

          <button
            onClick={handleLogin}
            style={{
              width: "100%",
              padding: "13px",
              border: "none",
              borderRadius: "10px",
              background: "#16a34a",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            🚔 LOGIN
          </button>

          <div
            style={{
              marginTop: "15px",
              padding: "12px",
              borderRadius: "10px",
              background: "#f3f4f6",
              fontSize: "13px",
            }}
          >
            Authorized ID: <b>TP001</b>
          </div>

          {error && (
            <div
              style={{
                marginTop: "12px",
                padding: "12px",
                borderRadius: "8px",
                background: "#fee2e2",
                color: "#991b1b",
              }}
            >
              ⚠️ {error}
            </div>
          )}
        </>
      ) : (
        <>
          <h2 style={{ marginTop: 0 }}>
            🚔 Traffic Police GPS
          </h2>

          <div
            style={{
              padding: "14px",
              borderRadius: "10px",
              background: "#f3f4f6",
              marginBottom: "12px",
            }}
          >
            <b>Police ID:</b> TP001
          </div>

          <div
            style={{
              padding: "14px",
              borderRadius: "10px",
              background:
                status.includes("Live")
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
                🎯 <b>GPS Accuracy:</b>{" "}
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
              📍 Waiting for actual GPS...
            </div>
          )}

          <button
            onClick={startGPS}
            style={{
              width: "100%",
              padding: "13px",
              border: "none",
              borderRadius: "10px",
              background: "#16a34a",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
              marginBottom: "10px",
            }}
          >
            📍 START LIVE GPS
          </button>

          <button
            onClick={stopGPS}
            style={{
              width: "100%",
              padding: "13px",
              border: "none",
              borderRadius: "10px",
              background: "#dc2626",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
              marginBottom: "10px",
            }}
          >
            ⛔ STOP GPS
          </button>

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

          <button
            onClick={logout}
            style={{
              width: "100%",
              padding: "11px",
              border: "1px solid #d1d5db",
              borderRadius: "10px",
              background: "white",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </>
      )}
    </div>
  );
}