/**
 * Kit List Generator — options and packing logic.
 *
 * This module is framework-free so it can be tested in Node and reused by the
 * browser wizard and PDF builder.
 */

export const SECTIONS = [
  {
    id: "beavers",
    name: "Beavers",
    ages: "6–8",
    icon: "users",
    blurb: "Usually camp for 1 night.",
    defaultNights: 1,
  },
  {
    id: "cubs",
    name: "Cubs",
    ages: "8–10½",
    icon: "compass",
    blurb: "Usually camp for 2 nights.",
    defaultNights: 2,
  },
  {
    id: "scouts",
    name: "Scouts",
    ages: "10½–14",
    icon: "tent",
    blurb: "Usually camp for 2 nights or more.",
    defaultNights: 2,
  },
];

export const TRIP_TYPES = [
  {
    id: "day",
    name: "Day trip",
    icon: "sun",
    blurb: "A visit, hike or activity day with no overnight stay.",
    nights: 0,
  },
  {
    id: "sleepover",
    name: "Indoor sleepover",
    icon: "moon",
    blurb: "One night indoors in a hall, hut or venue.",
    nights: 1,
  },
  {
    id: "weekend",
    name: "Weekend camp",
    icon: "tent",
    blurb: "Friday to Sunday, or Saturday night for Beavers.",
    nights: null,
  },
  {
    id: "long",
    name: "Longer camp",
    icon: "calendar",
    blurb: "Three or more nights away, such as a summer camp.",
    nights: 4,
  },
  {
    id: "international",
    name: "International trip",
    icon: "globe",
    blurb: "Travel abroad, including passport and travel documents.",
    nights: 5,
  },
];

export const ACCOMMODATIONS = [
  {
    id: "tent",
    name: "Tent",
    icon: "tent",
    blurb: "Group tents or tents brought from home.",
  },
  {
    id: "indoor",
    name: "Indoor",
    icon: "home",
    blurb: "A hall, hut, bunkhouse or sleepover venue.",
  },
  {
    id: "hammock",
    name: "Hammock or bivvy",
    icon: "tree",
    blurb: "Sleeping under a tarp or in a bivvy bag.",
  },
  {
    id: "mixed",
    name: "A mix",
    icon: "layers",
    blurb: "Some nights under canvas and some indoors.",
  },
  {
    id: "hostel",
    name: "Hostel or lodge",
    icon: "bed",
    blurb: "Indoor beds and shared facilities.",
  },
];

export const SEASONS = [
  { id: "spring", name: "Spring" },
  { id: "summer", name: "Summer" },
  { id: "autumn", name: "Autumn" },
  { id: "winter", name: "Winter" },
];

export const WEATHER = [
  { id: "sunny", name: "Sunny and warm", icon: "sun" },
  { id: "mild", name: "Mild and mixed", icon: "cloud" },
  { id: "wet", name: "Wet", icon: "cloud-rain" },
  { id: "windy", name: "Windy", icon: "wind" },
  { id: "cold", name: "Cold", icon: "thermometer" },
  { id: "freezing", name: "Freezing or snow", icon: "snowflake" },
  { id: "muddy", name: "Muddy", icon: "boot" },
];

export const ACTIVITIES = [
  {
    id: "water",
    name: "Water activities",
    icon: "waves",
    blurb: "Splash games, swimming, paddling or sailing.",
    questions: [
      {
        id: "types",
        type: "checkbox",
        label: "What kind of water activity?",
        hint: "Tick everything on the programme so only relevant kit is added.",
        options: [
          { value: "splash", label: "Splash games", desc: "Water games or field activities" },
          { value: "pool", label: "Swimming pool", desc: "Session at a pool or leisure centre" },
          { value: "openwater", label: "Open water swim", desc: "Lake, river or sea" },
          { value: "paddle", label: "Kayaking or canoeing", desc: "Flat or moving water paddling" },
          { value: "raft", label: "Raft building", desc: "Building and launching rafts" },
          { value: "sail", label: "Sailing or windsurfing", desc: "Dinghy sailing or windsurfing" },
          { value: "sup", label: "Paddleboarding", desc: "Stand-up paddleboarding" },
        ],
      },
      {
        id: "sessions",
        type: "select",
        label: "How many water sessions?",
        hint: "Sets the number of swimsuits to pack.",
        options: [
          { value: "1", label: "1 session" },
          { value: "2", label: "2 sessions" },
          { value: "3", label: "3 sessions" },
          { value: "4", label: "4 or more sessions" },
        ],
      },
      {
        id: "wetsuit",
        type: "radio",
        label: "Will wetsuits be provided?",
        hint: "If not, young people will need their own.",
        options: [
          { value: "provided", label: "Yes, by the centre" },
          { value: "own", label: "No, bring your own" },
          { value: "notneeded", label: "Not needed" },
        ],
      },
      {
        id: "showers",
        type: "radio",
        label: "Will there be showers afterwards?",
        hint: "Paddling sessions usually need a shower and a full change of clothes.",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "unknown", label: "Not sure" },
        ],
      },
    ],
  },
  {
    id: "hiking",
    name: "Hiking or hill walk",
    icon: "footprints",
    blurb: "Local walks, day hikes or expeditions.",
    questions: [
      {
        id: "length",
        type: "radio",
        label: "How long is the walk?",
        options: [
          { value: "short", label: "Short walk", desc: "Under 2 hours, easy ground" },
          { value: "half", label: "Half day", desc: "2–4 hours, mixed ground" },
          { value: "full", label: "Full day", desc: "4+ hours, hill walking kit" },
          { value: "expedition", label: "Expedition", desc: "Full day with a packed rucksack" },
        ],
      },
      {
        id: "terrain",
        type: "radio",
        label: "What is the ground like?",
        options: [
          { value: "paths", label: "Paths and tracks" },
          { value: "hills", label: "Hills and moorland" },
          { value: "muddy", label: "Muddy or boggy" },
          { value: "snow", label: "Snowy" },
        ],
      },
    ],
  },
  {
    id: "climbing",
    name: "Climbing or abseiling",
    icon: "mountain",
    blurb: "Indoor wall, outdoor crag or high ropes.",
    questions: [
      {
        id: "where",
        type: "radio",
        label: "Where are you climbing?",
        options: [
          { value: "indoor", label: "Indoor wall" },
          { value: "outdoor", label: "Outdoor crag" },
          { value: "ropes", label: "High ropes or adventure course" },
        ],
      },
    ],
  },
  {
    id: "archery",
    name: "Archery",
    icon: "target",
    blurb: "Range session with bows and arrows.",
  },
  {
    id: "cycling",
    name: "Cycling",
    icon: "bike",
    blurb: "Trail rides, cycle paths or bike sessions.",
    questions: [
      {
        id: "bikes",
        type: "radio",
        label: "Where are the bikes coming from?",
        options: [
          { value: "own", label: "Young people bring their own" },
          { value: "hired", label: "Hired or provided" },
          { value: "balance", label: "Balance bikes or scooters" },
        ],
      },
      {
        id: "terrain",
        type: "radio",
        label: "What kind of riding?",
        options: [
          { value: "trafficfree", label: "Traffic-free paths" },
          { value: "road", label: "Roads" },
          { value: "offroad", label: "Off-road trails" },
        ],
      },
    ],
  },
  {
    id: "campfire",
    name: "Campfire",
    icon: "fire",
    blurb: "Evening campfire, songs or fire cooking.",
    questions: [
      {
        id: "cooking",
        type: "radio",
        label: "Will you cook on the fire?",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No, just songs and stories" },
        ],
      },
    ],
  },
  {
    id: "cooking",
    name: "Cooking",
    icon: "utensils",
    blurb: "Patrol cooking, backwoods cooking or camp stoves.",
  },
  {
    id: "sports",
    name: "Sports and wide games",
    icon: "football",
    blurb: "Team games, sports or outdoor wide games.",
  },
  {
    id: "crafts",
    name: "Crafts and badges",
    icon: "scissors",
    blurb: "Making activities, badge work and messy crafts.",
  },
  {
    id: "beach",
    name: "Beach or coast",
    icon: "anchor",
    blurb: "Coastal visit, beach games or rock pooling.",
  },
  {
    id: "nighthike",
    name: "Night hike",
    icon: "moon",
    blurb: "Evening or night walk with torches.",
  },
  {
    id: "adventure",
    name: "Adventure course",
    icon: "zap",
    blurb: "High ropes, obstacle courses or team challenges.",
  },
  {
    id: "snow",
    name: "Snow and winter",
    icon: "snowflake",
    blurb: "Sledging, snow games or winter trips.",
  },
  {
    id: "service",
    name: "Service or conservation",
    icon: "tree",
    blurb: "Litter picks, path clearing or outdoor maintenance.",
  },
  {
    id: "performance",
    name: "Music or performance",
    icon: "music",
    blurb: "Campfire songs, gang show or talent night.",
  },
  {
    id: "pioneering",
    name: "Pioneering",
    icon: "knot",
    blurb: "Ropes, poles and lashings.",
  },
  {
    id: "photography",
    name: "Photography or film",
    icon: "camera",
    blurb: "Taking photos or filming during the trip.",
  },
];

