// DistrictMap.jsx - Renders the interactive Tamil Nadu digital twin map with zoom, pan, drag, and search locator.
import React, { useState, useMemo, useRef, useEffect } from "react";
import { MapPin, Activity, Search, Plus, Minus, RotateCcw, Maximize2, Minimize2, Navigation } from "lucide-react";
import { officialDistricts, projectCoordinates } from "../data/mockBusinesses";

function DistrictMap({
  selectedDistrict,
  onSelectDistrict,
  onSelectBusinessId,
  districtStats,
  businesses
}) {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredNodeData, setHoveredNodeData] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  
  // Interactive zoom & pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const mapCardRef = useRef(null);
  const svgRef = useRef(null);

  // Project the official districts dynamically
  const districtNodes = useMemo(() => {
    return officialDistricts.map((d) => {
      const proj = projectCoordinates(d.lat, d.lng);
      
      // Determine label positioning based on geography to prevent overlap
      let labelPos = "right";
      if (proj.x > 260) labelPos = "left";
      else if (proj.y < 120) labelPos = "bottom";
      else if (proj.y > 420) labelPos = "top";
      
      return {
        name: d.name,
        hq: d.hq,
        pincode: d.pincode,
        lat: d.lat,
        lng: d.lng,
        pop: d.pop,
        x: proj.x,
        y: proj.y,
        r: d.name === "Chennai" ? 15 : d.name === "Coimbatore" || d.name === "Madurai" ? 13 : 9,
        labelPos
      };
    });
  }, []);

  // System network topology connections between projected nodes
  const networkConnections = useMemo(() => [
    { from: "Chennai", to: "Tiruvallur" },
    { from: "Chennai", to: "Kancheepuram" },
    { from: "Chennai", to: "Chengalpattu" },
    { from: "Chengalpattu", to: "Kancheepuram" },
    { from: "Kancheepuram", to: "Ranipet" },
    { from: "Vellore", to: "Ranipet" },
    { from: "Vellore", to: "Tirupathur" },
    { from: "Vellore", to: "Tiruvannamalai" },
    { from: "Krishnagiri", to: "Tirupathur" },
    { from: "Krishnagiri", to: "Dharmapuri" },
    { from: "Dharmapuri", to: "Salem" },
    { from: "Tiruvannamalai", to: "Kallakurichi" },
    { from: "Tiruvannamalai", to: "Viluppuram" },
    { from: "Viluppuram", to: "Cuddalore" },
    { from: "Thanjavur", to: "Kumbakonam" },
    { from: "Mayiladuthurai", to: "Kumbakonam" },
    { from: "Kallakurichi", to: "Salem" },
    { from: "Salem", to: "Namakkal" },
    { from: "Salem", to: "Erode" },
    { from: "Nilgiris", to: "Coimbatore" },
    { from: "Nilgiris", to: "Erode" },
    { from: "Coimbatore", to: "Tiruppur" },
    { from: "Coimbatore", to: "Erode" },
    { from: "Erode", to: "Karur" },
    { from: "Tiruppur", to: "Dindigul" },
    { from: "Karur", to: "Tiruchirappalli" },
    { from: "Karur", to: "Dindigul" },
    { from: "Namakkal", to: "Tiruchirappalli" },
    { from: "Perambalur", to: "Kallakurichi" },
    { from: "Perambalur", to: "Ariyalur" },
    { from: "Ariyalur", to: "Cuddalore" },
    { from: "Ariyalur", to: "Tiruchirappalli" },
    { from: "Ariyalur", to: "Mayiladuthurai" },
    { from: "Mayiladuthurai", to: "Tiruvarur" },
    { from: "Mayiladuthurai", to: "Nagapattinam" },
    { from: "Tiruchirappalli", to: "Thanjavur" },
    { from: "Tiruchirappalli", to: "Pudukkottai" },
    { from: "Thanjavur", to: "Tiruvarur" },
    { from: "Tiruvarur", to: "Nagapattinam" },
    { from: "Pudukkottai", to: "Sivagangai" },
    { from: "Dindigul", to: "Madurai" },
    { from: "Dindigul", to: "Theni" },
    { from: "Theni", to: "Madurai" },
    { from: "Theni", to: "Tenkasi" },
    { from: "Madurai", to: "Sivagangai" },
    { from: "Madurai", to: "Virudhunagar" },
    { from: "Sivagangai", to: "Ramanathapuram" },
    { from: "Virudhunagar", to: "Ramanathapuram" },
    { from: "Virudhunagar", to: "Thoothukudi" },
    { from: "Virudhunagar", to: "Tirunelveli" },
    { from: "Tenkasi", to: "Tirunelveli" },
    { from: "Tirunelveli", to: "Thoothukudi" },
    { from: "Tirunelveli", to: "Kanniyakumari" },
    { from: "Thoothukudi", to: "Kanniyakumari" },
    { from: "Thoothukudi", to: "Ramanathapuram" }
  ], []);

  // Listen to browser fullscreen changes to update layout state correctly
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Keyboard shortcut listener for Reset and Fullscreen when element has focus
  const handleKeyDown = (e) => {
    if (e.key === "r" || e.key === "R") {
      handleResetView();
    } else if (e.key === "f" || e.key === "F") {
      toggleFullscreen();
    }
  };

  // Drag handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom handler
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = 0.08;
    let nextZoom = zoom + (e.deltaY < 0 ? zoomFactor : -zoomFactor);
    nextZoom = Math.max(0.5, Math.min(4, nextZoom));
    setZoom(nextZoom);
  };

  const handleZoomIn = () => {
    setZoom(z => Math.min(4, z + 0.25));
  };

  const handleZoomOut = () => {
    setZoom(z => Math.max(0.5, z - 0.25));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const toggleFullscreen = () => {
    if (!mapCardRef.current) return;
    
    if (!document.fullscreenElement) {
      mapCardRef.current.requestFullscreen().catch(() => {
        setIsFullscreen(!isFullscreen);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Locate District feature: Centers and Zooms onto the node coordinates
  const handleLocateDistrict = (distName) => {
    if (!distName) return;
    const node = districtNodes.find(n => n.name === distName);
    if (node) {
      setZoom(2.2);
      // Map viewBox is 400x500. Center of SVG is 200x250.
      // Target pan: SVG_center - node_coords * zoom
      setPan({
        x: 200 - node.x * 2.2,
        y: 250 - node.y * 2.2
      });
      onSelectDistrict(node.name);
      
      const districtBiz = businesses.filter(b => b.district === node.name);
      if (districtBiz.length > 0) {
        onSelectBusinessId(districtBiz[0].id);
      }
    }
  };

  // Calculate aggregated metrics
  const totalBusinesses = businesses.length;
  const averageHealth = useMemo(() => {
    return Math.round(
      businesses.reduce((acc, b) => acc + b.currentHealth, 0) / (totalBusinesses || 1)
    );
  }, [businesses, totalBusinesses]);

  const activeCrises = useMemo(() => {
    return businesses.filter((b) => b.riskLevel === "high").length;
  }, [businesses]);

  // Filter district rows based on search query
  const filteredNodes = districtNodes.filter(node =>
    node.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Selected district info to render in detailed statistics popup
  const selectedDistrictData = useMemo(() => {
    if (!selectedDistrict) return null;
    return districtNodes.find(n => n.name === selectedDistrict);
  }, [selectedDistrict, districtNodes]);

  const selectedStats = useMemo(() => {
    if (!selectedDistrict) return null;
    return districtStats[selectedDistrict] || { count: 0, averageHealth: 0, crises: 0, revenue: 0, sentiment: 0.0 };
  }, [selectedDistrict, districtStats]);

  return (
    <div
      ref={mapCardRef}
      className={`card map-card ${isFullscreen ? "fullscreen-map-active" : ""}`}
      style={{
        borderColor: "var(--border-color)",
        backgroundColor: "var(--bg-card)",
        color: "var(--text-primary)"
      }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label="Tamil Nadu GIS IoT Digital Twin Map"
    >
      <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 className="card-title" style={{ fontSize: "18px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
            <Activity size={18} style={{ color: "var(--primary)" }} />
            <span>Tamil Nadu GIS IoT Digital Twin Network</span>
          </h2>
          <p className="card-subtitle" style={{ fontSize: "13px" }}>Real-time telemetry map of administrative district twins & telemetry grids</p>
        </div>

        {/* Locate District Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Navigation size={13} style={{ color: "var(--primary)" }} />
            <span style={{ fontSize: "11.5px", fontWeight: "600" }}>Locate:</span>
          </div>
          <select
            onChange={(e) => handleLocateDistrict(e.target.value)}
            value={selectedDistrict || ""}
            style={{ padding: "4px 8px", fontSize: "12px", borderRadius: "6px", width: "140px", cursor: "pointer" }}
            aria-label="Locate District on Map"
          >
            <option value="">Select District</option>
            {districtNodes.map(node => (
              <option key={node.name} value={node.name}>{node.name}</option>
            ))}
          </select>
          <div className="status-indicator-pill live-pill" style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: "var(--primary-light)",
            border: "1px solid var(--primary)",
            padding: "4px 10px",
            borderRadius: "20px",
            fontSize: "12.5px",
            fontWeight: "500",
            color: "var(--primary)"
          }}>
            <span className="dot pulse-green" style={{
              width: "6px",
              height: "6px",
              backgroundColor: "var(--color-green)",
              borderRadius: "50%",
              display: "inline-block"
            }}></span>
            <span>Broker Online</span>
          </div>
        </div>
      </div>

      <div className="map-grid" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
        {/* SVG Network Map container */}
        <div 
          className="map-svg-container" 
          style={{
            backgroundColor: "var(--bg-main)",
            borderRadius: "12px",
            border: "1px solid var(--border-color)",
            padding: "12px",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            overflow: "hidden",
            cursor: isDragging ? "grabbing" : "grab"
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Zoom & Screen HUD Controls */}
          <div 
            className="map-hud-controls" 
            style={{ 
              position: "absolute", 
              top: "12px", 
              right: "12px", 
              display: "flex", 
              flexDirection: "column", 
              gap: "6px", 
              zIndex: 10 
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleZoomIn}
              aria-label="Zoom In"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                boxShadow: "var(--shadow-sm)"
              }}
            >
              <Plus size={16} />
            </button>
            <button
              onClick={handleZoomOut}
              aria-label="Zoom Out"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                boxShadow: "var(--shadow-sm)"
              }}
            >
              <Minus size={16} />
            </button>
            <button
              onClick={handleResetView}
              aria-label="Reset View"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "var(--shadow-sm)"
              }}
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={toggleFullscreen}
              aria-label="Toggle Fullscreen"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "var(--shadow-sm)"
              }}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>

          <svg 
            ref={svgRef}
            viewBox="0 0 400 500" 
            className="tn-network-map" 
            style={{ 
              width: "100%", 
              maxHeight: "400px", 
              pointerEvents: "auto",
              userSelect: "none"
            }}
          >
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* Tamil Nadu Stylized Boundaries */}
              <path
                d="M 280,30 L 360,50 L 390,90 L 330,160 L 320,220 L 300,280 L 260,330 L 220,440 L 140,490 L 100,470 L 110,420 L 70,300 L 70,220 L 120,180 L 180,100 Z"
                fill="var(--bg-card)"
                stroke="var(--border-color)"
                strokeWidth="2.5"
                className="tn-bg-boundary"
              />

              {/* Grid Pattern overlay */}
              <g>
                {Array.from({ length: 10 }).map((_, i) => (
                  <line key={`h-${i}`} x1="0" y1={i * 50} x2="400" y2={i * 50} stroke="var(--border-color)" strokeWidth="0.5" opacity="0.3" />
                ))}
                {Array.from({ length: 8 }).map((_, i) => (
                  <line key={`v-${i}`} x1={i * 50} y1="0" x2={i * 50} y2="500" stroke="var(--border-color)" strokeWidth="0.5" opacity="0.3" />
                ))}
              </g>

              {/* Network Connections */}
              {networkConnections.map((conn, idx) => {
                const fromNode = districtNodes.find((n) => n.name === conn.from);
                const toNode = districtNodes.find((n) => n.name === conn.to);
                if (!fromNode || !toNode) return null;

                const fromStats = districtStats[fromNode.name] || { averageHealth: 90 };
                const toStats = districtStats[toNode.name] || { averageHealth: 90 };
                const isCrisis = fromStats.averageHealth < 75 || toStats.averageHealth < 75;

                return (
                  <line
                    key={`line-${idx}`}
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke={isCrisis ? "var(--color-red)" : "var(--primary)"}
                    strokeWidth={isCrisis ? "2.5" : "1.5"}
                    strokeDasharray={isCrisis ? "4,4" : "0"}
                    opacity="0.6"
                  />
                );
              })}

              {/* Live Business Event Pulse Dots clustered geographically around district center */}
              {businesses.map((biz) => {
                const isCrisis = biz.riskLevel === "high";
                const isGrowth = biz.trend === "up" && biz.currentHealth > 90;
                return (
                  <circle
                    key={`dot-${biz.id}`}
                    cx={biz.coordinates.x}
                    cy={biz.coordinates.y}
                    r={isCrisis ? 4.5 : isGrowth ? 3.5 : 2.5}
                    fill={isCrisis ? "var(--color-red)" : isGrowth ? "var(--color-green)" : "var(--primary)"}
                    opacity="0.95"
                    className={isCrisis ? "pulse-dot-red" : isGrowth ? "pulse-dot-green" : ""}
                  />
                );
              })}

              {/* District Nodes */}
              {districtNodes.map((node) => {
                const stats = districtStats[node.name] || { count: 0, averageHealth: 100, crises: 0 };
                const isSelected = selectedDistrict === node.name;
                const isHovered = hoveredNode === node.name;

                let nodeColor = "var(--color-green)"; // Healthy
                let strokeColor = "var(--color-green)";
                if (stats.averageHealth < 75) {
                  nodeColor = "var(--color-red)"; // Crisis
                  strokeColor = "var(--color-red)";
                } else if (stats.averageHealth < 85) {
                  nodeColor = "var(--color-amber)"; // Warning
                  strokeColor = "var(--color-amber)";
                }

                return (
                  <g
                    key={node.name}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      const isSel = selectedDistrict === node.name;
                      const nextDistrict = isSel ? null : node.name;
                      onSelectDistrict(nextDistrict);
                      
                      if (nextDistrict) {
                        const districtBiz = businesses.filter((b) => b.district === nextDistrict);
                        if (districtBiz.length > 0) {
                          onSelectBusinessId(districtBiz[0].id);
                        } else {
                          onSelectBusinessId(null);
                        }
                      } else {
                        onSelectBusinessId(null);
                      }
                    }}
                    onMouseEnter={(e) => {
                      setHoveredNode(node.name);
                      setHoveredNodeData({ ...node, stats });
                      setTooltipPos({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseMove={(e) => {
                      setTooltipPos({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseLeave={() => {
                      setHoveredNode(null);
                      setHoveredNodeData(null);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Hover/Selection shadow rings */}
                    <circle
                      r={node.r + (isHovered || isSelected ? 6 : 2)}
                      fill={nodeColor}
                      opacity={isHovered || isSelected ? 0.3 : 0.08}
                      style={{ transition: "all 0.25s ease" }}
                    />

                    {/* Core Node */}
                    <circle
                      r={node.r}
                      fill="var(--bg-surface)"
                      stroke={isSelected ? "var(--primary)" : strokeColor}
                      strokeWidth={isSelected ? "3" : "2"}
                    />
                    
                    {/* Status Indicator Center */}
                    <circle r={node.r - 8 > 4 ? node.r - 8 : 4} fill={nodeColor} />

                    {/* Text Label */}
                    <text
                      x={node.labelPos === "left" ? -(node.r + 6) : node.labelPos === "right" ? node.r + 6 : 0}
                      y={node.labelPos === "top" ? -(node.r + 6) : node.labelPos === "bottom" ? node.r + 14 : 4}
                      textAnchor={node.labelPos === "left" ? "end" : node.labelPos === "right" ? "start" : "middle"}
                      fill={isSelected ? "var(--text-primary)" : "var(--text-secondary)"}
                      fontWeight={isSelected ? "700" : "500"}
                      fontSize="9.5px"
                      style={{
                        fontFamily: "var(--font-sans)",
                        userSelect: "none"
                      }}
                    >
                      {node.name}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* District Tooltip (Portal-like floating overlay on hover) */}
          {hoveredNodeData && (
            <div style={{
              position: "fixed",
              top: `${tooltipPos.y + 15}px`,
              left: `${tooltipPos.x + 15}px`,
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "12px",
              boxShadow: "var(--shadow-md)",
              zIndex: 9999,
              pointerEvents: "none",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              backdropFilter: "blur(4px)"
            }}>
              <strong style={{ fontSize: "13px", color: "var(--primary)" }}>{hoveredNodeData.name}</strong>
              <span>Headquarters: {hoveredNodeData.hq}</span>
              <span>Monitored Twins: {hoveredNodeData.stats.count}</span>
              <span>Avg Health: <span style={{ fontWeight: "700", color: (hoveredNodeData.stats.averageHealth || 0) >= 85 ? "var(--color-green)" : (hoveredNodeData.stats.averageHealth || 0) >= 75 ? "var(--color-amber)" : "var(--color-red)" }}>{hoveredNodeData.stats.averageHealth || 0}%</span></span>
              <span>Avg Sentiment: {Number(hoveredNodeData.stats.sentiment || 0).toFixed(2)}</span>
              <span>Total Revenue: ₹{Number(hoveredNodeData.stats.revenue || 0).toLocaleString()} Lakhs</span>
              <span>Active Alerts: {hoveredNodeData.stats.crises || 0}</span>
            </div>
          )}

          <div style={{ position: "absolute", bottom: "8px", left: "12px", fontSize: "11px", color: "var(--text-muted)", display: "flex", gap: "10px" }}>
            <span>🔴 High Risk</span>
            <span>🟡 Med Risk</span>
            <span>🟢 Stable</span>
          </div>
        </div>

        {/* Districts Information List & Popup Detail Panel */}
        <div className="districts-list-panel" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Quick aggregates */}
          <div className="aggregate-dashboard-stats" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
            <div style={{ border: "1px solid var(--border-color)", backgroundColor: "var(--bg-main)", padding: "10px", borderRadius: "8px", textAlign: "center" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Total Monitored</span>
              <span style={{ fontSize: "15px", fontWeight: "700" }}>{totalBusinesses} Plants</span>
            </div>
            <div style={{ border: "1px solid var(--border-color)", backgroundColor: "var(--bg-main)", padding: "10px", borderRadius: "8px", textAlign: "center" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Avg Health</span>
              <span style={{ fontSize: "15px", fontWeight: "700", color: averageHealth >= 85 ? "var(--color-green)" : "var(--color-amber)" }}>{averageHealth}%</span>
            </div>
            <div style={{ border: "1px solid var(--border-color)", backgroundColor: "var(--bg-main)", padding: "10px", borderRadius: "8px", textAlign: "center" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Anomalies</span>
              <span style={{ fontSize: "15px", fontWeight: "700", color: activeCrises > 0 ? "var(--color-red)" : "var(--text-muted)" }}>{activeCrises}</span>
            </div>
          </div>

          {/* District Statistics Popup details overlay */}
          {selectedDistrictData && selectedStats && (
            <div style={{
              backgroundColor: "var(--primary-light)",
              border: "1px solid var(--primary)",
              borderRadius: "8px",
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "6px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: "13.5px", color: "var(--primary)" }}>{selectedDistrictData.name} District Stats</strong>
                <button
                  onClick={() => onSelectDistrict(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "11px" }}
                >
                  Clear Node
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "11.5px" }}>
                <span><strong>HQ:</strong> {selectedDistrictData.hq}</span>
                <span><strong>Pincode:</strong> {selectedDistrictData.pincode}</span>
                <span><strong>Population:</strong> {selectedDistrictData.pop.toLocaleString()}</span>
                <span><strong>Business Count:</strong> {selectedStats.count}</span>
                <span><strong>Avg Health:</strong> {selectedStats.averageHealth}%</span>
                <span><strong>Avg Sentiment:</strong> {(selectedStats.sentiment || 0).toFixed(2)}</span>
                <span style={{ gridColumn: "span 2" }}><strong>Total Revenue:</strong> ₹{(selectedStats.revenue || 0).toLocaleString()} Lakhs</span>
              </div>
            </div>
          )}

          {/* Search bar */}
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Search size={14} style={{ position: "absolute", left: "10px", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search districts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 8px 8px 32px",
                fontSize: "13px",
                borderRadius: "6px",
                outline: "none"
              }}
            />
          </div>

          {/* District Table List */}
          <div className="districts-scrollbar-container" style={{ overflowY: "auto", maxHeight: "230px", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
            <table className="districts-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px", textAlign: "left" }}>
              <thead style={{ backgroundColor: "var(--bg-main)", position: "sticky", top: 0, borderBottom: "1px solid var(--border-color)", zIndex: 1 }}>
                <tr>
                  <th style={{ padding: "8px 12px", color: "var(--text-secondary)", fontWeight: "600" }}>District</th>
                  <th style={{ padding: "8px 12px", color: "var(--text-secondary)", fontWeight: "600", textAlign: "center" }}>Twins</th>
                  <th style={{ padding: "8px 12px", color: "var(--text-secondary)", fontWeight: "600", textAlign: "center" }}>Avg Health</th>
                  <th style={{ padding: "8px 12px", color: "var(--text-secondary)", fontWeight: "600", textAlign: "right" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredNodes.map((node) => {
                  const stats = districtStats[node.name] || { count: 0, averageHealth: 0, crises: 0 };
                  const isSelected = selectedDistrict === node.name;

                  let rowBg = "transparent";
                  if (isSelected) rowBg = "var(--primary-light)";

                  let healthColor = "var(--color-green)";
                  if (stats.averageHealth < 75) healthColor = "var(--color-red)";
                  else if (stats.averageHealth < 85) healthColor = "var(--color-amber)";

                  return (
                    <tr
                      key={node.name}
                      onClick={() => {
                        const isSel = selectedDistrict === node.name;
                        const nextDistrict = isSel ? null : node.name;
                        onSelectDistrict(nextDistrict);
                        
                        if (nextDistrict) {
                          const districtBiz = businesses.filter((b) => b.district === nextDistrict);
                          if (districtBiz.length > 0) {
                            onSelectBusinessId(districtBiz[0].id);
                          } else {
                            onSelectBusinessId(null);
                          }
                        } else {
                          onSelectBusinessId(null);
                        }
                      }}
                      style={{
                        backgroundColor: rowBg,
                        cursor: "pointer",
                        borderBottom: "1px solid var(--border-color)",
                        transition: "background 0.2s"
                      }}
                      className="district-row-hover"
                    >
                      <td style={{ padding: "8px 12px", color: "var(--text-primary)", fontWeight: isSelected ? "600" : "400" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <MapPin size={12} style={{ color: isSelected ? "var(--primary)" : "var(--text-muted)" }} />
                          {node.name}
                        </div>
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "center", color: "var(--text-secondary)" }}>{stats.count}</td>
                      <td style={{ padding: "8px 12px", textAlign: "center" }}>
                        <span style={{
                          color: healthColor,
                          fontWeight: "700",
                          backgroundColor: healthColor === "var(--color-green)" ? "rgba(16, 185, 129, 0.1)" : healthColor === "var(--color-amber)" ? "rgba(245, 158, 11, 0.1)" : "rgba(239, 68, 68, 0.1)",
                          padding: "2px 6px",
                          borderRadius: "4px"
                        }}>
                          {stats.averageHealth}%
                        </span>
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "right" }}>
                        {stats.averageHealth < 75 ? (
                          <span style={{ fontSize: "11px", color: "var(--color-red)", fontWeight: "600" }}>⚠️ Warning</span>
                        ) : (
                          <span style={{ fontSize: "11px", color: "var(--color-green)", fontWeight: "600" }}>✓ Optimal</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(DistrictMap);
