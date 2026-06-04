import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import "leaflet/dist/leaflet.css";
import { auth, provider } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { MapContainer, Marker, Polyline, Popup, useMap, Pane } from "react-leaflet";
import L from "leaflet";

import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const LOCATIONS = [
  { id: 1, name: "Main Gate", type: "gate", desc: "Main entrance of NHCE", pos: [12.933408, 77.691239] },
  { id: 2, name: "Library", type: "library", desc: "Library – 24/7", pos: [12.933571979295008, 77.69245395658271] },
  { id: 3, name: "MUNCH Canteen", type: "canteen", desc: "Lunch & Snacks", pos: [12.934443, 77.692755] },
  { id: 4, name: "Block A (CSE/ISE)", type: "block", desc: "CS & IS Department Block", pos: [12.9341048, 77.6921029] },
  { id: 5, name: "Block B (ECE/EEE)", type: "block", desc: "Electronics Department Block", pos: [12.9344286, 77.6931785] },
  { id: 6, name: "Block C (MECH)", type: "block", desc: "Mechanical ", pos: [12.9344286, 77.6931785] },
  { id: 7, name: "Auditorium", type: "event", desc: "Main Auditorium – Events & Seminars", pos: [12.9343845, 77.6922608] },
  { id: 8, name: "Admin Block", type: "block", desc: "Principal & Admin Office", pos: [12.933660, 77.691799] },
  { id: 9, name: "Basketball Court", type: "sports", desc: "Basketball & Sports Ground", pos: [12.933560215566194, 77.69233526883649] },
  { id: 10, name: "Girls Hostel", type: "hostel", desc: "Girls Hostel", pos: [12.9347959, 77.6932378] },
  { id: 11, name: "Boys Hostel", type: "hostel", desc: "Boys Hostel", pos: [12.9333153, 77.6920972] },
  { id: 12, name: "Xerox / Printouts", type: "printouts", desc: "Front of MUNCH Canteen", pos: [12.9343845, 77.6922608] },
];

const TEACHERS = [
  { id: 1, name: "MS.Shefali",     dept: "DS",    room: "Block C – Room 223", pos: [12.9336313, 77.6920073] },
  { id: 2, name: "MR.Joshua",      dept: "DS",    room: "Block C – Room 223", pos: [12.9336313, 77.6920073] },
  { id: 3, name: "MR.Chandan",     dept: "DS",    room: "Block C – Room 223", pos: [12.9336313, 77.6920073] },
  { id: 4, name: "MS.Saranya",     dept: "CSE",   room: "Block A – Room 101", pos: [12.9341048, 77.6921029] },
  { id: 5, name: "DR.Roja Ramani", dept: "CSE",   room: "Block A – Room 101", pos: [12.9341048, 77.6921029] },
  { id: 6, name: "Prof. Deepa V",  dept: "CSE",   room: "Block C – Room 101", pos: [12.9341048, 77.6921029] },
  { id: 7, name: "Dr. Nithya L",   dept: "MATHS", room: "Block C – Room 401", pos: [12.9336313, 77.6920073] },
];

const EVENTS = [
  { id: 1, title: "Marathon",               time: "Tomorrow, 6AM", location: "COLLEGE",               live: false },
  { id: 2, title: "Placement Drive – TCS",  time: "Today, 2PM",    location: "Seminar Hall, Block A",  live: true  },
  { id: 3, title: "Cultural Fest – Horizon",time: "Tomorrow, 9AM", location: "Sports Ground",          live: false },
  { id: 4, title: "IEEE Workshop",          time: "May 18, 11AM",  location: "Block B – Room 301",     live: false },
];

const TYPE_ICONS = {
  all: "🗺️", gate: "🚪", library: "📚", canteen: "🍽️",
  block: "🏫", event: "🎭", sports: "⚽", admin: "🏛️", hostel: "🏠",
};

const NHCE_POS = [12.9334947, 77.6911819];

