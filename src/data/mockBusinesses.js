// mockBusinesses.js - Official Tamil Nadu districts list and dynamic enterprise business twin generator.

// Bounding box for Tamil Nadu to project GPS coordinates to SVG coordinate system (0 to 400, 0 to 500)
export function projectCoordinates(lat, lng) {
  const minLat = 8.0;
  const maxLat = 13.6;
  const minLng = 75.8;
  const maxLng = 80.6;
  
  const minX = 55;
  const maxX = 345;
  const minY = 480;
  const maxY = 35;
  
  const x = minX + ((lng - minLng) / (maxLng - minLng)) * (maxX - minX);
  const y = minY - ((lat - minLat) / (maxLat - minLat)) * (minY - maxY);
  
  return { x: Math.round(x), y: Math.round(y) };
}

// Official list of all 39 districts of Tamil Nadu (including Puducherry UT as the 39th item)
export const officialDistricts = [
  { name: "Ariyalur", hq: "Ariyalur", pincode: "621704", lat: 11.1401, lng: 79.0786, pop: 754894 },
  { name: "Chengalpattu", hq: "Chengalpattu", pincode: "603001", lat: 12.6841, lng: 79.9836, pop: 2556244 },
  { name: "Chennai", hq: "Chennai", pincode: "600001", lat: 13.0827, lng: 80.2707, pop: 7139582 },
  { name: "Coimbatore", hq: "Coimbatore", pincode: "641001", lat: 11.0168, lng: 76.9558, pop: 3458045 },
  { name: "Cuddalore", hq: "Cuddalore", pincode: "607001", lat: 11.7480, lng: 79.7714, pop: 2605914 },
  { name: "Dharmapuri", hq: "Dharmapuri", pincode: "636701", lat: 12.1211, lng: 78.1582, pop: 1506843 },
  { name: "Dindigul", hq: "Dindigul", pincode: "624001", lat: 10.3673, lng: 77.9803, pop: 2209684 },
  { name: "Erode", hq: "Erode", pincode: "638001", lat: 11.3410, lng: 77.7172, pop: 2251744 },
  { name: "Kallakurichi", hq: "Kallakurichi", pincode: "606202", lat: 11.7375, lng: 78.9625, pop: 1370281 },
  { name: "Kancheepuram", hq: "Kancheepuram", pincode: "631501", lat: 12.8342, lng: 79.7036, pop: 1166401 },
  { name: "Kanniyakumari", hq: "Nagercoil", pincode: "629001", lat: 8.1883, lng: 77.4119, pop: 1870374 },
  { name: "Karur", hq: "Karur", pincode: "639001", lat: 10.9601, lng: 78.0766, pop: 1064493 },
  { name: "Krishnagiri", hq: "Krishnagiri", pincode: "635001", lat: 12.5186, lng: 78.2137, pop: 1879062 },
  { name: "Madurai", hq: "Madurai", pincode: "625001", lat: 9.9252, lng: 78.1198, pop: 3038253 },
  { name: "Mayiladuthurai", hq: "Mayiladuthurai", pincode: "609001", lat: 11.1085, lng: 79.6545, pop: 918283 },
  { name: "Nagapattinam", hq: "Nagapattinam", pincode: "611001", lat: 10.7672, lng: 79.8444, pop: 1616450 },
  { name: "Namakkal", hq: "Namakkal", pincode: "637001", lat: 11.2189, lng: 78.1674, pop: 1726601 },
  { name: "Nilgiris", hq: "Udhagamandalam", pincode: "643001", lat: 11.4102, lng: 76.6950, pop: 735394 },
  { name: "Perambalur", hq: "Perambalur", pincode: "621212", lat: 11.2342, lng: 78.8821, pop: 565223 },
  { name: "Pudukkottai", hq: "Pudukkottai", pincode: "622001", lat: 10.3797, lng: 78.8205, pop: 1618345 },
  { name: "Ramanathapuram", hq: "Ramanathapuram", pincode: "623501", lat: 9.3639, lng: 78.8395, pop: 1353445 },
  { name: "Ranipet", hq: "Ranipet", pincode: "632401", lat: 12.9272, lng: 79.3331, pop: 1210283 },
  { name: "Salem", hq: "Salem", pincode: "636001", lat: 11.6643, lng: 78.1460, pop: 3482058 },
  { name: "Sivagangai", hq: "Sivagangai", pincode: "630561", lat: 9.8433, lng: 78.4809, pop: 1339101 },
  { name: "Tenkasi", hq: "Tenkasi", pincode: "627811", lat: 8.9591, lng: 77.3142, pop: 1407623 },
  { name: "Thanjavur", hq: "Thanjavur", pincode: "613001", lat: 10.7870, lng: 79.1378, pop: 2405890 },
  { name: "Theni", hq: "Theni", pincode: "625531", lat: 10.0104, lng: 77.4768, pop: 1245892 },
  { name: "Thoothukudi", hq: "Thoothukudi", pincode: "628001", lat: 8.7642, lng: 78.1348, pop: 1750244 },
  { name: "Tiruchirappalli", hq: "Tiruchirappalli", pincode: "620001", lat: 10.7905, lng: 78.7047, pop: 2722290 },
  { name: "Tirunelveli", hq: "Tirunelveli", pincode: "627001", lat: 8.7139, lng: 77.7567, pop: 3077233 },
  { name: "Tirupathur", hq: "Tirupathur", pincode: "635601", lat: 12.4934, lng: 78.5678, pop: 1111812 },
  { name: "Tiruppur", hq: "Tiruppur", pincode: "641601", lat: 11.1085, lng: 77.3411, pop: 2479052 },
  { name: "Tiruvallur", hq: "Tiruvallur", pincode: "602001", lat: 13.1384, lng: 79.9079, pop: 3728104 },
  { name: "Tiruvannamalai", hq: "Tiruvannamalai", pincode: "606601", lat: 12.2253, lng: 79.0747, pop: 2464875 },
  { name: "Tiruvarur", hq: "Tiruvarur", pincode: "610001", lat: 10.7725, lng: 79.6361, pop: 1264278 },
  { name: "Vellore", hq: "Vellore", pincode: "632001", lat: 12.9165, lng: 79.1325, pop: 1614242 },
  { name: "Viluppuram", hq: "Viluppuram", pincode: "605602", lat: 11.9398, lng: 79.4990, pop: 2093003 },
  { name: "Virudhunagar", hq: "Virudhunagar", pincode: "626001", lat: 9.5680, lng: 77.9624, pop: 1943309 },
  { name: "Kumbakonam", hq: "Kumbakonam", pincode: "612001", lat: 10.9602, lng: 79.3844, pop: 500289 }
];

