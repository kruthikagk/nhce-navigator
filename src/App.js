import React, { useState, useEffect } from "react";
import "./App.css";

import { auth, provider } from "./firebase";
import { signInWithPopup, signOut } from "firebase/auth";

const LOCATIONS = [
  { id: 1, name: "Main Gate", type: "gate", desc: "Main entrance of NHCE" },
{
  id: 2,
  name: "Library",
  type: "library",
  desc: "Library – 24/7",
  pos: [12.933571979295008, 77.69245395658271]
},
  { id: 3, name: "Canteen", type: "canteen", desc: "Main Canteen – Breakfast, Lunch & Snacks", },
  { id: 4, name: "Block A (CSE/ISE)", type: "block", desc: "CS & IS Department Block" },
  { id: 5, name: "Block B (ECE/EEE)", type: "block", desc: "Electronics Department Block" },
  { id: 6, name: "Block C (MECH/CIVIL)", type: "block", desc: "Mechanical & Civil Block" },
  { id: 7, name: "Auditorium", type: "event", desc: "Main Auditorium – Events & Seminars" },
  { id: 8, name:"Admin Block", type: "admin", desc: "Principal & Admin Office" },
  { id: 10, name: "Hostel", type: "hostel", desc: "Boys & Girls Hostel" },
 
  { id: 9,
  name:"NHCE Basketball Court",
      
  desc: "sports",
  pos: [12.933560215566194, 77.69233526883649]
},
];

const TEACHERS = [
  { id: 1, name: "Dr. Ramesh Kumar", dept: "CSE", room: "Block A – Room 204" },
  { id: 2, name: "Prof. Anitha S", dept: "ISE", room: "Block A – Room 108" },
  { id: 3, name: "Dr. Suresh M", dept: "ECE", room: "Block B – Room 301" },
  { id: 4, name: "Prof. Kavitha R", dept: "EEE", room: "Block B – Room 205" },
  { id: 5, name: "Dr. Prakash N", dept: "MECH", room: "Block C – Room 102" },
  { id: 6, name: "Prof. Deepa V", dept: "CIVIL", room: "Block C – Room 203" },
  { id: 7, name: "Dr. Nithya L", dept: "MATHS", room: "Admin Block – Room 010" },
];

const EVENTS = [
  { id: 1, title: "Tech Symposium 2025", time: "Today, 10AM", location: "Auditorium", live: true },
  { id: 2, title: "Placement Drive – TCS", time: "Today, 2PM", location: "Seminar Hall, Block A", live: true },
  { id: 3, title: "Cultural Fest – Horizon", time: "Tomorrow, 9AM", location: "Sports Ground", live: false },
  { id: 4, title: "IEEE Workshop", time: "May 18, 11AM", location: "Block B – Room 301", live: false },
];

const TYPE_ICONS = {
  all: "🗺️",
  gate: "🚪",
  library: "📚",
  canteen: "🍽️",
  block: "🏫",
  event: "🎭",
  sports: "⚽",
  admin: "🏛️",
  hostel: "🏠",
};

