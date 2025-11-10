import React from "react";

function RSVPTable({ attendees }) {
  const sortedAttendees = [...attendees].sort((a, b) =>
    a.full_name.localeCompare(b.full_name)
  );

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          border: "1px solid #ccc",
        }}
      >
        <thead style={{ backgroundColor: "#f5f5f5" }}>
          <tr>
            {Object.keys(sortedAttendees[0] || {}).map((key, i) => (
              <th
                key={i}
                style={{
                  padding: "0.75rem",
                  border: "1px solid #ddd",
                  textAlign: "left",
                  textTransform: "capitalize",
                }}
              >
                {key.replaceAll("_", " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedAttendees.map((person, idx) => (
            <tr key={idx}>
              {Object.entries(person).map(([key, val], i) => (
                <td
                  key={i}
                  style={{
                    padding: "0.75rem",
                    border: "1px solid #eee",
                    backgroundColor: idx % 2 === 0 ? "#fafafa" : "#fff",
                  }}
                >
                  {key.toLowerCase() === "status" ? (
                    <span
                      style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: "6px",
                        fontWeight: "bold",
                        color:
                          val === "Confirmed"
                            ? "#0f5132"
                            : val === "Pending"
                            ? "#664d03"
                            : val === "Cancelled"
                            ? "#842029"
                            : "#333",
                        backgroundColor:
                          val === "Confirmed"
                            ? "#d1e7dd"
                            : val === "Pending"
                            ? "#fff3cd"
                            : val === "Cancelled"
                            ? "#f8d7da"
                            : "#e9ecef",
                      }}
                    >
                      {val || "—"}
                    </span>
                  ) : (
                    val || "—"
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RSVPTable;

