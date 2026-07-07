// DistrictMap.jsx - Renders the interactive Tamil Nadu digital twin map with zoom, pan, drag, and search locator.
import React, { useState, useMemo, useRef, useEffect } from "react";
import { MapPin, Activity, Search, Plus, Minus, RotateCcw, Maximize2, Minimize2, Navigation } from "lucide-react";
import { officialDistricts, projectCoordinates } from "../data/mockBusinesses";

function DistrictMap({
  selectedDistrict,
  onSelectDistrict,
  onSelectBusinessId,
  onSelectBusiness,
  districtStats,
  businesses,
  alerts = []
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

  // Major cities to display on mobile viewports
  const topRankedNames = useMemo(() => {
    return ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tiruppur"];
  }, []);

  // Dynamic collision detection and positioning of district labels based on priority and zoom
  const processedNodes = useMemo(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

    // 1. Prepare initial nodes with responsive radii
    const preparedNodes = districtNodes.map(node => {
      let r = node.r;
      if (isMobile) {
        r = node.name === "Chennai" ? 11 : node.name === "Coimbatore" || node.name === "Madurai" ? 9.5 : 6.5;
      }
      return {
        ...node,
        r,
        x: node.x,
        y: node.y
      };
    });

    // 2. Resolve node-to-node overlaps dynamically (force displacement)
    const iterations = 8;
    const minSpacing = isMobile ? 3.0 : 4.0;
    
    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < preparedNodes.length; i++) {
        for (let j = i + 1; j < preparedNodes.length; j++) {
          const n1 = preparedNodes[i];
          const n2 = preparedNodes[j];
          
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.hypot(dx, dy);
          
          const minDist = n1.r + n2.r + minSpacing;
          
          if (dist < minDist) {
            const overlap = minDist - dist;
            const forceX = dist > 0.1 ? (dx / dist) : 1;
            const forceY = dist > 0.1 ? (dy / dist) : 0;
            const pushAmount = overlap / 2;
            
            n1.x -= forceX * pushAmount;
            n1.y -= forceY * pushAmount;
            n2.x += forceX * pushAmount;
            n2.y += forceY * pushAmount;
          }
        }
      }
    }

    // 3. Sort for label priority (hovered/selected first)
    const labelPriorityNodes = [...preparedNodes].sort((a, b) => {
      if (a.name === hoveredNode) return -1;
      if (b.name === hoveredNode) return 1;
      if (a.name === selectedDistrict) return -1;
      if (b.name === selectedDistrict) return 1;
      return b.pop - a.pop;
    });

    // 4. Place labels using the resolved coordinates
    const placedBoxes = [];
    const mappedNodes = labelPriorityNodes.map(node => {
      const isSelected = selectedDistrict === node.name;
      const isHovered = hoveredNode === node.name;
      const isLargest = topRankedNames.includes(node.name);
      
      let baseVisible = true;
      if (!isSelected && !isHovered) {
        if (isMobile) {
          if (!isLargest) {
            baseVisible = false;
          }
        } else {
          if (zoom < 1.3 && node.pop < 2500000) baseVisible = false;
          else if (zoom < 1.7 && node.pop < 1500000) baseVisible = false;
        }
      }

      const baseFontLimit = isMobile ? 8.0 : 10.0;
      const minFontLimit = isMobile ? 5.5 : 6.5;
      const currentFontSize = Math.max(minFontLimit, Math.min(baseFontLimit, baseFontLimit / zoom));
      const fontWidth = currentFontSize * 0.55;
      const fontHeight = currentFontSize;
      
      const labelText = node.name;
      const labelWidth = labelText.length * fontWidth;
      
      const positions = [node.labelPos, "right", "left", "top", "bottom"];
      
      if (node.name === "Chennai") positions.unshift("right");
      else if (node.name === "Tiruvallur") positions.unshift("left");
      else if (node.name === "Kancheepuram") positions.unshift("bottom");
      else if (node.name === "Chengalpattu") positions.unshift("right");
      else if (node.name === "Ranipet") positions.unshift("top");
      else if (node.name === "Vellore") positions.unshift("left");

      let finalPos = node.labelPos;
      let finalBox = null;
      let overlaps = false;
      let visible = baseVisible;

      if (visible) {
        for (const pos of positions) {
          let left = 0, top = 0;
          const spacing = 4;
          const offset = node.r + spacing;
          
          if (pos === "right") {
            left = node.x + offset;
            top = node.y - fontHeight / 2;
          } else if (pos === "left") {
            left = node.x - offset - labelWidth;
            top = node.y - fontHeight / 2;
          } else if (pos === "top") {
            left = node.x - labelWidth / 2;
            top = node.y - offset - fontHeight;
          } else if (pos === "bottom") {
            left = node.x - labelWidth / 2;
            top = node.y + offset + 8;
          }
          
          const box = {
            left,
            top,
            right: left + labelWidth,
            bottom: top + fontHeight,
            name: node.name
          };
          
          overlaps = placedBoxes.some(other => {
            const padding = isMobile ? 4.0 : 2.0;
            return !(
              box.right + padding < other.left ||
              box.left - padding > other.right ||
              box.bottom + padding < other.top ||
              box.top - padding > other.bottom
            );
          });
          
          if (!overlaps) {
            finalPos = pos;
            finalBox = box;
            break;
          }
        }
        
        if (overlaps) {
          if (isSelected || isHovered) {
            finalPos = "right";
            const offset = node.r + 4;
            finalBox = {
              left: node.x + offset,
              top: node.y - fontHeight / 2,
              right: node.x + offset + labelWidth,
              bottom: node.y + fontHeight / 2,
              name: node.name
            };
          } else {
            visible = false;
          }
        }
      }
      
      if (visible && finalBox) {
        placedBoxes.push(finalBox);
      }
      
      return {
        ...node,
        visible,
        labelPos: finalPos,
        fontSize: currentFontSize
      };
    });

    // 5. Sort final nodes for drawing order (hovered/selected drawn last to render on top)
    return mappedNodes.sort((a, b) => {
      const isSelA = selectedDistrict === a.name;
      const isSelB = selectedDistrict === b.name;
      const isHovA = hoveredNode === a.name;
      const isHovB = hoveredNode === b.name;
      
      if (isHovA && !isHovB) return 1;
      if (isHovB && !isHovA) return -1;
      if (isSelA && !isSelB) return 1;
      if (isSelB && !isSelA) return -1;
      
      const idxA = officialDistricts.findIndex(d => d.name === a.name);
      const idxB = officialDistricts.findIndex(d => d.name === b.name);
      return idxA - idxB;
    });
  }, [zoom, selectedDistrict, hoveredNode, districtNodes, topRankedNames]);

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

  const districtBusinesses = useMemo(() => {
    if (!selectedDistrict) return [];
    return businesses.filter(b => b.district === selectedDistrict);
  }, [businesses, selectedDistrict]);

  const districtAggregates = useMemo(() => {
    if (!selectedDistrict || districtBusinesses.length === 0) return null;
    const count = districtBusinesses.length;
    const avgHealth = Math.round(districtBusinesses.reduce((sum, b) => sum + b.currentHealth, 0) / count);
    const totalRevenue = districtBusinesses.reduce((sum, b) => sum + Math.round((b.baseRevenue || 250) * (b.currentHealth / 100)), 0);
    const avgSentiment = Number((districtBusinesses.reduce((sum, b) => sum + b.sentimentScore, 0) / count).toFixed(2));
    
    const lowRisk = districtBusinesses.filter(b => b.riskLevel === "low").length;
    const medRisk = districtBusinesses.filter(b => b.riskLevel === "medium").length;
    const highRisk = districtBusinesses.filter(b => b.riskLevel === "high").length;
    
    const activeAlertsCount = alerts.filter(a => districtBusinesses.some(b => b.id === a.businessId)).length;
    
    return {
      count,
      avgHealth,
      totalRevenue,
      avgSentiment,
      lowRisk,
      medRisk,
      highRisk,
      activeAlertsCount
    };
  }, [districtBusinesses, selectedDistrict, alerts]);

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

      <div className="map-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }} className="map-left-column">
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
              cursor: isDragging ? "grabbing" : "grab",
              width: "100%",
              boxSizing: "border-box"
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
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleZoomIn}
                aria-label="Zoom In"
              >
                <Plus size={16} />
              </button>
              <button
                onClick={handleZoomOut}
                aria-label="Zoom Out"
              >
                <Minus size={16} />
              </button>
              <button
                onClick={handleResetView}
                aria-label="Reset View"
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={toggleFullscreen}
                aria-label="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            </div>

            <svg 
              ref={svgRef}
              viewBox="0 0 400 500" 
              preserveAspectRatio="xMidYMid meet"
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
                  const fromNode = processedNodes.find((n) => n.name === conn.from);
                  const toNode = processedNodes.find((n) => n.name === conn.to);
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
                  
                  const isBelongingToSelected = selectedDistrict ? biz.district === selectedDistrict : true;
                  const opacity = selectedDistrict 
                    ? (isBelongingToSelected ? 0.95 : 0.15) 
                    : 0.95;
                    
                  const radius = selectedDistrict && isBelongingToSelected
                    ? (isCrisis ? 6 : isGrowth ? 5 : 4.5)
                    : (isCrisis ? 4.5 : isGrowth ? 3.5 : 2.5);

                  return (
                    <circle
                      key={`dot-${biz.id}`}
                      cx={biz.coordinates.x}
                      cy={biz.coordinates.y}
                      r={radius}
                      fill={isCrisis ? "var(--color-red)" : isGrowth ? "var(--color-green)" : "var(--primary)"}
                      opacity={opacity}
                      className={isCrisis ? "pulse-dot-red" : isGrowth ? "pulse-dot-green" : ""}
                      style={{ 
                        transition: "opacity 0.3s ease, r 0.3s ease",
                        cursor: "pointer"
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectBusiness) {
                          onSelectBusiness(biz.id);
                        } else {
                          onSelectBusinessId(biz.id);
                        }
                      }}
                    />
                  );
                })}

                {/* District Nodes */}
                {processedNodes.map((node) => {
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
                      {node.visible && (
                        <text
                          x={node.labelPos === "left" ? -(node.r + 6) : node.labelPos === "right" ? node.r + 6 : 0}
                          y={node.labelPos === "top" ? -(node.r + 6) : node.labelPos === "bottom" ? node.r + 14 : 4}
                          textAnchor={node.labelPos === "left" ? "end" : node.labelPos === "right" ? "start" : "middle"}
                          fill={isSelected ? "var(--text-primary)" : "var(--text-secondary)"}
                          fontWeight={isSelected ? "700" : "500"}
                          fontSize={`${node.fontSize}px`}
                          style={{
                            fontFamily: "var(--font-sans)",
                            userSelect: "none"
                          }}
                        >
                          {node.name}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* District Tooltip (Portal-like floating overlay on hover, disabled on mobile) */}
            {hoveredNodeData && typeof window !== "undefined" && window.innerWidth > 768 && (
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
          </div>

          <div className="map-legend">
            <span>🔴 High Risk</span>
            <span>🟡 Med Risk</span>
            <span>🟢 Stable</span>
          </div>
        </div>

        {/* Districts Information List & Popup Detail Panel */}
        <div className="districts-list-panel" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {selectedDistrict && selectedDistrictData && districtAggregates ? (
            /* Selected District Details side HUD Panel */
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--primary)" }}>{selectedDistrict} HUD</h3>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>HQ: {selectedDistrictData.hq} | Pop: {selectedDistrictData.pop.toLocaleString()}</span>
                </div>
                <button
                  onClick={() => onSelectDistrict(null)}
                  className="btn-playback"
                  style={{ padding: "4px 10px", fontSize: "11.5px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  ← Back
                </button>
              </div>

              {/* Aggregated KPIs Side Panel grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div style={{ border: "1px solid var(--border-color)", backgroundColor: "var(--bg-main)", padding: "8px 10px", borderRadius: "8px" }}>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block" }}>Total Twins</span>
                  <strong style={{ fontSize: "14px" }}>{districtAggregates.count} Nodes</strong>
                </div>
                <div style={{ border: "1px solid var(--border-color)", backgroundColor: "var(--bg-main)", padding: "8px 10px", borderRadius: "8px" }}>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block" }}>Avg Health</span>
                  <strong style={{ 
                    fontSize: "14px", 
                    color: districtAggregates.avgHealth >= 85 ? "var(--color-green)" : districtAggregates.avgHealth >= 75 ? "var(--color-amber)" : "var(--color-red)"
                  }}>{districtAggregates.avgHealth}%</strong>
                </div>
                <div style={{ border: "1px solid var(--border-color)", backgroundColor: "var(--bg-main)", padding: "8px 10px", borderRadius: "8px" }}>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block" }}>Total Revenue</span>
                  <strong style={{ fontSize: "14px" }}>₹{districtAggregates.totalRevenue.toLocaleString()} Lakhs</strong>
                </div>
                <div style={{ border: "1px solid var(--border-color)", backgroundColor: "var(--bg-main)", padding: "8px 10px", borderRadius: "8px" }}>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block" }}>Sentiment Index</span>
                  <strong style={{ fontSize: "14px", color: "var(--color-green)" }}>{(districtAggregates.avgSentiment * 100).toFixed(0)}% Pos</strong>
                </div>
                <div style={{ border: "1px solid var(--border-color)", backgroundColor: "var(--bg-main)", padding: "8px 10px", borderRadius: "8px", gridColumn: "span 2" }}>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Risk Distribution & Alerts</span>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: "8px", fontSize: "11px" }}>
                      <span style={{ color: "var(--color-green)", fontWeight: "600" }}>🟢 Low: {districtAggregates.lowRisk}</span>
                      <span style={{ color: "var(--color-amber)", fontWeight: "600" }}>🟡 Med: {districtAggregates.medRisk}</span>
                      <span style={{ color: "var(--color-red)", fontWeight: "600" }}>🔴 High: {districtAggregates.highRisk}</span>
                    </div>
                    {districtAggregates.activeAlertsCount > 0 && (
                      <span style={{ 
                        fontSize: "10px", 
                        backgroundColor: "rgba(239, 68, 68, 0.15)", 
                        color: "var(--color-red)", 
                        padding: "2px 6px", 
                        borderRadius: "4px",
                        fontWeight: "700" 
                      }}>
                        {districtAggregates.activeAlertsCount} ALERTS
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Requirement 3 Scrollable Business List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-secondary)" }}>
                  Businesses in {selectedDistrict} ({districtBusinesses.length})
                </span>
                
                <div className="districts-scrollbar-container" style={{ overflowY: "auto", maxHeight: "230px", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
                  
                  <div className="desktop-only-table">
                    <table className="districts-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px", textAlign: "left" }}>
                      <thead style={{ backgroundColor: "var(--bg-main)", position: "sticky", top: 0, borderBottom: "1px solid var(--border-color)", zIndex: 1 }}>
                        <tr>
                          <th style={{ padding: "8px 8px", color: "var(--text-secondary)", fontWeight: "600" }}>Business</th>
                          <th style={{ padding: "8px 8px", color: "var(--text-secondary)", fontWeight: "600" }}>Category</th>
                          <th style={{ padding: "8px 8px", color: "var(--text-secondary)", fontWeight: "600", textAlign: "center" }}>Health</th>
                          <th style={{ padding: "8px 8px", color: "var(--text-secondary)", fontWeight: "600", textAlign: "right" }}>Revenue</th>
                          <th style={{ padding: "8px 8px", color: "var(--text-secondary)", fontWeight: "600", textAlign: "right" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {districtBusinesses.map((biz) => {
                          const isCrisis = biz.riskLevel === "high";
                          const isWarning = biz.riskLevel === "medium";
                          
                          let statusColor = "var(--color-green)";
                          let statusText = "Optimal";
                          if (isCrisis) {
                            statusColor = "var(--color-red)";
                            statusText = "Critical";
                          } else if (isWarning) {
                            statusColor = "var(--color-amber)";
                            statusText = "Warning";
                          }

                          const bizRevenue = Math.round((biz.baseRevenue || 250) * (biz.currentHealth / 100));

                          return (
                            <tr
                              key={biz.id}
                              onClick={() => {
                                if (onSelectBusiness) {
                                  onSelectBusiness(biz.id);
                                } else {
                                  onSelectBusinessId(biz.id);
                                }
                              }}
                              style={{
                                cursor: "pointer",
                                borderBottom: "1px solid var(--border-color)",
                                transition: "background 0.2s"
                              }}
                              className="district-row-hover"
                            >
                              <td style={{ padding: "8px 8px" }}>
                                <div style={{ fontWeight: "600", color: "var(--text-primary)" }}>{biz.name.split(" (")[0]}</div>
                                <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                                  Sent: {(biz.sentimentScore * 100).toFixed(0)}% • Risk: {biz.riskLevel.toUpperCase()}
                                </div>
                              </td>
                              <td style={{ padding: "8px 8px", color: "var(--text-secondary)" }}>
                                {biz.category}
                              </td>
                              <td style={{ padding: "8px 8px", textAlign: "center", fontWeight: "700", color: statusColor }}>
                                {biz.currentHealth}%
                              </td>
                              <td style={{ padding: "8px 8px", textAlign: "right", fontFamily: "var(--font-mono)" }}>
                                ₹{bizRevenue}L
                              </td>
                              <td style={{ padding: "8px 8px", textAlign: "right" }}>
                                <span style={{ 
                                  color: statusColor, 
                                  backgroundColor: isCrisis ? "rgba(239, 68, 68, 0.1)" : isWarning ? "rgba(245, 158, 11, 0.1)" : "rgba(16, 185, 129, 0.1)",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  fontSize: "10.5px",
                                  fontWeight: "600"
                                }}>
                                  {statusText}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mobile-only-cards" style={{ display: "none", flexDirection: "column", gap: "10px" }}>
                    {districtBusinesses.map((biz) => {
                      const isCrisis = biz.riskLevel === "high";
                      const isWarning = biz.riskLevel === "medium";
                      
                      let statusColor = "var(--color-green)";
                      let statusText = "Optimal";
                      if (isCrisis) {
                        statusColor = "var(--color-red)";
                        statusText = "Critical";
                      } else if (isWarning) {
                        statusColor = "var(--color-amber)";
                        statusText = "Warning";
                      }

                      const bizRevenue = Math.round((biz.baseRevenue || 250) * (biz.currentHealth / 100));

                      return (
                        <div
                          key={biz.id}
                          onClick={() => {
                            if (onSelectBusiness) {
                              onSelectBusiness(biz.id);
                            } else {
                              onSelectBusinessId(biz.id);
                            }
                          }}
                          style={{
                            padding: "12px",
                            borderRadius: "8px",
                            border: "1px solid var(--border-color)",
                            backgroundColor: "var(--bg-surface)",
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                            <strong style={{ fontSize: "13px", color: "var(--text-primary)" }} className="text-truncate">{biz.name.split(" (")[0]}</strong>
                            <span style={{ 
                              color: statusColor, 
                              backgroundColor: isCrisis ? "rgba(239, 68, 68, 0.1)" : isWarning ? "rgba(245, 158, 11, 0.1)" : "rgba(16, 185, 129, 0.1)",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "10.5px",
                              fontWeight: "600",
                              whiteSpace: "nowrap"
                            }} className="text-truncate">
                              {statusText}
                            </span>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", fontSize: "11.5px", color: "var(--text-secondary)" }}>
                            <div>Category: {biz.category}</div>
                            <div>Health: <strong style={{ color: statusColor }}>{biz.currentHealth}%</strong></div>
                            <div style={{ gridColumn: "span 2" }}>Revenue: <strong>₹{bizRevenue}L</strong></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>
            </div>
          ) : (
            /* Original summary view when no district is active */
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
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

              {/* District Statistics details popup */}
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
                <div className="desktop-only-table">
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
                                backgroundColor: healthColor === "var(--color-green)" ? "rgba(16, 185, 129, 0.15)" : healthColor === "var(--color-amber)" ? "rgba(245, 158, 11, 0.15)" : "rgba(239, 68, 68, 0.15)",
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

                <div className="mobile-only-cards" style={{ display: "none", flexDirection: "column", gap: "10px" }}>
                  {filteredNodes.map((node) => {
                    const stats = districtStats[node.name] || { count: 0, averageHealth: 0, crises: 0 };
                    const isSelected = selectedDistrict === node.name;

                    let cardBg = isSelected ? "var(--primary-light)" : "var(--bg-surface)";
                    let healthColor = "var(--color-green)";
                    let statusText = "✓ Optimal";
                    if (stats.averageHealth < 75) {
                      healthColor = "var(--color-red)";
                      statusText = "⚠️ Warning";
                    } else if (stats.averageHealth < 85) {
                      healthColor = "var(--color-amber)";
                      statusText = "⚠️ Warning";
                    }

                    return (
                      <div
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
                          padding: "12px",
                          borderRadius: "8px",
                          border: isSelected ? "1.5px solid var(--primary)" : "1px solid var(--border-color)",
                          backgroundColor: cardBg,
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "600", color: "var(--text-primary)" }}>
                            <MapPin size={13} style={{ color: isSelected ? "var(--primary)" : "var(--text-muted)" }} />
                            {node.name}
                          </div>
                          <span style={{ fontSize: "11px", color: healthColor, fontWeight: "600" }}>{statusText}</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", fontSize: "11.5px", color: "var(--text-secondary)" }}>
                          <div>Monitored: <strong>{stats.count} Twins</strong></div>
                          <div>Avg Health: <strong style={{
                            color: healthColor,
                            backgroundColor: healthColor === "var(--color-green)" ? "rgba(16, 185, 129, 0.12)" : healthColor === "var(--color-amber)" ? "rgba(245, 158, 11, 0.12)" : "rgba(239, 68, 68, 0.12)",
                            padding: "1px 4px",
                            borderRadius: "4px"
                          }}>{stats.averageHealth}%</strong></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(DistrictMap);