export default function App() {

  const [user, setUser] = useState(null);

  const [search, setSearch] = useState("");

  const [activeTab, setActiveTab] = useState("places");

  const [filterType, setFilterType] = useState("all");

  const [selectedLocation, setSelectedLocation] = useState(null);

  const [liveLocation, setLiveLocation] = useState("");

  // LIVE LOCATION
  useEffect(() => {

    navigator.geolocation.getCurrentPosition(
      (position) => {

        setLiveLocation(
          `${position.coords.latitude},${position.coords.longitude}`
        );
      }
    );

  }, []);

  // LOGIN
  const handleLogin = async () => {

    try {

      const result = await signInWithPopup(
        auth,
        provider
      );

      setUser(result.user);

    } catch (e) {

      console.error(e);
    }
  };

  // LOGOUT
  const handleLogout = async () => {

    await signOut(auth);

    setUser(null);
  };

  // FILTERS
  const filteredLocations = LOCATIONS.filter((l) => {

    const matchType =
      filterType === "all" ||
      l.type === filterType;

    const matchSearch =
      l.name
        .toLowerCase()
        .includes(search.toLowerCase());

    return matchType && matchSearch;
  });

  const filteredTeachers = TEACHERS.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.dept.toLowerCase().includes(search.toLowerCase())
  );

  // LOGIN PAGE
  if (!user) {

    return (

      <div className="login-screen">

        <div className="login-card">

          <div className="login-logo">🧭</div>

          <h1>NHCE Navigator</h1>

          <p>New Horizon College of Engineering</p>

          <p className="login-sub">
            Sign in to explore the campus map,
            find teachers & live events
          </p>

          <button
            className="google-btn"
            onClick={handleLogin}
          >
            Sign in with Google
          </button>

        </div>

      </div>
    );
  }

  return (

    <div className="app">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="sidebar-header">

          <span className="logo">🧭</span>

          <div>

            <div className="brand">
              NHCE
            </div>

            <div className="brand-sub">
              Navigator
            </div>

          </div>

        </div>

        {/* USER */}

        <div className="user-info">

          <img
            src={user.photoURL}
            alt="avatar"
            className="avatar"
          />

          <div>

            <div className="user-name">
              {user.displayName?.split(" ")[0]}
            </div>

            <div className="user-email">
              {user.email}
            </div>

          </div>

        </div>

        {/* SEARCH */}

        <div className="search-wrap">

          <span className="search-icon">
            🔍
          </span>

          <input
            className="search-input"
            placeholder="Search places, teachers..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

        {/* TABS */}

        <div className="tabs">

          {["places", "teachers", "events"].map((t) => (

            <button
              key={t}
              className={`tab-btn ${
                activeTab === t ? "active" : ""
              }`}
              onClick={() => setActiveTab(t)}
            >

              {t === "places"
                ? "📍 Places"
                : t === "teachers"
                ? "👨‍🏫 Teachers"
                : "🎉 Events"}

            </button>

          ))}

        </div>

        {/* PLACES */}

        {activeTab === "places" && (

          <>

            <div className="filter-row">

              {Object.entries(TYPE_ICONS).map(
                ([type, icon]) => (

                  <button
                    key={type}
                    className={`filter-chip ${
                      filterType === type
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setFilterType(type)
                    }
                  >
                    {icon}
                  </button>

                )
              )}

            </div>

            <div className="list">

              {filteredLocations.map((loc) => (

                <div
                  key={loc.id}
                  className={`list-item ${
                    selectedLocation?.id === loc.id
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedLocation(loc)
                  }
                >

                  <span className="item-icon">
                    {TYPE_ICONS[loc.type]}
                  </span>

                  <div>

                    <div className="item-name">
                      {loc.name}
                    </div>

                    <div className="item-desc">
                      {loc.desc}
                    </div>

                  </div>

                </div>

              ))}

            </div>

          </>

        )}

        {/* TEACHERS */}

        {activeTab === "teachers" && (

          <div className="list">

            {filteredTeachers.map((t) => (

              <div
                key={t.id}
                className="list-item"
              >

                <span className="item-icon">
                  👨‍🏫
                </span>

                <div>

                  <div className="item-name">
                    {t.name}
                  </div>

                  <div className="item-desc">
                    {t.dept} · {t.room}
                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

        {/* EVENTS */}

        {activeTab === "events" && (

          <div className="list">

            {EVENTS.map((ev) => (

              <div
                key={ev.id}
                className="list-item"
              >

                <span className="item-icon">
                  🎉
                </span>

                <div>

                  <div className="item-name">

                    {ev.title}

                    {ev.live && (
                      <span className="live-badge">
                        LIVE
                      </span>
                    )}

                  </div>

                  <div className="item-desc">
                    {ev.time}
                  </div>

                  <div className="item-desc">
                    📍 {ev.location}
                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

        {/* FOOTER */}

        <div className="sidebar-footer">

          <button
            className="locate-btn"
            onClick={() => {

              if (!liveLocation) return;

              window.open(
                `https://www.google.com/maps/dir/${liveLocation}/New+Horizon+College+of+Engineering`
              );
            }}
          >
            📍 Navigate to NHCE
          </button>

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            Sign Out
          </button>

        </div>

      </aside>

      {/* GOOGLE MAP */}

      <main className="map-panel">

        <div className="google-map">

          <iframe
            title="NHCE Map"

            src={
              selectedLocation
                ? `https://www.google.com/maps?q=${selectedLocation.name}+New+Horizon+College+of+Engineering+Bangalore&output=embed`
                : `https://www.google.com/maps?q=New+Horizon+College+of+Engineering+Bangalore&output=embed`
            }

            width="100%"
            height="100%"

            style={{ border: 0 }}

            allowFullScreen=""

            loading="lazy"
          ></iframe>

        </div>

      </main>

    </div>
  );
}