// Generator arrays to produce unique corporate profiles
const companyPrefixes = ["TVS", "Murugappa", "Tata", "Reliance", "ITC", "Sri", "Adyar", "Anjappar", "Kovai", "Velammal", "Lotus", "MRF", "Apollo", "Sundaram", "Kothari"];
const companyMid = ["Industrial", "Agro", "Textile", "Automotive", "Software", "Super", "Ananda", "Infra", "Motors", "Logistics", "Medicare", "Glove", "Silks", "Bhavan", "Foods"];
const companySuffix = ["Solutions", "Ltd", "Enterprises", "Group", "Systems", "Plaza", "Clinic", "Associates", "Park", "Mills", "Trust", "Complex", "Hub", "Center", "Hotel"];

const ownerNames = ["G. Viswanathan", "M. Anandan", "K. Ramachandran", "S. Chelliah", "R. Srinivasan", "N. Lakshmi", "P. Chidambaram", "A. Alagappan", "T. Kannan", "M. Krishnan", "S. Vembu", "Dr. A. Kumar", "K. Tangavelu", "V. Selvam", "R. Pandian"];

const categoriesList = [
  "IT Companies", "Hospitals", "Hotels", "Restaurants", "Manufacturing",
  "Textile Industries", "Automobile", "Retail", "Logistics", "Education",
  "Agriculture", "Food Processing", "Tourism", "Banking", "Healthcare"
];