export const MEALS = [
  {
    id: "catered",
    name: "Catered by leaders",
    icon: "utensils",
    blurb: "Meals are prepared for everyone.",
  },
  {
    id: "patrol",
    name: "Patrol cooking",
    icon: "fire",
    blurb: "Small groups cook together on stoves or fires.",
  },
  {
    id: "own",
    name: "Bring your own food",
    icon: "cup",
    blurb: "Everyone brings and prepares their own meals.",
  },
  {
    id: "mixed",
    name: "A mix",
    icon: "layers",
    blurb: "Some meals catered, some cooked by the group.",
  },
];

export const UNIFORM = [
  { id: "travel", name: "Travel in uniform", icon: "shirt" },
  { id: "parade", name: "Parade or ceremony", icon: "flag" },
  { id: "remembrance", name: "Remembrance or church", icon: "heart" },
];

export const PERSONAL = [
  { id: "medication", name: "Prescribed medication" },
  { id: "inhaler", name: "Inhaler" },
  { id: "epipen", name: "Adrenaline auto-injector" },
  { id: "glasses", name: "Glasses or contact lenses" },
  { id: "period", name: "Period products" },
  { id: "continence", name: "Continence supplies" },
  { id: "sensory", name: "Sensory or comfort item" },
  { id: "mobility", name: "Mobility or accessibility equipment" },
  { id: "religious", name: "Religious or cultural clothing" },
  { id: "travelsick", name: "Travel sickness remedies" },
  { id: "diet", name: "Allergy or dietary information" },
];

export const EXTRAS = [
  { id: "phone", name: "Phone (leader approved)" },
  { id: "camera", name: "Camera" },
  { id: "teddy", name: "Teddy or comfort toy" },
  { id: "book", name: "Book or cards" },
  { id: "instrument", name: "Musical instrument" },
  { id: "fancy", name: "Fancy dress" },
  { id: "money", name: "Small amount of money" },
  { id: "chair", name: "Camping chair" },
  { id: "earplugs", name: "Earplugs or eye mask" },
  { id: "laundry", name: "Laundry bag" },
];

const GROUP_ORDER = ["essentials", "clothing", "sleeping", "toiletries", "eating", "activities", "extras", "leaders"];

const GROUP_META = {
  essentials: { title: "Essentials & paperwork", icon: "clipboard" },
  clothing: { title: "Clothing", icon: "shirt" },
  sleeping: { title: "Sleeping & camping", icon: "bed" },
  toiletries: { title: "Toiletries & washing", icon: "shower" },
  eating: { title: "Eating & drinking", icon: "utensils" },
  activities: { title: "Activity kit", icon: "compass" },
  extras: { title: "Extras & comfort", icon: "sparkles" },
  leaders: { title: "Leader & group kit", icon: "users" },
};

export function getSection(id) {
  return SECTIONS.find((section) => section.id === id) || SECTIONS[0];
}

export function getTripType(id) {
  return TRIP_TYPES.find((trip) => trip.id === id) || TRIP_TYPES[2];
}

export function getActivity(id) {
  return ACTIVITIES.find((activity) => activity.id === id);
}

export function getAccommodation(id) {
  return ACCOMMODATIONS.find((item) => item.id === id) || ACCOMMODATIONS[0];
}

export function defaultAnswers() {
  return {
    section: "cubs",
    tripType: "weekend",
    tripName: "",
    groupName: "",
    venue: "",
    startDate: "",
    endDate: "",
    nights: 2,
    accommodation: "tent",
    ownTents: "yes",
    season: seasonForDate(new Date()),
    weather: ["mild"],
    showers: "yes",
    laundry: "no",
    activities: [],
    activityOptions: {},
    meals: "patrol",
    uniform: [],
    personal: [],
    extras: [],
    includeLeaderKit: false,
    customItems: "",
  };
}

export function seasonForDate(date) {
  const month = date.getMonth();
  if (month <= 1 || month === 11) return "winter";
  if (month <= 4) return "spring";
  if (month <= 7) return "summer";
  return "autumn";
}

