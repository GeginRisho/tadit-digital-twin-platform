// SimulationEngine.js - Handles real-time event generation and simulated processing streams.
import { mockBusinesses, projectCoordinates, officialDistricts } from "../data/mockBusinesses";

class SimulationEngine {
  constructor() {
    this.businesses = JSON.parse(JSON.stringify(mockBusinesses)); // Deep copy
    this.subscribers = [];
    this.intervalId = null;
    this.kafkaQueue = [];
    this.sparkWindow = [];
    this.redisStreams = {};
    this.kubernetesPods = [
      { name: "ingest-service-pod-1", status: "running", cpu: "12%", memory: "124MB", restarts: 0, ip: "10.244.1.15" },
      { name: "ingest-service-pod-2", status: "running", cpu: "8%", memory: "110MB", restarts: 0, ip: "10.244.1.16" },
      { name: "spark-processor-pod", status: "running", cpu: "28%", memory: "450MB", restarts: 1, ip: "10.244.2.34" },
      { name: "redis-cache-pod", status: "running", cpu: "4%", memory: "98MB", restarts: 0, ip: "10.244.0.5" },
      { name: "graphql-api-pod-1", status: "running", cpu: "15%", memory: "180MB", restarts: 0, ip: "10.244.3.12" },
      { name: "prediction-engine-pod", status: "running", cpu: "35%", memory: "520MB", restarts: 2, ip: "10.244.4.8" }
    ];
    this.logs = [];
    this.districtStats = {};
    this.notifications = [
      {
        id: "notif-init-1",
        title: "Critical Alert: Saravana Bhavan",
        message: "Reputation Crisis detected in Chennai.",
        severity: "high",
        timestamp: "10:15:22 AM",
        isRead: false,
        businessId: "biz-1"
      },
      {
        id: "notif-init-2",
        title: "System Update: Auto-Scaler",
        message: "Provisioned graphql-api-pod-3 due to high telemetry load.",
        severity: "info",
        timestamp: "10:12:11 AM",
        isRead: true,
        businessId: "biz-6"
      }
    ];
    this.alerts = [
      {
        id: "alert-init-1",
        businessId: "biz-1",
        businessName: "Saravana Bhavan (T-Nagar)",
        type: "Reputation Crisis",
        severity: "high",
        priority: "CRITICAL",
        confidence: 94,
        description: "Negative social sentiment outlier detected in Chennai district.",
        timestamp: "10:15:22 AM",
        reason: "Review aggregator sentiment index dipped to 0.38.",
        recommendation: "Deploy PR statement, reply to critical customer tickets, and perform kitchen inspection."
      },
      {
        id: "alert-init-2",
        businessId: "biz-6",
        businessName: "Zoho Corporation (Estates)",
        type: "Viral Growth Spike",
        severity: "low",
        priority: "ADVISORY",
        confidence: 89,
        description: "Unusually high traffic influx from organic search tags.",
        timestamp: "10:14:05 AM",
        reason: "Social mentions velocity exceeds standard deviation by 4.2x.",
        recommendation: "Provision additional virtual web cluster capacities and review CDN cache layers."
      }
    ];
    this.executionHistory = [];
    this.seedMockBusinessesForEmptyDistricts();
    this.initializeDistrictStats();
  }

  getBusinesses() {
    return this.businesses;
  }

  getDistrictStats() {
    return this.districtStats;
  }

  getNotifications() {
    return this.notifications;
  }

  getAlerts() {
    return this.alerts;
  }

  getExecutionHistory() {
    return this.executionHistory;
  }

