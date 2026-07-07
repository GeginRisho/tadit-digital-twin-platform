// BusinessProfile.jsx - Sliding Side Drawer containing detailed telemetry, Google Maps overlay, competitor analysis, and AI indicators.
import React, { useState, useEffect } from "react";
import {
  User,
  TrendingUp,
  Star,
  X,
  ExternalLink,
  MapPin,
  Clock,
  Compass,
  ThumbsUp
} from "lucide-react";
import EmptyState from "./common/EmptyState";

export default function BusinessProfile({
  business,
  onClose,
  isOpen,
  selectedDistrict,
  onInjectAnomaly,
  alerts = []
}) {
  const getAIRecommendations = (biz, allAlerts) => {
    const activeAlerts = allAlerts.filter(a => a.businessId === biz.id);
    if (activeAlerts.length > 0) {
      return activeAlerts.map(alert => ({
        type: "incident",
        title: `Active Alert: ${alert.type}`,
        priority: alert.priority,
        text: alert.recommendation,
        reason: alert.reason
      }));
    }
    
    const cat = biz.category;
    const items = [];
    
    if (cat === "IT Companies") {
      items.push({
        type: "proactive",
        title: "Proactive Edge CDN Optimization",
        priority: "ADVISORY",
        text: "Enable regional edge routing and static CDN caching to reduce client virtual DOM handshakes latency by 35ms."
      });
      items.push({
        type: "proactive",
        title: "K8s Microservice Scaling Insights",
        priority: "ADVISORY",
        text: "Scale down GraphQL gateway pod replicas by 30% between 12:00 AM and 05:00 AM (non-peak) to reduce idle cloud expenditure."
      });
    } else if (cat === "Hospitals" || cat === "Healthcare") {
      items.push({
        type: "proactive",
        title: "ICU IoT Monitor Calibration Check",
        priority: "ADVISORY",
        text: "Calibrate bedside IoT wireless telemetry monitors weekly to prevent noise spike alerts from corrupting spark sliding windows."
      });
      items.push({
        type: "proactive",
        title: "Predictive Ward Staff Scheduling",
        priority: "ADVISORY",
        text: "Weekend occupancy is forecasted to rise by 15%. Recommend scaling nursing shift slots by 10% to preserve quality indices."
      });
    } else if (cat === "Hotels" || cat === "Restaurants") {
      items.push({
        type: "proactive",
        title: "Weekend Demand Pricing Insights",
        priority: "ADVISORY",
        text: "Promote seasonal menu bundles on review portals during Friday-Sunday peak hours to boost average transaction value by 12%."
      });
      items.push({
        type: "proactive",
        title: "Local Supply Buffer Adjustment",
        priority: "ADVISORY",
        text: "Increase fresh ingredient procurement volumes by 20% ahead of next week's district festival demand spikes."
      });
    } else if (cat === "Manufacturing") {
      items.push({
        type: "proactive",
        title: "Preventive Conveyor Mechanical Check",
        priority: "ADVISORY",
        text: "Vibration sensors on line 3 indicate minor mechanical drift. Schedule conveyor lubrication to avoid safety shutdowns."
      });
      items.push({
        type: "proactive",
        title: "IoT Node Battery Alert",
        priority: "ADVISORY",
        text: "Vibration sensor node M-4 telemetry reporting low voltage (2.6V). Schedule routine battery swap before telemetry drop."
      });
    } else if (cat === "Textile Industries") {
      items.push({
        type: "proactive",
        title: "Humidity Tuning Guidelines",
        priority: "ADVISORY",
        text: "Keep loom hall relative humidity steady at 65% to reduce organic cotton thread friction and breakage rates by 8%."
      });
      items.push({
        type: "proactive",
        title: "Raw Silk Batch Tracking Log",
        priority: "ADVISORY",
        text: "Sync raw yarn warehouse temperature registers with digital twins to verify compliance audits."
      });
    } else if (cat === "Automobile") {
      items.push({
        type: "proactive",
        title: "Paint-Shop Thermal Offset Sync",
        priority: "ADVISORY",
        text: "Diagnostic scanning of paint-shop drying ovens reveals a +2°C offset. Adjust controller coefficients to match standard twin models."
      });
      items.push({
        type: "proactive",
        title: "Robotic Assembly Torque Diagnostic",
        priority: "ADVISORY",
        text: "Robot Arm R-12 joints report normal torque metrics (45 Nm). Next diagnostics due in 45 operational hours."
      });
    } else if (cat === "Retail") {
      items.push({
        type: "proactive",
        title: "Dynamic Promo Campaign",
        priority: "ADVISORY",
        text: "Launch weekend clearance app notifications on low-movement inventory items to speed up inventory turns."
      });
      items.push({
        type: "proactive",
        title: "Evening Footfall Staffing Match",
        priority: "ADVISORY",
        text: "Customer checkout queues peak between 6:00 PM - 8:30 PM. Add 1 additional cashier station to keep wait times under 3 minutes."
      });
    } else if (cat === "Logistics") {
      items.push({
        type: "proactive",
        title: "Carrier Route Geo-Fencing Advice",
        priority: "ADVISORY",
        text: "Re-route Chennai-bound cargo trucks via outer bypass routes to save 45 minutes of transit delays."
      });
      items.push({
        type: "proactive",
        title: "Cold Chain Temperature Validation",
        priority: "ADVISORY",
        text: "Refrigerated transport fleet sensor diagnostics show normal range (2.4°C). Alert system remains on standby."
      });
    } else {
      items.push({
        type: "proactive",
        title: "TLS Port Security Audit",
        priority: "ADVISORY",
        text: "Secure all incoming REST telemetry connections on port 443 with TLS 1.3 to meet compliance regulations."
      });
      items.push({
        type: "proactive",
        title: "Operational Cost Benchmarks",
        priority: "ADVISORY",
        text: "Review competitor marketing spend and adjust regional advertising bid margins to sustain market shares."
      });
    }
    
    return items;
  };

  const [activeTab, setActiveTab] = useState("overview"); // overview, analytics, timeline, social

  // Keyboard shortcut listener to close the drawer with ESC key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!business) {
    return (
      <div className={`drawer-container ${isOpen ? "open" : ""}`} style={{ maxWidth: "580px" }}>
        <div className="drawer-header">
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Digital Twin Profile</h2>
          <button onClick={onClose} className="btn-playback" style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
            <X size={20} />
          </button>
        </div>
        <div className="drawer-body" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <EmptyState
            title={selectedDistrict ? `No Selection in ${selectedDistrict}` : "Select a Business Twin"}
            description={selectedDistrict
              ? `There are no active twin data streams currently highlighted in the ${selectedDistrict} district. Select one of the business dots on the map to review telemetry.`
              : "Click any interactive business cluster dot on the GIS Map or pick a corporate record in the twin directory to sync its detailed SaaS telemetry drawer."
            }
          />
        </div>
      </div>
    );
  }

  // Calculate dynamic stats
  const baseRev = business.baseRevenue || 210;
  const currentRevenue = Math.round(baseRev * (business.currentHealth / 100));
  const predictedRevenue = Math.round(currentRevenue * (business.trend === "up" ? 1.12 : business.trend === "down" ? 0.88 : 1.01));
  const estimatedCustomers = Math.round(business.currentHealth * 14.5 * (business.trend === "up" ? 1.08 : 1.0));

  // Determine avatar background color based on category
  const categoryColors = {
    "IT Companies": "#3b82f6",
    "Hospitals": "#10b981",
    "Hotels": "#a855f7",
    "Restaurants": "#f97316",
    "Manufacturing": "#4b5563",
    "Textile Industries": "#ec4899",
    "Automobile": "#14b8a6",
    "Retail": "#eab308",
    "Logistics": "#06b6d4"
  };
  const logoColor = categoryColors[business.category] || "#6366f1";

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`drawer-backdrop ${isOpen ? "open" : ""}`} 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide Drawer Panel */}
      <div
        className={`drawer-container ${isOpen ? "open" : ""}`}
        role="dialog"
        aria-label={`${business.name} detailed profile`}
      >
        {/* Header */}
        <div className="drawer-header" style={{ borderBottom: "1px solid var(--border-color)", padding: "16px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              backgroundColor: logoColor,
              color: "var(--bg-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "800",
              fontSize: "18px",
              fontFamily: "var(--font-display)"
            }}>
              {business.name.charAt(0)}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "16.5px", fontWeight: "700", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>{business.name}</span>
                {business.riskLevel === "high" && (
                  <span style={{ fontSize: "9px", backgroundColor: "rgba(239, 68, 68, 0.15)", color: "var(--color-red)", padding: "2px 6px", borderRadius: "4px" }}>ANOMALY</span>
                )}
              </h2>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                <MapPin size={11} /> {business.district} District | PIN {business.pincode}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Details Drawer"
            className="btn-playback"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-secondary)",
              padding: "6px",
              borderRadius: "50%",
              display: "flex"
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selection */}
        <div style={{ display: "flex", overflowX: "auto", whiteSpace: "nowrap", borderBottom: "1px solid var(--border-color)", backgroundColor: "var(--bg-surface)", padding: "0 16px" }}>
          {[
            { id: "overview", label: "Overview" },
            { id: "analytics", label: "Analytics & Predict" },
            { id: "timeline", label: "History Log" },
            { id: "social", label: "Reviews & Feeds" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                border: "none",
                background: "none",
                padding: "12px 16px",
                fontSize: "12.5px",
                fontWeight: "600",
                color: activeTab === tab.id ? "var(--primary)" : "var(--text-secondary)",
                borderBottom: activeTab === tab.id ? "2.5px solid var(--primary)" : "2.5px solid transparent",
                cursor: "pointer",
                transition: "all 0.2s",
                flexShrink: 0
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Body */}
        <div className="drawer-body" style={{ padding: "20px" }}>
          
          {/* Tab: Overview */}
          {activeTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Photo Gallery Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "8px", borderRadius: "10px", overflow: "hidden", height: "130px" }}>
                <img src={business.gallery[0]} alt="HQ Facade" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <img src={business.gallery[1]} alt="Workspace" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <img src={business.gallery[2]} alt="Internal Server Room" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>

              {/* General details grid */}
              <div className="card" style={{ padding: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <span style={{ fontSize: "10.5px", color: "var(--text-muted)", display: "block" }}>Company Owner</span>
                  <span style={{ fontSize: "13px", fontWeight: "600" }}><User size={12} style={{ display: "inline", marginRight: "4px" }} />{business.owner}</span>
                </div>
                <div>
                  <span style={{ fontSize: "10.5px", color: "var(--text-muted)", display: "block" }}>Business Category</span>
                  <span style={{ fontSize: "13px", fontWeight: "600" }}><Compass size={12} style={{ display: "inline", marginRight: "4px" }} />{business.category}</span>
                </div>
                <div>
                  <span style={{ fontSize: "10.5px", color: "var(--text-muted)", display: "block" }}>GST Number (compliance)</span>
                  <span style={{ fontSize: "13px", fontWeight: "600", fontFamily: "var(--font-mono)" }}>{business.gstNumber}</span>
                </div>
                <div>
                  <span style={{ fontSize: "10.5px", color: "var(--text-muted)", display: "block" }}>Reg Registration No</span>
                  <span style={{ fontSize: "13px", fontWeight: "600", fontFamily: "var(--font-mono)" }}>{business.registrationNo}</span>
                </div>
                <div>
                  <span style={{ fontSize: "10.5px", color: "var(--text-muted)", display: "block" }}>Phone Contact</span>
                  <span style={{ fontSize: "13px", fontWeight: "600" }}>{business.phone || "+91 94440 12345"}</span>
                </div>
                <div>
                  <span style={{ fontSize: "10.5px", color: "var(--text-muted)", display: "block" }}>Email Address</span>
                  <span style={{ fontSize: "13px", fontWeight: "600", wordBreak: "break-all" }}>{business.email || "contact@twin.com"}</span>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <span style={{ fontSize: "10.5px", color: "var(--text-muted)", display: "block" }}>Physical Address</span>
                  <span style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-secondary)" }}>{business.address}</span>
                </div>
              </div>

              {/* Core Telemetry Health Gauge */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "16px" }}>
                <div className="card" style={{ padding: "16px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700" }}>AI Health Score</span>
                  <div style={{ position: "relative", width: "80px", height: "80px", margin: "10px 0" }}>
                    {/* Ring progress */}
                    <svg width="80" height="80" viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)" }}>
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--bg-main)" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke={business.currentHealth >= 85 ? "var(--color-green)" : business.currentHealth >= 75 ? "var(--color-amber)" : "var(--color-red)"} strokeWidth="3"
                        strokeDasharray={`${business.currentHealth} ${100 - business.currentHealth}`} />
                    </svg>
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: "18px", fontWeight: "800" }}>
                      {business.currentHealth}%
                    </div>
                  </div>
                  <span style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    color: business.riskLevel === "high" ? "var(--color-red)" : "var(--color-green)",
                    backgroundColor: business.riskLevel === "high" ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.12)",
                    padding: "3px 8px",
                    borderRadius: "4px"
                  }}>
                    {business.riskLevel.toUpperCase()} RISK
                  </span>
                </div>

                <div className="card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px", justifyContent: "center" }}>
                  <div>
                    <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>Operational Schedule</span>
                    <span style={{ fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                      <Clock size={12} style={{ color: "var(--primary)" }} /> {business.openingHours}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>Review Metrics</span>
                    <span style={{ fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                      <Star size={12} fill="var(--color-amber)" stroke="var(--color-amber)" />
                      <span>{business.currentRating} / 5.0 ({business.reviews.length} Audited Logs)</span>
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>Sentiment NLP Positive</span>
                    <span style={{ fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                      <ThumbsUp size={12} style={{ color: "var(--color-green)" }} />
                      <span>{(business.sentimentScore * 100).toFixed(0)}% Satisfactory</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Recommendations Card */}
              <div className="card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                  ✨ AI Digital Twin Recommendations
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {getAIRecommendations(business, alerts).map((rec, rIdx) => {
                    const isIncident = rec.type === "incident";
                    const bg = isIncident ? "rgba(239, 68, 68, 0.1)" : "var(--primary-light)";
                    const border = isIncident ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid var(--border-color)";
                    const titleColor = isIncident ? "var(--color-red)" : "var(--primary)";
                    
                    return (
                      <div key={rIdx} style={{ padding: "10px", borderRadius: "8px", backgroundColor: bg, border }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <strong style={{ fontSize: "12px", color: titleColor }}>{rec.title}</strong>
                          <span style={{ 
                            fontSize: "9px", 
                            fontWeight: "700", 
                            backgroundColor: isIncident ? "var(--color-red)" : "var(--primary)", 
                            color: "white", 
                            padding: "1px 4px", 
                            borderRadius: "3px" 
                          }}>
                            {rec.priority}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: "11.5px", lineHeight: "1.4", color: "var(--text-secondary)" }}>{rec.text}</p>
                        {rec.reason && (
                          <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px", fontStyle: "italic" }}>
                            Reason: {rec.reason}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Google Maps Embedded SVG preview & Direct GPS Action Button */}
              <div className="card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <MapPin size={12} style={{ color: "var(--color-red)" }} /> GIS Google Maps Location Preview
                </span>

                <div style={{
                  height: "120px",
                  borderRadius: "8px",
                  overflow: "hidden",
                  backgroundColor: "var(--bg-main)",
                  border: "1px solid var(--border-color)",
                  position: "relative"
                }}>
                  {/* Styled Mock Google Map Grid */}
                  <svg width="100%" height="100%">
                    <rect width="100%" height="100%" fill="var(--bg-main)" />
                    {/* Simulated street paths */}
                    <path d="M 0,40 L 400,60" stroke="var(--border-color)" strokeWidth="12" fill="none" />
                    <path d="M 120,0 L 140,200" stroke="var(--border-color)" strokeWidth="15" fill="none" />
                    <path d="M 280,0 L 250,200" stroke="var(--border-color)" strokeWidth="10" fill="none" />
                    <path d="M 0,150 L 400,120" stroke="var(--border-color)" strokeWidth="14" fill="none" />
                    
                    {/* Pulsing Target business location point */}
                    <g transform="translate(200, 70)">
                      <circle r="12" fill="var(--primary)" opacity="0.3" className="pulse-green" />
                      <circle r="6" fill="var(--color-red)" />
                    </g>
                  </svg>

                  {/* Absolute positioned coordinates label */}
                  <div style={{
                    position: "absolute",
                    bottom: "8px",
                    left: "8px",
                    backgroundColor: "rgba(15, 23, 42, 0.8)",
                    color: "var(--bg-secondary)",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    fontSize: "9.5px",
                    fontFamily: "var(--font-mono)"
                  }}>
                    Lat: {business.coordinates.lat} | Lng: {business.coordinates.lng}
                  </div>
                </div>

                <a
                  href={business.googleMapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "var(--bg-primary)",
                    textDecoration: "none",
                    fontSize: "12px",
                    fontWeight: "600",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    boxShadow: "var(--shadow-sm)"
                  }}
                >
                  <ExternalLink size={12} />
                  <span>Open in Google Maps</span>
                </a>
              </div>

              {/* Anomaly Injection Tool (For demonstration purposes) */}
              <div className="card" style={{ padding: "16px", border: "1px dashed var(--color-red)" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--color-red)", display: "block", marginBottom: "4px" }}>
                  SaaS Telemetry Lab (Anomaly Injection)
                </span>
                <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)", marginBottom: "10px" }}>
                  Simulate an IoT device breakdown to trigger Kafka telemetry chimes, visual alerts, and playbooks.
                </p>
                <button
                  onClick={() => onInjectAnomaly(business.id)}
                  style={{
                    width: "100%",
                    backgroundColor: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid var(--color-red)",
                    color: "var(--color-red)",
                    fontWeight: "700",
                    fontSize: "11.5px",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                >
                  ⚠️ Trigger Critical Anomaly
                </button>
              </div>
            </div>
          )}

          {/* Tab: Analytics */}
          {activeTab === "analytics" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Financial Predictors Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="card" style={{ padding: "14px" }}>
                  <span style={{ fontSize: "10.5px", color: "var(--text-muted)", display: "block" }}>Monthly Revenue</span>
                  <strong style={{ fontSize: "18px", color: "var(--text-primary)" }}>₹{currentRevenue} Lakhs</strong>
                  <span style={{ fontSize: "10.5px", color: "var(--color-green)", display: "block", marginTop: "2px" }}>
                    <TrendingUp size={10} style={{ display: "inline", marginRight: "2px" }} /> Stable streaming
                  </span>
                </div>
                <div className="card" style={{ padding: "14px" }}>
                  <span style={{ fontSize: "10.5px", color: "var(--text-muted)", display: "block" }}>Revenue Prediction (1M)</span>
                  <strong style={{ fontSize: "18px", color: business.trend === "up" ? "var(--color-green)" : business.trend === "down" ? "var(--color-red)" : "var(--text-primary)" }}>
                    ₹{predictedRevenue} Lakhs
                  </strong>
                  <span style={{ fontSize: "10.5px", color: "var(--text-muted)", display: "block", marginTop: "2px" }}>
                    Trend: {business.trend.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Customer predict & AI Health Index */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="card" style={{ padding: "14px" }}>
                  <span style={{ fontSize: "10.5px", color: "var(--text-muted)", display: "block" }}>Customer Growth</span>
                  <strong style={{ fontSize: "18px" }}>~{estimatedCustomers}</strong>
                  <span style={{ fontSize: "10.5px", color: "var(--text-muted)", display: "block", marginTop: "2px" }}>Cumulative estimate</span>
                </div>
                <div className="card" style={{ padding: "14px" }}>
                  <span style={{ fontSize: "10.5px", color: "var(--text-muted)", display: "block" }}>AI Health Index</span>
                  <strong style={{ fontSize: "18px", color: "var(--primary)" }}>{business.currentHealth * 1.05 > 100 ? "AAA" : "AA"}</strong>
                  <span style={{ fontSize: "10.5px", color: "var(--text-muted)", display: "block", marginTop: "2px" }}>Credit status score</span>
                </div>
              </div>

              {/* Competitor Analysis Card */}
              <div className="card" style={{ padding: "16px" }}>
                <span style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "10px" }}>
                  Competitor Benchmark Analysis
                </span>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {business.competitors.map((comp) => (
                    <div
                      key={comp.id}
                      style={{
                        padding: "10px",
                        borderRadius: "8px",
                        backgroundColor: "var(--bg-main)",
                        border: "1px solid var(--border-color)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <div>
                        <span style={{ fontSize: "12.5px", fontWeight: "600", display: "block" }}>{comp.name}</span>
                        <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>Range: {comp.distance} | Market Share: {comp.marketShare}%</span>
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--color-amber)", display: "flex", alignItems: "center", gap: "2px" }}>
                        <Star size={11} fill="var(--color-amber)" stroke="var(--color-amber)" /> {comp.rating}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Timeline History */}
          {activeTab === "timeline" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <span style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--text-secondary)", display: "block" }}>
                12-Month Audited Operations Log History
              </span>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "320px", overflowY: "auto", paddingRight: "6px" }}>
                {business.history.map((h, idx) => {
                  let badgeBg = "rgba(16, 185, 129, 0.12)";
                  let badgeText = "var(--color-green)";
                  if (h.type === "crisis") {
                    badgeBg = "rgba(239, 68, 68, 0.12)";
                    badgeText = "var(--color-red)";
                  } else if (h.type === "festival") {
                    badgeBg = "rgba(59, 130, 246, 0.12)";
                    badgeText = "var(--primary)";
                  } else if (h.type === "milestone") {
                    badgeBg = "rgba(168, 85, 247, 0.12)";
                    badgeText = "#a855f7";
                  }

                  return (
                    <div
                      key={idx}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "8px",
                        backgroundColor: "var(--bg-surface)",
                        border: "1px solid var(--border-color)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "700" }}>{h.month} 2026 - {h.event}</span>
                        <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>Health: {h.health}% | Rating: {h.rating} ★</span>
                      </div>
                      <span style={{
                        fontSize: "9px",
                        fontWeight: "700",
                        backgroundColor: badgeBg,
                        color: badgeText,
                        padding: "2px 6px",
                        borderRadius: "4px"
                      }}>
                        {h.type.toUpperCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab: Social Feeds & Reviews */}
          {activeTab === "social" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--text-secondary)" }}>
                  Verified Reviews Feed
                </span>
                
                {business.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      backgroundColor: "var(--bg-surface)",
                      border: "1px solid var(--border-color)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <strong style={{ fontSize: "12px" }}>{rev.author} ({rev.source})</strong>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{rev.timestamp}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "11.5px", color: "var(--text-secondary)" }}>{rev.text}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--text-secondary)" }}>
                  Social Network Mentions
                </span>

                {business.socialPosts.map((post) => (
                  <div
                    key={post.id}
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      backgroundColor: "var(--bg-surface)",
                      border: "1px solid var(--border-color)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <strong style={{ fontSize: "12px", color: "var(--primary)" }}>{post.author}</strong>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{post.timestamp}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: "1.4" }}>{post.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
