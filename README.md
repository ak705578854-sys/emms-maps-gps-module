# EMMC Maps + GPS Module — Police Traffic Alert

Features:
- Live browser/device GPS tracking
- Ambulance + hospital + authorized police markers
- 1 km police proximity check
- Demo police notification/alert when an authorized police unit is within 1 km
- Alert shows ambulance location, destination, and patient emergency category
- OSRM road route, distance and ETA
- Leaflet + OpenStreetMap
- Interactive map controls

Important: The police location and notification are DEMO/local logic in this frontend. For the real EMMC system, police GPS positions and notification delivery should come from the authorized backend/realtime service.

## Run
npm install
npm run dev

## Build
npm run build


## Added polish
- Dynamic OSRM route recalculation whenever live GPS location changes.
- Route status shows calculating/recalculating/live updated state.
- GPS last-updated time is displayed.
- 1 km authorized traffic-police proximity alert remains part of the demo.
