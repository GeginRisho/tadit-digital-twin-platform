import React, { useState, useRef, useEffect } from "react";
import { Bell, Search, Trash2, Check, X, Flame, AlertTriangle, Info, BellOff } from "lucide-react";

export default function NotificationCenter({
  notifications = [],
  onMarkRead,
  onMarkAllRead,
  onClearAll,
  onDismissNotification
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // all, critical, warning, info
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Filter & Search notifications
  const filteredNotifications = notifications.filter(n => {
    // 1. Filter by severity level
    if (activeFilter === "critical" && n.severity !== "high") return false;
    if (activeFilter === "warning" && n.severity !== "medium") return false;
    if (activeFilter === "info" && n.severity !== "low" && n.severity !== "info") return false;

    // 2. Filter by search text
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      const textMatch = n.description?.toLowerCase().includes(query);
      const titleMatch = n.type?.toLowerCase().includes(query);
      const businessMatch = n.businessName?.toLowerCase().includes(query);
      return textMatch || titleMatch || businessMatch;
    }
    return true;
  });

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "high":
        return <Flame size={14} style={{ color: "var(--color-red)" }} className="pulse-red" />;
      case "medium":
        return <AlertTriangle size={14} style={{ color: "var(--color-amber)" }} />;
      default:
        return <Info size={14} style={{ color: "var(--primary)" }} />;
    }
  };

  const getSeverityClass = (severity) => {
    switch (severity) {
      case "high":
        return "notif-critical";
      case "medium":
        return "notif-warning";
      default:
        return "notif-info";
    }
  };

  return (
    <div className="notification-center-container" ref={dropdownRef} style={{ position: "relative" }}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`nav-bell-trigger ${isOpen ? "active" : ""}`}
        aria-label={`Open alerts feed. ${unreadCount} unread items`}
        aria-expanded={isOpen}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          position: "relative",
          padding: "8px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-secondary)",
          transition: "background 0.2s"
        }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            className="bell-badge pulse-red"
            style={{
              position: "absolute",
              top: "4px",
              right: "4px",
              backgroundColor: "var(--color-red)",
              color: "var(--bg-primary)",
              fontSize: "9px",
              fontWeight: "700",
              borderRadius: "50%",
              width: "16px",
              height: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid var(--bg-surface)"
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="notification-dropdown"
          role="dialog"
          aria-label="Alert Feed Panel"
          style={{
            position: "absolute",
            top: "44px",
            right: "0",
            width: "360px",
            maxHeight: "500px",
            backgroundColor: "var(--bg-surface)",
            borderRadius: "12px",
            boxShadow: "var(--shadow-lg)",
            border: "1px solid var(--border-color)",
            zIndex: 999,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}
        >
          {/* Header */}
          <div
            className="dropdown-header"
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>Alert Center</h3>
              {unreadCount > 0 && (
                <span
                  style={{
                    backgroundColor: "var(--primary-light)",
                    color: "var(--primary)",
                    fontSize: "11px",
                    fontWeight: "600",
                    padding: "2px 8px",
                    borderRadius: "12px"
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllRead}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--primary)",
                    fontSize: "12px",
                    cursor: "pointer",
                    padding: 0,
                    fontWeight: "600"
                  }}
                >
                  Mark read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={onClearAll}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    fontSize: "12px",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <Trash2 size={12} /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Search bar & filters */}
          <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "8px", backgroundColor: "var(--bg-main)" }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Search
                size={13}
                style={{ position: "absolute", left: "10px", color: "var(--text-muted)" }}
              />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 8px 6px 30px",
                  fontSize: "12px",
                  borderRadius: "6px"
                }}
              />
              {searchQuery && (
                <X
                  size={12}
                  onClick={() => setSearchQuery("")}
                  style={{ position: "absolute", right: "10px", color: "var(--text-muted)", cursor: "pointer" }}
                />
              )}
            </div>

            {/* Filter pills */}
            <div style={{ display: "flex", gap: "4px" }}>
              {["all", "critical", "warning", "info"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  style={{
                    border: "none",
                    backgroundColor: activeFilter === filter ? "var(--border-hover)" : "transparent",
                    color: activeFilter === filter ? "var(--text-primary)" : "var(--text-secondary)",
                    fontSize: "11px",
                    fontWeight: "600",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    textTransform: "capitalize"
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div
            className="notifications-scroll-area"
            style={{
              flex: 1,
              overflowY: "auto",
              maxHeight: "300px",
              padding: "4px 0"
            }}
          >
            {filteredNotifications.length === 0 ? (
              <div style={{ padding: "30px 16px", textAlign: "center", color: "var(--text-muted)" }}>
                <BellOff size={24} style={{ margin: "0 auto 8px", opacity: 0.6 }} />
                <p style={{ margin: 0, fontSize: "13px" }}>No matching notifications.</p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notif-dropdown-item ${getSeverityClass(notif.severity)} ${!notif.isRead ? "unread" : ""}`}
                  style={{
                    padding: "10px 16px",
                    borderBottom: "1px solid var(--border-color)",
                    display: "flex",
                    gap: "10px",
                    backgroundColor: notif.isRead ? "transparent" : "var(--primary-light)",
                    transition: "background-color 0.2s",
                    position: "relative"
                  }}
                >
                  <div style={{ marginTop: "3px" }}>{getSeverityIcon(notif.severity)}</div>
                  <div style={{ flex: 1, paddingRight: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2px" }}>
                      <span style={{ fontSize: "12.5px", fontWeight: "600" }}>{notif.type}</span>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                        {notif.timestamp}
                      </span>
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--primary)", display: "block", marginBottom: "2px" }}>
                      {notif.businessName}
                    </span>
                    <p style={{ margin: 0, fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                      {notif.description}
                    </p>
                  </div>

                  {/* Actions (Mark read / dismiss) */}
                  <div
                    className="notif-actions"
                    style={{
                      position: "absolute",
                      right: "12px",
                      bottom: "10px",
                      display: "flex",
                      gap: "4px"
                    }}
                  >
                    {!notif.isRead && (
                      <button
                        onClick={() => onMarkRead(notif.id)}
                        title="Mark as read"
                        style={{
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border-color)",
                          borderRadius: "4px",
                          padding: "2px",
                          cursor: "pointer",
                          color: "var(--color-green)",
                          display: "flex"
                        }}
                      >
                        <Check size={10} />
                      </button>
                    )}
                    <button
                      onClick={() => onDismissNotification(notif.id)}
                      title="Dismiss alert"
                      style={{
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "4px",
                        padding: "2px",
                        cursor: "pointer",
                        color: "var(--text-muted)",
                        display: "flex"
                      }}
                    >
                      <X size={10} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            className="dropdown-footer"
            style={{
              padding: "10px 16px",
              backgroundColor: "var(--bg-main)",
              borderTop: "1px solid var(--border-color)",
              textAlign: "center",
              fontSize: "12px",
              color: "var(--text-muted)"
            }}
          >
            Displaying {filteredNotifications.length} of {notifications.length} incidents
          </div>
        </div>
      )}
    </div>
  );
}
