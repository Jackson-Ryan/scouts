// Data model, official April 2024 UK Scouts uniform definitions, necker options and state helpers.
// Pure ES module with no top-level DOM access so Node smoke tests can import it safely.

export const CANVAS = {
  width: 960,
  height: 760,
  centerX: 480,
};

export const SECTIONS = [
  {
    id: "squirrels",
    name: "Squirrels",
    fullName: "Squirrel Scouts",
    age: "4–6",
    accent: "#d83825",
    tapeLabel: "Group Name Tape",
    groupBadgeLabel: "Group Badge",
    chiefAwardLabel: "Chief Scout’s Award",
    chiefAwardDetail: "Chief Scout’s Acorn Award",
    challengeCount: 4,
    joiningInCount: 2,
    variants: [
      {
        id: "standard",
        label: "Red sweatshirt",
        garment: "sweatshirt",
        garmentColor: "#df3b28",
        lineColor: "#d63b29",
        title: "Squirrel Scout uniform",
      },
    ],
  },
  {
    id: "beavers",
    name: "Beavers",
    fullName: "Beaver Scouts",
    age: "6–8",
    accent: "#0072b2",
    tapeLabel: "Group Name Tape",
    groupBadgeLabel: "Group Badge",
    chiefAwardLabel: "Chief Scout’s Award",
    chiefAwardDetail: "Chief Scout’s Bronze Award",
    challengeCount: 6,
    joiningInCount: 2,
    variants: [
      {
        id: "standard",
        label: "Turquoise sweatshirt",
        garment: "sweatshirt",
        garmentColor: "#0077be",
        lineColor: "#0072b2",
        title: "Beaver Scout uniform",
      },
    ],
  },
  {
    id: "cubs",
    name: "Cubs",
    fullName: "Cub Scouts",
    age: "8–10½",
    accent: "#1f8a3b",
    tapeLabel: "Group Name Tape",
    groupBadgeLabel: "Group Badge",
    chiefAwardLabel: "Chief Scout’s Award",
    chiefAwardDetail: "Chief Scout’s Silver Award",
    challengeCount: 7,
    joiningInCount: 3,
    variants: [
      {
        id: "standard",
        label: "Green sweatshirt",
        garment: "sweatshirt",
        garmentColor: "#1d5e37",
        lineColor: "#208b3a",
        title: "Cub Scout uniform",
      },
      {
        id: "sea",
        label: "Sea Cubs (RN Recognised)",
        garment: "sweatshirt",
        garmentColor: "#1d5e37",
        lineColor: "#208b3a",
        title: "Cub Scout uniform",
        branch: "sea",
      },
    ],
  },
  {
    id: "scouts",
    name: "Scouts",
    fullName: "Scouts",
    age: "10½–14",
    accent: "#174d56",
    tapeLabel: "Group Name Tape",
    groupBadgeLabel: "Group Badge",
    chiefAwardLabel: "Chief Scout’s Gold Award",
    chiefAwardDetail: "Chief Scout’s Gold Award",
    challengeCount: 9,
    joiningInCount: 4,
    variants: [
      {
        id: "standard",
        label: "Teal shirt (Land)",
        garment: "shirt",
        garmentColor: "#1a5c61",
        lineColor: "#174d56",
        title: "Scout uniform",
      },
      {
        id: "sea-jumper",
        label: "Navy jumper (Sea)",
        garment: "sweatshirt",
        garmentColor: "#173252",
        lineColor: "#174d56",
        title: "Scout jumper (sea)",
        branch: "sea",
      },
      {
        id: "sea-shirt",
        label: "Light blue shirt (Sea)",
        garment: "shirt",
        garmentColor: "#639cd3",
        lineColor: "#174d56",
        title: "Scout uniform (sea)",
        branch: "sea",
      },
      {
        id: "air-shirt",
        label: "Light blue shirt (Air)",
        garment: "shirt",
        garmentColor: "#6ba2d9",
        lineColor: "#174d56",
        title: "Scout uniform (air)",
        branch: "air",
      },
    ],
  },
  {
    id: "explorers",
    name: "Explorers",
    fullName: "Explorer Scouts",
    age: "14–18",
    accent: "#2d3f75",
    tapeLabel: "Unit Name Tape",
    groupBadgeLabel: "Unit Badge",
    chiefAwardLabel: "Chief Scout’s, King’s or Queen’s Scout Award",
    chiefAwardDetail: "Chief Scout’s Award or King’s Scout Award or Queen’s Scout Award (only the highest gained should be worn)",
    challengeCount: 0,
    joiningInCount: 4,
    hasBeltBuckles: true,
    variants: [
      {
        id: "standard",
        label: "Beige shirt (Land)",
        garment: "shirt",
        garmentColor: "#cfc3a8",
        lineColor: "#2d3f75",
        title: "Explorer Scout uniform",
      },
      {
        id: "sea",
        label: "Light blue shirt (Sea)",
        garment: "shirt",
        garmentColor: "#639cd3",
        lineColor: "#2d3f75",
        title: "Explorer Scout uniform (sea)",
        branch: "sea",
      },
      {
        id: "air",
        label: "Light blue shirt (Air)",
        garment: "shirt",
        garmentColor: "#6ba2d9",
        lineColor: "#2d3f75",
        title: "Explorer Scout uniform (air)",
        branch: "air",
      },
    ],
  },
  {
    id: "network",
    name: "Network",
    fullName: "Scout Network",
    age: "18–25",
    accent: "#2e2e38",
    tapeLabel: "Network Name Tape",
    groupBadgeLabel: "Local Network Badge",
    chiefAwardLabel: "Chief Scout’s, King’s or Queen’s Scout Award",
    chiefAwardDetail: "Chief Scout’s Award or King’s Scout Award or Queen’s Scout Award (only the highest gained should be worn)",
    challengeCount: 0,
    joiningInCount: 0,
    hasBeltBuckles: true,
    variants: [
      {
        id: "standard",
        label: "Beige shirt (Land)",
        garment: "shirt",
        garmentColor: "#cfc3a8",
        lineColor: "#262626",
        title: "Scout Network uniform",
      },
      {
        id: "sea",
        label: "Light blue shirt (Sea)",
        garment: "shirt",
        garmentColor: "#639cd3",
        lineColor: "#262626",
        title: "Scout Network uniform (sea)",
        branch: "sea",
      },
      {
        id: "air",
        label: "Light blue shirt (Air)",
        garment: "shirt",
        garmentColor: "#6ba2d9",
        lineColor: "#262626",
        title: "Scout Network uniform (air)",
        branch: "air",
      },
    ],
  },
  {
    id: "adult",
    name: "Adults",
    fullName: "Adult Volunteers",
    age: "18+",
    accent: "#2e2e38",
    tapeLabel: "Group/Unit/Network Name Tape",
    groupBadgeLabel: "Group/Unit/Network Badge",
    chiefAwardLabel: "King’s or Queen’s Scout / Guide Award",
    chiefAwardDetail: "King’s Scout Award or Queen’s Scout Award / Queen’s Guide Award",
    challengeCount: 0,
    joiningInCount: 0,
    hasBeltBuckles: true,
    variants: [
      {
        id: "standard",
        label: "Stone shirt (Land)",
        garment: "shirt",
        garmentColor: "#d5cbb5",
        lineColor: "#262626",
        title: "Adult uniform",
      },
      {
        id: "sea",
        label: "Light blue shirt (Sea)",
        garment: "shirt",
        garmentColor: "#639cd3",
        lineColor: "#262626",
        title: "Adult uniform (sea)",
        branch: "sea",
      },
      {
        id: "air",
        label: "Light blue shirt (Air)",
        garment: "shirt",
        garmentColor: "#6ba2d9",
        lineColor: "#262626",
        title: "Adult uniform (air)",
        branch: "air",
      },
    ],
  },
];