export function normaliseAnswers(input = {}) {
  const defaults = defaultAnswers();
  const answers = {
    ...defaults,
    ...input,
    weather: Array.isArray(input.weather) ? [...input.weather] : defaults.weather,
    activities: Array.isArray(input.activities) ? [...input.activities] : [],
    uniform: Array.isArray(input.uniform) ? [...input.uniform] : [],
    personal: Array.isArray(input.personal) ? [...input.personal] : [],
    extras: Array.isArray(input.extras) ? [...input.extras] : [],
    activityOptions: input.activityOptions && typeof input.activityOptions === "object" ? { ...input.activityOptions } : {},
  };

  if (!SECTIONS.some((section) => section.id === answers.section)) answers.section = defaults.section;
  if (!TRIP_TYPES.some((trip) => trip.id === answers.tripType)) answers.tripType = defaults.tripType;
  if (!ACCOMMODATIONS.some((item) => item.id === answers.accommodation)) answers.accommodation = defaults.accommodation;
  if (!MEALS.some((meal) => meal.id === answers.meals)) answers.meals = defaults.meals;
  if (!SEASONS.some((season) => season.id === answers.season)) answers.season = defaults.season;
  if (answers.tripType === "sleepover") answers.accommodation = "indoor";
  ["tripName", "groupName", "venue", "startDate", "endDate"].forEach((key) => {
    if (typeof answers[key] !== "string") answers[key] = "";
  });
  answers.customItems = typeof answers.customItems === "string" ? answers.customItems : "";

  answers.nights = clampNights(answers.nights, answers.tripType, answers.section);
  answers.activities = answers.activities.filter((id) => Boolean(getActivity(id)));
  answers.weather = answers.weather.filter((id) => WEATHER.some((item) => item.id === id));
  answers.uniform = answers.uniform.filter((id) => UNIFORM.some((item) => item.id === id));
  answers.personal = answers.personal.filter((id) => PERSONAL.some((item) => item.id === id));
  answers.extras = answers.extras.filter((id) => EXTRAS.some((item) => item.id === id));

  return answers;
}

export function clampNights(value, tripType, sectionId) {
  const trip = getTripType(tripType);
  const section = getSection(sectionId);
  if (trip.id === "day") return 0;
  if (trip.id === "sleepover") return 1;

  const parsed = Number(value);
  const fallback = trip.nights == null ? section.defaultNights : trip.nights;
  const nights = Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : fallback;
  const min = trip.id === "long" ? 2 : 1;
  const max = trip.id === "international" ? 21 : trip.id === "long" ? 14 : 4;
  return Math.min(Math.max(nights, min), max);
}

export function nightsBetween(startDate, endDate) {
  if (!startDate || !endDate) return null;
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  if (end < start) return null;
  return Math.round((end - start) / 86400000);
}

export function formatTripDates(answers) {
  const { startDate, endDate } = answers;
  if (!startDate && !endDate) {
    return "To be confirmed";
  }

  const parse = (value) => new Date(`${value}T12:00:00`);
  const start = startDate ? parse(startDate) : null;
  const end = endDate ? parse(endDate) : null;
  if (start && Number.isNaN(start.getTime())) return "To be confirmed";

  const day = (date) => new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" }).format(date);
  const longDay = (date) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(date);

  if (start && end && !Number.isNaN(end.getTime())) {
    if (startDate === endDate) return longDay(start);
    return `${day(start)} – ${longDay(end)}`;
  }
  if (start) {
    return longDay(start);
  }
  return end && !Number.isNaN(end.getTime()) ? `Ends ${longDay(end)}` : "To be confirmed";
}

export function tripMetaLine(list) {
  const parts = [list.section];
  if (list.hasDates) parts.push(list.dates);
  parts.push(list.nights > 0 ? `${list.nights} night${list.nights === 1 ? "" : "s"}` : "Day trip");
  if (list.nights > 0 && list.accommodation) parts.push(list.accommodation);
  if (list.venue) parts.push(list.venue);
  if (list.groupName) parts.push(list.groupName);
  return parts.join("  •  ");
}

export function tripTitle(answers) {
  if (answers.tripName && answers.tripName.trim()) return answers.tripName.trim();
  const section = getSection(answers.section);
  const trip = getTripType(answers.tripType);
  return `${section.name} ${trip.name.toLowerCase()}`;
}

export function slugify(value) {
  return String(value || "kit-list")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) || "kit-list";
}

function weatherSet(answers) {
  return new Set(answers.weather);
}

function hasAny(set, values) {
  return values.some((value) => set.has(value));
}

