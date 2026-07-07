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
  const [swipeX, setSwipeX] = useState({ id: null, startX: 0, offset: 0 });

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
            className="dropdown-header notification-center-header"
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }} className="header-title-section">
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
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }} className="header-actions-section">
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
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
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
              filteredNotifications.map((notif) => {
                const notifTitle = notif.title || notif.type || "Notification Alert";
                const notifMessage = notif.message || notif.description || "No notification details provided.";
                const notifSource = notif.businessName || "System Cluster";
                
                let severityColor = "var(--primary)";
                let severityBg = "rgba(99, 102, 241, 0.1)";
                let severityText = "Info";
                if (notif.severity === "high" || notif.severity === "critical") {
                  severityColor = "var(--color-red)";
                  severityBg = "rgba(239, 68, 68, 0.1)";
                  severityText = "Critical";
                } else if (notif.severity === "medium" || notif.severity === "warning") {
                  severityColor = "var(--color-amber)";
                  severityBg = "rgba(245, 158, 11, 0.1)";
                  severityText = "Warning";
                }

                return (
                  <div
                    key={notif.id}
                    className={`notif-dropdown-item notif-severity-${notif.severity} ${!notif.isRead ? "unread" : ""}`}
                    onTouchStart={(e) => {
                      setSwipeX({ id: notif.id, startX: e.touches[0].clientX, offset: 0 });
                    }}
                    onTouchMove={(e) => {
                      if (swipeX.id === notif.id) {
                        const diffX = e.touches[0].clientX - swipeX.startX;
                        if (diffX < 0) {
                          setSwipeX((prev) => ({ ...prev, offset: Math.max(-120, diffX) }));
                        }
                      }
                    }}
                    onTouchEnd={() => {
                      if (swipeX.id === notif.id) {
                        if (swipeX.offset < -80) {
                          onDismissNotification(notif.id);
                        }
                        setSwipeX({ id: null, startX: 0, offset: 0 });
                      }
                    }}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "10px",
                      margin: "8px 12px",
                      border: "1px solid var(--border-color)",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      backgroundColor: notif.isRead ? "var(--bg-surface)" : "var(--primary-light)",
                      boxShadow: "var(--shadow-sm)",
                      transform: swipeX.id === notif.id ? `translateX(${swipeX.offset}px)` : "none",
                      transition: swipeX.id === null ? "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)" : "none",
                      cursor: "grab",
                      position: "relative"
                    }}
                  >
                    {/* Severity Icon Circle */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: severityBg,
                      color: severityColor,
                      flexShrink: 0,
                      marginTop: "2px"
                    }}>
                      {getSeverityIcon(notif.severity)}
                    </div>

                    {/* Content Column */}
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
                      {/* Title & Time */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "6px" }}>
                        <span style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--text-primary)", overflowWrap: "anywhere", wordBreak: "break-word", flex: 1 }}>
                          {notifTitle}
                        </span>
                        <span style={{ fontSize: "9.5px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap", marginTop: "2px" }}>
                          {notif.timestamp}
                        </span>
                      </div>

                      {/* Severity & Source metadata pills */}
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", margin: "2px 0" }}>
                        <span style={{
                          fontSize: "9px",
                          fontWeight: "700",
                          color: severityColor,
                          backgroundColor: severityBg,
                          padding: "1px 6px",
                          borderRadius: "4px",
                          textTransform: "uppercase"
                        }}>
                          {severityText}
                        </span>
                        <span style={{ fontSize: "10.5px", color: "var(--text-muted)", fontWeight: "500" }}>
                          • Source: <span style={{ color: "var(--text-secondary)", fontWeight: "600" }}>{notifSource}</span>
                        </span>
                      </div>

                      {/* Description Message Body */}
                      <p style={{
                        margin: "4px 0 0 0",
                        fontSize: "11.5px",
                        color: "var(--text-secondary)",
                        lineHeight: "1.4",
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                        whiteSpace: "normal"
                      }}>
                        {notifMessage}
                      </p>

                      {/* Actions Footer */}
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px", borderTop: "1px solid var(--border-color)", paddingTop: "8px" }}>
                        {!notif.isRead && (
                          <button
                            onClick={() => onMarkRead(notif.id)}
                            title="Mark as read"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              background: "rgba(16, 185, 129, 0.08)",
                              border: "1px solid rgba(16, 185, 129, 0.2)",
                              borderRadius: "6px",
                              padding: "4px 8px",
                              fontSize: "11px",
                              fontWeight: "600",
                              color: "var(--color-green)",
                              cursor: "pointer",
                              transition: "background 0.2s"
                            }}
                          >
                            <Check size={12} style={{ strokeWidth: 3 }} /> Mark Read
                          </button>
                        )}
                        <button
                          onClick={() => onDismissNotification(notif.id)}
                          title="Dismiss alert"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            background: "rgba(239, 68, 68, 0.08)",
                            border: "1px solid rgba(239, 68, 68, 0.2)",
                            borderRadius: "6px",
                            padding: "4px 8px",
                            fontSize: "11px",
                            fontWeight: "600",
                            color: "var(--color-red)",
                            cursor: "pointer",
                            transition: "background 0.2s"
                          }}
                        >
                          <X size={12} style={{ strokeWidth: 3 }} /> Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
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