export const NATIONS = [
  { id: "all-uk", label: "All UK (official)", short: "All UK", description: "Shows Wales and Scotland badges as on the full official UK diagram." },
  { id: "england", label: "England", short: "England", description: "Hides Wales and Scotland nation badges." },
  { id: "scotland", label: "Scotland", short: "Scotland", description: "Shows the Scotland Badge below the name tape and hides Wales badges." },
  { id: "wales", label: "Wales", short: "Wales", description: "Shows Wales Badges on both shoulders and hides Scotland badge." },
  { id: "ni", label: "Northern Ireland", short: "N. Ireland", description: "Places the Ulster badge in the County slot, County in the District slot, and District centrally below." },
];

export const DIAGRAM_STYLES = [
  { id: "colour", label: "Full colour", description: "Coloured uniform, necker and badges — best for families." },
  { id: "official", label: "Official line art", description: "Section-coloured outline matching the official Scouts diagram, with your necker and badges." },
  { id: "ink-saver", label: "Ink saver", description: "Clean outline with light badge tints for economical home printing." },
];

export const NECKER_PATTERNS = [
  { id: "plain", label: "Plain", usesSecondary: false, usesTertiary: false },
  { id: "single-border", label: "Single border", usesSecondary: true, usesTertiary: false },
  { id: "double-border", label: "Double border", usesSecondary: true, usesTertiary: true },
  { id: "triple-border", label: "Triple border", usesSecondary: true, usesTertiary: true },
  { id: "piped", label: "Piped edge", usesSecondary: true, usesTertiary: false },
  { id: "halved", label: "Halved / split", usesSecondary: true, usesTertiary: false },
  { id: "halved-border", label: "Halved + border", usesSecondary: true, usesTertiary: true },
  { id: "striped", label: "Diagonal stripes", usesSecondary: true, usesTertiary: true },
  { id: "tartan", label: "Tartan / check", usesSecondary: true, usesTertiary: true },
  { id: "quartered", label: "Quartered", usesSecondary: true, usesTertiary: false },
  { id: "contrast-point", label: "Contrast point", usesSecondary: true, usesTertiary: false },
];

export const NECKER_SWATCHES = [
  { name: "Scarlet Red", hex: "#d62828" },
  { name: "Maroon", hex: "#7b112c" },
  { name: "Navy Blue", hex: "#0b2559" },
  { name: "Royal Blue", hex: "#0056b3" },
  { name: "Sky Blue", hex: "#4da3e0" },
  { name: "Turquoise", hex: "#008ca8" },
  { name: "Teal", hex: "#086e70" },
  { name: "Bottle Green", hex: "#14532d" },
  { name: "Emerald Green", hex: "#008a3b" },
  { name: "Lime Green", hex: "#65b32e" },
  { name: "Scouts Purple", hex: "#590fa9" },
  { name: "Lilac", hex: "#9d72d6" },
  { name: "Gold", hex: "#f4b400" },
  { name: "Yellow", hex: "#ffe627" },
  { name: "Amber", hex: "#e67e22" },
  { name: "Orange", hex: "#ea580c" },
  { name: "Hot Pink", hex: "#e64980" },
  { name: "Brown", hex: "#6b3e26" },
  { name: "Gilwell Taupe", hex: "#9e8677" },
  { name: "Khaki / Sand", hex: "#c8b58d" },
  { name: "Black", hex: "#1a1a1a" },
  { name: "Charcoal", hex: "#4a4f5a" },
  { name: "Silver Grey", hex: "#b8c0cc" },
  { name: "White", hex: "#ffffff" },
];

export const NECKER_PRESETS = [
  { id: "navy-gold", name: "Navy & Gold border", pattern: "single-border", primary: "#0b2559", secondary: "#ffe627", tertiary: "#ffffff", woggle: "#6b3e26" },
  { id: "scarlet-white-split", name: "Red & White split", pattern: "halved", primary: "#d62828", secondary: "#ffffff", tertiary: "#0b2559", woggle: "#1a1a1a" },
  { id: "green-yellow-double", name: "Green & Yellow double", pattern: "double-border", primary: "#14532d", secondary: "#ffe627", tertiary: "#ffffff", woggle: "#6b3e26" },
  { id: "purple-white", name: "Purple & White border", pattern: "single-border", primary: "#590fa9", secondary: "#ffffff", tertiary: "#ffe627", woggle: "#590fa9" },
  { id: "maroon-gold-triple", name: "Maroon & Gold triple", pattern: "triple-border", primary: "#7b112c", secondary: "#f4b400", tertiary: "#ffffff", woggle: "#6b3e26" },
  { id: "royal-red-halved-border", name: "Royal & Red halved", pattern: "halved-border", primary: "#0056b3", secondary: "#d62828", tertiary: "#ffffff", woggle: "#0b2559" },
  { id: "tartan-green", name: "Scottish Tartan", pattern: "tartan", primary: "#14532d", secondary: "#0b2559", tertiary: "#ffe627", woggle: "#6b3e26" },
  { id: "gilwell", name: "Gilwell Taupe", pattern: "contrast-point", primary: "#9e8677", secondary: "#7b112c", tertiary: "#f4b400", woggle: "#6b3e26" },
];

export const WOGGLE_SWATCHES = [
  { name: "Leather Brown", hex: "#6b3e26" },
  { name: "Scouts Purple", hex: "#590fa9" },
  { name: "Navy", hex: "#0b2559" },
  { name: "Black", hex: "#1a1a1a" },
  { name: "Gold", hex: "#d99b00" },
  { name: "Scarlet", hex: "#d62828" },
  { name: "Green", hex: "#14532d" },
  { name: "Turquoise", hex: "#0077be" },
  { name: "White", hex: "#f5f5f5" },
];

