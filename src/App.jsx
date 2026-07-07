// App.jsx - Main Dashboard controller and state coordinator.
import React, { useState, useEffect, useMemo, useCallback, Suspense, useRef } from "react";
import DistrictMap from "./components/DistrictMap";
import BusinessProfile from "./components/BusinessProfile";
import TimelinePlayback from "./components/TimelinePlayback";
import AIRecommendations from "./components/AIRecommendations";
import NotificationCenter from "./components/dashboard/NotificationCenter";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { CardSkeleton } from "./components/common/Skeleton";
import SimulationEngine from "./services/SimulationEngine";
import { 
  Cpu, 
  LayoutDashboard, 
  Layers, 
  Library, 
  Search, 
  SlidersHorizontal, 
  MapPin, 
  Sun, 
  Moon, 
  RefreshCw, 
  Download, 
  FileText, 
  Keyboard, 
  Volume2, 
  VolumeX, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  BookOpen, 
  PieChart,
  Menu,
  Building,
  Plus,
  Trash2,
  Edit3
} from "lucide-react";

// Lazy load the pipeline visualizer component since it's render-heavy
const PipelineVisualizer = React.lazy(() => import("./components/PipelineVisualizer"));

// Specialized Counter Component using requestAnimationFrame for smooth KPI ticks
function AnimatedCounter({ value }) {
  const [displayValue, setDisplayValue] = useState(0);
  const displayValRef = useRef(0);

  useEffect(() => {
    const start = displayValRef.current;
    const end = parseInt(value) || 0;
    if (start === end) return;
    const duration = 650; // ms
    const startTime = performance.now();

    let frameId;
    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress * (2 - progress); // easeOutQuad
      const current = Math.round(start + (end - start) * ease);
      displayValRef.current = current;
      setDisplayValue(current);
      if (progress < 1) {
        frameId = requestAnimationFrame(update);
      }
    };
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [value]);

  return <span>{displayValue}</span>;
}