export function buildKitList(input) {
  const answers = normaliseAnswers(input);
  const section = getSection(answers.section);
  const trip = getTripType(answers.tripType);
  const accommodation = getAccommodation(answers.accommodation);
  const weather = weatherSet(answers);
  const nights = answers.nights;
  const overnight = nights > 0;
  const dayTrip = nights === 0;
  const winter = answers.season === "winter" || hasAny(weather, ["freezing", "cold"]) || answers.activities.includes("snow");
  const warm = answers.season === "summer" || hasAny(weather, ["sunny"]);
  const wet = hasAny(weather, ["wet", "muddy"]);
  const windy = hasAny(weather, ["windy"]);
  const muddy = hasAny(weather, ["muddy"]);
  const showers = answers.showers === "yes" || (answers.showers === "unknown" && overnight);

  const groups = new Map();
  const seen = new Map();

  const ensureGroup = (id) => {
    if (!groups.has(id)) {
      const meta = GROUP_META[id] || { title: id, icon: "cube" };
      groups.set(id, { id, title: meta.title, icon: meta.icon, items: [] });
    }
    return groups.get(id);
  };

  const addItem = (groupId, item) => {
    if (!item || !item.id || !item.name) return;
    const normalized = {
      id: item.id,
      name: item.name,
      note: item.note || "",
      qty: item.qty == null || item.qty === "" ? "" : String(item.qty),
      optional: Boolean(item.optional),
    };

    const existing = seen.get(normalized.id);
    if (existing) {
      const oldQty = Number(existing.qty);
      const newQty = Number(normalized.qty);
      if (Number.isFinite(oldQty) && Number.isFinite(newQty) && newQty > oldQty) existing.qty = normalized.qty;
      if (normalized.note && !existing.note.includes(normalized.note)) {
        existing.note = existing.note ? `${existing.note} ${normalized.note}` : normalized.note;
      }
      return;
    }

    ensureGroup(groupId).items.push(normalized);
    seen.set(normalized.id, normalized);
  };

  const addGroupItem = (id, name, note, qty) => addItem("essentials", { id, name, note, qty });

  const water = answers.activities.includes("water");
  const waterOptions = answers.activityOptions.water || {};
  const waterTypes = new Set(Array.isArray(waterOptions.types) ? waterOptions.types : []);
  const waterSessions = Math.max(1, Math.min(4, Number(waterOptions.sessions) || 1));
  const waterAny = water && waterTypes.size > 0;
  const hasPaddling = ["paddle", "raft", "sail", "sup"].some((type) => waterTypes.has(type));
  const hasWetWater = hasPaddling || waterTypes.has("openwater");
  const waterShowerChoice = waterOptions.showers || "unknown";
  const waterShowers = waterShowerChoice === "yes" || (waterShowerChoice === "unknown" && showers);
  const wetsuit = waterOptions.wetsuit || "provided";

  const hiking = answers.activities.includes("hiking");
  const hikeOptions = answers.activityOptions.hiking || {};
  const hikeLength = hikeOptions.length || "half";
  const hikeTerrain = hikeOptions.terrain || "paths";
  const hikeLong = ["full", "expedition"].includes(hikeLength);
  const hikeMuddy = hikeTerrain === "muddy" || muddy;

  const climbing = answers.activities.includes("climbing");
  const climbingOptions = answers.activityOptions.climbing || {};
  const climbWhere = climbingOptions.where || "indoor";

  const cycling = answers.activities.includes("cycling");
  const cyclingOptions = answers.activityOptions.cycling || {};
  const ownBikes = cyclingOptions.bikes === "own";
  const bikeOffroad = cyclingOptions.terrain === "offroad";

  const campfire = answers.activities.includes("campfire");
  const campfireOptions = answers.activityOptions.campfire || {};
  const fireCooking = campfireOptions.cooking === "yes";

  const beach = answers.activities.includes("beach");
  const cooking = answers.activities.includes("cooking") || ["patrol", "own", "mixed"].includes(answers.meals) || fireCooking;
  const patrolCooking = ["patrol", "mixed"].includes(answers.meals);
  const ownFood = answers.meals === "own";
  const smartUniform = answers.uniform.some((value) => ["parade", "remembrance"].includes(value));
  const travelUniform = answers.uniform.includes("travel");
  const international = trip.id === "international";
  const personal = new Set(answers.personal);
  const extras = new Set(answers.extras);

  // -------------------------------------------------------------------------
  // Essentials
  // -------------------------------------------------------------------------

  addGroupItem("water-bottle", "Water bottle (1 litre or larger)", "Fill it before you leave and label it clearly.", 1);
  addGroupItem(
    "day-bag",
    "Day bag or rucksack",
    hiking
      ? "A sturdy rucksack for the walk with room for waterproofs, lunch, water and a spare layer."
      : "For waterproofs, lunch, water and spare layers.",
    1,
  );
  if (warm || dayTrip || hasWetWater) {
    addGroupItem("sun-cream", "Sun cream (SPF 30 or higher)", "Pack it even if it is overcast, especially near water or snow.", 1);
  }
  if (warm || overnight || campfire) {
    addGroupItem("insect-repellent", "Insect repellent", "Useful for evenings, long grass and sites near water.", 1);
  }
  addGroupItem("tissues", "Tissues or wet wipes");
  addGroupItem("hand-gel", "Hand sanitiser");
  addGroupItem("contact-card", "Emergency contact card", "Leaders should carry a copy. Keep personal details inside the bag, not on the outside.", 1);
  if (international) {
    addGroupItem("passport", "Passport", "Check it is in date and keep it in a named, waterproof pouch.", 1);
    addGroupItem("ehic", "EHIC or GHIC card", "Keep with your travel insurance details.", 1);
    addGroupItem("insurance", "Travel insurance details", "One copy for leaders and one kept with your documents.", 1);
    addGroupItem("currency", "Local currency", "A small amount, plus a contactless card if agreed with leaders.", 1);
    addGroupItem("adapter", "Travel plug adapter", "Check the plug type for your destination.", 1);
    addGroupItem("document-copies", "Copies of important documents", "Passport, insurance and emergency contacts, kept separately.", 1);
    addGroupItem("luggage-tag", "Luggage tag", "Put your name and group on your bag.", 1);
  }

  if (personal.has("medication")) {
    addGroupItem("medication", "Prescribed medication", "Hand to leaders in a labelled bag with clear dosage instructions.", 1);
  }
  if (personal.has("inhaler")) {
    addGroupItem("inhaler", "Inhaler", "Bring a spare if you have one, and tell leaders where it is kept.", 1);
  }
  if (personal.has("epipen")) {
    addGroupItem("epipen", "Adrenaline auto-injector", "Hand to leaders with your allergy action plan.", 1);
  }
  if (personal.has("glasses")) {
    addGroupItem("spare-glasses", "Spare glasses or contact lenses", "Include solution and a case if you wear lenses.", 1);
  }
  if (personal.has("period")) {
    addGroupItem("period-products", "Period products", "Pack enough for the whole trip, plus spare underwear.", 1);
  }
  if (personal.has("continence")) {
    addGroupItem("continence", "Continence supplies", "Pack discreetly and let a leader know where they are kept.", 1);
  }
  if (personal.has("sensory")) {
    addGroupItem("sensory", "Sensory or comfort item", "Something small that helps you feel settled.", 1);
  }
  if (personal.has("mobility")) {
    addGroupItem("mobility", "Mobility or accessibility equipment", "Label it and check it suits the venue and terrain.", 1);
  }
  if (personal.has("religious")) {
    addGroupItem("religious-clothing", "Religious or cultural clothing", "Bring anything needed for prayer, diet or dress.", 1);
  }
  if (personal.has("travelsick")) {
    addGroupItem("travel-sickness", "Travel sickness remedies", "Hand to leaders if prescribed.", 1);
  }
  if (personal.has("diet")) {
    addGroupItem("diet-info", "Allergy and dietary information", "Give a copy to the catering team and keep one with health forms.", 1);
  }

  // -------------------------------------------------------------------------
  // Clothing
  // -------------------------------------------------------------------------

  const underwearQty = dayTrip ? 1 : nights + 1;
  const socksQty = dayTrip ? 1 : nights + 2 + (hiking ? 1 : 0);
  const tshirtQty = dayTrip ? 1 : nights + 2 + (hasWetWater ? 1 : 0);
  const trouserQty = dayTrip ? 1 : 2;
  const sleepwearQty = nights >= 2 ? 2 : 1;

  addItem("clothing", { id: "underwear", name: "Underwear", qty: underwearQty });
  addItem("clothing", { id: "socks", name: "Socks", note: hiking ? "Include a spare pair for walking." : "", qty: socksQty });
  addItem("clothing", { id: "tshirts", name: "T-shirts", note: hasWetWater ? "Include an extra dry top for after water activities." : "", qty: tshirtQty });
  addItem("clothing", { id: "trousers", name: "Trousers or shorts", note: "Quick-drying trousers are best if it is wet or muddy.", qty: trouserQty });
  if (winter || hasWetWater || hiking || windy) {
    addItem("clothing", { id: "long-sleeve", name: "Long-sleeve base layer", note: "Synthetic or wool rather than cotton, especially on the water.", qty: 1 });
  }
  addItem("clothing", { id: "fleece", name: "Fleece or warm jumper", qty: winter ? 2 : 1 });
  addItem("clothing", { id: "waterproof-jacket", name: "Waterproof jacket", note: "A proper waterproof, not just a showerproof coat.", qty: 1 });
  if (wet || hiking || hasWetWater || windy) {
    addItem("clothing", { id: "waterproof-trousers", name: "Waterproof trousers", qty: 1 });
  }
  if (overnight) {
    addItem("clothing", { id: "sleepwear", name: "Pyjamas or sleepwear", qty: sleepwearQty });
  }
  if (warm) {
    addItem("clothing", { id: "sun-hat", name: "Sun hat or cap", note: "A hat with a strap is best on the water.", qty: 1 });
  }
  if (winter) {
    addItem("clothing", { id: "warm-hat", name: "Warm hat or beanie", qty: 1 });
    addItem("clothing", { id: "gloves", name: "Warm gloves", note: "Pack a spare pair if they are likely to get wet.", qty: 1 });
    addItem("clothing", { id: "scarf", name: "Scarf or neck buff", qty: 1 });
  }
  addItem("clothing", { id: "trainers", name: "Trainers or sturdy shoes", qty: 1 });
  if (overnight) {
    addItem("clothing", { id: "camp-shoes", name: "Camp shoes or slippers", note: "Easy to slip on inside the tent or hall.", qty: 1 });
  }
  if (hiking) {
    addItem("clothing", {
      id: "walking-boots",
      name: "Walking boots",
      note: "Worn in, waterproof and comfortable.",
      qty: 1,
    });
  }
  if (muddy || wet || (overnight && accommodation.id === "tent")) {
    addItem("clothing", { id: "wellies", name: "Wellies or waterproof boots", note: "Useful if the site gets muddy.", qty: 1 });
  }
  if (waterAny || beach) {
    const sessions = waterAny ? waterSessions : 1;
    addItem("clothing", { id: "swimwear", name: "Swimming costume or trunks", qty: sessions });
    addItem("clothing", { id: "wet-bag", name: "Plastic bags for wet clothes", note: "One for wet kit and one for muddy footwear.", qty: 2 });
    addItem("clothing", { id: "change-clothes", name: "Full change of clothes", note: "Keep it dry in a bag for after water activities.", qty: 1 });
  }

  // -------------------------------------------------------------------------
  // Sleeping & camping
  // -------------------------------------------------------------------------

  if (overnight) {
    const bagRating = winter ? "A 4-season or extra-warm sleeping bag" : "A 2–3 season sleeping bag";
    addItem("sleeping", { id: "sleeping-bag", name: "Sleeping bag", note: `${bagRating}. Check it fits and is clean before packing.`, qty: 1 });
    addItem("sleeping", { id: "sleeping-mat", name: "Sleeping mat", note: "Roll mat or self-inflating mat for warmth and comfort.", qty: 1 });
    addItem("sleeping", { id: "pillow", name: "Pillow or pillowcase", note: "A small travel pillow is fine.", qty: 1 });
    if (winter) {
      addItem("sleeping", { id: "extra-blanket", name: "Extra blanket", qty: 1 });
      addItem("sleeping", { id: "hot-water-bottle", name: "Hot water bottle", note: "Fill at bedtime, never inside the sleeping bag.", qty: 1 });
    }
    if (["tent", "mixed"].includes(accommodation.id) && answers.ownTents !== "no") {
      addItem("sleeping", { id: "tent", name: "Tent", note: "Check poles, pegs and instructions before leaving.", qty: 1 });
      addItem("sleeping", { id: "mallet", name: "Mallet", qty: 1 });
      addItem("sleeping", { id: "spare-pegs", name: "Spare tent pegs and guy lines", qty: 1 });
      addItem("sleeping", { id: "groundsheet", name: "Groundsheet or footprint", qty: 1 });
    }
    if (extras.has("chair")) addItem("sleeping", { id: "camping-chair", name: "Camping chair", qty: 1 });
    if (extras.has("earplugs")) addItem("sleeping", { id: "earplugs", name: "Earplugs or eye mask", qty: 1 });
    addItem("sleeping", { id: "lantern", name: "Torch or small lantern", note: "Include spare batteries.", qty: 1 });
  }

  // -------------------------------------------------------------------------
  // Toiletries
  // -------------------------------------------------------------------------

  addItem("toiletries", { id: "wash-bag", name: "Wash bag", qty: 1 });
  addItem("toiletries", { id: "toothbrush", name: "Toothbrush and toothpaste", qty: 1 });
  addItem("toiletries", { id: "soap", name: "Soap or shower gel", qty: 1 });
  if (showers) {
    addItem("toiletries", { id: "shampoo", name: "Shampoo and conditioner", qty: 1 });
    addItem("toiletries", { id: "shower-shoes", name: "Flip flops for the shower", qty: 1 });
  } else if (overnight) {
    addItem("toiletries", { id: "dry-shampoo", name: "Dry shampoo or flannel wash kit", note: "Helpful when there are no showers on site.", qty: 1 });
  }
  if (section.id !== "beavers") {
    addItem("toiletries", { id: "deodorant", name: "Deodorant", qty: 1 });
  }
  addItem("toiletries", { id: "hairbrush", name: "Hairbrush and hair ties", note: "Long hair should be tied back for water sports, climbing and archery.", qty: 1 });

  const towelQty = 1 + (showers ? 1 : 0) + (waterAny ? 1 : 0);
  let towelNote = "";
  if (waterAny && showers) {
    towelNote = "One for washing, one for showers and one for water activities.";
  } else if (waterAny) {
    towelNote = "One for washing and one for after water activities.";
  } else if (showers) {
    towelNote = "Pack a spare so you always have a dry one.";
  }
  addItem("toiletries", { id: "towel", name: "Towel", note: towelNote, qty: towelQty });

  if (hasPaddling && waterShowers) {
    addItem("toiletries", {
      id: "paddling-shower-kit",
      name: "Extra shower kit for after paddling",
      note: "A second towel, shower gel, shampoo and clean, dry clothes.",
      qty: 1,
    });
  }
  if (warm || winter) addItem("toiletries", { id: "lip-balm", name: "Lip balm", qty: 1 });
  if (section.id === "scouts" && overnight) addItem("toiletries", { id: "razor", name: "Razor and shaving kit", note: "If needed.", qty: 1, optional: true });
  if (answers.laundry === "yes") addItem("toiletries", { id: "laundry-bag", name: "Travel wash and laundry bag", qty: 1 });

  // -------------------------------------------------------------------------
  // Eating
  // -------------------------------------------------------------------------

  if (cooking) {
    if (patrolCooking || ownFood || answers.meals === "mixed") {
      addItem("eating", { id: "mess-kit", name: "Mess kit", note: "Plate, bowl, mug and cutlery in a named bag.", qty: 1 });
      addItem("eating", { id: "tea-towel", name: "Tea towel", qty: 1 });
      addItem("eating", { id: "washing-up", name: "Washing-up liquid and sponge", note: "Check whether your patrol needs to bring this.", qty: 1 });
      addItem("eating", { id: "apron", name: "Apron or old shirt", note: "For cooking and washing up.", qty: 1 });
    }
    if (ownFood || answers.meals === "patrol" || answers.meals === "mixed") {
      addItem("eating", { id: "recipe", name: "Recipe and ingredients", note: "Check the menu, allergies and who is carrying what.", qty: 1 });
    }
    if (answers.meals === "catered" && !fireCooking) {
      addItem("eating", { id: "mess-kit-catered", name: "Mug and cutlery", note: "Even catered camps usually ask for your own mug.", qty: 1 });
    }
  }
  addItem("eating", { id: "snacks", name: "Snacks for the journey", note: "Check the section's allergy guidance before packing nuts or shared snacks.", qty: 1 });

  // -------------------------------------------------------------------------
  // Activity kit
  // -------------------------------------------------------------------------

  if (water) {
    if (waterTypes.size === 0) {
      addItem("activities", { id: "water-basic", name: "Swimming kit", note: "Select the specific water activities above for a detailed list.", qty: 1 });
    }
    if (waterTypes.has("splash")) {
      addItem("activities", { id: "splash-clothes", name: "Old clothes for splash games", note: "Clothes that can get wet and muddy.", qty: 1 });
      addItem("activities", { id: "water-shoes", name: "Water shoes or old trainers", qty: 1 });
    }
    if (waterTypes.has("pool")) {
      addItem("activities", { id: "goggles", name: "Swimming goggles", qty: 1 });
      addItem("activities", { id: "swim-cap", name: "Swimming hat", note: "Some pools require one.", qty: 1 });
      addItem("activities", { id: "pool-flip-flops", name: "Flip flops or pool shoes", qty: 1 });
      addItem("activities", { id: "padlock", name: "Small padlock", note: "For a pool locker.", qty: 1 });
      addItem("activities", { id: "pool-coin", name: "£1 coin", note: "For lockers or hair dryers.", qty: 1 });
    }
    if (waterTypes.has("openwater")) {
      if (wetsuit !== "provided") addItem("activities", { id: "wetsuit", name: "Wetsuit", note: "Check it fits before you leave.", qty: 1 });
      addItem("activities", { id: "dry-robe", name: "Dry robe or warm change robe", qty: 1 });
      addItem("activities", { id: "tow-float", name: "Tow float", note: "Usually provided; check with the activity leader.", qty: 1, optional: true });
      addItem("activities", { id: "hot-drink", name: "Flask or hot drink", qty: 1 });
    }
    if (hasPaddling) {
      if (wetsuit !== "provided") addItem("activities", { id: "wetsuit", name: "Wetsuit", note: "Check it fits before you leave.", qty: 1 });
      addItem("activities", { id: "water-shoes", name: "Water shoes or old trainers", qty: 1 });
      addItem("activities", { id: "rash-vest", name: "Rash vest or thermal top", note: "Synthetic layers only, as cotton stays cold when wet.", qty: 1 });
      addItem("activities", { id: "dry-bag", name: "Dry bag", note: "For spare layers and anything that must stay dry.", qty: 1 });
      addItem("activities", { id: "paddle-gloves", name: "Paddling gloves", note: "Useful for longer sessions or cold weather.", qty: 1, optional: true });
      addItem("activities", { id: "nose-clip", name: "Nose clip and ear plugs", note: "If you use them for water sports.", qty: 1, optional: true });
      addItem("activities", { id: "glasses-strap", name: "Glasses strap", note: "Recommended if you wear glasses on the water.", qty: 1, optional: true });
      addItem("activities", { id: "after-water-layer", name: "Warm, dry layer for after paddling", qty: 1 });
    }
    if (waterTypes.has("sail")) {
      addItem("activities", { id: "spray-top", name: "Spray top or waterproof smock", qty: 1 });
      addItem("activities", { id: "sailing-gloves", name: "Sailing gloves", qty: 1 });
    }
    if (waterTypes.has("raft")) {
      addItem("activities", { id: "raft-gloves", name: "Old gloves", note: "For handling ropes and barrels.", qty: 1 });
    }
    if (hasWetWater) {
      addItem("activities", { id: "water-snacks", name: "Extra snacks", note: "Water sessions use plenty of energy.", qty: 1 });
    }
  }

  if (hiking) {
    addItem("activities", { id: "blister-plasters", name: "Blister plasters", qty: 1 });
    addItem("activities", { id: "hike-snacks", name: "Packed lunch and snacks", qty: 1 });
    if (hikeLong) {
      addItem("activities", { id: "headtorch", name: "Headtorch and spare batteries", qty: 1 });
      addItem("activities", { id: "emergency-shelter", name: "Emergency shelter", note: "Usually carried by the leader.", qty: 1, optional: true });
    }
    if (hikeTerrain === "hills" || hikeTerrain === "snow") {
      addItem("activities", { id: "trekking-poles", name: "Trekking poles", qty: 1, optional: true });
    }
    if (hikeMuddy) {
      addItem("activities", { id: "gaiters", name: "Gaiters", qty: 1, optional: true });
    }
    if (answers.season === "summer") {
      addItem("activities", { id: "midge-net", name: "Midge net", note: "Worth packing for Scotland and still summer evenings.", qty: 1, optional: true });
    }
    addItem("activities", { id: "hike-whistle", name: "Whistle", note: "Usually carried by the leader.", qty: 1, optional: true });
  }

  if (climbing) {
    addItem("activities", { id: "climb-shoes", name: climbWhere === "indoor" ? "Climbing shoes or clean trainers" : "Climbing shoes or sturdy trainers", qty: 1 });
    addItem("activities", { id: "climb-trousers", name: "Flexible trousers", note: "Stretchy trousers or shorts you can move in.", qty: 1 });
    addItem("activities", { id: "hair-ties", name: "Hair ties", note: "Long hair must be tied back.", qty: 1 });
    addItem("activities", { id: "climb-water", name: "Water and a snack", qty: 1 });
    addItem("activities", { id: "climb-no-jewellery", name: "Leave jewellery at home", note: "Rings, watches and necklaces must come off before climbing.", qty: "" });
    if (climbWhere === "indoor") addItem("activities", { id: "chalk-bag", name: "Chalk bag", qty: 1, optional: true });
    if (climbWhere === "outdoor") addItem("activities", { id: "harness", name: "Climbing harness", note: "If you have your own.", qty: 1, optional: true });
  }

  if (answers.activities.includes("archery")) {
    addItem("activities", { id: "archery-shoes", name: "Closed-toe shoes", qty: 1 });
    addItem("activities", { id: "hair-ties", name: "Hair ties", note: "Long hair must be tied back.", qty: 1 });
    addItem("activities", { id: "archery-top", name: "Fitted top or jumper", note: "Loose sleeves can catch on the bowstring.", qty: 1 });
    addItem("activities", { id: "water-bottle", name: "Water bottle", qty: 1 });
  }

  if (cycling) {
    addItem("activities", { id: "bike-helmet", name: "Cycle helmet", note: "Check it fits properly and is not damaged.", qty: 1 });
    if (ownBikes) addItem("activities", { id: "bike", name: "Bicycle", note: "Check brakes, tyres and gears before leaving.", qty: 1 });
    addItem("activities", { id: "bike-gloves", name: "Cycling gloves", qty: 1 });
    addItem("activities", { id: "hi-vis", name: "High-vis top or jacket", qty: 1 });
    addItem("activities", { id: "bike-shorts", name: "Padded shorts or comfortable trousers", qty: 1 });
    addItem("activities", { id: "bike-lock", name: "Bike lock", note: "If bringing your own bike.", qty: 1, optional: true });
    addItem("activities", { id: "bike-repair", name: "Puncture repair kit", note: "Usually carried by the leader.", qty: 1, optional: true });
    addItem("activities", { id: "bike-snacks", name: "Water and snacks", qty: 1 });
    if (bikeOffroad) addItem("activities", { id: "bike-glasses", name: "Sports glasses or sunglasses", qty: 1 });
  }

  if (campfire) {
    addItem("activities", { id: "campfire-layer", name: "Warm layer for the campfire", note: "Evenings cool down quickly once the sun drops.", qty: 1 });
    addItem("activities", { id: "campfire-gloves", name: "Fire gloves", note: "Usually provided by the leader.", qty: 1, optional: true });
    if (fireCooking) addItem("activities", { id: "campfire-stick", name: "Marshmallow stick or long fork", qty: 1, optional: true });
    addItem("activities", { id: "campfire-blanket", name: "Campfire blanket", note: "If your section uses them.", qty: 1, optional: true });
  }

  if (cooking) {
    addItem("activities", { id: "apron", name: "Apron or old shirt", qty: 1 });
    if (patrolCooking || ownFood) addItem("activities", { id: "recipe", name: "Recipe and ingredients", qty: 1 });
  }

  if (answers.activities.includes("sports")) {
    addItem("activities", { id: "sports-kit", name: "PE kit or sports clothes", qty: 1 });
    addItem("activities", { id: "sports-shoes", name: "Trainers", qty: 1 });
    addItem("activities", { id: "sports-shin", name: "Shin pads", note: "If playing contact sports.", qty: 1, optional: true });
    addItem("activities", { id: "sports-mouth", name: "Mouthguard", note: "If needed.", qty: 1, optional: true });
    addItem("activities", { id: "water-bottle", name: "Water bottle", qty: 1 });
  }

  if (answers.activities.includes("crafts")) {
    addItem("activities", { id: "craft-shirt", name: "Old shirt or apron", qty: 1 });
    addItem("activities", { id: "craft-kit", name: "Craft materials", note: "Check the programme for anything specific.", qty: 1 });
    addItem("activities", { id: "craft-wipes", name: "Wet wipes", qty: 1 });
  }

  if (beach) {
    addItem("activities", { id: "beach-shoes", name: "Water shoes or sandals", qty: 1 });
    addItem("activities", { id: "beach-towel", name: "Beach towel", qty: 1 });
    addItem("activities", { id: "beach-bag", name: "Dry bag or waterproof bag", qty: 1 });
    addItem("activities", { id: "beach-bucket", name: "Bucket and spade", qty: 1, optional: true });
    addItem("activities", { id: "beach-windbreak", name: "Windbreak", note: "Usually a group item.", qty: 1, optional: true });
  }

  if (answers.activities.includes("nighthike")) {
    addItem("activities", { id: "night-torch", name: "Torch or headtorch", note: "With spare batteries.", qty: 1 });
    addItem("activities", { id: "hi-vis", name: "High-vis top or jacket", qty: 1 });
    addItem("activities", { id: "night-glow", name: "Glow stick", note: "Helpful for spotting everyone in the dark.", qty: 1, optional: true });
    addItem("activities", { id: "night-map", name: "Map and compass", note: "Usually carried by the leader.", qty: 1, optional: true });
  }

  if (answers.activities.includes("adventure")) {
    addItem("activities", { id: "trainers", name: "Trainers or sturdy shoes", qty: 1 });
    addItem("activities", { id: "adventure-clothes", name: "Fitted clothing", note: "Avoid loose clothing that can catch on ropes.", qty: 1 });
    addItem("activities", { id: "adventure-gloves", name: "Gloves", qty: 1, optional: true });
    addItem("activities", { id: "water-bottle", name: "Water bottle", qty: 1 });
  }

  if (answers.activities.includes("snow")) {
    addItem("activities", { id: "snow-thermals", name: "Thermal base layers", qty: 2 });
    addItem("activities", { id: "snow-boots", name: "Snow boots or waterproof boots", qty: 1 });
    addItem("activities", { id: "snow-gloves", name: "Waterproof gloves", qty: 2 });
    addItem("activities", { id: "snow-balaclava", name: "Balaclava or warm hat", qty: 1 });
    addItem("activities", { id: "snow-goggles", name: "Snow goggles or sunglasses", qty: 1 });
    addItem("activities", { id: "snow-handwarmers", name: "Hand warmers", qty: 1, optional: true });
  }

  if (answers.activities.includes("service")) {
    addItem("activities", { id: "old-clothes", name: "Old clothes you can get dirty", qty: 1 });
    addItem("activities", { id: "service-gloves", name: "Gardening gloves", qty: 1 });
    addItem("activities", { id: "service-shoes", name: "Sturdy shoes or boots", qty: 1 });
    addItem("activities", { id: "water-bottle", name: "Water bottle", qty: 1 });
  }

  if (answers.activities.includes("performance")) {
    addItem("activities", { id: "instrument", name: "Musical instrument", note: "Label the case.", qty: 1, optional: true });
    addItem("activities", { id: "performance-music", name: "Music or script folder", qty: 1, optional: true });
    addItem("activities", { id: "performance-costume", name: "Costume or performance clothes", qty: 1, optional: true });
  }

  if (answers.activities.includes("pioneering")) {
    addItem("activities", { id: "pioneering-gloves", name: "Work gloves", qty: 1 });
    addItem("activities", { id: "pioneering-shoes", name: "Sturdy shoes", qty: 1 });
    addItem("activities", { id: "old-clothes", name: "Old clothes you can get dirty", qty: 1 });
  }

  if (answers.activities.includes("photography")) {
    addItem("activities", { id: "camera", name: "Camera", qty: 1, optional: true });
    addItem("activities", { id: "camera-batteries", name: "Spare batteries and memory card", qty: 1, optional: true });
    addItem("activities", { id: "camera-case", name: "Waterproof camera case", qty: 1, optional: true });
  }

  // -------------------------------------------------------------------------
  // Uniform
  // -------------------------------------------------------------------------

  if (travelUniform || smartUniform) {
    addItem("clothing", { id: "uniform", name: "Section uniform", note: "Shirt or top, plus neckerchief.", qty: 1 });
    addItem("clothing", { id: "neckerchief", name: "Neckerchief", qty: 1 });
  }
  if (smartUniform) {
    addItem("clothing", { id: "smart-shoes", name: "Smart shoes", note: "For a parade, ceremony or church service.", qty: 1 });
  }

  // -------------------------------------------------------------------------
  // Extras
  // -------------------------------------------------------------------------

  if (extras.has("phone")) addItem("extras", { id: "phone", name: "Phone", note: "Only if agreed with leaders. Keep it charged and in a dry bag.", qty: 1 });
  if (extras.has("camera")) addItem("extras", { id: "camera", name: "Camera", qty: 1 });
  if (extras.has("teddy")) addItem("extras", { id: "teddy", name: "Teddy or comfort toy", qty: 1 });
  if (extras.has("book")) addItem("extras", { id: "book", name: "Book, cards or quiet game", qty: 1 });
  if (extras.has("instrument")) addItem("extras", { id: "instrument", name: "Musical instrument", note: "Check with leaders before bringing anything valuable.", qty: 1 });
  if (extras.has("fancy")) addItem("extras", { id: "fancy-dress", name: "Fancy dress", qty: 1 });
  if (extras.has("money")) addItem("extras", { id: "money", name: "Small amount of money", note: "Only if leaders have said it is needed.", qty: 1 });
  if (extras.has("laundry")) addItem("extras", { id: "laundry-bag", name: "Laundry bag", qty: 1 });
  if (extras.has("chair") && !overnight) addItem("extras", { id: "camping-chair", name: "Camping chair", qty: 1 });

  const custom = String(answers.customItems || "")
    .split(/\r?\n|;/)
    .map((line) => line.trim())
    .filter(Boolean);
  custom.forEach((line, index) => {
    addItem("extras", {
      id: `custom-${index}-${slugify(line)}`,
      name: line,
      note: "Added by your leader.",
      qty: 1,
    });
  });

  // -------------------------------------------------------------------------
  // Leader & group kit
  // -------------------------------------------------------------------------

  if (answers.includeLeaderKit) {
    addItem("leaders", { id: "leader-first-aid", name: "Group first aid kit", note: "Check it is in date and stocked with burns and blister supplies.", qty: 1 });
    addItem("leaders", { id: "leader-consent", name: "Consent and health forms", note: "Printed copies, stored securely.", qty: 1 });
    addItem("leaders", { id: "leader-medication", name: "Medication log and safe storage", qty: 1 });
    addItem("leaders", { id: "leader-risk", name: "Risk assessments and emergency plan", qty: 1 });
    addItem("leaders", { id: "leader-contacts", name: "Emergency contact list", note: "Include the venue address and nearest hospital.", qty: 1 });
    addItem("leaders", { id: "leader-printed", name: "Printed kit list and programme", qty: 1 });
    addItem("leaders", { id: "leader-water", name: "Water containers and hand-wash station", qty: 1 });
    addItem("leaders", { id: "leader-fire", name: "Fire kit, fire blanket and burns kit", qty: 1 });
    addItem("leaders", { id: "leader-cooking", name: "Group cooking kit and fuel", qty: 1 });
    addItem("leaders", { id: "leader-shelter", name: "Group shelter or tarp", qty: 1 });
    addItem("leaders", { id: "leader-repair", name: "Repair kit and duct tape", qty: 1 });
    addItem("leaders", { id: "leader-power", name: "Power bank and charger", qty: 1 });
    addItem("leaders", { id: "leader-hivis", name: "High-vis vests and whistles", qty: 1 });
    addItem("leaders", { id: "leader-map", name: "Maps, compass and route card", qty: 1 });
    addItem("leaders", { id: "leader-radio", name: "Radios or phones for the leadership team", qty: 1 });
    addItem("leaders", { id: "leader-bins", name: "Bin bags and cleaning supplies", qty: 1 });
    addItem("leaders", { id: "leader-food", name: "Food storage and cool box", qty: 1 });
    addItem("leaders", { id: "leader-spares", name: "Spare clothes and spare sleeping kit", qty: 1 });
    if (warm) addItem("leaders", { id: "leader-tick", name: "Tick removers and midge repellent", qty: 1 });
    if (international) addItem("leaders", { id: "leader-docs", name: "Group travel documents and insurance", qty: 1 });
  }

  const orderedGroups = [...groups.values()]
    .filter((group) => group.items.length > 0)
    .sort((a, b) => GROUP_ORDER.indexOf(a.id) - GROUP_ORDER.indexOf(b.id));

  const totalItems = orderedGroups.reduce((total, group) => total + group.items.length, 0);
  const activityNames = answers.activities.map((id) => getActivity(id)?.name).filter(Boolean);
  const hasDates = Boolean(answers.startDate || answers.endDate);
  const dates = formatTripDates(answers);

  return {
    title: tripTitle(answers),
    section: section.name,
    sectionId: section.id,
    tripType: trip.name,
    tripTypeId: trip.id,
    hasDates,
    dates,
    nights,
    accommodation: accommodation.name,
    season: SEASONS.find((season) => season.id === answers.season)?.name || "Mixed",
    weather: answers.weather.map((id) => WEATHER.find((item) => item.id === id)?.name).filter(Boolean),
    activities: activityNames,
    groupName: answers.groupName || "",
    venue: answers.venue || "",
    groups: orderedGroups,
    totalItems,
    tips: buildTips(answers, { overnight, winter, waterAny, hasPaddling, hiking, international, section }),
    meta: [
      { label: "Section", value: section.name },
      { label: "Trip", value: trip.name },
      { label: "Dates", value: dates },
      { label: "Nights", value: nights === 0 ? "Day trip" : String(nights) },
      { label: "Sleeping", value: overnight ? accommodation.name : "Not staying over" },
      { label: "Weather", value: answers.weather.length ? answers.weather.map((id) => WEATHER.find((item) => item.id === id)?.name).join(", ") : "Mixed" },
    ],
    generatedAt: new Date(),
  };
}