  addBusiness(biz) {
    const lat = parseFloat(biz.latitude);
    const lng = parseFloat(biz.longitude);
    const proj = projectCoordinates(lat, lng);
    const newBiz = {
      ...biz,
      id: `biz-${Date.now()}`,
      coordinates: {
        lat,
        lng,
        x: proj.x,
        y: proj.y
      },
      currentHealth: biz.currentHealth !== undefined ? Number(biz.currentHealth) : 90,
      currentRating: biz.currentRating !== undefined ? Number(biz.currentRating) : 4.0,
      sentimentScore: biz.sentimentScore !== undefined ? Number(biz.sentimentScore) : 0.8,
      riskLevel: biz.riskLevel || "low",
      trend: "stable",
      baseRevenue: biz.revenue !== undefined ? Number(biz.revenue) : 250,
      reviews: biz.reviews || [
        { id: "rev-gen-1", source: "Google", author: "System Initializer", rating: biz.currentRating || 4.0, text: "Initial twin node telemetry synchronised successfully.", timestamp: "Just now" }
      ],
      socialPosts: biz.socialPosts || [
        { id: "post-gen-1", author: "@system_status", content: "TADIT Twin node status registered in district grid.", likes: 10, timestamp: "Just now" }
      ],
      competitors: biz.competitors || [
        { name: "Local Alternative", marketShare: 20 }
      ],
      history: biz.history || Array.from({ length: 12 }, (_, i) => ({
        month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
        health: biz.currentHealth !== undefined ? Number(biz.currentHealth) : 90,
        rating: biz.currentRating !== undefined ? Number(biz.currentRating) : 4.0,
        sentiment: biz.sentimentScore !== undefined ? Number(biz.sentimentScore) : 0.8
      }))
    };

    this.businesses.push(newBiz);
    this.initializeDistrictStats();
    this.addLog("Broker Service", `New business twin registered: ${newBiz.name} in ${newBiz.district}`, "success");
    this.notifySubscribers();
    return newBiz;
  }

  editBusiness(id, updatedFields) {
    const bizIndex = this.businesses.findIndex(b => b.id === id);
    if (bizIndex === -1) return false;

    const oldBiz = this.businesses[bizIndex];
    let lat = updatedFields.latitude !== undefined ? parseFloat(updatedFields.latitude) : oldBiz.coordinates.lat;
    let lng = updatedFields.longitude !== undefined ? parseFloat(updatedFields.longitude) : oldBiz.coordinates.lng;
    let proj = projectCoordinates(lat, lng);

    const mergedBiz = {
      ...oldBiz,
      ...updatedFields,
      coordinates: {
        lat,
        lng,
        x: proj.x,
        y: proj.y
      },
      currentHealth: updatedFields.currentHealth !== undefined ? Number(updatedFields.currentHealth) : oldBiz.currentHealth,
      currentRating: updatedFields.currentRating !== undefined ? Number(updatedFields.currentRating) : oldBiz.currentRating,
      sentimentScore: updatedFields.sentimentScore !== undefined ? Number(updatedFields.sentimentScore) : oldBiz.sentimentScore,
      baseRevenue: updatedFields.revenue !== undefined ? Number(updatedFields.revenue) : oldBiz.baseRevenue,
      riskLevel: updatedFields.riskLevel !== undefined ? updatedFields.riskLevel : oldBiz.riskLevel
    };

    if (mergedBiz.history && mergedBiz.history.length > 0) {
      const lastIndex = mergedBiz.history.length - 1;
      mergedBiz.history[lastIndex] = {
        ...mergedBiz.history[lastIndex],
        health: mergedBiz.currentHealth,
        rating: mergedBiz.currentRating,
        sentiment: mergedBiz.sentimentScore
      };
    }

    this.businesses[bizIndex] = mergedBiz;
    this.initializeDistrictStats();
    this.addLog("Broker Service", `Business twin updated: ${mergedBiz.name}`, "info");
    this.notifySubscribers();
    return mergedBiz;
  }

  deleteBusiness(id) {
    const biz = this.businesses.find(b => b.id === id);
    if (!biz) return false;

    this.businesses = this.businesses.filter(b => b.id !== id);
    this.seedMockBusinessesForEmptyDistricts();
    this.initializeDistrictStats();
    this.addLog("Broker Service", `Business twin de-registered: ${biz.name}`, "warning");
    
    this.alerts = this.alerts.filter(a => a.businessId !== id);
    this.notifications = this.notifications.filter(n => n.businessId !== id);

    this.notifySubscribers();
    return true;
  }

  setRefreshInterval(ms) {
    this.refreshInterval = ms;
    if (this.intervalId) {
      this.stop();
      this.start(ms);
    }
  }

  resumeSimulation() {
    this.start(this.refreshInterval || 4000);
  }

  pauseSimulation() {
    this.stop();
  }

  triggerManualSync() {
    this.generateTick();
  }

  markNotificationRead(id) {
    this.notifications = this.notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    this.notifySubscribers();
  }

