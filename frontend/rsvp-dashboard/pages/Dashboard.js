import React, { useEffect, useState } from "react";
import RSVPTable from "../components/RSVPTable";


export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🟢 Fetch events on load
  useEffect(() => {
    fetch("http://localhost:8000/api/events.php")
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch((err) => console.error("Error fetching events:", err));
  }, []);

  // 🟣 Fetch RSVPs when event changes
  useEffect(() => {
    if (!selectedEvent) return;
    setLoading(true);
    fetch(`http://localhost:8000/api/rsvp.php?event_id=${selectedEvent}`)
      .then((res) => res.json())
      .then((data) => {
        setAttendees(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching attendees:", err);
        setLoading(false);
      });
  }, [selectedEvent]);

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ marginBottom: "1.5rem", color: "#333" }}>
        RSVP Management Dashboard
      </h1>

      {/* Event Dropdown */}
      <div style={{ marginBottom: "1.5rem" }}>
        <label htmlFor="event-select" style={{ fontWeight: "bold" }}>
          Select Event:
        </label>
        <select
          id="event-select"
          onChange={(e) => setSelectedEvent(e.target.value)}
          value={selectedEvent}
          style={{
            marginLeft: "1rem",
            padding: "0.5rem",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        >
          <option value="">-- Choose an event --</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title}
            </option>
          ))}
        </select>
      </div>

      {/* Attendee Section */}
      <div>
        {loading ? (
          <p>Loading attendees...</p>
        ) : attendees.length > 0 ? (
          <>
            <p
              style={{
                fontWeight: "bold",
                marginBottom: "1rem",
                color: "#555",
              }}
            >
              Total Registered Attendees: {attendees.length}
            </p>
            <RSVPTable attendees={attendees} />
          </>
        ) : (
          selectedEvent && (
            <p style={{ color: "#777" }}>No one has registered yet.</p>
          )
        )}
      </div>
    </div>
  );
}