// Build exactly 4 mock businesses for each of the 39 districts (156 businesses total)
export const mockBusinesses = officialDistricts.flatMap((dist, distIdx) => {
  return Array.from({ length: 4 }).map((_, bizIdx) => {
    const id = `biz-${distIdx}-${bizIdx}`;
    const category = categoriesList[(distIdx * 4 + bizIdx) % categoriesList.length];
    
    // Generate a unique name
    const prefix = companyPrefixes[(distIdx * 3 + bizIdx) % companyPrefixes.length];
    const mid = companyMid[(distIdx * 2 + bizIdx) % companyMid.length];
    const suffix = companySuffix[(distIdx + bizIdx * 5) % companySuffix.length];
    const name = `${prefix} ${mid} ${suffix} (${dist.name})`;
    
    const owner = ownerNames[(distIdx * 2 + bizIdx) % ownerNames.length];
    
    // Add small coordinate offset for clustering around the district center
    const latOffset = (bizIdx === 0 ? 0.04 : bizIdx === 1 ? -0.04 : bizIdx === 2 ? 0.02 : -0.02) + (Math.sin(distIdx) * 0.01);
    const lngOffset = (bizIdx === 0 ? -0.04 : bizIdx === 1 ? 0.04 : bizIdx === 2 ? 0.02 : -0.02) + (Math.cos(distIdx) * 0.01);
    const bizLat = Number((dist.lat + latOffset).toFixed(4));
    const bizLng = Number((dist.lng + lngOffset).toFixed(4));
    
    const svgCoords = projectCoordinates(bizLat, bizLng);
    
    // Base health rating
    const baseHealth = 70 + ((distIdx * 7 + bizIdx * 11) % 28); // 70 to 98
    const baseRating = Number((3.8 + ((distIdx * 3 + bizIdx * 2) % 13) * 0.1).toFixed(1)); // 3.8 to 5.0
    const sentiment = Number((0.68 + ((distIdx + bizIdx) % 10) * 0.03).toFixed(2)); // 0.68 to 0.98
    
    // Base pincode offset
    const finalPincode = String(Number(dist.pincode) + bizIdx * 3);

    // Timeline 12-month logs
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const history = months.map((month, mIdx) => {
      const variance = Math.sin((mIdx + distIdx) * 0.8) * 4;
      const monthHealth = Math.max(50, Math.min(100, Math.round(baseHealth + variance)));
      const monthRating = Math.max(1.0, Math.min(5.0, Number((baseRating + variance * 0.04).toFixed(1))));
      const monthSentiment = Math.max(0.1, Math.min(1.0, Number((sentiment + variance * 0.01).toFixed(2))));
      
      let event = "Standard operations log synced.";
      let type = "normal";
      if (mIdx === 2) {
        event = `${dist.name} Annual Compliance Audit`;
        type = "milestone";
      } else if (mIdx === 5) {
        event = "Seasonal supply chain review";
        type = "normal";
      } else if (mIdx === 9) {
        event = "Festival seasonal demand spike";
        type = "festival";
      } else if (mIdx === 11 && baseHealth < 75) {
        event = "Local raw ingredient delays";
        type = "crisis";
      }
      return { month, health: monthHealth, rating: monthRating, sentiment: monthSentiment, event, type };
    });

    const competitors = [
      { id: `comp-${id}-1`, name: `${prefix} Competitor Delta`, distance: "1.4 km", rating: Number((baseRating - 0.2).toFixed(1)), marketShare: Math.round(baseHealth * 0.3) },
      { id: `comp-${id}-2`, name: `${prefix} Competitor Gamma`, distance: "2.8 km", rating: Number((baseRating - 0.4).toFixed(1)), marketShare: Math.round(baseHealth * 0.15) }
    ];

    const reviews = [
      { id: `rev-${id}-1`, source: "Google", author: "M. Balaji", rating: Math.round(baseRating), text: `Consistent performance at ${name}. Highly recommended!`, timestamp: "20 mins ago" },
      { id: `rev-${id}-2`, source: "Zomato", author: "Revathi S.", rating: Math.max(1, Math.round(baseRating - 1)), text: `Excellent operational uptime and digital twin support.`, timestamp: "1 hr ago" }
    ];

    const socialPosts = [
      { id: `post-${id}-1`, author: `@${dist.name.toLowerCase().replace(/[^a-z]/g, "")}_business`, content: `Visualizing the IoT stream live from the ${name} node. #digitaltwin #saas #tn`, likes: Math.round(baseHealth * 14), timestamp: "3 hrs ago" }
    ];

    // Description text based on category
    const description = `This is the active digital twin of ${name}, operating in the ${category} sector of ${dist.name} district. Monitored continuously via central IoT webhooks, this entity streams real-time telemetry packets for state governance and SaaS auditing compliance.`;

    const cleanNameLower = name.toLowerCase().replace(/[^a-z0-9]/g, "");

    const baseRevenue = 
      category === "IT Companies" ? 850 :
      category === "Hospitals" ? 680 :
      category === "Hotels" ? 550 :
      category === "Restaurants" ? 240 :
      category === "Manufacturing" ? 450 :
      category === "Textile Industries" ? 380 :
      category === "Automobile" ? 720 :
      category === "Retail" ? 180 :
      category === "Logistics" ? 410 :
      category === "Education" ? 320 :
      category === "Agriculture" ? 260 :
      category === "Food Processing" ? 290 :
      category === "Tourism" ? 310 :
      category === "Banking" ? 950 :
      category === "Healthcare" ? 620 : 250;

    return {
      id,
      name,
      owner,
      category,
      baseRevenue,
      address: `No. ${24 + bizIdx * 10}, ${dist.hq} Main Road, ${dist.name} District - ${finalPincode}`,
      district: dist.name,
      pincode: finalPincode,
      coordinates: { 
        lat: bizLat, 
        lng: bizLng, 
        x: svgCoords.x, 
        y: svgCoords.y 
      },
      phone: `+91 9444${10 + distIdx} ${280 + bizIdx}`,
      email: `contact@${cleanNameLower || "tn-twin"}.com`,
      website: `www.${cleanNameLower || "tn-twin"}.com`,
      gstNumber: `33AAAAF${1000 + distIdx * 4 + bizIdx}K${bizIdx}Z${bizIdx}`,
      registrationNo: `REG-${dist.name.substring(0, 3).toUpperCase()}-${20000 + distIdx * 4 + bizIdx}`,
      googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${bizLat},${bizLng}`,
      openingHours: "09:00 AM - 09:00 PM",
      description,
      baseRating,
      currentRating: baseRating,
      baseHealth,
      currentHealth: baseHealth,
      sentimentScore: sentiment,
      trend: baseHealth > 85 ? "up" : baseHealth > 75 ? "stable" : "down",
      riskLevel: baseHealth >= 85 ? "low" : baseHealth >= 75 ? "medium" : "high",
      competitors,
      history,
      reviews,
      socialPosts,
      gallery: [
        `https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80`,
        `https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=400&q=80`,
        `https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80`
      ]
    };
  });
});