export const BADGE_SHAPES = [
  { id: "circle", label: "Circle" },
  { id: "square", label: "Rounded square" },
  { id: "rect", label: "Rectangle" },
  { id: "shield", label: "Shield" },
  { id: "diamond", label: "Diamond" },
  { id: "hexagon", label: "Hexagon" },
  { id: "oval", label: "Oval" },
  { id: "star", label: "Star" },
  { id: "triangle", label: "Triangle" },
  { id: "pennant", label: "Pennant" },
  { id: "bar", label: "Ribbon / stripe bar" },
];

export const BADGE_ICONS = [
  { id: "none", label: "None (colour / text)" },
  { id: "fleur", label: "Fleur-de-lis" },
  { id: "shield", label: "Shield crest" },
  { id: "star", label: "Star" },
  { id: "compass", label: "Compass" },
  { id: "tent", label: "Tent" },
  { id: "fire", label: "Campfire" },
  { id: "anchor", label: "Anchor (Sea)" },
  { id: "plane", label: "Wings (Air)" },
  { id: "crown", label: "Crown" },
  { id: "flag", label: "Flag" },
  { id: "globe", label: "World / Globe" },
  { id: "award", label: "Award medal" },
  { id: "first-aid", label: "First aid cross" },
  { id: "tree", label: "Tree" },
  { id: "mountain", label: "Mountain" },
  { id: "paw", label: "Paw print" },
  { id: "target", label: "Target / rings" },
  { id: "heart", label: "Heart" },
  { id: "sun", label: "Sun" },
];

export const ZONES = [
  { id: "right-sleeve", label: "Right sleeve (left on diagram)", defaultX: 308, defaultY: 350, defaultSide: "left", defaultRotation: -12 },
  { id: "right-chest", label: "Right chest (left torso)", defaultX: 418, defaultY: 360, defaultSide: "left", defaultRotation: 0 },
  { id: "left-chest", label: "Left chest (right torso)", defaultX: 540, defaultY: 262, defaultSide: "right", defaultRotation: 0 },
  { id: "left-sleeve", label: "Left sleeve (right on diagram)", defaultX: 651, defaultY: 332, defaultSide: "right", defaultRotation: 12 },
  { id: "scarf", label: "Necker / scarf", defaultX: 480, defaultY: 118, defaultSide: "right", defaultRotation: 0 },
  { id: "shoulders", label: "Shoulders / epaulettes", defaultX: 368, defaultY: 152, defaultSide: "left", defaultRotation: -14 },
  { id: "belt", label: "Waist / belt area", defaultX: 480, defaultY: 586, defaultSide: "right", defaultRotation: 0 },
];

export const CUSTOM_BADGE_TEMPLATES = [
  {
    id: "district-exclusive",
    name: "District exclusive badge",
    label: "District Exclusive Badge",
    note: "Sew on the right sleeve below the District Badge or Group Badge.",
    zone: "right-sleeve",
    shape: "shield",
    x: 294,
    y: 422,
    w: 24,
    h: 26,
    rotation: -12,
    fill: "#590fa9",
    stroke: "#ffe627",
    textColor: "#ffffff",
    text: "",
    icon: "star",
    calloutSide: "left",
  },
  {
    id: "camp-event",
    name: "Camp / event badge",
    label: "Group Camp Badge",
    note: "Occasional or camp badge worn on the left chest above Joining In Awards.",
    zone: "left-chest",
    shape: "circle",
    x: 540,
    y: 202,
    w: 24,
    h: 24,
    rotation: 0,
    fill: "#088486",
    stroke: "#ffffff",
    textColor: "#ffffff",
    text: "",
    icon: "tent",
    calloutSide: "right",
  },
  {
    id: "anniversary",
    name: "Group anniversary badge",
    label: "Group Anniversary Badge",
    note: "Special commemorative badge worn on the right chest or left chest.",
    zone: "left-chest",
    shape: "hexagon",
    x: 572,
    y: 228,
    w: 24,
    h: 24,
    rotation: 0,
    fill: "#f4b400",
    stroke: "#1a1a1a",
    textColor: "#1a1a1a",
    text: "50",
    icon: "none",
    calloutSide: "right",
  },
  {
    id: "custom-district",
    name: "Custom district crest",
    label: "Custom District Crest",
    note: "Custom District crest worn on the right sleeve.",
    zone: "right-sleeve",
    shape: "shield",
    x: 341,
    y: 273,
    w: 24,
    h: 25,
    rotation: -12,
    fill: "#0056b3",
    stroke: "#ffffff",
    textColor: "#ffffff",
    text: "",
    icon: "shield",
    calloutSide: "left",
  },
  {
    id: "blank",
    name: "Blank custom badge",
    label: "Custom Badge",
    note: "Drag this badge anywhere on the uniform or choose a zone.",
    zone: "left-sleeve",
    shape: "circle",
    x: 668,
    y: 422,
    w: 24,
    h: 24,
    rotation: 12,
    fill: "#590fa9",
    stroke: "#ffffff",
    textColor: "#ffffff",
    text: "",
    icon: "fleur",
    calloutSide: "right",
  },
];

export const FOOTNOTE_NI =
  "In Northern Ireland, the Ulster badge should take the place of the County badge. The County badge should be in the District location, with the District badge placed centrally below these.";
export const FOOTNOTE_RN =
  "*Only Royal Navy (RN) Recognised Sea Scouts / Sea Cub Scouts are permitted to wear the RN Recognition Badge.";
export const FOOTNOTE_RAF =
  "*Only Royal Air Force (RAF) Recognised Air Scouts are permitted to wear the RAF Recognition Badge.";

export function getSection(sectionId) {
  return SECTIONS.find((s) => s.id === sectionId) || SECTIONS[1]; // Beavers fallback
}

export function getVariant(sectionId, variantId) {
  const section = getSection(sectionId);
  return section.variants.find((v) => v.id === variantId) || section.variants[0];
}