  markAllNotificationsRead() {
    this.notifications = this.notifications.map(n => ({ ...n, isRead: true }));
    this.notifySubscribers();
  }

  clearAllNotifications() {
    this.notifications = [];
    this.notifySubscribers();
  }

  dismissNotification(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifySubscribers();
  }

  executeRecommendation(alertId) {
    const alertIndex = this.alerts.findIndex(a => a.id === alertId);
    if (alertIndex !== -1) {
      const alert = this.alerts[alertIndex];
      const biz = this.businesses.find(b => b.id === alert.businessId);
      if (biz) {
        biz.currentHealth = 95;
        biz.riskLevel = "low";
        this.initializeDistrictStats();
      }
      this.alerts = this.alerts.filter(a => a.id !== alertId);
      this.executionHistory.unshift({
        id: `exec-${Date.now()}`,
        businessName: alert.businessName,
        planName: `Plan: ${alert.type} Mitigation Playbook`,
        action: alert.recommendation,
        outcome: "Telemetry metrics normalized.",
        resolutionTime: "1.2s",
        status: "SUCCESS",
        timestamp: new Date().toLocaleTimeString()
      });
      if (this.executionHistory.length > 30) this.executionHistory.pop();
      this.addLog("AI System", `Recommendation executed successfully for ${alert.businessName}.`, "success");
      this.notifySubscribers();
    }
  }

  dismissAlert(id) {
    this.alerts = this.alerts.filter(a => a.id !== id);
    this.addLog("AI System", `Alert dismissed: ID ${id}`, "info");
    this.notifySubscribers();
  }

  injectAnomaly(bizId) {
    const types = ["crisis", "viral", "competitor"];
    const randType = types[Math.floor(Math.random() * types.length)];
    this.triggerManualAnomaly(bizId, randType);
  }

  notifySubscribers() {
    this.emit({
      businesses: this.businesses,
      logs: this.logs,
      anomaly: null,
      activeDistrictStats: this.districtStats,
      kafkaQueue: this.kafkaQueue,
      sparkWindow: this.sparkWindow,
      kubernetesPods: this.kubernetesPods,
      notifications: this.notifications,
      alerts: this.alerts,
      executionHistory: this.executionHistory
    });
  }

