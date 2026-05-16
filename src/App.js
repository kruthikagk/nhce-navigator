import React, { useState, useEffect } from "react";
import "./App.css";
import { auth, provider } from "./firebase";
import { signInWithPopup, signOut } from "firebase/auth";

const LOCATIONS = [
  { id: 1,  name: "Main Gate",             type: "gate",    desc: "Main entrance of NHCE",                   pos: [12.9318, 77.6908] },
  { id: 2,  name: "Library",               type: "library", desc: "Library – 24/7",                          pos: [12.933571979295008, 77.69245395658271] },
  { id: 3,  name: "MUNCH Canteen",               type: "canteen", desc: " –  Lunch & Snacks", pos: [12.9343953, 77.6925750] },
  { id: 4,  name: "Block A (CSE/ISE)",     type: "block",   desc: "CS & IS Department Block",                pos: [12.9341048, 77.6921029] },
  { id: 5,  name: "Block B (ECE/EEE)",     type: "block",   desc: "Electronics Department Block",            pos: [12.9344286, 77.6931785] },
  { id: 6,  name: "Block C (MECH/CIVIL)",  type: "block",   desc: "Mechanical & Civil Block",                pos: [12.9344286, 77.6931785] },
  { id: 7,  name: "Auditorium",            type: "event 1st  floor ",   desc: "Main Auditorium – Events & Seminars",     pos: [12.9343845, 77.6922608] },
  { id: 8,  name: "Admin Block",           type: "admin",   desc: "Principal & Admin Office",                pos: [12.9340, 77.6912] },
  { id: 9,  name: "NHCE Basketball Court", type: "sports",  desc: "Basketball & Sports Ground",              pos: [12.933560215566194, 77.69233526883649] },
  { id: 10, name: "girls Hostel",               type: "hostel",  desc: "Girls Hostel",                     pos: [12.9347959, 77.6932378] },
  { id: 11, name: "boys Hostel",               type: "svn hostel",  desc: "boys Hostel",                     pos: [12.9333153, 77.6920972] },
   { id: 12,  name: "xerox",             type: "printouts",    desc: "front of munch canteen",                   pos: [12.9343845, 77.6922608] },
];

const TEACHERS = [
  { id: 1, name: "MS.Shefali",  dept: "DS",   room: "Block C – Room 223",pos:[12.9336313, 77.6920073] },
  { id: 2, name: " MR.joshua",  dept: "DS",   room: "Block C – Room 223",pos:[12.9336313, 77.6920073] },
  { id: 3,name: "MR.Chandan ",  dept: "DS",   room: "Block C – Room 223",pos:[12.9336313, 77.6920073] },
  { id: 4, name: "MS.Saranya",   dept: "CSE",   room: "Block A – Room 101",pos:[12.9341048, 77.6921029]  },
  { id: 5, name: "DR.Roja ramani",     dept: "CSE",  room: "Block A – Room 101" ,pos:[12.9341048, 77.6921029] },
  { id: 6, name: "Prof. Deepa V",     dept: "CSE", room: "Block C – Room 101" ,pos:[12.9341048, 77.6921029] },
  { id: 7, name: "Dr. Nithya L",      dept: "MATHS", room: "Block C– Room 401",pos:[12.9336313, 77.6920073]  },
];

const EVENTS = [
  { id: 1, title: "Tech Symposium 2025",     time: "Today, 10AM",   location: "Auditorium",            live: true  },
  { id: 2, title: "Placement Drive – TCS",   time: "Today, 2PM",    location: "Seminar Hall, Block A", live: true  },
  { id: 3, title: "Cultural Fest – Horizon", time: "Tomorrow, 9AM", location: "Sports Ground",         live: false },
  { id: 4, title: "IEEE Workshop",           time: "May 18, 11AM",  location: "Block B – Room 301",    live: false },
];

const TYPE_ICONS = {
  all: "🗺️", gate: "🚪", library: "📚", canteen: "🍽️",
  block: "🏫", event: "🎭", sports: "⚽", admin: "🏛️", hostel: "🏠",
};

const NHCE_POS = [12.9318, 77.6908];

// ─── Google Maps Embed URL builders ───────────────────────────────────────────
// NOTE: The Embed API v1 requires a valid API key with Maps Embed API enabled.
// Replace YOUR_GOOGLE_MAPS_API_KEY below with your real key.
// If you don't have one, the fallback (no-key) iframe URL is used instead.
const API_KEY = "YOUR_GOOGLE_MAPS_API_KEY";

function buildDirectionsSrc(originCoords, destPos) {
  if (API_KEY && API_KEY !== "YOUR_GOOGLE_MAPS_API_KEY") {
    return (
      `https://www.google.com/maps/embed/v1/directions` +
      `?key=${API_KEY}` +
      `&origin=${originCoords.lat},${originCoords.lng}` +
      `&destination=${destPos[0]},${destPos[1]}` +
      `&mode=walking`
    );
  }
  // Fallback: open directions in embed without key (limited but works for display)
  return (
    `https://www.google.com/maps?saddr=${originCoords.lat},${originCoords.lng}` +
    `&daddr=${destPos[0]},${destPos[1]}&output=embed`
  );
}

function buildPlaceSrc(destPos) {
  if (API_KEY && API_KEY !== "YOUR_GOOGLE_MAPS_API_KEY") {
    return (
      `https://www.google.com/maps/embed/v1/place` +
      `?key=${API_KEY}` +
      `&q=${destPos[0]},${destPos[1]}`
    );
  }
  return `https://www.google.com/maps?q=${destPos[0]},${destPos[1]}&output=embed`;
}

const DEFAULT_MAP_SRC =
  "https://www.google.com/maps?q=New+Horizon+College+of+Engineering+Bangalore&output=embed";

// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [user,             setUser]             = useState(null);
  const [search,           setSearch]           = useState("");
  const [activeTab,        setActiveTab]        = useState("places");
  const [filterType,       setFilterType]       = useState("all");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [userCoords,       setUserCoords]       = useState(null);
  const [navigating,       setNavigating]       = useState(false);
  const [mapSrc,           setMapSrc]           = useState(DEFAULT_MAP_SRC);

  // Ask for location once on mount
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      ()    => console.warn("Location permission denied")
    );
  }, []);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  // Navigate to any location: show directions inside the map iframe
  const navigateTo = (loc) => {
    setSelectedLocation(loc);
    setNavigating(true);

    const showRoute = (coords) => {
      setMapSrc(buildDirectionsSrc(coords, loc.pos));
    };

    const showPlace = () => {
      setMapSrc(buildPlaceSrc(loc.pos));
    };

    // Try to get fresh coords; fall back to cached; fall back to just showing place
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const fresh = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(fresh);
        showRoute(fresh);
      },
      () => {
        if (userCoords) showRoute(userCoords);
        else showPlace();
      }
    );
  };

  const handleLocationClick = (loc) => {
    if (!loc.pos) {
      alert("Exact coordinates for this location are not yet available.");
      return;
    }
    navigateTo(loc);
  };

  const handleNavigateToNHCE = () => {
    navigateTo({ name: "NHCE Main Gate", pos: NHCE_POS });
  };

  const handleResetMap = () => {
    setSelectedLocation(null);
    setNavigating(false);
    setMapSrc(DEFAULT_MAP_SRC);
  };

  const filteredLocations = LOCATIONS.filter((l) => {
    const matchType   = filterType === "all" || l.type === filterType;
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const filteredTeachers = TEACHERS.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.dept.toLowerCase().includes(search.toLowerCase())
  );

  // ── Login screen ─────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-logo">🧭</div>
          <h1>NHCE Navigator</h1>
          <p>New Horizon College of Engineering</p>
          <p className="login-sub">
            Sign in to explore the campus map, find teachers &amp; live events
          </p>
          <button className="google-btn" onClick={handleLogin}>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  // ── Main app ──────────────────────────────────────────────────────────────────
  return (
    <div className="app">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="sidebar-header">
          <span className="logo">🧭</span>
          <div>
            <div className="brand">NHCE</div>
            <div className="brand-sub">Navigator</div>
          </div>
        </div>

        {/* User */}
        <div className="user-info">
          <img src={user.photoURL} alt="avatar" className="avatar" />
          <div>
            <div className="user-name">{user.displayName?.split(" ")[0]}</div>
            <div className="user-email">{user.email}</div>
          </div>
        </div>

        {/* Search */}
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Search places, teachers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div className="tabs">
          {["places", "teachers", "events"].map((t) => (
            <button
              key={t}
              className={`tab-btn ${activeTab === t ? "active" : ""}`}
              onClick={() => setActiveTab(t)}
            >
              {t === "places" ? "📍 Places" : t === "teachers" ? "👨‍🏫 Teachers" : "🎉 Events"}
            </button>
          ))}
        </div>

        {/* ── Places ── */}
        {activeTab === "places" && (
          <>
            <div className="filter-row">
              {Object.entries(TYPE_ICONS).map(([type, icon]) => (
                <button
                  key={type}
                  className={`filter-chip ${filterType === type ? "active" : ""}`}
                  onClick={() => setFilterType(type)}
                >
                  {icon}
                </button>
              ))}
            </div>

            <div className="list">
              {filteredLocations.map((loc) => (
                <div
                  key={loc.id}
                  className={`list-item ${selectedLocation?.id === loc.id ? "selected" : ""}`}
                  onClick={() => handleLocationClick(loc)}
                >
                  <span className="item-icon">{TYPE_ICONS[loc.type] || "📍"}</span>
                  <div>
                    <div className="item-name">{loc.name}</div>
                    <div className="item-desc">{loc.desc}</div>
                    {selectedLocation?.id === loc.id && navigating && (
                      <div className="item-nav-label">🗺️ Route shown on map</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Teachers ── */}
        {activeTab === "teachers" && (
          <div className="list">
            {filteredTeachers.map((t) => (
              <div key={t.id} className="list-item">
                <span className="item-icon">👨‍🏫</span>
                <div>
                  <div className="item-name">{t.name}</div>
                  <div className="item-desc">{t.dept} · {t.room}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Events ── */}
        {activeTab === "events" && (
          <div className="list">
            {EVENTS.map((ev) => (
              <div key={ev.id} className="list-item">
                <span className="item-icon">🎉</span>
                <div>
                  <div className="item-name">
                    {ev.title}
                    {ev.live && <span className="live-badge">LIVE</span>}
                  </div>
                  <div className="item-desc">{ev.time}</div>
                  <div className="item-desc">📍 {ev.location}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="sidebar-footer">
          {navigating && (
            <button className="reset-btn" onClick={handleResetMap}>
              🔄 Back to Campus View
            </button>
          )}
          <button className="locate-btn" onClick={handleNavigateToNHCE}>
            📍 Navigate to NHCE
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Sign Out
          </button>
        </div>

      </aside>

      {/* MAP PANEL */}
      <main className="map-panel">
        {navigating && selectedLocation && (
          <div className="map-banner">
            {userCoords
              ? `🗺️ Directions → ${selectedLocation.name}`
              : `📍 ${selectedLocation.name} (enable location for turn-by-turn directions)`}
          </div>
        )}
        {/* key={mapSrc} forces iframe to reload whenever the URL changes */}
        <iframe
          key={mapSrc}
          title="NHCE Map"
          src={mapSrc}
          className="google-map"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </main>

    </div>
  );
}