export function slugify(value) {
  return (
    String(value || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "uniform-guide"
  );
}

/**
 * Returns the full ordered list of official April 2024 badges for a given section, variant and nation.
 * Coordinates live in the canonical 960 x 760 SVG coordinate space.
 */
export function getOfficialBadges(sectionId, variantId = "standard", nation = "all-uk") {
  const section = getSection(sectionId);
  const variant = getVariant(sectionId, variantId);
  const branch = variant.branch || "land";
  const isShirt = variant.garment === "shirt";
  const isNI = nation === "ni";
  const showWalesDefault = nation === "all-uk" || nation === "wales";
  const showScotlandDefault = nation === "all-uk" || nation === "scotland";

  const badges = [];
  const add = (badge) => badges.push({ official: true, rotation: 0, text: "", icon: "none", ...badge });

  // 1. Shoulders (Wales Badges on both shoulders per April 2024 PDF)
  add({
    id: "wales-right",
    label: "Wales Badge",
    zone: "shoulders",
    shape: "square",
    x: 368,
    y: 152,
    w: 17,
    h: 17,
    rotation: -14,
    calloutSide: "left",
    fill: "#d62828",
    stroke: "#ffffff",
    textColor: "#ffffff",
    icon: "flag",
    defaultVisible: showWalesDefault,
    essential: false,
    note: "Worn on both shoulders by members in ScoutsCymru (Wales).",
  });

  add({
    id: "wales-left",
    label: "Wales Badge",
    zone: "shoulders",
    shape: "square",
    x: 592,
    y: 152,
    w: 17,
    h: 17,
    rotation: 14,
    calloutSide: "right",
    fill: "#d62828",
    stroke: "#ffffff",
    textColor: "#ffffff",
    icon: "flag",
    defaultVisible: showWalesDefault,
    essential: false,
    note: "Worn on both shoulders by members in ScoutsCymru (Wales).",
  });

  // 2. Scarf / Necker badge
  const scarfBadgeLabel =
    sectionId === "adult" && branch === "sea"
      ? "Group/Unit/Network/Scout Active Support Unit Badge (if worn on scarf)"
      : `${section.groupBadgeLabel} (if worn on scarf)`;

  add({
    id: "scarf-group-badge",
    label: scarfBadgeLabel,
    zone: "scarf",
    shape: "shield",
    x: 480,
    y: 118,
    w: 20,
    h: 22,
    calloutSide: "right",
    fill: "#590fa9",
    stroke: "#ffffff",
    textColor: "#ffffff",
    icon: "shield",
    defaultVisible: true,
    essential: true,
    note: "Sew centred near the point at the back of the neckerchief, if your group wears it on the scarf rather than the right sleeve.",
  });

  // 3. Wearer's Right Chest (viewer's left torso, centred around x = 418)
  add({
    id: "union-flag",
    label: "Union Flag",
    zone: "right-chest",
    shape: "rect",
    x: 418,
    y: 222,
    w: 24,
    h: 16,
    calloutSide: "left",
    fill: "#0b2559",
    stroke: "#ffffff",
    textColor: "#ffffff",
    icon: "flag",
    defaultVisible: true,
    essential: false,
    note: "Worn at the top of the right chest when attending international events or representing UK Scouting abroad.",
  });

  add({
    id: "cornwell",
    label: "Cornwell Scout Badge",
    zone: "right-chest",
    shape: "square",
    x: 418,
    y: 248,
    w: 20,
    h: 20,
    calloutSide: "left",
    fill: "#c59b27",
    stroke: "#4a3800",
    textColor: "#ffffff",
    icon: "award",
    defaultVisible: true,
    essential: false,
    note: "Awarded for pre-eminently high character and devotion to duty, worn below the Union Flag.",
  });

  if (sectionId === "network") {
    add({
      id: "network-badge",
      label: "Network Badge",
      zone: "right-chest",
      shape: "rect",
      x: 418,
      y: 272,
      w: 26,
      h: 14,
      calloutSide: "left",
      fill: "#2e2e38",
      stroke: "#ffffff",
      textColor: "#ffffff",
      icon: "fleur",
      defaultVisible: true,
      essential: true,
      note: "Scout Network membership badge worn on the right chest.",
    });
  }

  if (sectionId === "adult") {
    add({
      id: "sasu-badge",
      label: "Scout Active Support Badge",
      zone: "right-chest",
      shape: "rect",
      x: 418,
      y: 272,
      w: 26,
      h: 14,
      calloutSide: "left",
      fill: "#590fa9",
      stroke: "#ffffff",
      textColor: "#ffffff",
      icon: "star",
      defaultVisible: true,
      essential: false,
      note: "Worn on the right chest by members of a Scout Active Support Unit.",
    });
  }

  const gallantryY = sectionId === "network" || sectionId === "adult" ? 295 : 274;
  const gallantryLabel =
    sectionId === "adult"
      ? "Gallantry / Meritorious Conduct / Good Service / Chief Scout’s Personal & Commendation Awards"
      : "Gallantry / Meritorious Conduct / Chief Scout’s Personal Award / Commendation Awards";

  add({
    id: "gallantry",
    label: gallantryLabel,
    zone: "right-chest",
    shape: "bar",
    x: 418,
    y: gallantryY,
    w: 30,
    h: 10,
    calloutSide: "left",
    fill: "#008a3b",
    stroke: "#14532d",
    textColor: "#ffffff",
    defaultVisible: true,
    essential: false,
    note: "Cloth award emblems worn on the right chest; for Good Service only the highest gained should be worn.",
  });

  if (section.challengeCount > 0) {
    // Squirrels, Beavers, Cubs, Scouts: Chief Scout's Award + hexagonal Challenge Awards
    const awardColors = {
      squirrels: { fill: "#d83825", stroke: "#8a1c10" },
      beavers: { fill: "#b87333", stroke: "#6e4117" },
      cubs: { fill: "#9aa5b4", stroke: "#4a5568" },
      scouts: { fill: "#d99b00", stroke: "#7a5400" },
    };
    const col = awardColors[sectionId] || awardColors.beavers;

    add({
      id: "chief-scouts-award",
      label: section.chiefAwardLabel,
      zone: "right-chest",
      shape: "hexagon",
      x: 418,
      y: 304,
      w: 26,
      h: 26,
      calloutSide: "left",
      fill: col.fill,
      stroke: col.stroke,
      textColor: "#ffffff",
      icon: "crown",
      defaultVisible: true,
      essential: true,
      note: `${section.chiefAwardDetail} — sewn directly above the Challenge Awards on the right chest.`,
    });

    add({
      id: "challenge-awards",
      label: "Challenge Awards",
      zone: "right-chest",
      shape: "challenge-cluster",
      x: 418,
      y: 368,
      w: 68,
      h: 82,
      count: section.challengeCount,
      calloutSide: "left",
      fill: section.accent,
      stroke: "#ffffff",
      textColor: "#ffffff",
      defaultVisible: true,
      essential: true,
      note: `Hexagonal Challenge Awards (${section.challengeCount} in ${section.name}) arranged neatly together on the right chest.`,
    });
  } else if (sectionId === "explorers") {
    add({
      id: "chief-kings-award",
      label: section.chiefAwardDetail,
      zone: "right-chest",
      shape: "diamond",
      x: 418,
      y: 312,
      w: 24,
      h: 24,
      calloutSide: "left",
      fill: "#d99b00",
      stroke: "#6b4a00",
      textColor: "#ffffff",
      icon: "crown",
      defaultVisible: true,
      essential: true,
      note: "Only the highest gained award should be worn on the right chest.",
    });
  } else {
    // Network & Adults: Service Award bar + King's/Queen's Scout Award diamond
    add({
      id: "service-award",
      label:
        sectionId === "adult"
          ? "Young Leader Service Award / Length of Service Award (only highest gained)"
          : "Young Leader Service Award",
      zone: "right-chest",
      shape: "bar",
      x: 418,
      y: 319,
      w: 34,
      h: 11,
      calloutSide: "left",
      fill: "#0056b3",
      stroke: "#0b2559",
      textColor: "#ffffff",
      defaultVisible: true,
      essential: false,
      note: "Worn on the right chest directly above the King’s/Queen’s Scout Award.",
    });

    add({
      id: "chief-kings-award",
      label: section.chiefAwardDetail,
      zone: "right-chest",
      shape: "diamond",
      x: 418,
      y: 348,
      w: 24,
      h: 24,
      calloutSide: "left",
      fill: "#d99b00",
      stroke: "#6b4a00",
      textColor: "#ffffff",
      icon: "crown",
      defaultVisible: true,
      essential: true,
      note: "Only the highest gained top award should be worn on the right chest.",
    });
  }

  // 4. Wearer's Right Sleeve (viewer's left arm, tilted -12°)
  // Note: Primary + custom name tapes live above y = 236 and layout dynamically shifts sleeve badges below them!
  const sleeveBaseShift = isNI ? 24 : 0;

  add({
    id: "scotland",
    label: "Scotland Badge",
    zone: "right-sleeve",
    sleeveStack: true,
    shape: "rect",
    x: 332,
    y: 242,
    w: 28,
    h: 12,
    rotation: -12,
    calloutSide: "left",
    fill: "#005eb8",
    stroke: "#ffffff",
    textColor: "#ffffff",
    icon: "flag",
    defaultVisible: showScotlandDefault,
    essential: false,
    note: "Worn on the right sleeve directly below the Name Tape by members in Scouts Scotland.",
  });

  if (isNI) {
    add({
      id: "ulster",
      label: "Ulster Badge",
      zone: "right-sleeve",
      sleeveStack: true,
      shape: "shield",
      x: 313,
      y: 268,
      w: 22,
      h: 23,
      rotation: -12,
      calloutSide: "left",
      fill: "#d62828",
      stroke: "#ffffff",
      textColor: "#ffffff",
      icon: "shield",
      defaultVisible: true,
      essential: true,
      note: "In Northern Ireland, the Ulster badge takes the place of the County badge.",
    });

    add({
      id: "county",
      label: "County Badge",
      zone: "right-sleeve",
      sleeveStack: true,
      shape: "shield",
      x: 340,
      y: 273,
      w: 22,
      h: 23,
      rotation: -12,
      calloutSide: "left",
      fill: "#0056b3",
      stroke: "#ffffff",
      textColor: "#ffffff",
      icon: "shield",
      defaultVisible: true,
      essential: true,
      note: "In Northern Ireland, the County badge is worn in the District location beside the Ulster badge.",
    });

    add({
      id: "district",
      label: "District Badge",
      zone: "right-sleeve",
      sleeveStack: true,
      shape: "square",
      x: 322,
      y: 298,
      w: 22,
      h: 22,
      rotation: -12,
      calloutSide: "left",
      fill: "#088486",
      stroke: "#ffffff",
      textColor: "#ffffff",
      icon: "compass",
      defaultVisible: true,
      essential: true,
      note: "In Northern Ireland, the District badge is placed centrally below the Ulster and County badges.",
    });
  } else {
    add({
      id: "county",
      label: "County/Area/Region Badge",
      zone: "right-sleeve",
      sleeveStack: true,
      shape: "shield",
      x: 313,
      y: 268,
      w: 22,
      h: 23,
      rotation: -12,
      calloutSide: "left",
      fill: "#0056b3",
      stroke: "#ffffff",
      textColor: "#ffffff",
      icon: "shield",
      defaultVisible: true,
      essential: true,
      note: "Worn on the right sleeve below the Group Name Tape (outer side beside the District Badge).",
    });

    add({
      id: "district",
      label: "District Badge",
      zone: "right-sleeve",
      sleeveStack: true,
      shape: "square",
      x: 340,
      y: 273,
      w: 21,
      h: 21,
      rotation: -12,
      calloutSide: "left",
      fill: "#088486",
      stroke: "#ffffff",
      textColor: "#ffffff",
      icon: "compass",
      defaultVisible: true,
      essential: true,
      note: "Worn on the right sleeve next to the County/Area/Region Badge.",
    });
  }

  const sleeveGroupLabel =
    sectionId === "adult" && branch === "sea"
      ? "Group/Unit/Network/Scout Active Support Unit Badge (if not worn on scarf)"
      : `${section.groupBadgeLabel} (if not worn on scarf)`;

  add({
    id: "group-sleeve",
    label: sleeveGroupLabel,
    zone: "right-sleeve",
    sleeveStack: true,
    shape: "square",
    x: 306,
    y: 302 + sleeveBaseShift,
    w: 21,
    h: 21,
    rotation: -12,
    calloutSide: "left",
    fill: "#590fa9",
    stroke: "#ffffff",
    textColor: "#ffffff",
    icon: "shield",
    defaultVisible: true,
    essential: true,
    note: "Worn on the right sleeve below the County/District badges if your group does not wear it on the scarf.",
  });

  if (!(sectionId === "adult" && branch === "sea")) {
    add({
      id: "group-sponsor",
      label: "Group Sponsor Badge",
      zone: "right-sleeve",
      sleeveStack: true,
      shape: "square",
      x: 333,
      y: 307 + sleeveBaseShift,
      w: 21,
      h: 21,
      rotation: -12,
      calloutSide: "left",
      fill: "#6e6e6e",
      stroke: "#ffffff",
      textColor: "#ffffff",
      icon: "star",
      defaultVisible: true,
      essential: false,
      note: "Worn beside the Group Badge if your group is sponsored by a local organisation.",
    });
  }

  // Section-specific lower right-sleeve badges
  if (sectionId === "beavers" || sectionId === "cubs") {
    add({
      id: "leadership-stripe",
      label: "Leadership Stripe",
      zone: "right-sleeve",
      sleeveStack: true,
      shape: "bar",
      x: 311,
      y: 336 + sleeveBaseShift,
      w: 28,
      h: 9,
      rotation: -12,
      calloutSide: "left",
      fill: "#ffe627",
      stroke: "#8f7500",
      textColor: "#1a1a1a",
      defaultVisible: true,
      essential: false,
      note: sectionId === "beavers"
        ? "Lodge Leader or Assistant Lodge Leader stripe worn on the right sleeve."
        : "Sixer or Seconder leadership stripe worn on the right sleeve.",
    });

    add({
      id: "youshape",
      label: "YouShape Award",
      zone: "right-sleeve",
      sleeveStack: true,
      shape: "circle",
      x: 303,
      y: 368 + sleeveBaseShift,
      w: 24,
      h: 24,
      rotation: -12,
      calloutSide: "left",
      fill: "#590fa9",
      stroke: "#ffe627",
      textColor: "#ffffff",
      icon: "target",
      defaultVisible: true,
      essential: false,
      note: "YouShape Award central badge and surrounding segments worn on the right sleeve.",
    });
  } else if (sectionId === "scouts") {
    add({
      id: "patrol",
      label: "Patrol Badge",
      zone: "right-sleeve",
      sleeveStack: true,
      shape: "square",
      x: 311,
      y: 336 + sleeveBaseShift,
      w: 22,
      h: 22,
      rotation: -12,
      calloutSide: "left",
      fill: "#008a3b",
      stroke: "#ffffff",
      textColor: "#ffffff",
      icon: "paw",
      defaultVisible: true,
      essential: true,
      note: "Your Scout Patrol emblem, sewn below the Group Badge on the right sleeve.",
    });

    add({
      id: "leadership-stripe",
      label: "Leadership Stripe",
      zone: "right-sleeve",
      sleeveStack: true,
      shape: "bar",
      x: 304,
      y: 365 + sleeveBaseShift,
      w: 28,
      h: 9,
      rotation: -12,
      calloutSide: "left",
      fill: "#ffffff",
      stroke: "#174d56",
      textColor: "#174d56",
      defaultVisible: true,
      essential: false,
      note: "Patrol Leader (2 stripes) or Assistant Patrol Leader (1 stripe) below the Patrol Badge.",
    });

    add({
      id: "youshape",
      label: "YouShape Award",
      zone: "right-sleeve",
      sleeveStack: true,
      shape: "circle",
      x: 297,
      y: 396 + sleeveBaseShift,
      w: 24,
      h: 24,
      rotation: -12,
      calloutSide: "left",
      fill: "#590fa9",
      stroke: "#ffe627",
      textColor: "#ffffff",
      icon: "target",
      defaultVisible: true,
      essential: false,
      note: "YouShape Award central badge and segments worn on the right sleeve.",
    });
  } else if (sectionId === "explorers") {
    add({
      id: "mission",
      label: "Mission Badges",
      zone: "right-sleeve",
      sleeveStack: true,
      shape: "circle",
      x: 311,
      y: 338 + sleeveBaseShift,
      w: 24,
      h: 24,
      rotation: -12,
      calloutSide: "left",
      fill: "#088486",
      stroke: "#ffffff",
      textColor: "#ffffff",
      icon: "compass",
      defaultVisible: true,
      essential: false,
      note: "Young Leader Mission badges arranged around the Young Leader buckle/badge area.",
    });

    add({
      id: "young-leader",
      label: "Young Leader Badge",
      zone: "right-sleeve",
      sleeveStack: true,
      shape: "shield",
      x: 303,
      y: 369 + sleeveBaseShift,
      w: 22,
      h: 23,
      rotation: -12,
      calloutSide: "left",
      fill: "#0b2559",
      stroke: "#ffe627",
      textColor: "#ffffff",
      icon: "fleur",
      defaultVisible: true,
      essential: false,
      note: "Worn on the right sleeve by Explorer Scout Young Leaders.",
    });

    add({
      id: "youshape",
      label: "YouShape Award",
      zone: "right-sleeve",
      sleeveStack: true,
      shape: "circle",
      x: 296,
      y: 400 + sleeveBaseShift,
      w: 24,
      h: 24,
      rotation: -12,
      calloutSide: "left",
      fill: "#590fa9",
      stroke: "#ffe627",
      textColor: "#ffffff",
      icon: "target",
      defaultVisible: true,
      essential: false,
      note: "YouShape Award worn on the right sleeve.",
    });
  }

  // 5. Wearer's Left Chest (viewer's right torso, centred around x = 540)
  add({
    id: "occasional",
    label: "Occasional Badges",
    zone: "left-chest",
    shape: "circle",
    x: 540,
    y: 224,
    w: 23,
    h: 23,
    calloutSide: "right",
    fill: "#e9730c",
    stroke: "#ffffff",
    textColor: "#ffffff",
    icon: "sun",
    defaultVisible: true,
    essential: false,
    note: "Event, jamboree or camp badges — worn above the Moving On / Joining In Awards for up to 12 months.",
  });

  if (["cubs", "scouts", "explorers", "network"].includes(sectionId)) {
    add({
      id: "moving-on",
      label: "Moving On Award",
      zone: "left-chest",
      shape: "rect",
      x: 540,
      y: 254,
      w: 26,
      h: 14,
      calloutSide: "right",
      fill: "#008a3b",
      stroke: "#ffffff",
      textColor: "#ffffff",
      icon: "star",
      defaultVisible: true,
      essential: true,
      note: "Worn above the Joining In Awards after moving up from the previous section.",
    });
  }

  if (section.joiningInCount > 0) {
    add({
      id: "joining-in",
      label: "Joining In Awards",
      zone: "left-chest",
      shape: "joining-row",
      x: 540,
      y: 280,
      w: 66,
      h: 16,
      count: section.joiningInCount,
      calloutSide: "right",
      fill: "#590fa9",
      stroke: "#ffffff",
      textColor: "#ffffff",
      defaultVisible: true,
      essential: true,
      note: "Numbered yearly participation badges worn in a neat horizontal row on the left chest.",
    });
  }

  if (branch === "air") {
    add({
      id: "air-id",
      label: sectionId === "scouts" || sectionId === "explorers" ? "Air Scout Identification Badge" : "Air Scout Identification",
      zone: "left-chest",
      shape: "bar",
      x: 540,
      y: section.joiningInCount > 0 ? 300 : 278,
      w: 32,
      h: 11,
      calloutSide: "right",
      fill: "#0b2559",
      stroke: "#ffffff",
      textColor: "#ffffff",
      icon: "plane",
      defaultVisible: true,
      essential: true,
      note: "Worn centrally above the left breast pocket by Air Scouts, Air Explorers and Air Scout leaders.",
    });
  }

  if (branch === "sea") {
    add({
      id: "rn-recognition",
      label: "RN Recognition Badge*",
      zone: "left-chest",
      shape: "circle",
      x: 540,
      y: isShirt ? 309 : 308,
      w: 18,
      h: 18,
      calloutSide: "right",
      fill: "#0b2559",
      stroke: "#f4b400",
      textColor: "#ffe627",
      icon: "anchor",
      defaultVisible: true,
      essential: true,
      asterisk: "rn",
      note: "Only Royal Navy (RN) Recognised Sea Scouts / Sea Cub Scouts are permitted to wear the RN Recognition Badge.",
    });
  } else if (branch === "air") {
    add({
      id: "raf-recognition",
      label: "RAF Recognition Badge*",
      zone: "left-chest",
      shape: "circle",
      x: 540,
      y: 318,
      w: 18,
      h: 18,
      calloutSide: "right",
      fill: "#0056b3",
      stroke: "#f4b400",
      textColor: "#ffffff",
      icon: "plane",
      defaultVisible: true,
      essential: true,
      asterisk: "raf",
      note: "Only Royal Air Force (RAF) Recognised Air Scouts are permitted to wear the RAF Recognition Badge.",
    });
  }

  add({
    id: "pin-badge",
    label: "Pin badge",
    zone: "left-chest",
    shape: "circle",
    x: 540,
    y: isShirt ? 336 : 332,
    w: 11,
    h: 11,
    calloutSide: "right",
    fill: "#590fa9",
    stroke: "#ffffff",
    textColor: "#ffffff",
    defaultVisible: true,
    essential: false,
    note: "Membership or section pin badge worn just above the World Membership Badge.",
  });

  add({
    id: "world-membership",
    label: "The World Membership Badge",
    zone: "left-chest",
    shape: "circle",
    x: 540,
    y: isShirt ? 378 : 366,
    w: 32,
    h: 32,
    calloutSide: "right",
    fill: "#590fa9",
    stroke: "#ffffff",
    textColor: "#ffffff",
    icon: "fleur",
    defaultVisible: true,
    essential: true,
    note: isShirt
      ? "Sewn centrally on the left breast pocket upon investiture."
      : "Sewn on the left chest upon investiture — every Scout around the world wears this badge.",
  });

  // 6. Wearer's Left Sleeve (viewer's right arm, tilted +12°)
  if (["squirrels", "beavers", "cubs", "scouts"].includes(sectionId)) {
    add({
      id: "activity-badges",
      label: "Activity Badges and Staged Activity Badges",
      zone: "left-sleeve",
      shape: "activity-column",
      x: 650,
      y: 332,
      w: 36,
      h: 114,
      count: 3,
      rotation: 12,
      calloutSide: "right",
      fill: "#006ddf",
      stroke: "#ffffff",
      textColor: "#ffffff",
      defaultVisible: true,
      essential: true,
      note: "Sewn neatly down the left sleeve. Staged Activity Badges move up with the young person into the next section.",
    });
  } else if (sectionId === "explorers") {
    add({
      id: "explorer-belt-award",
      label: "Explorer Belt Award",
      zone: "left-sleeve",
      shape: "circle",
      x: 633,
      y: 256,
      w: 24,
      h: 24,
      rotation: 12,
      calloutSide: "right",
      fill: "#14532d",
      stroke: "#ffffff",
      textColor: "#ffffff",
      icon: "globe",
      defaultVisible: true,
      essential: false,
      note: "Worn at the top of the left sleeve after completing the Explorer Belt expedition.",
    });

    add({
      id: "activity-badges",
      label: "Activity Badges and Staged Activity Badges",
      zone: "left-sleeve",
      shape: "activity-column",
      x: 646,
      y: 310,
      w: 32,
      h: 68,
      count: 2,
      rotation: 12,
      calloutSide: "right",
      fill: "#006ddf",
      stroke: "#ffffff",
      textColor: "#ffffff",
      defaultVisible: true,
      essential: true,
      note: "Explorer Activity Badges and Staged Activity Badges sewn on the left sleeve.",
    });

    add({
      id: "dofe",
      label: "Duke of Edinburgh’s Award (only the highest gained should be worn)",
      zone: "left-sleeve",
      shape: "diamond",
      x: 659,
      y: 364,
      w: 22,
      h: 22,
      rotation: 12,
      calloutSide: "right",
      fill: "#d99b00",
      stroke: "#1a1a1a",
      textColor: "#1a1a1a",
      icon: "award",
      defaultVisible: true,
      essential: false,
      note: "Bronze, Silver or Gold Duke of Edinburgh’s Award badge (wear only the highest gained).",
    });

    add({
      id: "first-aid",
      label: "First Aid and Saving of Life",
      zone: "left-sleeve",
      shape: "square",
      x: 666,
      y: 396,
      w: 22,
      h: 22,
      rotation: 12,
      calloutSide: "right",
      fill: "#008a3b",
      stroke: "#ffffff",
      textColor: "#ffffff",
      icon: "first-aid",
      defaultVisible: true,
      essential: false,
      note: "First Aid and Saving of Life badges worn towards the lower part of the left sleeve.",
    });
  } else {
    // Network & Adults
    add({
      id: "scouts-of-the-world",
      label: "Scouts of the World Award",
      zone: "left-sleeve",
      shape: "circle",
      x: 633,
      y: 256,
      w: 24,
      h: 24,
      rotation: 12,
      calloutSide: "right",
      fill: "#590fa9",
      stroke: "#ffffff",
      textColor: "#ffffff",
      icon: "globe",
      defaultVisible: true,
      essential: false,
      note: "Scouts of the World Award worn near the top of the left sleeve.",
    });

    add({
      id: "explorer-belt-award",
      label: "Explorer Belt Award",
      zone: "left-sleeve",
      shape: "circle",
      x: 641,
      y: 290,
      w: 24,
      h: 24,
      rotation: 12,
      calloutSide: "right",
      fill: "#14532d",
      stroke: "#ffffff",
      textColor: "#ffffff",
      icon: "compass",
      defaultVisible: true,
      essential: false,
      note: "Explorer Belt cloth badge worn on the left sleeve.",
    });

    add({
      id: "dofe",
      label:
        sectionId === "adult"
          ? "Gold Duke of Edinburgh’s Award"
          : "Duke of Edinburgh’s Award (only the highest gained should be worn)",
      zone: "left-sleeve",
      shape: "diamond",
      x: 649,
      y: 324,
      w: 22,
      h: 22,
      rotation: 12,
      calloutSide: "right",
      fill: "#d99b00",
      stroke: "#1a1a1a",
      textColor: "#1a1a1a",
      icon: "award",
      defaultVisible: true,
      essential: false,
      note: sectionId === "adult"
        ? "Gold Duke of Edinburgh’s Award badge worn on the left sleeve."
        : "Only the highest gained Duke of Edinburgh’s Award should be worn.",
    });

    add({
      id: "first-aid",
      label: "First Aid and Saving of Life",
      zone: "left-sleeve",
      shape: "square",
      x: 657,
      y: 358,
      w: 22,
      h: 22,
      rotation: 12,
      calloutSide: "right",
      fill: "#008a3b",
      stroke: "#ffffff",
      textColor: "#ffffff",
      icon: "first-aid",
      defaultVisible: true,
      essential: false,
      note: "First Aid and Saving of Life badges worn on the left sleeve.",
    });
  }

  return badges;
}

export function createDefaultState() {
  return {
    version: 1,
    section: "beavers",
    variant: "standard",
    nation: "all-uk",
    groupName: "1st Boxford",
    districtName: "",
    countyName: "",
    guideTitle: "",
    parentNote: "Please sew badges neatly with matching thread. Ask a leader if you are unsure where a badge goes.",
    diagramStyle: "colour",
    garmentColorOverride: "",
    showNecker: true,
    showCallouts: true,
    showBeltBuckles: true,
    includeSewingKeyInPdf: true,
    necker: {
      pattern: "single-border",
      primary: "#0b2559",
      secondary: "#ffe627",
      tertiary: "#ffffff",
      woggle: "#6b3e26",
      scarfBadgeMode: "both", // "both" | "scarf" | "sleeve"
    },
    tapes: {
      primary: {
        text: "",
        uppercase: true,
        visible: true,
        shape: "curved",
        bg: "#14532d",
        fg: "#ffffff",
        border: "#ffffff",
        calloutLabel: "",
        showCallout: true,
        note: "Sew centred at the top of the right sleeve, just below the shoulder seam.",
      },
      custom: [],
    },
    badgeOverrides: {},
    customBadges: [],
  };
}

export function normaliseState(input) {
  const defaults = createDefaultState();
  if (!input || typeof input !== "object") return defaults;

  const section = getSection(input.section);
  const variant = getVariant(section.id, input.variant);
  const nation = NATIONS.some((n) => n.id === input.nation) ? input.nation : defaults.nation;
  const diagramStyle = DIAGRAM_STYLES.some((d) => d.id === input.diagramStyle) ? input.diagramStyle : defaults.diagramStyle;
  const neckerIn = input.necker && typeof input.necker === "object" ? input.necker : {};
  const tapesIn = input.tapes && typeof input.tapes === "object" ? input.tapes : {};
  const primaryTapeIn = tapesIn.primary && typeof tapesIn.primary === "object" ? tapesIn.primary : {};

  return {
    version: 1,
    section: section.id,
    variant: variant.id,
    nation,
    groupName: typeof input.groupName === "string" ? input.groupName : defaults.groupName,
    districtName: typeof input.districtName === "string" ? input.districtName : "",
    countyName: typeof input.countyName === "string" ? input.countyName : "",
    guideTitle: typeof input.guideTitle === "string" ? input.guideTitle : "",
    parentNote: typeof input.parentNote === "string" ? input.parentNote : defaults.parentNote,
    diagramStyle,
    garmentColorOverride: typeof input.garmentColorOverride === "string" ? input.garmentColorOverride : "",
    showNecker: input.showNecker !== false,
    showCallouts: input.showCallouts !== false,
    showBeltBuckles: input.showBeltBuckles !== false,
    includeSewingKeyInPdf: input.includeSewingKeyInPdf !== false,
    necker: {
      pattern: NECKER_PATTERNS.some((p) => p.id === neckerIn.pattern) ? neckerIn.pattern : defaults.necker.pattern,
      primary: typeof neckerIn.primary === "string" ? neckerIn.primary : defaults.necker.primary,
      secondary: typeof neckerIn.secondary === "string" ? neckerIn.secondary : defaults.necker.secondary,
      tertiary: typeof neckerIn.tertiary === "string" ? neckerIn.tertiary : defaults.necker.tertiary,
      woggle: typeof neckerIn.woggle === "string" ? neckerIn.woggle : defaults.necker.woggle,
      scarfBadgeMode: ["both", "scarf", "sleeve"].includes(neckerIn.scarfBadgeMode)
        ? neckerIn.scarfBadgeMode
        : defaults.necker.scarfBadgeMode,
    },
    tapes: {
      primary: {
        ...defaults.tapes.primary,
        ...primaryTapeIn,
        shape: primaryTapeIn.shape === "straight" ? "straight" : "curved",
        visible: primaryTapeIn.visible !== false,
        showCallout: primaryTapeIn.showCallout !== false,
        uppercase: primaryTapeIn.uppercase !== false,
      },
      custom: Array.isArray(tapesIn.custom)
        ? tapesIn.custom
            .filter((t) => t && typeof t === "object")
            .map((t, index) => ({
              id: String(t.id || `tape-${index + 1}`),
              position: t.position === "above" ? "above" : "below",
              text: String(t.text ?? "CUSTOM TAPE"),
              uppercase: t.uppercase !== false,
              visible: t.visible !== false,
              shape: t.shape === "straight" ? "straight" : "curved",
              bg: String(t.bg || "#0b2559"),
              fg: String(t.fg || "#ffffff"),
              border: String(t.border || "#ffffff"),
              calloutLabel: String(t.calloutLabel || ""),
              showCallout: t.showCallout !== false,
              note: String(t.note || "Custom name tape sewn on the right sleeve."),
            }))
        : [],
    },
    badgeOverrides:
      input.badgeOverrides && typeof input.badgeOverrides === "object" && !Array.isArray(input.badgeOverrides)
        ? structuredClone(input.badgeOverrides)
        : {},
    customBadges: Array.isArray(input.customBadges)
      ? input.customBadges
          .filter((b) => b && typeof b === "object")
          .map((b, index) => ({
            id: String(b.id || `custom-${index + 1}`),
            label: String(b.label || "Custom Badge"),
            note: String(b.note || ""),
            zone: ZONES.some((z) => z.id === b.zone) ? b.zone : "right-sleeve",
            shape: BADGE_SHAPES.some((s) => s.id === b.shape) ? b.shape : "circle",
            x: Number.isFinite(Number(b.x)) ? Number(b.x) : 322,
            y: Number.isFinite(Number(b.y)) ? Number(b.y) : 416,
            w: Number.isFinite(Number(b.w)) ? Number(b.w) : 24,
            h: Number.isFinite(Number(b.h)) ? Number(b.h) : 24,
            scale: Number.isFinite(Number(b.scale)) ? Number(b.scale) : 1,
            rotation: Number.isFinite(Number(b.rotation)) ? Number(b.rotation) : 0,
            fill: String(b.fill || "#590fa9"),
            stroke: String(b.stroke || "#ffffff"),
            textColor: String(b.textColor || "#ffffff"),
            text: String(b.text || ""),
            icon: BADGE_ICONS.some((i) => i.id === b.icon) ? b.icon : "none",
            imageDataUrl: typeof b.imageDataUrl === "string" ? b.imageDataUrl : "",
            visible: b.visible !== false,
            calloutSide: ["auto", "left", "right", "none"].includes(b.calloutSide) ? b.calloutSide : "auto",
          }))
      : [],
  };
}

export function resolveGuideTitle(state) {
  const custom = String(state.guideTitle || "").trim();
  if (custom) return custom;
  const variant = getVariant(state.section, state.variant);
  const group = String(state.groupName || "").trim();
  return group ? `${group} — ${variant.title}` : variant.title;
}