export default function App() {
  // Theme state
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  
  // Navigation layout state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, analytics, pipeline, directory
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [liveTime, setLiveTime] = useState(new Date().toLocaleTimeString());

  // Interactive filter & search states
  const [globalSearch, setGlobalSearch] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterRisk, setFilterRisk] = useState("all");
  const [filterHealth, setFilterHealth] = useState("all");

  // Pagination for the business directory tab
  const [dirCurrentPage, setDirCurrentPage] = useState(1);
  const dirItemsPerPage = 12;

  // Selected entities
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Simulation engine setup
  const [engine] = useState(() => SimulationEngine);
  const [businesses, setBusinesses] = useState(() => engine.getBusinesses());
  const [districtStats, setDistrictStats] = useState(() => engine.getDistrictStats());
  const [notifications, setNotifications] = useState(() => engine.getNotifications());
  const [alerts, setAlerts] = useState(() => engine.getAlerts());
  const [executionHistory, setExecutionHistory] = useState(() => engine.getExecutionHistory());

  // Automatically select the first business in the clicked district for timeline/rec sync
  useEffect(() => {
    if (selectedDistrict) {
      const districtBiz = businesses.filter(b => b.district === selectedDistrict);
      if (districtBiz.length > 0) {
        const currentBiz = businesses.find(b => b.id === selectedBusinessId);
        if (!currentBiz || currentBiz.district !== selectedDistrict) {
          setSelectedBusinessId(districtBiz[0].id);
        }
      } else {
        setSelectedBusinessId(null);
      }
    }
  }, [selectedDistrict, businesses, selectedBusinessId]);

  // Ingestion metrics
  const [kafkaQueue, setKafkaQueue] = useState([]);
  const [sparkWindow, setSparkWindow] = useState([]);
  const [kubernetesPods, setKubernetesPods] = useState([]);
  const [logs, setLogs] = useState([]);

  // Control variables
  const [refreshInterval, setRefreshInterval] = useState(4000);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());
  const [isLoading, setIsLoading] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Analytics comparison state
  const [compareIdA, setCompareIdA] = useState("");
  const [compareIdB, setCompareIdB] = useState("");
  const [analyticsViewType, setAnalyticsViewType] = useState("monthly"); // weekly, monthly, quarterly, yearly

  // Playback mode state for scrubbing
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaybackMode, setIsPlaybackMode] = useState(false);

  // Business Management CRUD state variables
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState("add"); // "add" | "edit"
  const [editingBusinessId, setEditingBusinessId] = useState(null);
  const [mgtSearch, setMgtSearch] = useState("");
  const [mgtCategory, setMgtCategory] = useState("all");
  const [mgtDistrict, setMgtDistrict] = useState("all");
  const [mgtCurrentPage, setMgtCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    owner: "",
    category: "",
    district: "",
    address: "",
    pincode: "",
    phone: "",
    email: "",
    website: "",
    gstNumber: "",
    registrationNo: "",
    latitude: "",
    longitude: "",
    health: "90",
    rating: "4.0",
    sentimentScore: "0.8",
    riskLevel: "low",
    revenue: "250",
    openingHours: "09:00 AM - 09:00 PM",
    description: ""
  });
  const [formErrors, setFormErrors] = useState({});
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingBusinessId, setDeletingBusinessId] = useState(null);
  const [toast, setToast] = useState(null);

  // Toast Auto-Dismiss Timer
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Modal background scrolling lock
  useEffect(() => {
    if (isFormModalOpen || isDeleteModalOpen || isShortcutsOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFormModalOpen, isDeleteModalOpen, isShortcutsOpen]);

  // Form Validation Logic
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Company name is required";
    if (!formData.owner.trim()) errors.owner = "Owner name is required";
    if (!formData.category.trim()) errors.category = "Category is required";
    if (!formData.district.trim()) errors.district = "District is required";
    if (!formData.address.trim()) errors.address = "Address is required";
    
    // Pincode (6 digits in India)
    if (!formData.pincode.trim()) {
      errors.pincode = "Pincode is required";
    } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
      errors.pincode = "Invalid pincode (must be exactly 6 digits)";
    }
    
    // Phone
    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^\+?\d{10,12}$/.test(formData.phone.trim().replace(/[\s-]/g, ""))) {
      errors.phone = "Invalid phone format (10-12 digits)";
    }
    
    // Email
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "Invalid email address";
    }

    // GST Number (Indian GSTIN format: 15 alphanumeric characters)
    const gstRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/;
    if (!formData.gstNumber.trim()) {
      errors.gstNumber = "GST Number is required";
    } else if (!gstRegex.test(formData.gstNumber.trim().toUpperCase())) {
      errors.gstNumber = "Invalid GSTIN format (e.g. 33AAAAF1234K1Z1)";
    }

    // Registration Number
    if (!formData.registrationNo.trim()) {
      errors.registrationNo = "Registration Number is required";
    }

    // Latitude & Longitude validation
    if (!formData.latitude.toString().trim()) {
      errors.latitude = "Latitude is required";
    } else {
      const lat = parseFloat(formData.latitude);
      if (isNaN(lat) || lat < 8 || lat > 14) {
        errors.latitude = "Must be a valid latitude (8.0 to 14.0 for Tamil Nadu)";
      }
    }
    
    if (!formData.longitude.toString().trim()) {
      errors.longitude = "Longitude is required";
    } else {
      const lng = parseFloat(formData.longitude);
      if (isNaN(lng) || lng < 76 || lng > 81) {
        errors.longitude = "Must be a valid longitude (76.0 to 81.0 for Tamil Nadu)";
      }
    }

    // Check for duplicate GST Number or Registration Number
    if (formMode === "add") {
      const isDuplicateGST = businesses.some(b => b.gstNumber.toUpperCase() === formData.gstNumber.trim().toUpperCase());
      if (isDuplicateGST) {
        errors.gstNumber = "A business with this GST number already exists";
      }
      const isDuplicateReg = businesses.some(b => b.registrationNo.toUpperCase() === formData.registrationNo.trim().toUpperCase());
      if (isDuplicateReg) {
        errors.registrationNo = "A business with this Registration number already exists";
      }
    } else if (formMode === "edit" && editingBusinessId) {
      const isDuplicateGST = businesses.some(b => b.id !== editingBusinessId && b.gstNumber.toUpperCase() === formData.gstNumber.trim().toUpperCase());
      if (isDuplicateGST) {
        errors.gstNumber = "A business with this GST number already exists";
      }
      const isDuplicateReg = businesses.some(b => b.id !== editingBusinessId && b.registrationNo.toUpperCase() === formData.registrationNo.trim().toUpperCase());
      if (isDuplicateReg) {
        errors.registrationNo = "A business with this Registration number already exists";
      }
    }

    // Score checks
    const healthNum = parseInt(formData.health);
    if (isNaN(healthNum) || healthNum < 0 || healthNum > 100) {
      errors.health = "Health must be between 0 and 100";
    }
    const ratingNum = parseFloat(formData.rating);
    if (isNaN(ratingNum) || ratingNum < 1.0 || ratingNum > 5.0) {
      errors.rating = "Rating must be between 1.0 and 5.0";
    }
    const sentNum = parseFloat(formData.sentimentScore);
    if (isNaN(sentNum) || sentNum < 0.0 || sentNum > 1.0) {
      errors.sentimentScore = "Sentiment Score must be between 0.0 and 1.0";
    }
    const revNum = parseFloat(formData.revenue);
    if (isNaN(revNum) || revNum < 0) {
      errors.revenue = "Revenue must be a positive number";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveBusiness = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setToast({ text: "Please resolve the form errors before submitting", type: "error" });
      return;
    }

    const cleanBizData = {
      name: formData.name.trim(),
      owner: formData.owner.trim(),
      category: formData.category.trim(),
      district: formData.district.trim(),
      address: formData.address.trim(),
      pincode: formData.pincode.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim().toLowerCase(),
      website: formData.website.trim(),
      gstNumber: formData.gstNumber.trim().toUpperCase(),
      registrationNo: formData.registrationNo.trim().toUpperCase(),
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      currentHealth: parseInt(formData.health),
      currentRating: parseFloat(formData.rating),
      sentimentScore: parseFloat(formData.sentimentScore),
      riskLevel: formData.riskLevel,
      revenue: parseFloat(formData.revenue),
      openingHours: formData.openingHours.trim(),
      description: formData.description.trim()
    };

    if (formMode === "add") {
      const newBiz = engine.addBusiness(cleanBizData);
      setToast({ text: `Successfully registered twin node: ${newBiz.name}`, type: "success" });
    } else {
      engine.editBusiness(editingBusinessId, cleanBizData);
      setToast({ text: `Successfully updated twin node: ${cleanBizData.name}`, type: "success" });
    }

    setIsFormModalOpen(false);
    setFormData({
      name: "", owner: "", category: "", district: "", address: "", pincode: "", phone: "", email: "", website: "", gstNumber: "", registrationNo: "", latitude: "", longitude: "", health: "90", rating: "4.0", sentimentScore: "0.8", riskLevel: "low", revenue: "250", openingHours: "09:00 AM - 09:00 PM", description: ""
    });
    setFormErrors({});
  };

  const handleEditClick = (biz) => {
    setFormMode("edit");
    setEditingBusinessId(biz.id);
    setFormData({
      name: biz.name,
      owner: biz.owner,
      category: biz.category,
      district: biz.district,
      address: biz.address,
      pincode: biz.pincode,
      phone: biz.phone,
      email: biz.email,
      website: biz.website || "",
      gstNumber: biz.gstNumber,
      registrationNo: biz.registrationNo,
      latitude: biz.coordinates.lat,
      longitude: biz.coordinates.lng,
      health: biz.currentHealth.toString(),
      rating: biz.currentRating.toString(),
      sentimentScore: biz.sentimentScore.toString(),
      riskLevel: biz.riskLevel,
      revenue: (biz.baseRevenue || 250).toString(),
      openingHours: biz.openingHours || "09:00 AM - 09:00 PM",
      description: biz.description || ""
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (bizId) => {
    setDeletingBusinessId(bizId);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    const biz = businesses.find(b => b.id === deletingBusinessId);
    if (biz) {
      engine.deleteBusiness(deletingBusinessId);
      setToast({ text: `De-registered twin node: ${biz.name}`, type: "success" });
      if (selectedBusinessId === deletingBusinessId) {
        setSelectedBusinessId(null);
        setIsDrawerOpen(false);
      }
    }
    setIsDeleteModalOpen(false);
    setDeletingBusinessId(null);
  };

  // Dynamic unique categories list
  const categories = useMemo(() => {
    return Array.from(new Set(businesses.map(b => b.category))).sort();
  }, [businesses]);

  // Dynamic unique districts list
  const districts = useMemo(() => {
    return Array.from(new Set(businesses.map(b => b.district))).sort();
  }, [businesses]);

  // Dashboard overall KPIs stats
  const kpiStats = useMemo(() => {
    const filteredByDistrict = selectedDistrict
      ? businesses.filter(b => b.district === selectedDistrict)
      : businesses;

    const totalCount = filteredByDistrict.length;
    if (totalCount === 0) {
      return { total: 0, healthy: 0, warning: 0, critical: 0, avgHealth: 0, avgSentiment: 0, totalRevenue: 0 };
    }
    const healthy = filteredByDistrict.filter(b => b.currentHealth >= 85).length;
    const warning = filteredByDistrict.filter(b => b.currentHealth >= 75 && b.currentHealth < 85).length;
    const critical = filteredByDistrict.filter(b => b.currentHealth < 75).length;
    
    const sumHealth = filteredByDistrict.reduce((acc, b) => acc + b.currentHealth, 0);
    const avgHealth = Math.round(sumHealth / totalCount);
    
    const sumSentiment = filteredByDistrict.reduce((acc, b) => acc + b.sentimentScore, 0);
    const avgSentiment = Number((sumSentiment / totalCount).toFixed(2));
    
    const totalRevenue = filteredByDistrict.reduce((acc, b) => acc + Math.round((b.baseRevenue || 210) * (b.currentHealth / 100)), 0);
    
    return {
      total: totalCount,
      healthy,
      warning,
      critical,
      avgHealth,
      avgSentiment,
      totalRevenue
    };
  }, [businesses, selectedDistrict]);

  const searchInputRef = useRef(null);

  // Update live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Programmatic synthesization of alarm chime using Web Audio API
  const playAlertChime = useCallback(() => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      
      // Dual tone chime: D5 (587.33Hz) then A5 (880Hz)
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {
      console.warn("AudioContext blocked by browser policy.");
    }
  }, [isMuted]);

  // Set page HTML data-theme attribute
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Sync initial state and subscribe
  useEffect(() => {
    const handleStateUpdate = (state) => {
      setBusinesses([...state.businesses]);
      setDistrictStats({ ...state.activeDistrictStats });
      setNotifications([...state.notifications]);
      setAlerts([...state.alerts]);
      setExecutionHistory([...state.executionHistory]);
      
      setKafkaQueue([...state.kafkaQueue]);
      setSparkWindow([...state.sparkWindow]);
      setKubernetesPods([...state.kubernetesPods]);
      setLogs([...state.logs]);
      
      setLastSyncTime(new Date().toLocaleTimeString());
    };

    engine.subscribe(handleStateUpdate);
    engine.start();

    return () => {
      engine.stop();
    };
  }, [engine]);

  // Handle auto-refresh interval updates
  useEffect(() => {
    engine.setRefreshInterval(refreshInterval);
  }, [refreshInterval, engine]);

  useEffect(() => {
    if (isAutoRefresh) {
      engine.resumeSimulation();
    } else {
      engine.pauseSimulation();
    }
  }, [isAutoRefresh, engine]);

  // Trigger alert chime when new critical notification is added
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[notifications.length - 1];
      if (latest && !latest.isRead && latest.severity === "high") {
        playAlertChime();
      }
    }
  }, [notifications, playAlertChime]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleGlobalShortcuts = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.tagName === "TEXTAREA") {
        return;
      }
      switch (e.key.toLowerCase()) {
        case "t":
          setTheme(prev => prev === "light" ? "dark" : "light");
          break;
        case "a":
          setIsAutoRefresh(prev => !prev);
          break;
        case "r":
          // Reset Map View
          const resetBtn = document.querySelector('[aria-label="Reset View"]');
          if (resetBtn) resetBtn.click();
          break;
        case "f":
          // Toggle Fullscreen map
          const fsBtn = document.querySelector('[aria-label="Toggle Fullscreen"]');
          if (fsBtn) fsBtn.click();
          break;
        case "s":
          e.preventDefault();
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
          break;
        case "h":
          setActiveTab("dashboard");
          break;
        case "p":
          setActiveTab("pipeline");
          break;
        case "d":
          setActiveTab("directory");
          break;
        case "?":
          setIsShortcutsOpen(prev => !prev);
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, []);

  // Synchronize telemetry manually
  const handleSimulateSync = () => {
    setIsLoading(true);
    engine.triggerManualSync();
    setTimeout(() => {
      setIsLoading(false);
    }, 600);
  };

  // Notification management callbacks
  const handleMarkNotifRead = (id) => engine.markNotificationRead(id);
  const handleMarkAllNotifsRead = () => engine.markAllNotificationsRead();
  const handleClearAllNotifs = () => engine.clearAllNotifications();
  const handleDismissNotif = (id) => engine.dismissNotification(id);

  // Recommendations callbacks
  const handleExecutePlaybook = (alert) => {
    engine.executeRecommendation(alert.id);
  };

  const handleDismissAlert = (id) => {
    engine.dismissAlert(id);
  };

  // Anomaly Injection Callback
  const handleInjectAnomaly = (bizId) => {
    engine.injectAnomaly(bizId);
  };

  // Reset filters
  const handleResetFilters = () => {
    setGlobalSearch("");
    setFilterDistrict("all");
    setFilterCategory("all");
    setFilterRisk("all");
    setFilterHealth("all");
    setSelectedDistrict(null);
  };

  // Global search filtering
  const filteredBusinesses = useMemo(() => {
    return businesses.filter(b => {
      // 1. Matches text search on: Name, Owner, District, Category, GST, PIN, Registration No, Phone, or Email
      const query = globalSearch.trim().toLowerCase();
      const matchesSearch = query === "" ||
        b.name.toLowerCase().includes(query) ||
        b.owner.toLowerCase().includes(query) ||
        b.district.toLowerCase().includes(query) ||
        b.category.toLowerCase().includes(query) ||
        b.pincode.toLowerCase().includes(query) ||
        (b.gstNumber && b.gstNumber.toLowerCase().includes(query)) ||
        (b.registrationNo && b.registrationNo.toLowerCase().includes(query)) ||
        (b.phone && b.phone.toLowerCase().includes(query)) ||
        (b.email && b.email.toLowerCase().includes(query));

      // 2. Matches dropdown filters (overridden by map's selectedDistrict if set)
      const matchesDistrict = selectedDistrict
        ? b.district === selectedDistrict
        : (filterDistrict === "all" || b.district === filterDistrict);
      const matchesCategory = filterCategory === "all" || b.category === filterCategory;
      const matchesRisk = filterRisk === "all" || b.riskLevel === filterRisk;
      
      let matchesHealth = true;
      if (filterHealth === "healthy") matchesHealth = b.currentHealth >= 85;
      else if (filterHealth === "warning") matchesHealth = b.currentHealth >= 75 && b.currentHealth < 85;
      else if (filterHealth === "critical") matchesHealth = b.currentHealth < 75;

      return matchesSearch && matchesDistrict && matchesCategory && matchesRisk && matchesHealth;
    });
  }, [businesses, globalSearch, filterDistrict, filterCategory, filterRisk, filterHealth, selectedDistrict]);

  // Chart Labels selector based on active period
  const chartLabels = useMemo(() => {
    if (analyticsViewType === "weekly") {
      return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    } else if (analyticsViewType === "quarterly") {
      return ["Q1", "Q2", "Q3", "Q4"];
    } else if (analyticsViewType === "yearly") {
      return ["2022", "2023", "2024", "2025", "2026"];
    } else {
      return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    }
  }, [analyticsViewType]);

  // Aggregated Revenue Data & Forecast Calculations
  const revenueData = useMemo(() => {
    if (filteredBusinesses.length === 0) return [];
    if (analyticsViewType === "weekly") {
      return [0, 1, 2, 3, 4, 5, 6].map(d => {
        return filteredBusinesses.reduce((sum, b) => {
          const base = (b.baseRevenue || 210) * (b.currentHealth / 100) / 30;
          const variance = Math.sin((d + parseInt(b.id.split("-")[1] || 0)) * 0.9) * 0.15;
          return sum + base * (1 + variance);
        }, 0);
      });
    } else if (analyticsViewType === "quarterly") {
      return [0, 1, 2, 3].map(q => {
        return filteredBusinesses.reduce((sum, b) => {
          const startM = q * 3;
          const monthsSubset = b.history.slice(startM, startM + 3);
          const qSum = monthsSubset.reduce((acc, m) => {
            const factor = m.type === "festival" ? 1.25 : m.type === "crisis" ? 0.8 : 1.0;
            return acc + (b.baseRevenue || 210) * (m.health / 100) * factor;
          }, 0);
          return sum + qSum;
        }, 0);
      });
    } else if (analyticsViewType === "yearly") {
      return [2022, 2023, 2024, 2025, 2026].map((year, idx) => {
        const discount = 1 - (4 - idx) * 0.07;
        return filteredBusinesses.reduce((sum, b) => {
          const currentYearRev = b.history.reduce((acc, m) => {
            const factor = m.type === "festival" ? 1.25 : m.type === "crisis" ? 0.8 : 1.0;
            return acc + (b.baseRevenue || 210) * (m.health / 100) * factor;
          }, 0);
          return sum + currentYearRev * discount;
        }, 0);
      });
    } else {
      // monthly
      return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(mIdx => {
        return filteredBusinesses.reduce((sum, b) => {
          const m = b.history[mIdx] || { health: b.currentHealth, type: "normal" };
          const factor = m.type === "festival" ? 1.25 : m.type === "crisis" ? 0.8 : 1.0;
          return sum + (b.baseRevenue || 210) * (m.health / 100) * factor;
        }, 0);
      });
    }
  }, [filteredBusinesses, analyticsViewType]);

  // Automatically calculate next period forecast
  const forecastVal = useMemo(() => {
    if (revenueData.length === 0) return 0;
    const lastVal = revenueData[revenueData.length - 1];
    const prevVal = revenueData[revenueData.length - 2] || lastVal;
    const growth = prevVal !== 0 ? (lastVal - prevVal) / prevVal : 0;
    return lastVal * (1 + Math.max(-0.15, Math.min(0.15, growth)));
  }, [revenueData]);

  // Aggregated Customer Sentiment Trend score calculations
  const sentimentData = useMemo(() => {
    if (filteredBusinesses.length === 0) return [];
    if (analyticsViewType === "weekly") {
      return [0, 1, 2, 3, 4, 5, 6].map(d => {
        const totalSent = filteredBusinesses.reduce((sum, b) => {
          const offset = Math.sin((d + parseInt(b.id.split("-")[1] || 0)) * 0.9) * 0.05;
          return sum + Math.max(0.1, Math.min(1.0, b.sentimentScore + offset));
        }, 0);
        return totalSent / filteredBusinesses.length;
      });
    } else if (analyticsViewType === "quarterly") {
      return [0, 1, 2, 3].map(q => {
        const totalSent = filteredBusinesses.reduce((sum, b) => {
          const startM = q * 3;
          const monthsSubset = b.history.slice(startM, startM + 3);
          const qSent = monthsSubset.reduce((acc, m) => acc + m.sentiment, 0) / 3;
          return sum + qSent;
        }, 0);
        return totalSent / filteredBusinesses.length;
      });
    } else if (analyticsViewType === "yearly") {
      return [2022, 2023, 2024, 2025, 2026].map((year, idx) => {
        const discount = 0.93 + idx * 0.015;
        const totalSent = filteredBusinesses.reduce((sum, b) => {
          return sum + Math.max(0.1, Math.min(1.0, b.sentimentScore * discount));
        }, 0);
        return totalSent / filteredBusinesses.length;
      });
    } else {
      // monthly
      return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(mIdx => {
        const totalSent = filteredBusinesses.reduce((sum, b) => {
          const m = b.history[mIdx] || { sentiment: b.sentimentScore };
          return sum + m.sentiment;
        }, 0);
        return totalSent / filteredBusinesses.length;
      });
    }
  }, [filteredBusinesses, analyticsViewType]);

  // Aggregated interaction telemetry packets statistics
  const interactionData = useMemo(() => {
    if (filteredBusinesses.length === 0) return [];
    
    const getCategoryFreq = (cat) => {
      const freq = {
        "IT Companies": 800,
        "Manufacturing": 600,
        "Logistics": 500,
        "Automobile": 550,
        "Hospitals": 400,
        "Banking": 700,
        "Healthcare": 450,
        "Textile Industries": 350
      };
      return freq[cat] || 250;
    };

    if (analyticsViewType === "weekly") {
      return [0, 1, 2, 3, 4, 5, 6].map(d => {
        return filteredBusinesses.reduce((sum, b) => {
          const freq = getCategoryFreq(b.category);
          const variance = Math.sin((d + parseInt(b.id.split("-")[1] || 0)) * 0.75) * 0.2;
          return sum + Math.round(freq * (b.currentHealth / 100) * (1 + variance) * 45);
        }, 0);
      });
    } else if (analyticsViewType === "quarterly") {
      return [0, 1, 2, 3].map(q => {
        return filteredBusinesses.reduce((sum, b) => {
          const startM = q * 3;
          const monthsSubset = b.history.slice(startM, startM + 3);
          const qSumHealth = monthsSubset.reduce((acc, m) => acc + m.health, 0) / 3;
          const freq = getCategoryFreq(b.category);
          return sum + Math.round(freq * (qSumHealth / 100) * 1200);
        }, 0);
      });
    } else if (analyticsViewType === "yearly") {
      return [2022, 2023, 2024, 2025, 2026].map((year, idx) => {
        const discount = 0.85 + idx * 0.03;
        return filteredBusinesses.reduce((sum, b) => {
          const freq = getCategoryFreq(b.category);
          return sum + Math.round(freq * (b.currentHealth / 100) * 4500 * discount);
        }, 0);
      });
    } else {
      // monthly
      return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(mIdx => {
        return filteredBusinesses.reduce((sum, b) => {
          const freq = getCategoryFreq(b.category);
          const m = b.history[mIdx] || { health: b.currentHealth };
          return sum + Math.round(freq * (m.health / 100) * 350);
        }, 0);
      });
    }
  }, [filteredBusinesses, analyticsViewType]);

  // Chart 1 coordinate data points and paths
  const chart1Points = useMemo(() => {
    if (revenueData.length === 0) return { actualPath: "", fillPath: "", forecastPath: "", nodes: [], points: [] };
    const maxVal = Math.max(...revenueData, forecastVal) || 1;
    const points = revenueData.map((v, i) => {
      const x = 15 + i * (240 / (revenueData.length - 1 || 1));
      const y = 110 - (v / maxVal) * 90;
      return { x, y, val: v };
    });

    const actualPath = points.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(" ");
    const fillPath = points.length > 0 ? `${actualPath} L ${points[points.length - 1].x},120 L ${points[0].x},120 Z` : "";
    
    // Forecast line
    const lastP = points[points.length - 1];
    const forecastX = 285;
    const forecastY = 110 - (forecastVal / maxVal) * 90;
    const forecastPath = lastP ? `M ${lastP.x},${lastP.y} L ${forecastX},${forecastY}` : "";

    return {
      actualPath,
      fillPath,
      forecastPath,
      forecastPoint: { x: forecastX, y: forecastY, val: forecastVal },
      points
    };
  }, [revenueData, forecastVal]);

  // Chart 2 stepped line path
  const chart2SteppedPath = useMemo(() => {
    if (interactionData.length === 0) return { steppedPath: "", points: [] };
    const maxVal = Math.max(...interactionData) || 1;
    const points = interactionData.map((v, i) => {
      const x = 15 + i * (270 / (interactionData.length - 1 || 1));
      const y = 110 - (v / maxVal) * 90;
      return { x, y, val: v };
    });

    let path = points.length > 0 ? `M ${points[0].x},${points[0].y}` : "";
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x},${points[i - 1].y} L ${points[i].x},${points[i].y}`;
    }
    return {
      steppedPath: path,
      points
    };
  }, [interactionData]);

  // Dynamic ranking stats and distributions
  const analyticsData = useMemo(() => {
    // 1. Top Performing Businesses (by health)
    const topPerforming = [...filteredBusinesses]
      .sort((a, b) => b.currentHealth - a.currentHealth)
      .slice(0, 5);

    // 2. Lowest Performing Businesses (by health)
    const lowestPerforming = [...filteredBusinesses]
      .sort((a, b) => a.currentHealth - b.currentHealth)
      .slice(0, 5);

    // 3. Revenue Ranking
    const revenueRanking = [...filteredBusinesses]
      .map(b => ({
        ...b,
        revenue: Math.round((b.baseRevenue || 210) * (b.currentHealth / 100))
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // 4. Health Ranking
    const healthRanking = [...filteredBusinesses]
      .sort((a, b) => b.currentHealth - a.currentHealth)
      .slice(0, 5);

    // 5. District Ranking (by average health and total revenue)
    const districtsMap = {};
    filteredBusinesses.forEach(b => {
      if (!districtsMap[b.district]) {
        districtsMap[b.district] = { district: b.district, totalHealth: 0, totalRevenue: 0, totalSentiment: 0, count: 0 };
      }
      districtsMap[b.district].totalHealth += b.currentHealth;
      districtsMap[b.district].totalRevenue += Math.round((b.baseRevenue || 210) * (b.currentHealth / 100));
      districtsMap[b.district].totalSentiment += b.sentimentScore;
      districtsMap[b.district].count += 1;
    });
    const districtRanking = Object.values(districtsMap)
      .map(d => ({
        district: d.district,
        avgHealth: Math.round(d.totalHealth / d.count),
        totalRevenue: d.totalRevenue,
        avgSentiment: Number((d.totalSentiment / d.count).toFixed(2)),
        count: d.count
      }))
      .sort((a, b) => b.avgHealth - a.avgHealth);

    // 6. Category Ranking (by average health and total revenue)
    const categoriesMap = {};
    filteredBusinesses.forEach(b => {
      if (!categoriesMap[b.category]) {
        categoriesMap[b.category] = { category: b.category, totalHealth: 0, totalRevenue: 0, count: 0 };
      }
      categoriesMap[b.category].totalHealth += b.currentHealth;
      categoriesMap[b.category].totalRevenue += Math.round((b.baseRevenue || 210) * (b.currentHealth / 100));
      categoriesMap[b.category].count += 1;
    });
    const categoryRanking = Object.values(categoriesMap)
      .map(c => ({
        category: c.category,
        avgHealth: Math.round(c.totalHealth / c.count),
        totalRevenue: c.totalRevenue,
        count: c.count
      }))
      .sort((a, b) => b.avgHealth - a.avgHealth);

    // 7. Risk Distribution
    const riskLevels = { low: 0, medium: 0, high: 0 };
    filteredBusinesses.forEach(b => {
      if (b.riskLevel === "low") riskLevels.low++;
      else if (b.riskLevel === "medium") riskLevels.medium++;
      else if (b.riskLevel === "high") riskLevels.high++;
    });

    // 8. Sentiment Distribution
    const sentimentRanges = { excellent: 0, good: 0, poor: 0 };
    filteredBusinesses.forEach(b => {
      if (b.sentimentScore >= 0.85) sentimentRanges.excellent++;
      else if (b.sentimentScore >= 0.70) sentimentRanges.good++;
      else sentimentRanges.poor++;
    });

    return {
      topPerforming,
      lowestPerforming,
      revenueRanking,
      healthRanking,
      districtRanking,
      categoryRanking,
      riskLevels,
      sentimentRanges
    };
  }, [filteredBusinesses]);

  // Paginated directory items
  const paginatedBusinesses = useMemo(() => {
    const startIdx = (dirCurrentPage - 1) * dirItemsPerPage;
    return filteredBusinesses.slice(startIdx, startIdx + dirItemsPerPage);
  }, [filteredBusinesses, dirCurrentPage]);

  const totalDirPages = Math.ceil(filteredBusinesses.length / dirItemsPerPage);

  // Memoized Business Management filtered list
  const filteredMgtBusinesses = useMemo(() => {
    return businesses.filter(b => {
      const matchSearch = !mgtSearch.trim() || 
        b.name.toLowerCase().includes(mgtSearch.toLowerCase()) ||
        b.owner.toLowerCase().includes(mgtSearch.toLowerCase()) ||
        b.gstNumber.toLowerCase().includes(mgtSearch.toLowerCase()) ||
        b.registrationNo.toLowerCase().includes(mgtSearch.toLowerCase()) ||
        b.pincode.toLowerCase().includes(mgtSearch.toLowerCase()) ||
        b.district.toLowerCase().includes(mgtSearch.toLowerCase()) ||
        b.email.toLowerCase().includes(mgtSearch.toLowerCase()) ||
        b.phone.toLowerCase().includes(mgtSearch.toLowerCase());
        
      const matchCategory = mgtCategory === "all" || b.category === mgtCategory;
      const matchDistrict = mgtDistrict === "all" || b.district === mgtDistrict;
      
      return matchSearch && matchCategory && matchDistrict;
    });
  }, [businesses, mgtSearch, mgtCategory, mgtDistrict]);

  const mgtItemsPerPage = 10;
  const paginatedMgtBusinesses = useMemo(() => {
    const startIdx = (mgtCurrentPage - 1) * mgtItemsPerPage;
    return filteredMgtBusinesses.slice(startIdx, startIdx + mgtItemsPerPage);
  }, [filteredMgtBusinesses, mgtCurrentPage]);

  const totalMgtPages = Math.ceil(filteredMgtBusinesses.length / mgtItemsPerPage);

  // Set default comparison twins A & B
  useEffect(() => {
    if (businesses.length > 0) {
      if (!compareIdA) setCompareIdA(businesses[0].id);
      if (!compareIdB) setCompareIdB(businesses[1]?.id || businesses[0].id);
    }
  }, [businesses, compareIdA, compareIdB]);

  const comparedTwinA = useMemo(() => businesses.find(b => b.id === compareIdA), [businesses, compareIdA]);
  const comparedTwinB = useMemo(() => businesses.find(b => b.id === compareIdB), [businesses, compareIdB]);

  // Export CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Name,Owner,Category,District,PIN,Lat,Lng,Risk,Health,GST\n";
    
    businesses.forEach(b => {
      csvContent += `"${b.id}","${b.name}","${b.owner}","${b.category}","${b.district}","${b.pincode}",${b.coordinates.lat},${b.coordinates.lng},"${b.riskLevel.toUpperCase()}",${b.currentHealth},"${b.gstNumber}"\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "TADIT_Twins_Audit_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF template
  const handlePrintPDF = () => {
    window.print();
  };

  const handleSelectBusiness = (id) => {
    setSelectedBusinessId(id);
    const biz = businesses.find(b => b.id === id);
    if (biz) {
      setSelectedDistrict(biz.district);
    }
    setIsDrawerOpen(true);
  };

  const activeBusiness = useMemo(() => {
    const biz = businesses.find(b => b.id === selectedBusinessId) || null;
    if (isPlaybackMode && biz) {
      return engine.getHistoricalState(selectedBusinessId, playbackIndex, analyticsViewType);
    }
    return biz;
  }, [businesses, selectedBusinessId, isPlaybackMode, playbackIndex, analyticsViewType, engine]);

  // Breadcrumb generation
  const getBreadcrumbs = () => {
    const paths = ["TADIT Platform"];
    if (activeTab === "dashboard") paths.push("GIS Map Portal");
    else if (activeTab === "analytics") paths.push("Analytics Hub");
    else if (activeTab === "pipeline") paths.push("Telemetry Pipeline");
    else if (activeTab === "directory") paths.push("Twins Directory");
    else if (activeTab === "management") paths.push("Business Management");
    
    if (selectedDistrict) {
      paths.push(selectedDistrict);
    }
    return paths.join(" / ");
  };

  return (
    <div className="app-container">
      {/* Collapsible Left Sidebar */}
      {/* Collapsible Left Sidebar */}
      <aside className={`sidebar ${isSidebarCollapsed ? "collapsed" : ""} ${isMobileSidebarOpen ? "open" : ""}`}>
        {/* Collapse toggle */}
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
          className="sidebar-toggle-btn"
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Sidebar Header Logo */}
        <div className="sidebar-logo-section">
          <Cpu size={24} style={{ color: "var(--primary)", flexShrink: 0 }} />
          {(!isSidebarCollapsed || isMobileSidebarOpen) && (
            <span style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "16px", color: "var(--text-primary)" }}>
              TADIT Portal
            </span>
          )}
        </div>

        {/* Navigation list */}
        <nav className="sidebar-menu">
          <button
            onClick={() => { setActiveTab("dashboard"); setIsMobileSidebarOpen(false); }}
            className={`sidebar-item ${activeTab === "dashboard" ? "active" : ""}`}
            title="GIS Dashboard"
          >
            <LayoutDashboard size={18} />
            {(!isSidebarCollapsed || isMobileSidebarOpen) && <span>Dashboard GIS</span>}
          </button>
          
          <button
            onClick={() => { setActiveTab("analytics"); setIsMobileSidebarOpen(false); }}
            className={`sidebar-item ${activeTab === "analytics" ? "active" : ""}`}
            title="Analytics workspace"
          >
            <PieChart size={18} />
            {(!isSidebarCollapsed || isMobileSidebarOpen) && <span>Analytics Hub</span>}
          </button>

          <button
            onClick={() => { setActiveTab("pipeline"); setIsMobileSidebarOpen(false); }}
            className={`sidebar-item ${activeTab === "pipeline" ? "active" : ""}`}
            title="Ingestion Pipeline stream"
          >
            <Layers size={18} />
            {(!isSidebarCollapsed || isMobileSidebarOpen) && <span>Pipeline Monitor</span>}
          </button>

          <button
            onClick={() => { setActiveTab("directory"); setIsMobileSidebarOpen(false); }}
            className={`sidebar-item ${activeTab === "directory" ? "active" : ""}`}
            title="SaaS Business directory table"
          >
            <Library size={18} />
            {(!isSidebarCollapsed || isMobileSidebarOpen) && <span>Twins Directory</span>}
          </button>

          <button
            onClick={() => { setActiveTab("management"); setIsMobileSidebarOpen(false); }}
            className={`sidebar-item ${activeTab === "management" ? "active" : ""}`}
            title="Manage business twins"
          >
            <Building size={18} />
            {(!isSidebarCollapsed || isMobileSidebarOpen) && <span>Business Management</span>}
          </button>
        </nav>

        {/* User profile dropdown and theme chimes at the footer */}
        <div className="sidebar-profile">
          <div 
            className="sidebar-avatar" 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            title="Toggle user profile menu"
          >
            A
          </div>
          {(!isSidebarCollapsed || isMobileSidebarOpen) && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--text-primary)" }}>Admin User</span>
              <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>State Governance</span>
            </div>
          )}

          {isProfileOpen && (
            <div className="profile-dropdown-menu">
              <span className="profile-dropdown-item" onClick={() => { setActiveTab("dashboard"); setIsProfileOpen(false); setIsMobileSidebarOpen(false); }}>SaaS Settings</span>
              <span className="profile-dropdown-item" onClick={() => { setIsMuted(!isMuted); setIsProfileOpen(false); setIsMobileSidebarOpen(false); }}>
                {isMuted ? "Unmute Alarm Chime" : "Mute Alarm Chime"}
              </span>
              <span className="profile-dropdown-item" onClick={() => { setIsProfileOpen(false); setIsMobileSidebarOpen(false); }}>System Diagnostics</span>
            </div>
          )}
        </div>
      </aside>

      {isMobileSidebarOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content Workspace Wrapper */}
      <div className="main-wrapper">
        
        {/* Unified Application Header Controls */}
        <header className="app-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="mobile-hamburger-btn"
              aria-label="Toggle navigation menu"
              style={{ padding: "8px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
            >
              <Menu size={20} />
            </button>
            {/* Breadcrumb Navigation Trail */}
            <div className="breadcrumb-nav">
              <BookOpen size={12} />
              <span>{getBreadcrumbs()}</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            
            {/* Live Clock Display */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600" }}>
              <Clock size={12} style={{ color: "var(--primary)" }} />
              <span>{liveTime}</span>
            </div>

            {/* Alarm volume indicator */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              aria-label={isMuted ? "Unmute sound alerts" : "Mute sound alerts"}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--text-secondary)",
                padding: "8px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center"
              }}
              className="btn-playback"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            {/* Theme switcher */}
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              aria-label="Toggle Dark/Light Theme"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--text-secondary)",
                padding: "8px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center"
              }}
              className="btn-playback"
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Keyboard shortcut info */}
            <button
              onClick={() => setIsShortcutsOpen(true)}
              aria-label="Show Keyboard Shortcuts Info"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--text-secondary)",
                padding: "8px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center"
              }}
              className="btn-playback header-shortcut-btn"
            >
              <Keyboard size={18} />
            </button>

            {/* Notification center */}
            <NotificationCenter
              notifications={notifications}
              onMarkRead={handleMarkNotifRead}
              onMarkAllRead={handleMarkAllNotifsRead}
              onClearAll={handleClearAllNotifs}
              onDismissNotification={handleDismissNotif}
            />
          </div>
        </header>

        {/* Live System Status Bar HUD */}
        <section className="status-bar-ticker" aria-label="System Live Status Panel">
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="dot pulse-green" style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "var(--color-green)"
              }}></span>
              <span style={{ fontWeight: "700", fontSize: "11px" }}>INGEST STREAM: ACTIVE</span>
            </div>
            <span style={{ fontSize: "11px", opacity: 0.7 }}>
              Kafka Buffer: {sparkWindow.length} recs | Sync Frequency: {refreshInterval}ms
            </span>
            <span style={{ fontSize: "11px", opacity: 0.7 }}>
              K8s Cluster Avg CPU: {kubernetesPods.length > 0 
                ? Math.round(kubernetesPods.reduce((a, b) => a + parseInt(b.cpu), 0) / kubernetesPods.length) 
                : 0}%
            </span>
          </div>

          {/* Sync Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <label htmlFor="auto-refresh-check" style={{ fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>Auto Sync:</label>
              <input
                id="auto-refresh-check"
                type="checkbox"
                checked={isAutoRefresh}
                onChange={(e) => setIsAutoRefresh(e.target.checked)}
                style={{ cursor: "pointer" }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: "600" }}>Tick Rate:</span>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                style={{ padding: "2px 6px", fontSize: "11px", borderRadius: "4px", cursor: "pointer" }}
                aria-label="Refresh speed"
              >
                <option value="2000">2.0s</option>
                <option value="4000">4.0s</option>
                <option value="8000">8.0s</option>
                <option value="12000">12.0s</option>
              </select>
            </div>

            <button
              onClick={handleSimulateSync}
              aria-label="Sync telemetry manually"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "11.5px",
                fontWeight: "600"
              }}
            >
              <RefreshCw size={11} className={isLoading ? "spin-animation" : ""} />
              Sync
            </button>

            <span style={{ fontSize: "11px", opacity: 0.8 }}>Last Telemetry Sync: {lastSyncTime}</span>
          </div>
        </section>

        {/* Tab 1: Dashboard Tab */}
        {activeTab === "dashboard" && (
          <main style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Enterprise Dashboard Summary Stats Cards */}
            <div className="stats-grid-row" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
              <div className="card mini-stat-card" style={{ padding: "16px" }}>
                <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase" }}>Total Districts</span>
                <span style={{ display: "block", fontSize: "26px", fontWeight: "800", marginTop: "4px" }}>
                  <AnimatedCounter value={39} />
                </span>
                <span style={{ fontSize: "11px", color: "var(--color-green)", marginTop: "2px", display: "block", fontWeight: "600" }}>100% GIS Coverage</span>
              </div>
              <div className="card mini-stat-card" style={{ padding: "16px" }}>
                <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase" }}>Total Twins</span>
                <span style={{ display: "block", fontSize: "26px", fontWeight: "800", marginTop: "4px" }}>
                  <AnimatedCounter value={kpiStats.total} />
                </span>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px", display: "block" }}>Active IoT Nodes</span>
              </div>
              <div className="card mini-stat-card" style={{ padding: "16px" }}>
                <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase" }}>Healthy Twins</span>
                <span style={{ display: "block", fontSize: "26px", fontWeight: "800", color: "var(--color-green)", marginTop: "4px" }}>
                  <AnimatedCounter value={kpiStats.healthy} />
                </span>
                <span style={{ fontSize: "11px", color: "var(--color-green)", marginTop: "2px", display: "block", fontWeight: "600" }}>Stable Status</span>
              </div>
              <div className="card mini-stat-card" style={{ padding: "16px" }}>
                <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase" }}>Warning Twins</span>
                <span style={{ display: "block", fontSize: "26px", fontWeight: "800", color: "var(--color-amber)", marginTop: "4px" }}>
                  <AnimatedCounter value={kpiStats.warning} />
                </span>
                <span style={{ fontSize: "11px", color: "var(--color-amber)", marginTop: "2px", display: "block" }}>Inspection Flagged</span>
              </div>
              <div className="card mini-stat-card" style={{ padding: "16px" }}>
                <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase" }}>Critical Twins</span>
                <span style={{ display: "block", fontSize: "26px", fontWeight: "800", color: "var(--color-red)", marginTop: "4px" }}>
                  <AnimatedCounter value={kpiStats.critical} />
                </span>
                <span style={{ fontSize: "11px", color: "var(--color-red)", marginTop: "2px", display: "block", fontWeight: "600" }}>Active Anomalies</span>
              </div>
              <div className="card mini-stat-card" style={{ padding: "16px" }}>
                <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase" }}>Average Health</span>
                <span style={{ display: "block", fontSize: "26px", fontWeight: "800", color: "var(--primary)", marginTop: "4px" }}>
                  <AnimatedCounter value={kpiStats.avgHealth} />%
                </span>
                <span style={{ fontSize: "11px", color: "var(--primary)", marginTop: "2px", display: "block", fontWeight: "600" }}>Overall Score</span>
              </div>
              <div className="card mini-stat-card" style={{ padding: "16px" }}>
                <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase" }}>Overall Sentiment</span>
                <span style={{ display: "block", fontSize: "26px", fontWeight: "800", color: "var(--color-green)", marginTop: "4px" }}>
                  <AnimatedCounter value={Math.round(kpiStats.avgSentiment * 100)} />%
                </span>
                <span style={{ fontSize: "11px", color: "var(--color-green)", marginTop: "2px", display: "block" }}>Customer NLP Rating</span>
              </div>
              <div className="card mini-stat-card" style={{ padding: "16px" }}>
                <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase" }}>Total Revenue</span>
                <span style={{ display: "block", fontSize: "26px", fontWeight: "800", color: "var(--color-amber)", marginTop: "4px" }}>
                  ₹<AnimatedCounter value={kpiStats.totalRevenue} /> L
                </span>
                <span style={{ fontSize: "11px", color: "var(--color-amber)", marginTop: "2px", display: "block" }}>Aggregated Earnings</span>
              </div>
            </div>

            {/* Filter controls row */}
            <div className="card filters-row-card" style={{ padding: "12px 18px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", justifyContent: "space-between" }}>
              <div className="filters-left-section" style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <SlidersHorizontal size={14} style={{ color: "var(--text-muted)" }} />
                  <span style={{ fontSize: "12.5px", fontWeight: "700" }}>Filters:</span>
                </div>
                
                {/* Search query input */}
                <div className="search-bar-container" style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <Search size={12} style={{ position: "absolute", left: "8px", color: "var(--text-muted)" }} />
                  <input
                    ref={searchInputRef}
                    className="search-bar-input"
                    type="text"
                    placeholder="Search query (GST, PIN, Name, owner, District)..."
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    style={{ padding: "4px 8px 4px 26px", fontSize: "12px", borderRadius: "6px", width: "240px" }}
                  />
                </div>

                {/* Category select */}
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  style={{ padding: "4px 8px", fontSize: "12px", borderRadius: "6px" }}
                  aria-label="Filter category"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                {/* Risk filter select */}
                <select
                  value={filterRisk}
                  onChange={(e) => setFilterRisk(e.target.value)}
                  style={{ padding: "4px 8px", fontSize: "12px", borderRadius: "6px" }}
                  aria-label="Filter Risk Level"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                </select>

                {/* Health select */}
                <select
                  value={filterHealth}
                  onChange={(e) => setFilterHealth(e.target.value)}
                  style={{ padding: "4px 8px", fontSize: "12px", borderRadius: "6px" }}
                  aria-label="Filter Health Level"
                >
                  <option value="all">All Health states</option>
                  <option value="healthy">Healthy (&gt;= 85%)</option>
                  <option value="warning">Warning (75-84%)</option>
                  <option value="critical">Critical (&lt; 75%)</option>
                </select>

                {/* Reset button */}
                <button
                  onClick={handleResetFilters}
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-secondary)",
                    fontSize: "12px",
                    fontWeight: "600",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                  className="btn-playback"
                >
                  Reset
                </button>
              </div>

              {/* PDF/Excel Actions buttons */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={handleExportCSV}
                  title="Export records to CSV"
                  style={{
                    backgroundColor: "var(--primary-light)",
                    color: "var(--primary)",
                    border: "1px solid var(--primary)",
                    padding: "4px 12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    cursor: "pointer"
                  }}
                >
                  <Download size={12} /> Excel CSV
                </button>
                <button
                  onClick={handlePrintPDF}
                  title="Print Digital Twin Audit Summary"
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                    padding: "4px 12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    cursor: "pointer"
                  }}
                  className="btn-playback"
                >
                  <FileText size={12} /> Print PDF
                </button>
              </div>
            </div>

            {/* Interactive GIS Map & Timeline Panel */}
            <div className="map-grid-container">
              <DistrictMap
                selectedDistrict={selectedDistrict}
                onSelectDistrict={setSelectedDistrict}
                onSelectBusinessId={setSelectedBusinessId}
                onSelectBusiness={handleSelectBusiness}
                districtStats={districtStats}
                businesses={businesses}
                alerts={alerts}
              />
              
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Timeline scrubs */}
                <TimelinePlayback
                   playbackIndex={playbackIndex}
                   onPlaybackChange={setPlaybackIndex}
                   isPlaybackMode={isPlaybackMode}
                   onTogglePlaybackMode={setIsPlaybackMode}
                   selectedBusiness={activeBusiness}
                   viewType={analyticsViewType}
                 />
                
                {/* AI Recommendations playbook triggers */}
                <AIRecommendations
                  alerts={alerts}
                  executionHistory={executionHistory}
                  onExecuteRecommendation={handleExecutePlaybook}
                  onDismissAlert={handleDismissAlert}
                  selectedBusinessId={selectedBusinessId}
                />
              </div>
            </div>
          </main>
        )}

        {/* Tab 2: Analytics tab */}
        {activeTab === "analytics" && (
          <main style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 className="card-title">Tamil Nadu Business Twin Analytics Hub</h2>
                <p className="card-subtitle">Detailed aggregated revenue streams, customer growth rates, and predictive benchmarks</p>
              </div>

              {/* Views switcher */}
              <div style={{ display: "flex", gap: "4px", backgroundColor: "var(--bg-main)", padding: "3px", borderRadius: "8px" }}>
                {["weekly", "monthly", "quarterly", "yearly"].map(view => (
                  <button
                    key={view}
                    onClick={() => setAnalyticsViewType(view)}
                    style={{
                      border: "none",
                      background: analyticsViewType === view ? "var(--bg-surface)" : "transparent",
                      color: analyticsViewType === view ? "var(--text-primary)" : "var(--text-muted)",
                      padding: "4px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                      textTransform: "capitalize"
                    }}
                  >
                    {view}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom SVG Analytics Charts Grid */}
            <div className="analytics-charts-grid">
              
              {/* Chart 1: Revenue prediction & historical monthly */}
              <div className="card" style={{ padding: "16px" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "12px" }}>
                  Live Revenue & Forecast (₹ Lakhs) - {analyticsViewType.toUpperCase()}
                </span>
                
                <div style={{ height: "150px", position: "relative" }}>
                  <svg viewBox="0 0 300 130" width="100%" height="100%" className="forecast-chart-svg">
                    {/* Grid lines */}
                    <line x1="10" y1="20" x2="290" y2="20" stroke="var(--border-color)" strokeWidth="0.5" />
                    <line x1="10" y1="60" x2="290" y2="60" stroke="var(--border-color)" strokeWidth="0.5" />
                    <line x1="10" y1="100" x2="290" y2="100" stroke="var(--border-color)" strokeWidth="0.5" />

                    {/* Area fill */}
                    {chart1Points.fillPath && (
                      <path
                        d={chart1Points.fillPath}
                        fill="rgba(59, 130, 246, 0.15)"
                      />
                    )}
                    {/* Line curve */}
                    {chart1Points.actualPath && (
                      <path
                        d={chart1Points.actualPath}
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth="2.5"
                      />
                    )}
                    {/* Forecast curve */}
                    {chart1Points.forecastPath && (
                      <path
                        d={chart1Points.forecastPath}
                        fill="none"
                        stroke="var(--color-green)"
                        strokeWidth="2.5"
                        strokeDasharray="4,4"
                      />
                    )}
                    
                    {/* Coordinate nodes */}
                    {chart1Points.points.map((p, idx) => (
                      <circle 
                        key={idx} 
                        cx={p.x} 
                        cy={p.y} 
                        r="3.5" 
                        fill="var(--secondary)" 
                      />
                    ))}
                    {chart1Points.forecastPoint && (
                      <circle 
                        cx={chart1Points.forecastPoint.x} 
                        cy={chart1Points.forecastPoint.y} 
                        r="4" 
                        fill="var(--color-green)" 
                      />
                    )}
                  </svg>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>
                  <span>{chartLabels[0]}</span>
                  <span>{chartLabels[Math.round(chartLabels.length / 2)]}</span>
                  <span style={{ color: "var(--color-green)" }}>{chartLabels[chartLabels.length - 1]} (Forecast)</span>
                </div>
              </div>

              {/* Chart 2: Twin Interactions */}
              <div className="card" style={{ padding: "16px" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "12px" }}>
                  Cumulative Digital Twin Interactions (WSS Nodes)
                </span>

                <div style={{ height: "150px" }}>
                  <svg viewBox="0 0 300 130" width="100%" height="100%">
                    <line x1="10" y1="20" x2="290" y2="20" stroke="var(--border-color)" strokeWidth="0.5" />
                    <line x1="10" y1="70" x2="290" y2="70" stroke="var(--border-color)" strokeWidth="0.5" />
                    
                    {/* Steps line */}
                    {chart2SteppedPath.steppedPath && (
                      <path
                        d={chart2SteppedPath.steppedPath}
                        fill="none"
                        stroke="var(--color-green)"
                        strokeWidth="3"
                      />
                    )}

                    {/* Step nodes */}
                    {chart2SteppedPath.points.map((p, idx) => (
                      <circle
                        key={idx}
                        cx={p.x}
                        cy={p.y}
                        r="3"
                        fill="var(--color-green)"
                      />
                    ))}
                  </svg>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>
                  <span>{chartLabels[0]}</span>
                  <span>{chartLabels[Math.round(chartLabels.length / 2)]}</span>
                  <span>{chartLabels[chartLabels.length - 1]}</span>
                </div>
              </div>

              {/* Chart 3: Sentiment Trends NLP */}
              <div className="card" style={{ padding: "16px" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "12px" }}>
                  Customer Sentiment Trend (% Positive NLP reviews)
                </span>

                <div style={{ height: "150px" }}>
                  <svg viewBox="0 0 300 130" width="100%" height="100%">
                    <line x1="10" y1="20" x2="290" y2="20" stroke="var(--border-color)" strokeWidth="0.5" />
                    <line x1="10" y1="70" x2="290" y2="70" stroke="var(--border-color)" strokeWidth="0.5" />
                    {/* Draw bar graphs */}
                    {sentimentData.map((s, i) => {
                      const barWidth = Math.max(6, Math.min(22, 160 / sentimentData.length));
                      const x = 20 + i * (260 / sentimentData.length);
                      const height = Math.max(5, s * 90);
                      const y = 115 - height;
                      return (
                        <rect
                          key={i}
                          x={x}
                          y={y}
                          width={barWidth}
                          height={height}
                          rx="3"
                          fill="var(--primary)"
                          opacity="0.85"
                        />
                      );
                    })}
                  </svg>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>
                  <span>{chartLabels[0]}</span>
                  <span>{chartLabels[Math.round(chartLabels.length / 2)]}</span>
                  <span>{chartLabels[chartLabels.length - 1]}</span>
                </div>
              </div>

            </div>

            {/* Business Twin Comparison Widget */}
            <div className="card">
              <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "16px" }}>
                Business Twin benchmark comparison (Side-by-side)
              </span>

              <div className="comparison-grid" style={{ marginBottom: "16px" }}>
                {/* Select Twin A */}
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "6px" }}>Choose Twin A:</label>
                  <select
                    value={compareIdA}
                    onChange={(e) => setCompareIdA(e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", fontSize: "13px" }}
                  >
                    {businesses.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Select Twin B */}
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "6px" }}>Choose Twin B:</label>
                  <select
                    value={compareIdB}
                    onChange={(e) => setCompareIdB(e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", fontSize: "13px" }}
                  >
                    {businesses.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Comparison stats table */}
              {comparedTwinA && comparedTwinB ? (
                <div className="comparison-grid">
                  <div style={{ border: "1px solid var(--border-color)", padding: "16px", borderRadius: "8px", backgroundColor: "var(--bg-main)" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "12px" }}>Twin A Details</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12.5px" }}>
                      <span><strong>District:</strong> {comparedTwinA.district}</span>
                      <span><strong>Category:</strong> {comparedTwinA.category}</span>
                      <span><strong>GST:</strong> {comparedTwinA.gstNumber}</span>
                      <span><strong>Health Score:</strong> {comparedTwinA.currentHealth}%</span>
                      <div className="comparison-bar-outer">
                        <div className="comparison-bar-inner" style={{ width: `${comparedTwinA.currentHealth}%`, backgroundColor: "var(--primary)" }}></div>
                      </div>
                      <span><strong>Monthly Revenue:</strong> ₹{Math.round((comparedTwinA.baseRevenue || 210) * (comparedTwinA.currentHealth / 100))} Lakhs</span>
                      <span><strong>Avg Sentiment:</strong> {Math.round(comparedTwinA.sentimentScore * 100)}% Positive</span>
                      <span>
                        <strong>Risk Level:</strong>{" "}
                        <span style={{
                          fontWeight: "700",
                          color: comparedTwinA.riskLevel === "high" ? "var(--color-red)" : comparedTwinA.riskLevel === "medium" ? "var(--color-amber)" : "var(--color-green)"
                        }}>
                          {comparedTwinA.riskLevel.toUpperCase()}
                        </span>
                      </span>
                      <span>
                        <strong>Growth Trend:</strong>{" "}
                        <span style={{
                          fontWeight: "700",
                          color: Number(((comparedTwinA.history[11].health - comparedTwinA.history[0].health) / comparedTwinA.history[0].health * 100)) >= 0 ? "var(--color-green)" : "var(--color-red)"
                        }}>
                          {((comparedTwinA.history[11].health - comparedTwinA.history[0].health) / comparedTwinA.history[0].health * 100).toFixed(1)}% (12M)
                        </span>
                      </span>
                    </div>
                  </div>

                  <div style={{ border: "1px solid var(--border-color)", padding: "16px", borderRadius: "8px", backgroundColor: "var(--bg-main)" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "12px" }}>Twin B Details</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12.5px" }}>
                      <span><strong>District:</strong> {comparedTwinB.district}</span>
                      <span><strong>Category:</strong> {comparedTwinB.category}</span>
                      <span><strong>GST:</strong> {comparedTwinB.gstNumber}</span>
                      <span><strong>Health Score:</strong> {comparedTwinB.currentHealth}%</span>
                      <div className="comparison-bar-outer">
                        <div className="comparison-bar-inner" style={{ width: `${comparedTwinB.currentHealth}%`, backgroundColor: "var(--color-green)" }}></div>
                      </div>
                      <span><strong>Monthly Revenue:</strong> ₹{Math.round((comparedTwinB.baseRevenue || 210) * (comparedTwinB.currentHealth / 100))} Lakhs</span>
                      <span><strong>Avg Sentiment:</strong> {Math.round(comparedTwinB.sentimentScore * 100)}% Positive</span>
                      <span>
                        <strong>Risk Level:</strong>{" "}
                        <span style={{
                          fontWeight: "700",
                          color: comparedTwinB.riskLevel === "high" ? "var(--color-red)" : comparedTwinB.riskLevel === "medium" ? "var(--color-amber)" : "var(--color-green)"
                        }}>
                          {comparedTwinB.riskLevel.toUpperCase()}
                        </span>
                      </span>
                      <span>
                        <strong>Growth Trend:</strong>{" "}
                        <span style={{
                          fontWeight: "700",
                          color: Number(((comparedTwinB.history[11].health - comparedTwinB.history[0].health) / comparedTwinB.history[0].health * 100)) >= 0 ? "var(--color-green)" : "var(--color-red)"
                        }}>
                          {((comparedTwinB.history[11].health - comparedTwinB.history[0].health) / comparedTwinB.history[0].health * 100).toFixed(1)}% (12M)
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Select two businesses from the dropdown above to load comparison.</p>
              )}
            </div>

            {/* Dynamic Rankings & Sector Distributions Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
              {/* Card 1: Performance rankings */}
              <div className="card" style={{ padding: "16px" }}>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "12px" }}>
                  Digital Twin Health & Performance
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <h4 style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Top Performing (Health Score)</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {analyticsData.topPerforming.slice(0, 3).map((b, idx) => (
                        <div key={b.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
                          <span>{idx+1}. {b.name}</span>
                          <strong style={{ color: "var(--color-green)" }}>{b.currentHealth}%</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Lowest Performing (Health Score)</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {analyticsData.lowestPerforming.slice(0, 3).map((b, idx) => (
                        <div key={b.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
                          <span>{idx+1}. {b.name}</span>
                          <strong style={{ color: "var(--color-red)" }}>{b.currentHealth}%</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Financial Rankings */}
              <div className="card" style={{ padding: "16px" }}>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "12px" }}>
                  Revenue & Regional Rankings
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <h4 style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Top Revenue Earners (₹ Lakhs)</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {analyticsData.revenueRanking.slice(0, 3).map((b, idx) => (
                        <div key={b.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
                          <span>{idx+1}. {b.name}</span>
                          <strong style={{ color: "var(--color-amber)" }}>₹{b.revenue} Lakhs</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Top Districts (Avg Health)</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {analyticsData.districtRanking.slice(0, 3).map((d, idx) => (
                        <div key={d.district} style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
                          <span>{idx+1}. {d.district} ({d.count} twins)</span>
                          <strong style={{ color: "var(--primary)" }}>{d.avgHealth}% health</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Distributions */}
              <div className="card" style={{ padding: "16px" }}>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "12px" }}>
                  Risk & Sentiment Distribution
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <h4 style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Risk Distribution</h4>
                    <div style={{ display: "flex", gap: "10px", fontSize: "12px" }}>
                      <span style={{ color: "var(--color-green)", padding: "2px 6px", backgroundColor: "rgba(16, 185, 129, 0.12)", borderRadius: "4px" }}>
                        Low: {analyticsData.riskLevels.low}
                      </span>
                      <span style={{ color: "var(--color-amber)", padding: "2px 6px", backgroundColor: "rgba(245, 158, 11, 0.12)", borderRadius: "4px" }}>
                        Med: {analyticsData.riskLevels.medium}
                      </span>
                      <span style={{ color: "var(--color-red)", padding: "2px 6px", backgroundColor: "rgba(239, 68, 68, 0.12)", borderRadius: "4px" }}>
                        High: {analyticsData.riskLevels.high}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>NLP Sentiment Distribution</h4>
                    <div style={{ display: "flex", gap: "10px", fontSize: "12px" }}>
                      <span style={{ color: "var(--color-green)", padding: "2px 6px", backgroundColor: "rgba(16, 185, 129, 0.12)", borderRadius: "4px" }}>
                        Excellent: {analyticsData.sentimentRanges.excellent}
                      </span>
                      <span style={{ color: "var(--primary)", padding: "2px 6px", backgroundColor: "var(--primary-light)", borderRadius: "4px" }}>
                        Good: {analyticsData.sentimentRanges.good}
                      </span>
                      <span style={{ color: "var(--color-red)", padding: "2px 6px", backgroundColor: "rgba(239, 68, 68, 0.12)", borderRadius: "4px" }}>
                        Poor: {analyticsData.sentimentRanges.poor}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        )}

        {/* Tab 3: Pipeline Monitor (Lazy loaded) */}
        {activeTab === "pipeline" && (
          <Suspense fallback={<CardSkeleton />}>
            <ErrorBoundary onReset={() => setActiveTab("dashboard")}>
              <PipelineVisualizer
                kafkaQueue={kafkaQueue}
                sparkWindow={sparkWindow}
                kubernetesPods={kubernetesPods}
                logs={logs}
                selectedBusinessId={selectedBusinessId}
              />
            </ErrorBoundary>
          </Suspense>
        )}

        {/* Tab 4: Twin Directory Datatable (All 156 items paginated) */}
        {activeTab === "directory" && (
          <main style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 className="card-title">TN Central Digital Twin Directory Log</h2>
                <p className="card-subtitle">List of all {businesses.length} registered business twins across the 39 state zones</p>
              </div>

              {/* Quick CSV Export */}
              <button
                onClick={handleExportCSV}
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--bg-primary)",
                  border: "none",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  cursor: "pointer"
                }}
              >
                <Download size={12} /> Export CSV
              </button>
            </div>

            {/* Filter controls row */}
            <div className="card filters-row-card" style={{ padding: "12px 18px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
              <div className="filters-left-section" style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
                <div className="search-bar-container" style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <Search size={12} style={{ position: "absolute", left: "8px", color: "var(--text-muted)" }} />
                  <input
                    className="search-bar-input"
                    type="text"
                    placeholder="Filter name, owner, GST, Pincode..."
                    value={globalSearch}
                    onChange={(e) => {
                      setGlobalSearch(e.target.value);
                      setDirCurrentPage(1);
                    }}
                    style={{ padding: "4px 8px 4px 26px", fontSize: "12px", borderRadius: "6px", width: "240px" }}
                  />
                </div>

                {/* Categories Filter */}
                <select
                  value={filterCategory}
                  onChange={(e) => {
                    setFilterCategory(e.target.value);
                    setDirCurrentPage(1);
                  }}
                  style={{ padding: "4px 8px", fontSize: "12px", borderRadius: "6px" }}
                  aria-label="Filter category"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                {/* District Filter */}
                <select
                  value={filterDistrict}
                  onChange={(e) => {
                    setFilterDistrict(e.target.value);
                    setDirCurrentPage(1);
                  }}
                  style={{ padding: "4px 8px", fontSize: "12px", borderRadius: "6px", width: "140px" }}
                  aria-label="Filter District"
                >
                  <option value="all">All Districts</option>
                  {Array.from(new Set(businesses.map(b => b.district))).sort().map(dist => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>

                {/* Risk Level Filter */}
                <select
                  value={filterRisk}
                  onChange={(e) => {
                    setFilterRisk(e.target.value);
                    setDirCurrentPage(1);
                  }}
                  style={{ padding: "4px 8px", fontSize: "12px", borderRadius: "6px" }}
                  aria-label="Filter Risk Level"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                </select>

                <button
                  onClick={handleResetFilters}
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-secondary)",
                    fontSize: "12px",
                    fontWeight: "600",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                  className="btn-playback"
                >
                  Clear Filters
                </button>
              </div>

              <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "auto" }}>
                Found {filteredBusinesses.length} match records
              </span>
            </div>

            {/* Datatable Grid */}
            <div className="table-responsive-wrapper" style={{ overflowX: "auto" }}>
              <div className="desktop-only-table">
                <table className="districts-table" style={{ fontSize: "13px" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "12px 16px" }}>Business Name</th>
                      <th style={{ padding: "12px 16px" }}>Category</th>
                      <th style={{ padding: "12px 16px" }}>District</th>
                      <th style={{ padding: "12px 16px" }}>Pincode</th>
                      <th style={{ padding: "12px 16px" }}>GST Number</th>
                      <th style={{ padding: "12px 16px" }}>Health</th>
                      <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedBusinesses.map((biz) => {
                      let healthColor = "var(--color-green)";
                      if (biz.currentHealth < 75) healthColor = "var(--color-red)";
                      else if (biz.currentHealth < 85) healthColor = "var(--color-amber)";

                      return (
                        <tr
                          key={biz.id}
                          style={{
                            borderBottom: "1px solid var(--border-color)",
                            cursor: "pointer",
                            transition: "background 0.2s"
                          }}
                          onClick={() => handleSelectBusiness(biz.id)}
                          className="district-row-hover"
                        >
                          <td style={{ padding: "12px 16px", fontWeight: "600", color: "var(--text-primary)" }}>{biz.name}</td>
                          <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{biz.category}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <MapPin size={11} style={{ color: "var(--text-muted)" }} />
                              {biz.district}
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px", fontFamily: "var(--font-mono)", fontSize: "12px" }}>{biz.pincode}</td>
                          <td style={{ padding: "12px 16px", fontFamily: "var(--font-mono)", fontSize: "12px" }}>{biz.gstNumber}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{
                              color: healthColor,
                              fontWeight: "700",
                              backgroundColor: healthColor === "var(--color-green)" ? "rgba(16, 185, 129, 0.12)" : healthColor === "var(--color-amber)" ? "rgba(245, 158, 11, 0.12)" : "rgba(239, 68, 68, 0.12)",
                              padding: "2px 6px",
                              borderRadius: "4px"
                            }}>
                              {biz.currentHealth}%
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "right" }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectBusiness(biz.id);
                              }}
                              style={{
                                border: "1px solid var(--border-color)",
                                backgroundColor: "var(--bg-surface)",
                                color: "var(--primary)",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "11.5px"
                              }}
                              className="btn-playback"
                            >
                              Sync Twin
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Layout */}
              <div className="mobile-only-cards">
                {paginatedBusinesses.map((biz) => {
                  let healthColor = "var(--color-green)";
                  if (biz.currentHealth < 75) healthColor = "var(--color-red)";
                  else if (biz.currentHealth < 85) healthColor = "var(--color-amber)";

                  return (
                    <div 
                      key={biz.id} 
                      className="card mobile-business-card"
                      onClick={() => handleSelectBusiness(biz.id)}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        padding: "16px",
                        cursor: "pointer",
                        border: "1px solid var(--border-color)",
                        borderRadius: "12px",
                        backgroundColor: "var(--bg-card)"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <h4 className="text-truncate" style={{ margin: 0, fontSize: "14px", fontWeight: "700" }}>{biz.name}</h4>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginTop: "2px" }}>Category: {biz.category}</span>
                        </div>
                        <span style={{
                          color: healthColor,
                          fontWeight: "700",
                          backgroundColor: healthColor === "var(--color-green)" ? "rgba(16, 185, 129, 0.12)" : healthColor === "var(--color-amber)" ? "rgba(245, 158, 11, 0.12)" : "rgba(239, 68, 68, 0.12)",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "11.5px",
                          whiteSpace: "nowrap"
                        }}>
                          {biz.currentHealth}% Health
                        </span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px", color: "var(--text-secondary)" }}>
                        <div className="text-truncate">
                          <strong>Owner:</strong> {biz.owner || "N/A"}
                        </div>
                        <div className="text-truncate">
                          <strong>District:</strong> {biz.district}
                        </div>
                        <div style={{ gridColumn: "span 2" }} className="text-break">
                          <strong>GST:</strong> <span style={{ fontFamily: "var(--font-mono)", fontSize: "11.5px" }}>{biz.gstNumber}</span>
                        </div>
                        <div style={{ gridColumn: "span 2" }} className="text-truncate">
                          <strong>PIN:</strong> <span style={{ fontFamily: "var(--font-mono)" }}>{biz.pincode}</span>
                        </div>
                      </div>

                      <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "10px", marginTop: "4px" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectBusiness(biz.id);
                          }}
                          style={{
                            border: "1px solid var(--primary)",
                            backgroundColor: "var(--primary-light)",
                            color: "var(--primary)",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "12.5px",
                            fontWeight: "700",
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                        >
                          Sync Twin
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

              {/* Pagination controls footer */}
              {totalDirPages > 1 && (
                <div style={{
                  padding: "12px 16px",
                  borderTop: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-main)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <button
                    disabled={dirCurrentPage === 1}
                    onClick={() => setDirCurrentPage(prev => Math.max(1, prev - 1))}
                    style={{
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-surface)",
                      padding: "4px 10px",
                      borderRadius: "4px",
                      cursor: dirCurrentPage === 1 ? "not-allowed" : "pointer",
                      opacity: dirCurrentPage === 1 ? 0.5 : 1,
                      fontSize: "12px"
                    }}
                  >
                    Previous
                  </button>
                  <span style={{ fontSize: "12.5px" }}>
                    Page <strong>{dirCurrentPage}</strong> of {totalDirPages}
                  </span>
                  <button
                    disabled={dirCurrentPage === totalDirPages}
                    onClick={() => setDirCurrentPage(prev => Math.min(totalDirPages, prev + 1))}
                    style={{
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-surface)",
                      padding: "4px 10px",
                      borderRadius: "4px",
                      cursor: dirCurrentPage === totalDirPages ? "not-allowed" : "pointer",
                      opacity: dirCurrentPage === totalDirPages ? 0.5 : 1,
                      fontSize: "12px"
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
          </main>
        )}

        {/* Tab 5: Business Management (CRUD View) */}
        {activeTab === "management" && (
          <main style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 className="card-title">Digital Twin Business Management</h2>
                <p className="card-subtitle">Register new IoT business twins, modify existing telemetry, or de-register decommissioned twin nodes</p>
              </div>

              <button
                onClick={() => {
                  setFormMode("add");
                  setFormData({
                    name: "",
                    owner: "",
                    category: "Retail",
                    district: "Chennai",
                    address: "",
                    pincode: "",
                    phone: "",
                    email: "",
                    website: "",
                    gstNumber: "",
                    registrationNo: "",
                    latitude: "13.0827",
                    longitude: "80.2707",
                    health: "90",
                    rating: "4.0",
                    sentimentScore: "0.8",
                    riskLevel: "low",
                    revenue: "250",
                    openingHours: "09:00 AM - 09:00 PM",
                    description: ""
                  });
                  setFormErrors({});
                  setIsFormModalOpen(true);
                }}
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--bg-primary)",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontSize: "12.5px",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer"
                }}
              >
                <Plus size={15} /> Add Business Twin
              </button>
            </div>

            {/* Filter controls row */}
            <div className="card filters-row-card" style={{ padding: "12px 18px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
              <div className="filters-left-section" style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
                <div className="search-bar-container" style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <Search size={12} style={{ position: "absolute", left: "8px", color: "var(--text-muted)" }} />
                  <input
                    className="search-bar-input"
                    type="text"
                    placeholder="Search name, owner, GST, Reg No, PIN..."
                    value={mgtSearch}
                    onChange={(e) => {
                      setMgtSearch(e.target.value);
                      setMgtCurrentPage(1);
                    }}
                    style={{ padding: "4px 8px 4px 26px", fontSize: "12px", borderRadius: "6px", width: "260px" }}
                  />
                </div>

                {/* Categories Filter */}
                <select
                  value={mgtCategory}
                  onChange={(e) => {
                    setMgtCategory(e.target.value);
                    setMgtCurrentPage(1);
                  }}
                  style={{ padding: "4px 8px", fontSize: "12px", borderRadius: "6px" }}
                  aria-label="Filter Category"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                {/* Districts Filter */}
                <select
                  value={mgtDistrict}
                  onChange={(e) => {
                    setMgtDistrict(e.target.value);
                    setMgtCurrentPage(1);
                  }}
                  style={{ padding: "4px 8px", fontSize: "12px", borderRadius: "6px", width: "140px" }}
                  aria-label="Filter District"
                >
                  <option value="all">All Districts</option>
                  {districts.map(dist => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    setMgtSearch("");
                    setMgtCategory("all");
                    setMgtDistrict("all");
                    setMgtCurrentPage(1);
                  }}
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-secondary)",
                    fontSize: "12px",
                    fontWeight: "600",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                  className="btn-playback"
                >
                  Clear Filters
                </button>
              </div>

              <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "auto" }}>
                Found {filteredMgtBusinesses.length} twin nodes
              </span>
            </div>

            {/* Datatable */}
            <div className="table-responsive-wrapper" style={{ overflowX: "auto" }}>
              <div className="desktop-only-table">
                <table className="districts-table" style={{ fontSize: "13px" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "12px 16px" }}>Business Twin</th>
                      <th style={{ padding: "12px 16px" }}>Owner & Contact</th>
                      <th style={{ padding: "12px 16px" }}>Category</th>
                      <th style={{ padding: "12px 16px" }}>District</th>
                      <th style={{ padding: "12px 16px" }}>GST / Reg No</th>
                      <th style={{ padding: "12px 16px" }}>Health</th>
                      <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedMgtBusinesses.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                          No matching digital twins found. Click "Add Business Twin" to register one.
                        </td>
                      </tr>
                    ) : (
                      paginatedMgtBusinesses.map((biz) => {
                        let healthColor = "var(--color-green)";
                        if (biz.currentHealth < 75) healthColor = "var(--color-red)";
                        else if (biz.currentHealth < 85) healthColor = "var(--color-amber)";

                        return (
                          <tr
                            key={biz.id}
                            style={{
                              borderBottom: "1px solid var(--border-color)",
                              transition: "background 0.2s"
                            }}
                            className="district-row-hover"
                          >
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>{biz.name}</span>
                                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>ID: {biz.id}</span>
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ color: "var(--text-primary)", fontWeight: "500" }}>{biz.owner}</span>
                                <span style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>{biz.email}</span>
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{biz.category}</td>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <MapPin size={11} style={{ color: "var(--text-muted)" }} />
                                {biz.district}
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", flexDirection: "column", fontFamily: "var(--font-mono)", fontSize: "11.5px" }}>
                                <span>GST: {biz.gstNumber}</span>
                                <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>Reg: {biz.registrationNo}</span>
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <span style={{
                                color: healthColor,
                                fontWeight: "700",
                                backgroundColor: healthColor === "var(--color-green)" ? "rgba(16, 185, 129, 0.12)" : healthColor === "var(--color-amber)" ? "rgba(245, 158, 11, 0.12)" : "rgba(239, 68, 68, 0.12)",
                                padding: "2px 6px",
                                borderRadius: "4px"
                              }}>
                                {biz.currentHealth}%
                              </span>
                            </td>
                            <td style={{ padding: "12px 16px", textAlign: "right" }}>
                              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                                <button
                                  onClick={() => handleEditClick(biz)}
                                  title="Edit Business Details"
                                  style={{
                                    border: "1px solid var(--border-color)",
                                    backgroundColor: "var(--bg-surface)",
                                    color: "var(--primary)",
                                    padding: "6px",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                  }}
                                  className="btn-playback"
                                >
                                  <Edit3 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(biz.id)}
                                  title="De-register Business"
                                  style={{
                                    border: "1px solid rgba(239, 68, 68, 0.2)",
                                    backgroundColor: "var(--bg-surface)",
                                    color: "var(--color-red)",
                                    padding: "6px",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                  }}
                                  className="btn-playback"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Layout */}
              <div className="mobile-only-cards">
                {paginatedMgtBusinesses.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)", width: "100%" }}>
                    No matching digital twins found. Click "Add Business Twin" to register one.
                  </div>
                ) : (
                  paginatedMgtBusinesses.map((biz) => {
                    let healthColor = "var(--color-green)";
                    if (biz.currentHealth < 75) healthColor = "var(--color-red)";
                    else if (biz.currentHealth < 85) healthColor = "var(--color-amber)";

                    return (
                      <div 
                        key={biz.id} 
                        className="card mobile-business-card"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                          padding: "16px",
                          border: "1px solid var(--border-color)",
                          borderRadius: "12px",
                          backgroundColor: "var(--bg-card)"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <h4 className="text-truncate" style={{ margin: 0, fontSize: "14px", fontWeight: "700" }}>{biz.name}</h4>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginTop: "2px" }}>ID: {biz.id} | Category: {biz.category}</span>
                          </div>
                          <span style={{
                            color: healthColor,
                            fontWeight: "700",
                            backgroundColor: healthColor === "var(--color-green)" ? "rgba(16, 185, 129, 0.12)" : healthColor === "var(--color-amber)" ? "rgba(245, 158, 11, 0.12)" : "rgba(239, 68, 68, 0.12)",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontSize: "11.5px",
                            whiteSpace: "nowrap"
                          }}>
                            {biz.currentHealth}% Health
                          </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px", color: "var(--text-secondary)" }}>
                          <div className="text-truncate">
                            <strong>Owner:</strong> {biz.owner}
                          </div>
                          <div className="text-truncate">
                            <strong>District:</strong> {biz.district}
                          </div>
                          <div style={{ gridColumn: "span 2" }} className="text-break">
                            <strong>Email:</strong> {biz.email}
                          </div>
                          <div style={{ gridColumn: "span 2" }} className="text-break">
                            <strong>GST:</strong> <span style={{ fontFamily: "var(--font-mono)", fontSize: "11.5px" }}>{biz.gstNumber}</span>
                          </div>
                          <div style={{ gridColumn: "span 2" }} className="text-truncate">
                            <strong>Reg:</strong> <span style={{ fontFamily: "var(--font-mono)" }}>{biz.registrationNo}</span>
                          </div>
                        </div>

                        <div style={{ 
                          borderTop: "1px solid var(--border-color)", 
                          paddingTop: "10px", 
                          marginTop: "4px", 
                          display: "flex", 
                          justifyContent: "flex-end", 
                          gap: "10px" 
                        }}>
                          <button
                            onClick={() => handleEditClick(biz)}
                            title="Edit Business Details"
                            style={{
                              border: "1px solid var(--border-color)",
                              backgroundColor: "var(--bg-surface)",
                              color: "var(--primary)",
                              padding: "8px 16px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              flex: 1,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              fontSize: "12.5px",
                              fontWeight: "600"
                            }}
                            className="btn-playback"
                          >
                            <Edit3 size={13} /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(biz.id)}
                            title="De-register Business"
                            style={{
                              border: "1px solid rgba(239, 68, 68, 0.2)",
                              backgroundColor: "var(--bg-surface)",
                              color: "var(--color-red)",
                              padding: "8px 16px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              flex: 1,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              fontSize: "12.5px",
                              fontWeight: "600"
                            }}
                            className="btn-playback"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Pagination controls footer */}
              {totalMgtPages > 1 && (
                <div style={{
                  padding: "12px 16px",
                  borderTop: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-main)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <button
                    disabled={mgtCurrentPage === 1}
                    onClick={() => setMgtCurrentPage(prev => Math.max(1, prev - 1))}
                    style={{
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-surface)",
                      padding: "4px 10px",
                      borderRadius: "4px",
                      cursor: mgtCurrentPage === 1 ? "not-allowed" : "pointer",
                      opacity: mgtCurrentPage === 1 ? 0.5 : 1,
                      fontSize: "12px"
                    }}
                  >
                    Previous
                  </button>
                  <span style={{ fontSize: "12.5px" }}>
                    Page <strong>{mgtCurrentPage}</strong> of {totalMgtPages}
                  </span>
                  <button
                    disabled={mgtCurrentPage === totalMgtPages}
                    onClick={() => setMgtCurrentPage(prev => Math.min(totalMgtPages, prev + 1))}
                    style={{
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-surface)",
                      padding: "4px 10px",
                      borderRadius: "4px",
                      cursor: mgtCurrentPage === totalMgtPages ? "not-allowed" : "pointer",
                      opacity: mgtCurrentPage === totalMgtPages ? 0.5 : 1,
                      fontSize: "12px"
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
          </main>
        )}

      </div>

      {/* Slide Details Side Drawer Portal */}
      <BusinessProfile
        business={activeBusiness}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        selectedDistrict={selectedDistrict}
        onInjectAnomaly={handleInjectAnomaly}
        alerts={alerts}
      />

      {/* Form Modal for Add / Edit Business */}
      {isFormModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", overflowY: "auto", padding: "20px" }} onClick={() => setIsFormModalOpen(false)}>
          <div className="modal-content form-modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "var(--text-primary)" }}>
                {formMode === "add" ? "Register New Business Twin" : `Edit Twin: ${formData.name}`}
              </h3>
              <button 
                onClick={() => setIsFormModalOpen(false)} 
                className="btn-playback"
                style={{ border: "none", background: "none", cursor: "pointer", display: "flex", color: "var(--text-muted)" }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveBusiness} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <div className="form-scroll-body" style={{ flex: 1, overflowY: "auto", paddingRight: "4px", paddingBottom: "16px", display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Form Grid sections */}
              <div className="mgt-form-grid">
                
                {/* Column 1: General Details */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "13px", fontWeight: "700", color: "var(--primary)", borderBottom: "1px solid var(--border-color)", paddingBottom: "4px" }}>General Information</h4>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--text-secondary)" }}>Company Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{ padding: "6px 8px", fontSize: "12.5px", borderRadius: "4px", border: formErrors.name ? "1px solid var(--color-red)" : "1px solid var(--border-color)" }}
                    />
                    {formErrors.name && <span style={{ fontSize: "10.5px", color: "var(--color-red)" }}>{formErrors.name}</span>}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--text-secondary)" }}>Owner *</label>
                    <input
                      type="text"
                      value={formData.owner}
                      onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                      style={{ padding: "6px 8px", fontSize: "12.5px", borderRadius: "4px", border: formErrors.owner ? "1px solid var(--color-red)" : "1px solid var(--border-color)" }}
                    />
                    {formErrors.owner && <span style={{ fontSize: "10.5px", color: "var(--color-red)" }}>{formErrors.owner}</span>}
                  </div>

                  <div className="form-subgrid">
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--text-secondary)" }}>Category *</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        style={{ padding: "6px 8px", fontSize: "12.5px", borderRadius: "4px", border: formErrors.category ? "1px solid var(--color-red)" : "1px solid var(--border-color)" }}
                      >
                        <option value="Retail">Retail</option>
                        <option value="Food & Beverage">Food & Beverage</option>
                        <option value="Services">Services</option>
                        <option value="Apparel & Fashion">Apparel & Fashion</option>
                        <option value="Electronics & Tech">Electronics & Tech</option>
                        <option value="Healthcare & Pharma">Healthcare & Pharma</option>
                        <option value="Education">Education</option>
                        <option value="Manufacturing">Manufacturing</option>
                      </select>
                      {formErrors.category && <span style={{ fontSize: "10.5px", color: "var(--color-red)" }}>{formErrors.category}</span>}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--text-secondary)" }}>District *</label>
                      <select
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        style={{ padding: "6px 8px", fontSize: "12.5px", borderRadius: "4px", border: formErrors.district ? "1px solid var(--color-red)" : "1px solid var(--border-color)" }}
                      >
                        {districts.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      {formErrors.district && <span style={{ fontSize: "10.5px", color: "var(--color-red)" }}>{formErrors.district}</span>}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--text-secondary)" }}>Opening Hours</label>
                    <input
                      type="text"
                      placeholder="e.g. 09:00 AM - 09:00 PM"
                      value={formData.openingHours}
                      onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
                      style={{ padding: "6px 8px", fontSize: "12.5px", borderRadius: "4px", border: "1px solid var(--border-color)" }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--text-secondary)" }}>Description</label>
                    <textarea
                      rows="3"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      style={{ padding: "6px 8px", fontSize: "12.5px", borderRadius: "4px", border: "1px solid var(--border-color)", resize: "vertical", fontFamily: "inherit" }}
                    />
                  </div>
                </div>

                {/* Column 2: Contact, Location & Diagnostics */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "13px", fontWeight: "700", color: "var(--primary)", borderBottom: "1px solid var(--border-color)", paddingBottom: "4px" }}>Contact & Location</h4>

                  <div className="form-subgrid">
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--text-secondary)" }}>Phone *</label>
                      <input
                        type="text"
                        placeholder="10-digit number"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        style={{ padding: "6px 8px", fontSize: "12.5px", borderRadius: "4px", border: formErrors.phone ? "1px solid var(--color-red)" : "1px solid var(--border-color)" }}
                      />
                      {formErrors.phone && <span style={{ fontSize: "10.5px", color: "var(--color-red)" }}>{formErrors.phone}</span>}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--text-secondary)" }}>Email *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        style={{ padding: "6px 8px", fontSize: "12.5px", borderRadius: "4px", border: formErrors.email ? "1px solid var(--color-red)" : "1px solid var(--border-color)" }}
                      />
                      {formErrors.email && <span style={{ fontSize: "10.5px", color: "var(--color-red)" }}>{formErrors.email}</span>}
                    </div>
                  </div>

                  <div className="form-subgrid">
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--text-secondary)" }}>Website</label>
                      <input
                        type="text"
                        placeholder="URL (optional)"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        style={{ padding: "6px 8px", fontSize: "12.5px", borderRadius: "4px", border: "1px solid var(--border-color)" }}
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--text-secondary)" }}>Pincode *</label>
                      <input
                        type="text"
                        placeholder="6-digit PIN"
                        value={formData.pincode}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                        style={{ padding: "6px 8px", fontSize: "12.5px", borderRadius: "4px", border: formErrors.pincode ? "1px solid var(--color-red)" : "1px solid var(--border-color)" }}
                      />
                      {formErrors.pincode && <span style={{ fontSize: "10.5px", color: "var(--color-red)" }}>{formErrors.pincode}</span>}
                    </div>
                  </div>

                  <div className="form-subgrid">
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--text-secondary)" }}>GST Number *</label>
                      <input
                        type="text"
                        placeholder="e.g. 33AAAAF1234K1Z1"
                        value={formData.gstNumber}
                        onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                        style={{ padding: "6px 8px", fontSize: "12.5px", borderRadius: "4px", textTransform: "uppercase", border: formErrors.gstNumber ? "1px solid var(--color-red)" : "1px solid var(--border-color)" }}
                      />
                      {formErrors.gstNumber && <span style={{ fontSize: "10.5px", color: "var(--color-red)" }}>{formErrors.gstNumber}</span>}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--text-secondary)" }}>Registration No. *</label>
                      <input
                        type="text"
                        value={formData.registrationNo}
                        onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value })}
                        style={{ padding: "6px 8px", fontSize: "12.5px", borderRadius: "4px", textTransform: "uppercase", border: formErrors.registrationNo ? "1px solid var(--color-red)" : "1px solid var(--border-color)" }}
                      />
                      {formErrors.registrationNo && <span style={{ fontSize: "10.5px", color: "var(--color-red)" }}>{formErrors.registrationNo}</span>}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--text-secondary)" }}>Street Address *</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      style={{ padding: "6px 8px", fontSize: "12.5px", borderRadius: "4px", border: formErrors.address ? "1px solid var(--color-red)" : "1px solid var(--border-color)" }}
                    />
                    {formErrors.address && <span style={{ fontSize: "10.5px", color: "var(--color-red)" }}>{formErrors.address}</span>}
                  </div>

                  <div className="form-subgrid">
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--text-secondary)" }}>Latitude *</label>
                      <input
                        type="number"
                        step="0.0001"
                        placeholder="e.g. 13.0827"
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                        style={{ padding: "6px 8px", fontSize: "12.5px", borderRadius: "4px", border: formErrors.latitude ? "1px solid var(--color-red)" : "1px solid var(--border-color)" }}
                      />
                      {formErrors.latitude && <span style={{ fontSize: "10.5px", color: "var(--color-red)" }}>{formErrors.latitude}</span>}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--text-secondary)" }}>Longitude *</label>
                      <input
                        type="number"
                        step="0.0001"
                        placeholder="e.g. 80.2707"
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                        style={{ padding: "6px 8px", fontSize: "12.5px", borderRadius: "4px", border: formErrors.longitude ? "1px solid var(--color-red)" : "1px solid var(--border-color)" }}
                      />
                      {formErrors.longitude && <span style={{ fontSize: "10.5px", color: "var(--color-red)" }}>{formErrors.longitude}</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Initial Metrics & Risk */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
                <h4 style={{ margin: "0 0 4px 0", fontSize: "13px", fontWeight: "700", color: "var(--primary)" }}>Twin Node Initial Metrics</h4>
                
                <div className="mgt-metrics-row">
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--text-secondary)" }}>Health Score (0-100)</label>
                    <input
                      type="number"
                      value={formData.health}
                      onChange={(e) => setFormData({ ...formData, health: e.target.value })}
                      style={{ padding: "6px 8px", fontSize: "12.5px", borderRadius: "4px", border: formErrors.health ? "1px solid var(--color-red)" : "1px solid var(--border-color)" }}
                    />
                    {formErrors.health && <span style={{ fontSize: "10.5px", color: "var(--color-red)" }}>{formErrors.health}</span>}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--text-secondary)" }}>Rating (1.0-5.0)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                      style={{ padding: "6px 8px", fontSize: "12.5px", borderRadius: "4px", border: formErrors.rating ? "1px solid var(--color-red)" : "1px solid var(--border-color)" }}
                    />
                    {formErrors.rating && <span style={{ fontSize: "10.5px", color: "var(--color-red)" }}>{formErrors.rating}</span>}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--text-secondary)" }}>Sentiment Score (0-1)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.sentimentScore}
                      onChange={(e) => setFormData({ ...formData, sentimentScore: e.target.value })}
                      style={{ padding: "6px 8px", fontSize: "12.5px", borderRadius: "4px", border: formErrors.sentimentScore ? "1px solid var(--color-red)" : "1px solid var(--border-color)" }}
                    />
                    {formErrors.sentimentScore && <span style={{ fontSize: "10.5px", color: "var(--color-red)" }}>{formErrors.sentimentScore}</span>}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--text-secondary)" }}>Risk Level</label>
                    <select
                      value={formData.riskLevel}
                      onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value })}
                      style={{ padding: "6px 8px", fontSize: "12.5px", borderRadius: "4px", border: "1px solid var(--border-color)" }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--text-secondary)" }}>Base Revenue (₹ L)</label>
                    <input
                      type="number"
                      value={formData.revenue}
                      onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
                      style={{ padding: "6px 8px", fontSize: "12.5px", borderRadius: "4px", border: formErrors.revenue ? "1px solid var(--color-red)" : "1px solid var(--border-color)" }}
                    />
                    {formErrors.revenue && <span style={{ fontSize: "10.5px", color: "var(--color-red)" }}>{formErrors.revenue}</span>}
                  </div>
                </div>
              </div>

              </div> {/* Closing form-scroll-body */}

              {/* Form Buttons */}
              <div className="form-footer-buttons" style={{ flexShrink: 0, display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid var(--border-color)", paddingTop: "12px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "13px"
                  }}
                  className="btn-playback"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "var(--bg-primary)",
                    border: "none",
                    padding: "8px 20px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "700",
                    fontSize: "13px"
                  }}
                >
                  {formMode === "add" ? "Register Twin" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setIsDeleteModalOpen(false)}>
          <div className="modal-content" style={{ width: "100%", maxWidth: "450px", display: "flex", flexDirection: "column", gap: "16px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "var(--color-red)" }}>
                Confirm De-registration
              </h3>
              <button 
                onClick={() => setIsDeleteModalOpen(false)} 
                className="btn-playback"
                style={{ border: "none", background: "none", cursor: "pointer", display: "flex", color: "var(--text-muted)" }}
              >
                <X size={16} />
              </button>
            </div>
            
            <p style={{ fontSize: "13.5px", color: "var(--text-primary)", margin: 0, lineHeight: 1.5 }}>
              Are you sure you want to de-register this business twin? This action will permanently decommission the node from the GIS map, pipeline monitor, and central database streams.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-primary)",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "13px"
                }}
                className="btn-playback"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  backgroundColor: "var(--color-red)",
                  color: "white",
                  border: "none",
                  padding: "8px 18px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "700",
                  fontSize: "13px"
                }}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Feedback Toast Notifications */}
      {toast && (
        <div style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          backgroundColor: toast.type === "success" ? "var(--color-green)" : "var(--color-red)",
          color: "white",
          padding: "12px 24px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "13.5px",
          fontWeight: "600",
          animation: "slideIn 0.3s ease-out"
        }}>
          {toast.type === "success" ? "✓" : "⚠"} {toast.text}
        </div>
      )}

      {/* Keyboard shortcuts modal window legend */}
      {isShortcutsOpen && (
        <div className="modal-overlay" onClick={() => setIsShortcutsOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Global Hotkeys Legend</h3>
              <button 
                onClick={() => setIsShortcutsOpen(false)} 
                className="btn-playback"
                style={{ border: "none", background: "none", cursor: "pointer", display: "flex" }}
              >
                <X size={16} />
              </button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
              <div><kbd className="shortcut-kbd">T</kbd> Toggle light / dark color theme variables</div>
              <div><kbd className="shortcut-kbd">A</kbd> Enable / pause live auto refresh stream ticks</div>
              <div><kbd className="shortcut-kbd">R</kbd> Reset coordinates pan and zoom scale factor on GIS map</div>
              <div><kbd className="shortcut-kbd">F</kbd> Expand / restore full screen map view dimensions</div>
              <div><kbd className="shortcut-kbd">S</kbd> Set text-cursor focus on search filters input</div>
              <div><kbd className="shortcut-kbd">H</kbd> Go to Dashboard GIS Map tab</div>
              <div><kbd className="shortcut-kbd">P</kbd> Go to Telemetry Ingestion Pipeline Monitor tab</div>
              <div><kbd className="shortcut-kbd">D</kbd> Go to Twins Central directory database log tab</div>
              <div><kbd className="shortcut-kbd">?</kbd> Open / close this Keyboard shortcut overlay</div>
              <div><kbd className="shortcut-kbd">ESC</kbd> Close current details side drawer panel</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
