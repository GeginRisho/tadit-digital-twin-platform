// SamplePayloads.js - Real-world JSON payload telemetry schemas for pipeline inspector nodes

export const SamplePayloads = {
  sources: {
    title: "Ingestion API Scraper Payload",
    description: "Axios client request packet parsed from public scrapers.",
    schema: `{
  "scraper": {
    "engine_id": "scrape_node_chennai_01",
    "version": "1.4.2",
    "target_domain": "google.com/maps/reviews"
  },
  "payload": {
    "business_id": "biz-1",
    "source": "Google Reviews",
    "author": "Arun Swaminathan",
    "rating": 5,
    "review_text": "Absolutely loved the service! Worth every rupee.",
    "nlp_tags": ["sambar", "ghee roast", "service"],
    "timestamp_epoch": 1782390234
  },
  "connection": {
    "tls": "TLS_1_3_GCM_SHA256",
    "ip": "13.233.14.28",
    "latency_ms": 42
  }
}`
  },
  kafka: {
    title: "Apache Kafka Message Envelope",
    description: "Serialized event wrapper pushed to topic 'raw-reviews' partition 0.",
    schema: `{
  "topic": "raw-reviews",
  "partition": 0,
  "offset": 4820293,
  "key": "biz-1",
  "timestamp": 1782390234850,
  "headers": {
    "correlation-id": "corr_92f08a8c-8f12",
    "client-id": "ingest-service-pod-1"
  },
  "value": {
    "businessId": "biz-1",
    "source": "Google",
    "author": "Arun Swaminathan",
    "rating": 5,
    "text": "Absolutely loved the service! Worth every rupee."
  }
}`
  },
  spark: {
    title: "Apache Spark Structured Streaming Delta",
    description: "Output of 10s sliding window micro-batch analysis.",
    schema: `{
  "batchId": 48202,
  "window": {
    "start": "2026-07-03T19:44:00.000Z",
    "end": "2026-07-03T19:44:10.000Z"
  },
  "metrics": {
    "recordsProcessed": 14,
    "triggerExecutionTimeMs": 350,
    "watermarkMs": 10000
  },
  "results": [
    {
      "businessId": "biz-1",
      "computedSentiment": 0.89,
      "nlpEntityPolarity": {
        "sambar": 0.95,
        "service": 0.82
      },
      "calculatedDeltaHealth": +2.5,
      "anomalyTrigger": null
    }
  ]
}`
  },
  redis: {
    title: "Redis Enterprise Stream Entry Packet",
    description: "Low-latency Pub/Sub message state added to hash storage.",
    schema: `{
  "streamKey": "stream:business:biz-1",
  "entryID": "${Date.now()}-0",
  "connection": {
    "mode": "master",
    "cluster_node": "redis-node-03"
  },
  "fields": {
    "id": "biz-1",
    "currentHealth": "88",
    "currentRating": "4.4",
    "sentimentScore": "0.89",
    "trend": "up",
    "riskLevel": "low",
    "latestUpdateTimestamp": "${new Date().toISOString()}"
  }
}`
  },
  graphql: {
    title: "GraphQL Subscription WebSocket Frame",
    description: "Subscription push payload dispatched to listening browser clients.",
    schema: `{
  "type": "next",
  "id": "sub_1",
  "payload": {
    "data": {
      "businessUpdated": {
        "id": "biz-1",
        "name": "Saravana Bhavan (T-Nagar)",
        "currentHealth": 88,
        "sentimentScore": 0.89,
        "riskLevel": "LOW",
        "trend": "UP",
        "lastTelemetrySync": "${new Date().toLocaleTimeString()}"
      }
    }
  }
}`
  }
};