  seedMockBusinessesForEmptyDistricts() {
    const districtsWithBiz = new Set(this.businesses.map(b => b.district));
    
    officialDistricts.forEach((dist, distIdx) => {
      if (!districtsWithBiz.has(dist.name)) {
        for (let bizIdx = 0; bizIdx < 2; bizIdx++) {
          const id = `biz-seeded-${distIdx}-${bizIdx}-${Date.now()}`;
          const category = ["Retail", "Manufacturing", "Hotels", "IT Companies"][(distIdx + bizIdx) % 4];
          const name = `TN Seeded ${category} Twin (${dist.name})`;
          const owner = "State Seeder Service";
          
          const latOffset = (bizIdx === 0 ? 0.02 : -0.02);
          const lngOffset = (bizIdx === 0 ? -0.02 : 0.02);
          const bizLat = Number((dist.lat + latOffset).toFixed(4));
          const bizLng = Number((dist.lng + lngOffset).toFixed(4));
          const proj = projectCoordinates(bizLat, bizLng);
          
          const baseHealth = 85 + (bizIdx * 5);
          const baseRating = 4.2;
          const sentiment = 0.82;
          const finalPincode = dist.pincode;
          
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const history = months.map(month => ({
            month,
            health: baseHealth,
            rating: baseRating,
            sentiment,
            event: "Operational baseline seeded.",
            type: "normal"
          }));
          
          const newBiz = {
            id,
            name,
            owner,
            category,
            baseRevenue: 250,
            address: `Seeded Industrial Complex, ${dist.hq}, ${dist.name} - ${finalPincode}`,
            district: dist.name,
            pincode: finalPincode,
            coordinates: { lat: bizLat, lng: bizLng, x: proj.x, y: proj.y },
            phone: `+91 94440 00000`,
            email: `contact@seeded-${dist.name.toLowerCase().replace(/[^a-z]/g, "")}.com`,
            website: `www.seeded-${dist.name.toLowerCase().replace(/[^a-z]/g, "")}.com`,
            gstNumber: `33SEEDB${1000 + distIdx * 2 + bizIdx}D1Z0`,
            registrationNo: `REG-SEED-${dist.name.substring(0, 3).toUpperCase()}-${1000 + bizIdx}`,
            googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${bizLat},${bizLng}`,
            openingHours: "09:00 AM - 06:00 PM",
            description: `Seeded sample twin node representing regional enterprise health inside ${dist.name} administrative zone.`,
            baseRating,
            currentRating: baseRating,
            baseHealth,
            currentHealth: baseHealth,
            sentimentScore: sentiment,
            trend: "stable",
            riskLevel: "low",
            competitors: [
              { id: `comp-${id}-1`, name: "Seeded Rival Delta", distance: "2.1 km", rating: 4.0, marketShare: 25 },
              { id: `comp-${id}-2`, name: "Seeded Rival Gamma", distance: "3.5 km", rating: 3.8, marketShare: 15 }
            ],
            history,
            reviews: [
              { id: `rev-${id}-1`, source: "System", author: "Auditing Service", rating: 4, text: "Seeded node functional and streaming telemetry metrics.", timestamp: "1 day ago" }
            ],
            socialPosts: [
              { id: `post-${id}-1`, author: "@tn_seeder", content: "Seeding complete for district digital twin coverage. #digitaltwin #seeding", likes: 15, timestamp: "1 day ago" }
            ],
            gallery: [
              `https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80`,
              `https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=400&q=80`,
              `https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80`
            ]
          };
          this.businesses.push(newBiz);
        }
      }
    });
  }

  initializeDistrictStats() {
    const districts = {};
    
    officialDistricts.forEach((d) => {
      districts[d.name] = {
        count: 0,
        totalHealth: 0,
        totalRevenue: 0,
        totalSentiment: 0,
        crises: 0,
        averageHealth: 0,
        revenue: 0,
        sentiment: 0.0
      };
    });

    this.businesses.forEach((biz) => {
      if (!districts[biz.district]) {
        districts[biz.district] = { 
          count: 0, 
          totalHealth: 0, 
          totalRevenue: 0, 
          totalSentiment: 0, 
          crises: 0,
          averageHealth: 0,
          revenue: 0,
          sentiment: 0.0
        };
      }
      const baseRev = biz.baseRevenue || 210;
      const currentRevenue = Math.round(baseRev * (biz.currentHealth / 100));

      districts[biz.district].count += 1;
      districts[biz.district].totalHealth += biz.currentHealth;
      districts[biz.district].totalRevenue += currentRevenue;
      districts[biz.district].totalSentiment += biz.sentimentScore;
      if (biz.riskLevel === "high") {
        districts[biz.district].crises += 1;
      }
    });
    // Calculate averages
    Object.keys(districts).forEach((key) => {
      if (districts[key].count > 0) {
        districts[key].averageHealth = Math.round(districts[key].totalHealth / districts[key].count);
        districts[key].revenue = districts[key].totalRevenue;
        districts[key].sentiment = Number((districts[key].totalSentiment / districts[key].count).toFixed(2));
      } else {
        districts[key].averageHealth = 0;
        districts[key].revenue = 0;
        districts[key].sentiment = 0.0;
      }
    });
    this.districtStats = districts;
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  emit(data) {
    this.subscribers.forEach((callback) => callback(data));
  }

  addLog(moduleName, message, type = "info") {
    const logEntry = {
      timestamp: new Date().toLocaleTimeString(),
      module: moduleName,
      message,
      type
    };
    this.logs.unshift(logEntry);
    if (this.logs.length > 50) this.logs.pop();
  }

  start(tickRateMs = 4000) {
    if (this.intervalId) return;

    this.addLog("Kubernetes", "Orchestrator scaling up pods... Status: Stable.", "success");
    this.addLog("Kafka", "Message queues initialized. Topics: [raw-reviews, social-mentions].", "info");
    this.addLog("Spark", "Spark Streaming context active. Window size: 10 seconds.", "info");
    this.addLog("Redis", "Redis Stream listener active on key 'stream:business:updates'.", "info");
    this.addLog("GraphQL", "GraphQL Subscription server listening on ws://tadit.tn.gov.in/graphql", "success");

    this.intervalId = setInterval(() => {
      this.generateTick();
    }, tickRateMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.addLog("System", "Simulation engines suspended.", "warning");
    }
  }

  triggerManualAnomaly(businessId, anomalyType) {
    const biz = this.businesses.find((b) => b.id === businessId);
    if (!biz) return;

    let payload = {};
    if (anomalyType === "crisis") {
      payload = {
        source: "Google Reviews",
        author: "Anonymous Auditor",
        rating: 1,
        text: "Worst experience ever! Food quality has degraded completely. Unhygienic premises!",
        type: "crisis"
      };
      this.addLog("Ingestion", `Alert triggered: Reputation Crisis for ${biz.name}`, "error");
    } else if (anomalyType === "viral") {
      payload = {
        source: "Instagram",
        author: "@chennai_trendsetter",
        content: `Found this amazing spot in TN! Incredible quality. Absolute must visit! ⭐⭐⭐⭐⭐ #viral #quality`,
        likes: 15400,
        type: "viral"
      };
      this.addLog("Ingestion", `Alert triggered: Viral Growth for ${biz.name}`, "success");
    } else if (anomalyType === "competitor") {
      payload = {
        source: "Competitor Intelligence",
        name: biz.competitors[0]?.name || "Local Rival",
        action: "50% Discount Campaign launched in same street",
        type: "competitor"
      };
      this.addLog("Ingestion", `Alert triggered: Competitor Movement for ${biz.name}`, "warning");
    }

    this.processIngestedEvent(biz, payload);
  }

  generateTick() {
    // Select a random business
    const randomIndex = Math.floor(Math.random() * this.businesses.length);
    const biz = this.businesses[randomIndex];
    
    // Choose random event source
    const rand = Math.random();
    let payload = {};

    if (rand < 0.4) {
      // Review event
      const reviewsList = [
        { rating: 5, text: "Absolutely loved the service! Worth every rupee.", author: "Arun Swaminathan" },
        { rating: 5, text: "Standard TN taste, preserved perfectly. Highly recommended.", author: "Kavitha M." },
        { rating: 4, text: "Good ambiance, food is delicious. Service is a bit slow today.", author: "Bala Ji" },
        { rating: 2, text: "Not clean. Sambar was watery. Expected much better brand quality.", author: "Rajesh Kannan" },
        { rating: 1, text: "Horrible staff attitude. Wait time exceeded 45 mins. Never again.", author: "Divya N." }
      ];
      const selectedReview = reviewsList[Math.floor(Math.random() * reviewsList.length)];
      payload = {
        source: Math.random() > 0.5 ? "Google" : "Zomato",
        author: selectedReview.author,
        rating: selectedReview.rating,
        text: selectedReview.text,
        type: "review"
      };
    } else if (rand < 0.7) {
      // Social post
      const socialList = [
        { content: "Late night cravings sorted! Incredible quality and speed. #tasty", likes: 230 },
        { content: "Huge rush today. Took forever to get inside. Quality is okay.", likes: 110 },
        { content: "Highly overpriced compared to competitors nearby! #notworthit", likes: 450 },
        { content: "Outstanding hospitality. The team goes above and beyond. 👍", likes: 580 }
      ];
      const selectedSocial = socialList[Math.floor(Math.random() * socialList.length)];
      payload = {
        source: "Instagram",
        author: `@user_${Math.floor(Math.random() * 9000 + 1000)}`,
        content: selectedSocial.content,
        likes: selectedSocial.likes,
        type: "social"
      };
    } else {
      // Competitor or market condition
      const marketEvents = [
        { desc: "Local competitor launches loyalty program discount.", effect: -3, target: "competitor" },
        { desc: "Vegetable and ingredient prices rise by 8% in district.", effect: -2, target: "market" },
        { desc: "High tourist influx increases foot traffic by 15%.", effect: 4, target: "market" },
        { desc: "District infrastructure improves, road blockage cleared.", effect: 3, target: "market" }
      ];
      const selectedMarket = marketEvents[Math.floor(Math.random() * marketEvents.length)];
      payload = {
        source: "Market Intelligence",
        description: selectedMarket.desc,
        effect: selectedMarket.effect,
        type: selectedMarket.target
      };
    }

    this.processIngestedEvent(biz, payload);
  }

  processIngestedEvent(biz, payload) {
    // Fluctuate Kubernetes pods CPU & Memory metrics on each event ingestion
    this.kubernetesPods = this.kubernetesPods.map((pod) => {
      const cpuVal = parseInt(pod.cpu);
      const newCpu = Math.max(2, Math.min(98, cpuVal + Math.floor(Math.random() * 7) - 3));
      const memVal = parseInt(pod.memory);
      const newMem = Math.max(50, Math.min(1024, memVal + Math.floor(Math.random() * 19) - 9));
      return {
        ...pod,
        cpu: `${newCpu}%`,
        memory: `${newMem}MB`
      };
    });

    // 1. Ingestion Step
    this.addLog("Ingestion", `Raw data ingested from ${payload.source} for ${biz.name}`, "info");

    // 2. Kafka Stream Ingestion
    const kafkaMessage = {
      topic: payload.type === "review" ? "raw-reviews" : "social-feeds",
      key: biz.id,
      value: payload,
      timestamp: Date.now()
    };
    this.kafkaQueue.push(kafkaMessage);
    if (this.kafkaQueue.length > 15) this.kafkaQueue.shift();
    this.addLog("Kafka", `Buffered event in topic [${kafkaMessage.topic}] - Partition: 0, Offset: ${this.kafkaQueue.length}`, "info");

    // 3. Apache Spark Streaming Window calculations
    this.sparkWindow.push(kafkaMessage);
    if (this.sparkWindow.length > 10) this.sparkWindow.shift();

    // Trigger K8s auto-scaling simulation if CPU exceeding total capacity
    const totalCpu = this.kubernetesPods.reduce((acc, pod) => acc + parseInt(pod.cpu), 0);
    if (totalCpu > 140 && this.kubernetesPods.length < 8) {
      const newPod = {
        name: `graphql-api-pod-${this.kubernetesPods.length + 1}`,
        status: "running",
        cpu: "10%",
        memory: "160MB",
        restarts: 0,
        ip: `10.244.3.${12 + this.kubernetesPods.length}`
      };
      this.kubernetesPods.push(newPod);
      this.addLog("Kubernetes", `Auto-scaling triggered: Spawning ${newPod.name} due to high ingestion load.`, "success");
    }

    // Spark processes window metrics
    let scoreDelta = 0;
    let anomalyEvent = null;

    if (payload.type === "review") {
      // Review updates ratings
      biz.reviews.unshift({
        id: `rev-${Date.now()}`,
        source: payload.source,
        author: payload.author,
        rating: payload.rating,
        text: payload.text,
        timestamp: "Just now"
      });
      if (biz.reviews.length > 5) biz.reviews.pop();

      // Recalculate rolling rating average
      const recentRatingsSum = biz.reviews.reduce((acc, r) => acc + r.rating, 0);
      biz.currentRating = parseFloat((recentRatingsSum / biz.reviews.length).toFixed(1));

      // Calculate score effect
      if (payload.rating >= 4) {
        scoreDelta = payload.rating === 5 ? 2.5 : 1.2;
        biz.sentimentScore = Math.min(1.0, biz.sentimentScore + 0.03);
      } else {
        scoreDelta = payload.rating === 1 ? -6.0 : -3.0;
        biz.sentimentScore = Math.max(0.1, biz.sentimentScore - 0.08);
      }

      // Reputation Crisis detection
      if (payload.rating === 1 && payload.type === "crisis") {
        anomalyEvent = {
          id: `anomaly-${Date.now()}`,
          businessId: biz.id,
          businessName: biz.name,
          type: "Reputation Crisis",
          severity: "high",
          priority: "CRITICAL",
          confidence: 96,
          description: `Multiple 1-star reviews received on ${payload.source} due to hygiene/complaints.`,
          timestamp: new Date().toLocaleTimeString(),
          reason: "NLP sentiment score dropped below 0.40 within 10s sliding window on review aggregates.",
          recommendation: "Issue public statement, initiate audit of kitchen, reply to customer within 1 hour.",
          isRead: false
        };
        biz.riskLevel = "high";
        scoreDelta = -15;
      }
    } else if (payload.type === "social") {
      biz.socialPosts.unshift({
        id: `post-${Date.now()}`,
        author: payload.author,
        content: payload.content,
        likes: payload.likes,
        timestamp: "Just now"
      });
      if (biz.socialPosts.length > 5) biz.socialPosts.pop();

      if (payload.likes > 10000 || payload.type === "viral") {
        anomalyEvent = {
          id: `anomaly-${Date.now()}`,
          businessId: biz.id,
          businessName: biz.name,
          type: "Viral Growth Spike",
          severity: "low", // positive/info alert
          priority: "ADVISORY",
          confidence: 89,
          description: `Social media post by ${payload.author} went viral with ${payload.likes || 15400} likes.`,
          timestamp: new Date().toLocaleTimeString(),
          reason: "Outlier detection triggered by volume spikes exceeding 4x standard deviation on Instagram tags.",
          recommendation: "Activate viral promotional discounts, ensure buffer inventory, increase staffing.",
          isRead: false
        };
        biz.riskLevel = "low";
        scoreDelta = 12;
        biz.sentimentScore = Math.min(1.0, biz.sentimentScore + 0.12);
      } else if (payload.content.includes("overpriced") || payload.content.includes("notworthit")) {
        scoreDelta = -4;
        biz.sentimentScore = Math.max(0.1, biz.sentimentScore - 0.06);
      } else {
        scoreDelta = 1.5;
        biz.sentimentScore = Math.min(1.0, biz.sentimentScore + 0.02);
      }
    } else if (payload.type === "competitor") {
      anomalyEvent = {
        id: `anomaly-${Date.now()}`,
        businessId: biz.id,
        businessName: biz.name,
        type: "Competitor Action Alert",
        severity: "medium",
        priority: "WARNING",
        confidence: 91,
        description: `Direct competitor launched pricing campaign in vicinity: ${payload.action || "50% Discount Campaign launched"}`,
        timestamp: new Date().toLocaleTimeString(),
        reason: "Geofenced competitive scraping indicates sudden promo drops. High risk of immediate churn.",
        recommendation: "Counter-offer 10% loyalty discounts, highlight quality differentials in marketing.",
        isRead: false
      };
      biz.riskLevel = "medium";
      scoreDelta = -7;
      biz.competitors[0].marketShare = Math.min(60, biz.competitors[0].marketShare + 3);
    } else if (payload.type === "market") {
      scoreDelta = payload.effect;
    }

    // Apply Spark analytics logic
    this.addLog("Spark", `Rolling sentiment window processed. Delta computed: ${scoreDelta > 0 ? "+" : ""}${scoreDelta.toFixed(1)}`, "info");

    // Apply score delta to business health
    biz.currentHealth = Math.max(0, Math.min(100, Math.round(biz.currentHealth + scoreDelta)));
    biz.trend = scoreDelta > 0 ? "up" : scoreDelta < 0 ? "down" : "stable";

    if (biz.currentHealth < 75) {
      biz.riskLevel = "high";
    } else if (biz.currentHealth < 85) {
      biz.riskLevel = "medium";
    } else {
      biz.riskLevel = "low";
    }

    // Update history for graph (the current month in December index 11 or latest index)
    const currentMonthData = biz.history[biz.history.length - 1];
    if (currentMonthData) {
      currentMonthData.health = biz.currentHealth;
      currentMonthData.rating = biz.currentRating;
      currentMonthData.sentiment = biz.sentimentScore;
    }

    // Recalculate district stats
    this.initializeDistrictStats();

    if (anomalyEvent) {
      this.alerts.unshift(anomalyEvent);
      if (this.alerts.length > 30) this.alerts.pop();

      this.notifications.unshift({
        id: anomalyEvent.id,
        title: anomalyEvent.type,
        message: anomalyEvent.description,
        severity: anomalyEvent.severity === "high" ? "high" : anomalyEvent.severity === "medium" ? "medium" : "low",
        timestamp: anomalyEvent.timestamp,
        isRead: false,
        businessId: anomalyEvent.businessId
      });
      if (this.notifications.length > 50) this.notifications.pop();
    }

    // 4. Redis Streams Publisher
    const redisStreamKey = `stream:business:${biz.id}`;
    const streamPayload = {
      id: biz.id,
      health: biz.currentHealth,
      rating: biz.currentRating,
      sentiment: biz.sentimentScore,
      anomaly: anomalyEvent
    };
    this.redisStreams[redisStreamKey] = streamPayload;
    this.addLog("Redis", `Published state packet to Redis Stream [${redisStreamKey}] ID: ${Date.now()}-0`, "success");

    // 5. GraphQL Subscriptions
    this.addLog("GraphQL", `Pushed GraphQL subscription event 'businessUpdated(id: "${biz.id}")'`, "success");

    // Emit live to subscribers (UI layers)
    this.emit({
      businesses: this.businesses,
      logs: this.logs,
      anomaly: anomalyEvent,
      activeDistrictStats: this.districtStats,
      kafkaQueue: this.kafkaQueue,
      sparkWindow: this.sparkWindow,
      kubernetesPods: this.kubernetesPods,
      notifications: this.notifications,
      alerts: this.alerts,
      executionHistory: this.executionHistory
    });
  }

  getHistoricalState(businessId, index, viewType = "monthly") {
    const biz = this.businesses.find((b) => b.id === businessId);
    if (!biz) return null;

    const mockHistoricBiz = JSON.parse(JSON.stringify(biz));
    let health = biz.currentHealth;
    let rating = biz.currentRating;
    let sentiment = biz.sentimentScore;

    if (viewType === "weekly") {
      const getDayVal = (d) => {
        const offset = Math.sin((d + parseInt(businessId.split("-")[1] || 0)) * 0.9) * 3;
        const h = Math.max(50, Math.min(100, Math.round(biz.currentHealth + offset)));
        const r = Math.max(1.0, Math.min(5.0, Number((biz.currentRating + offset * 0.05).toFixed(1))));
        const s = Math.max(0.1, Math.min(1.0, Number((biz.sentimentScore + offset * 0.01).toFixed(2))));
        return { h, r, s };
      };
      const currentDay = getDayVal(index);
      health = currentDay.h;
      rating = currentDay.r;
      sentiment = currentDay.s;
      
      const prevDay = index > 0 ? getDayVal(index - 1) : null;
      mockHistoricBiz.trend = prevDay ? (health >= prevDay.h ? "up" : "down") : "stable";
    } else if (viewType === "quarterly") {
      const getQVal = (q) => {
        const startM = q * 3;
        const monthsSubset = biz.history.slice(startM, startM + 3);
        const h = Math.round(monthsSubset.reduce((sum, m) => sum + m.health, 0) / 3);
        const r = Number((monthsSubset.reduce((sum, m) => sum + m.rating, 0) / 3).toFixed(1));
        const s = Number((monthsSubset.reduce((sum, m) => sum + m.sentiment, 0) / 3).toFixed(2));
        return { h, r, s };
      };
      const currentQ = getQVal(index);
      health = currentQ.h;
      rating = currentQ.r;
      sentiment = currentQ.s;
      
      const prevQ = index > 0 ? getQVal(index - 1) : null;
      mockHistoricBiz.trend = prevQ ? (health >= prevQ.h ? "up" : "down") : "stable";
    } else if (viewType === "yearly") {
      const getYVal = (y) => {
        const h = Math.max(50, Math.min(100, Math.round(biz.currentHealth * (0.9 + y * 0.02))));
        const r = Math.max(1.0, Math.min(5.0, Number((biz.currentRating * (0.95 + y * 0.01)).toFixed(1))));
        const s = Math.max(0.1, Math.min(1.0, Number((biz.sentimentScore * (0.97 + y * 0.005)).toFixed(2))));
        return { h, r, s };
      };
      const currentY = getYVal(index);
      health = currentY.h;
      rating = currentY.r;
      sentiment = currentY.s;
      
      const prevY = index > 0 ? getYVal(index - 1) : null;
      mockHistoricBiz.trend = prevY ? (health >= prevY.h ? "up" : "down") : "stable";
    } else {
      // monthly
      const monthData = biz.history[index];
      if (monthData) {
        health = monthData.health;
        rating = monthData.rating;
        sentiment = monthData.sentiment;
        mockHistoricBiz.trend = index > 0 ? (biz.history[index].health >= biz.history[index - 1].health ? "up" : "down") : "stable";
      }
    }

    mockHistoricBiz.currentHealth = health;
    mockHistoricBiz.currentRating = rating;
    mockHistoricBiz.sentimentScore = sentiment;

    if (mockHistoricBiz.currentHealth < 75) {
      mockHistoricBiz.riskLevel = "high";
    } else if (mockHistoricBiz.currentHealth < 85) {
      mockHistoricBiz.riskLevel = "medium";
    } else {
      mockHistoricBiz.riskLevel = "low";
    }

    return mockHistoricBiz;
  }
}

export default new SimulationEngine();