function buildTips(answers, context) {
  const tips = [
    "Label every item with your name, including socks, towels and water bottles.",
    "Pack your bag with a grown-up and tick off each item before you leave.",
    "Check the forecast the night before and add extra warm or waterproof layers if needed.",
    "Leave valuables and anything you would be upset to lose at home.",
  ];

  if (context.overnight) {
    tips.push("Keep a dry change of clothes and your sleeping bag in waterproof bags inside your rucksack.");
  }
  if (context.waterAny || context.hasPaddling) {
    tips.push("Pack a plastic bag for wet kit and keep dry clothes near the top of your bag.");
  }
  if (context.hasPaddling) {
    tips.push("Bring a spare towel and shower kit, as paddling sessions usually end with a shower and a full change.");
  }
  if (context.winter) {
    tips.push("Pack layers rather than one thick jumper, and keep spare clothes dry.");
  }
  if (context.hiking) {
    tips.push("Wear walking boots on a short walk beforehand so they are broken in.");
  }
  if (context.international) {
    tips.push("Keep passports, insurance details and medication in hand luggage rather than hold bags.");
  }
  if (context.section.id === "beavers") {
    tips.push("A spare set of clothes and a comfort toy are always welcome for Beavers.");
  }
  if (answers.personal.some((id) => ["medication", "inhaler", "epipen"].includes(id))) {
    tips.push("Hand medication to a leader at drop-off, in a labelled bag with clear instructions.");
  }
  return tips;
}

export function plainTextList(list) {
  const lines = [`${list.title} — kit list`, ""];
  lines.push(tripMetaLine(list));
  lines.push("");
  for (const group of list.groups) {
    lines.push(`${group.title.toUpperCase()}`);
    for (const item of group.items) {
      const qty = item.qty ? ` (${item.qty})` : "";
      lines.push(`[ ] ${item.name}${qty}${item.note ? ` — ${item.note}` : ""}`);
    }
    lines.push("");
  }
  lines.push("Before you go:");
  list.tips.forEach((tip) => lines.push(`- ${tip}`));
  lines.push("");
  lines.push("Always follow your own risk assessment and safeguarding procedures. This list is a starting point, not a substitute for your event plan.");
  return lines.join("\n");
}

export function csvRows(list) {
  const rows = [["Item", "Category", "Quantity", "Notes"]];
  for (const group of list.groups) {
    for (const item of group.items) {
      rows.push([item.name, group.title, item.qty, item.note]);
    }
  }
  return rows;
}