// ── Smooth zoom control (wheel delta divided down) ───────────────────────────
function SmoothZoom() {
  const map = useMap();
  useEffect(() => {
    // Disable default scroll zoom, replace with smooth version
    map.scrollWheelZoom.disable();
    let accDelta = 0;
    let timer = null;

    const onWheel = (e) => {
      e.preventDefault();
      accDelta += e.deltaY;

      clearTimeout(timer);
      timer = setTimeout(() => {
        // Each ~300px of scroll = 1 zoom level
        const steps = accDelta / 300;
        const currentZoom = map.getZoom();
        const targetZoom = Math.min(20, Math.max(17, currentZoom - steps));
        map.setZoom(targetZoom, { animate: true });
        accDelta = 0;
      }, 60);
    };

    const container = map.getContainer();
    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [map]);
  return null;
}

// ── SVG-based rotated image overlay ─────────────────────────────────────────
function RotatedImageOverlay({ url, bounds, opacity = 0.9, rotationDeg = 15 }) {
  const map = useMap();
  useEffect(() => {
    const sw = L.latLng(bounds[0][0], bounds[0][1]);
    const ne = L.latLng(bounds[1][0], bounds[1][1]);
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("xmlns", svgNS);
    svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("preserveAspectRatio", "none");
    const image = document.createElementNS(svgNS, "image");
    image.setAttributeNS("http://www.w3.org/1999/xlink", "href", url);
    image.setAttribute("x", "0");
    image.setAttribute("y", "0");
    image.setAttribute("width", "100");
    image.setAttribute("height", "100");
    image.setAttribute("preserveAspectRatio", "none");
    image.setAttribute("opacity", String(opacity));
    image.setAttribute("transform", `translate(-4, 0) rotate(${rotationDeg}, 54, 50)`);
    svg.appendChild(image);
    const svgOverlay = L.svgOverlay(svg, [sw, ne], { interactive: false, pane: "imagePane" });
    svgOverlay.addTo(map);
    return () => { map.removeLayer(svgOverlay); };
  }, [map, url, bounds, opacity, rotationDeg]);
  return null;
}

// ── Route panel ──────────────────────────────────────────────────────────────
function RoutePanel({ from, to, onFromChange, onToChange, onGo, onClear }) {
  return (
    <div style={{
      position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
      zIndex: 1000, background: "#13151c", borderRadius: 14, padding: "12px 16px",
      display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      border: "1px solid #252836", minWidth: 340,
    }}>
      <span style={{ fontSize: 18 }}>🟢</span>
      <select value={from} onChange={e => onFromChange(e.target.value)}
        style={{ flex: 1, background: "#1f2937", color: from ? "white" : "#6b7280", border: "none", borderRadius: 8, padding: "8px 10px", fontSize: 13, cursor: "pointer" }}>
        <option value="">From…</option>
        {LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
      </select>
      <span style={{ color: "#4b5563", fontSize: 18 }}>→</span>
      <span style={{ fontSize: 18 }}>🔴</span>
      <select value={to} onChange={e => onToChange(e.target.value)}
        style={{ flex: 1, background: "#1f2937", color: to ? "white" : "#6b7280", border: "none", borderRadius: 8, padding: "8px 10px", fontSize: 13, cursor: "pointer" }}>
        <option value="">To…</option>
        {LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
      </select>
      <button onClick={onGo} disabled={!from || !to}
        style={{ background: from && to ? "#2563eb" : "#374151", color: "white", border: "none", borderRadius: 8, padding: "8px 14px", cursor: from && to ? "pointer" : "default", fontWeight: "bold", fontSize: 13 }}>
        Go
      </button>
      {(from || to) && (
        <button onClick={onClear}
          style={{ background: "#374151", color: "#9ca3af", border: "none", borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontSize: 13 }}>
          ✕
        </button>
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("places");
  const [filterType, setFilterType] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [userCoords, setUserCoords] = useState(null);
  const [navigating, setNavigating] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [routeFrom, setRouteFrom] = useState("");
  const [routeTo, setRouteTo]     = useState("");
  const [activeRoute, setActiveRoute] = useState(null);

  const mapRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords([pos.coords.latitude, pos.coords.longitude]),
      () => console.warn("Location permission denied")
    );
  }, []);

  const handleLogin  = async () => { try { await signInWithPopup(auth, provider); } catch (e) { console.error(e); } };
  const handleLogout = async () => { await signOut(auth); };

  const navigateTo = (loc) => {
    setSelectedLocation(loc);
    setNavigating(true);
    if (mapRef.current && loc.pos) {
      const map = mapRef.current;
      if (!map.getBounds().contains(loc.pos)) map.panTo(loc.pos, { animate: true });
    }
  };

  const handleLocationClick = (loc) => {
    if (!loc.pos) { alert("Exact coordinates not yet available."); return; }
    navigateTo(loc);
  };

  const handleNavigateToNHCE = () => navigateTo({ name: "NHCE Main Gate", pos: [12.9318, 77.6908] });

  const handleResetMap = () => {
    setSelectedLocation(null);
    setNavigating(false);
    setActiveRoute(null);
    setRouteFrom("");
    setRouteTo("");
  };

  const handleGoRoute = () => {
    const fromLoc = LOCATIONS.find(l => l.id === Number(routeFrom));
    const toLoc   = LOCATIONS.find(l => l.id === Number(routeTo));
    if (!fromLoc || !toLoc) return;
    setActiveRoute({ from: fromLoc, to: toLoc });
    setNavigating(true);
    if (mapRef.current) {
      mapRef.current.fitBounds([fromLoc.pos, toLoc.pos], { padding: [80, 80], animate: true });
    }
  };

  const filteredLocations = LOCATIONS.filter((l) => {
    const matchType = filterType === "all" || l.type === filterType;
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const filteredTeachers = TEACHERS.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.dept.toLowerCase().includes(search.toLowerCase())
  );

  if (isAuthChecking) return <div className="login-screen" style={{ color: "white" }}>Loading…</div>;

  if (!user) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-logo">🧭</div>
          <h1>NHCE Navigator</h1>
          <p>New Horizon College of Engineering</p>
          <p className="login-sub">Sign in to explore the campus map, find teachers &amp; live events</p>
          <button className="google-btn" onClick={handleLogin}>Sign in with Google</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="logo">🧭</span>
          <div>
            <div className="brand">NHCE</div>
            <div className="brand-sub">Navigator</div>
          </div>
        </div>

        <div className="user-info">
          <img src={user.photoURL} alt="avatar" className="avatar" />
          <div>
            <div className="user-name">{user.displayName?.split(" ")[0]}</div>
            <div className="user-email">{user.email}</div>
          </div>
        </div>

        <div className="search-wrap">
          <input className="search-input" placeholder="Search places, teachers..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="tabs">
          {["places", "teachers", "events"].map((t) => (
            <button key={t} className={`tab-btn ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>
              {t === "places" ? "📍 Places" : t === "teachers" ? "👨‍🏫 Teachers" : "🎉 Events"}
            </button>
          ))}
        </div>

        {activeTab === "places" && (
          <>
            <div className="filter-row">
              {Object.entries(TYPE_ICONS).map(([type, ic]) => (
                <button key={type} className={`filter-chip ${filterType === type ? "active" : ""}`} onClick={() => setFilterType(type)}>{ic}</button>
              ))}
            </div>
            <div className="list">
              {filteredLocations.map((loc) => (
                <div key={loc.id} className={`list-item ${selectedLocation?.id === loc.id ? "selected" : ""}`} onClick={() => handleLocationClick(loc)}>
                  <span className="item-icon">{TYPE_ICONS[loc.type] || "📍"}</span>
                  <div>
                    <div className="item-name">{loc.name}</div>
                    <div className="item-desc">{loc.desc}</div>
                    {selectedLocation?.id === loc.id && navigating && <div className="item-nav-label">🗺️ Route shown on map</div>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === "teachers" && (
          <div className="list">
            {filteredTeachers.map((t) => (
              <div key={t.id} className="list-item" onClick={() => t.pos && navigateTo({ ...t, type: "teacher", desc: `${t.dept} - ${t.room}` })} style={{ cursor: t.pos ? "pointer" : "default" }}>
                <span className="item-icon">👨‍🏫</span>
                <div>
                  <div className="item-name">{t.name}</div>
                  <div className="item-desc">{t.dept} · {t.room}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "events" && (
          <div className="list">
            {EVENTS.map((ev) => (
              <div key={ev.id} className="list-item">
                <span className="item-icon">🎉</span>
                <div>
                  <div className="item-name">{ev.title}{ev.live && <span className="live-badge">LIVE</span>}</div>
                  <div className="item-desc">{ev.time}</div>
                  <div className="item-desc">📍 {ev.location}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="sidebar-footer">
          {(navigating || activeRoute) && (
            <button className="reset-btn" onClick={handleResetMap}>🔄 Back to Campus View</button>
          )}
          <button className="locate-btn" onClick={handleNavigateToNHCE}>📍 Navigate to NHCE</button>
          <button className="logout-btn" onClick={handleLogout}>Sign Out</button>
        </div>
      </aside>

      <main className="map-panel" style={{ backgroundColor: "#1a1a2e" }}>
        {navigating && selectedLocation && !activeRoute && (
          <div className="map-banner">
            {userCoords ? `🗺️ Directions → ${selectedLocation.name}` : `📍 ${selectedLocation.name}`}
          </div>
        )}
        {activeRoute && (
          <div className="map-banner">
            🟢 {activeRoute.from.name} &nbsp;→&nbsp; 🔴 {activeRoute.to.name}
          </div>
        )}

        <div style={{ width: "100%", height: (navigating || activeRoute) ? "calc(100% - 40px)" : "100%", position: "relative" }}>
          <MapContainer
            center={NHCE_POS}
            zoom={17}
            minZoom={17}
            maxZoom={20}
            maxBounds={[[12.9310, 77.6895], [12.9370, 77.6950]]}
            maxBoundsViscosity={1.0}
            style={{ height: "100%", width: "100%", background: "#1a1a2e" }}
            ref={mapRef}
            zoomControl={false}
            attributionControl={false}
            scrollWheelZoom={false}
            zoomSnap={0.25}
            zoomDelta={0.25}
            wheelPxPerZoomLevel={120}
          >
            {/* Smooth scroll zoom */}
            <SmoothZoom />

            {/* Panes: image below routes */}
            <Pane name="imagePane" style={{ zIndex: 400 }} />
            <Pane name="routePane" style={{ zIndex: 450 }} />

            {/* Campus aerial image */}
            <RotatedImageOverlay
              url="/college_layout.jpg"
              bounds={[
                [12.9326, 77.6907],
                [12.9359, 77.6939],
              ]}
              opacity={1}
              rotationDeg={15}
            />

            {/* ── Route: source → destination ── */}
            {activeRoute && (
              <>
                <Polyline
                  positions={[activeRoute.from.pos, activeRoute.to.pos]}
                  pathOptions={{ color: "#22c55e", weight: 6, dashArray: "12, 8", lineCap: "round" }}
                  pane="routePane"
                />
                <Marker position={activeRoute.from.pos}>
                  <Popup>🟢 From: {activeRoute.from.name}</Popup>
                </Marker>
                <Marker position={activeRoute.to.pos}>
                  <Popup>🔴 To: {activeRoute.to.name}</Popup>
                </Marker>
              </>
            )}

            {/* ── Sidebar-click navigation route ── */}
            {navigating && !activeRoute && selectedLocation && userCoords && (
              <Polyline
                positions={[userCoords, selectedLocation.pos]}
                pathOptions={{ color: "#818cf8", weight: 6, dashArray: "12, 8", lineCap: "round" }}
                pane="routePane"
              />
            )}
            {navigating && !activeRoute && selectedLocation?.pos && (
              <Marker position={selectedLocation.pos}><Popup>{selectedLocation.name}</Popup></Marker>
            )}
            {navigating && !activeRoute && userCoords && (
              <Marker position={userCoords}><Popup>You are here</Popup></Marker>
            )}

            {/* ── All markers when idle ── */}
            {!navigating && !activeRoute && LOCATIONS.map((loc) => (
              <Marker key={loc.id} position={loc.pos}><Popup>{loc.name}</Popup></Marker>
            ))}

            {/* Floating route panel */}
            <RoutePanel
              from={routeFrom} to={routeTo}
              onFromChange={setRouteFrom} onToChange={setRouteTo}
              onGo={handleGoRoute} onClear={handleResetMap}
            />
          </MapContainer>
        </div>
      </main>
    </div>
  );
}