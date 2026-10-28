// Configuration for Branch-Aware Platforms, Link Validation, and Public Data Support
// Edit this file to add or modify platforms and their branch mappings.

export type PlatformId =
  | "github"
  | "leetcode"
  | "codeforces"
  | "hackerrank"
  | "credly"
  | "kaggle"
  | "codechef"
  | "geeksforgeeks"
  | "grabcad"
  | "tinkercad"
  | "wokwi"
  | "hackster"
  | "behance"
  | "dribbble"
  | "googlescholar"
  | "researchgate"
  | "orcid"
  | "thingiverse"
  | "onshape"
  | "autodesk"
  | "arduinohub"
  | "instructables"
  | "easyeda";

export interface PlatformConfig {
  id: PlatformId;
  name: string;
  category: "coding" | "hardware" | "cad" | "design" | "cert" | "research";
  expectedDomain: string; // e.g., 'github.com'
  placeholder: string;
  example: string;
  hasPublicStats: boolean; // true = server fetches real public API; false = linked profile with editable metrics
  description: string;
  defaultMetric1Label?: string;
  defaultMetric2Label?: string;
  highlightPlaceholder?: string;
  validateAndExtract: (rawUrl: string) => {
    valid: boolean;
    username?: string;
    canonicalUrl?: string;
    extractedHighlight?: string;
    error?: string;
  };
}

// -----------------------------------------------------------------------------
// 1. ALL SUPPORTED PLATFORMS WITH STRICT LINK VALIDATION
// -----------------------------------------------------------------------------
export const PLATFORMS_CONFIG: Record<PlatformId, PlatformConfig> = {
  github: {
    id: "github",
    name: "GitHub",
    category: "coding",
    expectedDomain: "github.com",
    placeholder: "https://github.com/username",
    example: "https://github.com/torvalds",
    hasPublicStats: true,
    description: "Open-source repositories, public commits, and followers.",
    validateAndExtract: (rawUrl: string) => {
      const parsed = parseHttpsUrl(rawUrl, "github.com");
      if (!parsed.valid) return parsed;
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.length !== 1) {
        return { valid: false, error: "Expected format: https://github.com/username" };
      }
      const username = parts[0];
      const reserved = ["settings", "explore", "topics", "pulls", "issues", "notifications", "marketplace"];
      if (reserved.includes(username.toLowerCase()) || !/^[a-zA-Z0-9]([a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(username)) {
        return { valid: false, error: "Invalid GitHub username format in URL." };
      }
      return { valid: true, username, canonicalUrl: `https://github.com/${username}` };
    },
  },

  leetcode: {
    id: "leetcode",
    name: "LeetCode",
    category: "coding",
    expectedDomain: "leetcode.com",
    placeholder: "https://leetcode.com/u/username",
    example: "https://leetcode.com/u/neal_wu",
    hasPublicStats: true,
    description: "Algorithmic problem-solving metrics by difficulty (Easy, Medium, Hard).",
    validateAndExtract: (rawUrl: string) => {
      const parsed = parseHttpsUrl(rawUrl, "leetcode.com");
      if (!parsed.valid) return parsed;
      const parts = parsed.pathname.split("/").filter(Boolean);
      const reserved = ["contest", "contests", "problems", "explore", "discuss", "assessment", "subscribe", "studyplan"];
      const username = parts[0] === "u" && parts.length > 1 ? parts[1] : (parts.length === 1 ? parts[0] : null);
      if (!username || reserved.includes(username.toLowerCase()) || !/^[a-zA-Z0-9_-]{3,35}$/.test(username)) {
        return { valid: false, error: "Expected format: https://leetcode.com/u/username" };
      }
      return { valid: true, username, canonicalUrl: `https://leetcode.com/u/${username}` };
    },
  },

  codeforces: {
    id: "codeforces",
    name: "Codeforces",
    category: "coding",
    expectedDomain: "codeforces.com",
    placeholder: "https://codeforces.com/profile/handle",
    example: "https://codeforces.com/profile/tourist",
    hasPublicStats: true,
    description: "Competitive programming contest rating, max rank, and solved problems.",
    validateAndExtract: (rawUrl: string) => {
      const parsed = parseHttpsUrl(rawUrl, "codeforces.com");
      if (!parsed.valid) return parsed;
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.length < 2 || parts[0] !== "profile") {
        return { valid: false, error: "Expected format: https://codeforces.com/profile/handle" };
      }
      const username = parts[1];
      if (!/^[a-zA-Z0-9_.-]{2,35}$/.test(username)) {
        return { valid: false, error: "Invalid Codeforces handle format." };
      }
      return { valid: true, username, canonicalUrl: `https://codeforces.com/profile/${username}` };
    },
  },

  hackerrank: {
    id: "hackerrank",
    name: "HackerRank",
    category: "coding",
    expectedDomain: "hackerrank.com",
    placeholder: "https://www.hackerrank.com/profile/username",
    example: "https://www.hackerrank.com/profile/genghiskhan",
    hasPublicStats: true,
    description: "Earned domain badges and stars.",
    validateAndExtract: (rawUrl: string) => {
      const parsed = parseHttpsUrl(rawUrl, "hackerrank.com");
      if (!parsed.valid) return parsed;
      const parts = parsed.pathname.split("/").filter(Boolean);
      const reserved = ["leaderboard", "challenges", "contests", "domains", "dashboard", "administration", "skills-verification", "interview", "certificates", "settings"];
      const username = parts[0] === "profile" && parts.length > 1 ? parts[1] : parts[0];
      if (!username || reserved.includes(username.toLowerCase()) || !/^[a-zA-Z0-9_.-]{2,50}$/.test(username)) {
        return { valid: false, error: "Expected format: https://www.hackerrank.com/profile/username" };
      }
      return { valid: true, username, canonicalUrl: `https://www.hackerrank.com/profile/${username}` };
    },
  },

  credly: {
    id: "credly",
    name: "Credly",
    category: "cert",
    expectedDomain: "credly.com",
    placeholder: "https://www.credly.com/users/username",
    example: "https://www.credly.com/users/satyanadella",
    hasPublicStats: true,
    description: "Verified industry certifications and digital badges from AWS, Google, Microsoft, IBM, etc.",
    validateAndExtract: (rawUrl: string) => {
      const parsed = parseHttpsUrl(rawUrl, "credly.com");
      if (!parsed.valid) return parsed;
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.length < 2 || parts[0] !== "users") {
        return { valid: false, error: "Expected format: https://www.credly.com/users/username" };
      }
      const username = parts[1];
      if (!/^[a-zA-Z0-9_.-]{2,60}$/.test(username)) {
        return { valid: false, error: "Invalid Credly username format." };
      }
      return { valid: true, username, canonicalUrl: `https://www.credly.com/users/${username}` };
    },
  },

  kaggle: {
    id: "kaggle",
    name: "Kaggle",
    category: "coding",
    expectedDomain: "kaggle.com",
    placeholder: "https://www.kaggle.com/username",
    example: "https://www.kaggle.com/antonioml",
    hasPublicStats: false,
    description: "Data science notebooks, datasets, and machine learning competitions.",
    validateAndExtract: (rawUrl: string) => {
      const parsed = parseHttpsUrl(rawUrl, "kaggle.com");
      if (!parsed.valid) return parsed;
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.length !== 1 || !/^[a-zA-Z0-9_]{3,35}$/.test(parts[0])) {
        return { valid: false, error: "Expected format: https://www.kaggle.com/username" };
      }
      return { valid: true, username: parts[0], canonicalUrl: `https://www.kaggle.com/${parts[0]}` };
    },
  },

  codechef: {
    id: "codechef",
    name: "CodeChef",
    category: "coding",
    expectedDomain: "codechef.com",
    placeholder: "https://www.codechef.com/users/username",
    example: "https://www.codechef.com/users/tourist",
    hasPublicStats: false,
    description: "Competitive programming star rating and contest track record.",
    validateAndExtract: (rawUrl: string) => {
      const parsed = parseHttpsUrl(rawUrl, "codechef.com");
      if (!parsed.valid) return parsed;
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.length < 2 || parts[0] !== "users") {
        return { valid: false, error: "Expected format: https://www.codechef.com/users/username" };
      }
      return { valid: true, username: parts[1], canonicalUrl: `https://www.codechef.com/users/${parts[1]}` };
    },
  },

  geeksforgeeks: {
    id: "geeksforgeeks",
    name: "GeeksforGeeks",
    category: "coding",
    expectedDomain: "geeksforgeeks.org",
    placeholder: "https://www.geeksforgeeks.org/user/username",
    example: "https://www.geeksforgeeks.org/user/username",
    hasPublicStats: false,
    description: "Coding practice scores and article contributions.",
    validateAndExtract: (rawUrl: string) => {
      const parsed = parseHttpsUrl(rawUrl, "geeksforgeeks.org");
      if (!parsed.valid) return parsed;
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.length < 2 || parts[0] !== "user") {
        return { valid: false, error: "Expected format: https://www.geeksforgeeks.org/user/username" };
      }
      return { valid: true, username: parts[1], canonicalUrl: `https://www.geeksforgeeks.org/user/${parts[1]}` };
    },
  },

  grabcad: {
    id: "grabcad",
    name: "GrabCAD",
    category: "cad",
    expectedDomain: "grabcad.com",
    placeholder: "https://grabcad.com/firstname.lastname-1",
    example: "https://grabcad.com/cad.designer-1",
    hasPublicStats: false,
    description: "Mechanical CAD models, 3D designs, engineering assemblies, and simulations.",
    defaultMetric1Label: "CAD Models",
    defaultMetric2Label: "Assemblies",
    highlightPlaceholder: "e.g., Robotic Gripper Assembly in SolidWorks",
    validateAndExtract: (rawUrl: string) => {
      const parsed = parseHttpsUrl(rawUrl, "grabcad.com");
      if (!parsed.valid) return parsed;
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.length < 1) {
        return { valid: false, error: "Expected format: https://grabcad.com/username" };
      }
      const username = parts[0];
      return { valid: true, username, canonicalUrl: `https://grabcad.com/${username}` };
    },
  },

  tinkercad: {
    id: "tinkercad",
    name: "Tinkercad",
    category: "hardware",
    expectedDomain: "tinkercad.com",
    placeholder: "https://www.tinkercad.com/users/username or /things/ID",
    example: "https://www.tinkercad.com/users/johndoe-circuits",
    hasPublicStats: false,
    description: "Electronic circuits, Arduino simulation, and 3D design projects.",
    defaultMetric1Label: "Circuits",
    defaultMetric2Label: "3D Designs",
    highlightPlaceholder: "e.g., Smart Weather Station with Arduino Uno",
    validateAndExtract: (rawUrl: string) => {
      const parsed = parseHttpsUrl(rawUrl, "tinkercad.com");
      if (!parsed.valid) return parsed;
      const parts = parsed.pathname.split("/").filter(Boolean);

      // Support project thing: https://www.tinkercad.com/things/id-project-name
      if (parts[0] === "things" && parts.length >= 2) {
        const thingId = parts[1];
        const rawTitle = decodeURIComponent(parts.slice(1).join(" ")).replace(/[-_]+/g, " ");
        const titleFormatted = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
        return {
          valid: true,
          username: `things/${thingId}`,
          canonicalUrl: `https://www.tinkercad.com/things/${thingId}`,
          extractedHighlight: titleFormatted,
        };
      }

      if (parts.length < 2 || parts[0] !== "users") {
        return { valid: false, error: "Expected format: https://www.tinkercad.com/users/username or https://www.tinkercad.com/things/ID-Title" };
      }
      const username = parts[1];
      return { valid: true, username, canonicalUrl: `https://www.tinkercad.com/users/${username}` };
    },
  },

  wokwi: {
    id: "wokwi",
    name: "Wokwi",
    category: "hardware",
    expectedDomain: "wokwi.com",
    placeholder: "https://wokwi.com/makers/@username",
    example: "https://wokwi.com/makers/@urish",
    hasPublicStats: false,
    description: "ESP32, Arduino, Raspberry Pi Pico, and embedded circuit simulations.",
    defaultMetric1Label: "Simulations",
    defaultMetric2Label: "MCU Tested",
    highlightPlaceholder: "e.g., ESP32 WiFi MQTT Home Automation Node",
    validateAndExtract: (rawUrl: string) => {
      const parsed = parseHttpsUrl(rawUrl, "wokwi.com");
      if (!parsed.valid) return parsed;
      const parts = parsed.pathname.split("/").filter(Boolean);
      const reserved = ["projects", "dashboard", "parts", "share", "anim", "docs", "pricing", "club", "faq", "explore"];
      let username = "";
      if (parts[0] === "makers" && parts.length > 1) {
        username = parts[1].replace(/^@/, "");
      } else if (parts.length === 1 && (parts[0].startsWith("@") || !reserved.includes(parts[0].toLowerCase()))) {
        if (!reserved.includes(parts[0].toLowerCase())) {
          username = parts[0].replace(/^@/, "");
        }
      }
      if (!username || reserved.includes(username.toLowerCase()) || !/^[a-zA-Z0-9_-]{2,50}$/.test(username)) {
        return { valid: false, error: "Expected format: https://wokwi.com/makers/@username" };
      }
      return { valid: true, username, canonicalUrl: `https://wokwi.com/makers/@${username}` };
    },
  },

  hackster: {
    id: "hackster",
    name: "Hackster.io",
    category: "hardware",
    expectedDomain: "hackster.io",
    placeholder: "https://www.hackster.io/username",
    example: "https://www.hackster.io/alex",
    hasPublicStats: false,
    description: "Hardware projects, IoT prototypes, and electronics documentation.",
    defaultMetric1Label: "Hardware Builds",
    defaultMetric2Label: "Reputation",
    highlightPlaceholder: "e.g., Solar Powered LoRa Mesh Gateway",
    validateAndExtract: (rawUrl: string) => {
      const parsed = parseHttpsUrl(rawUrl, "hackster.io");
      if (!parsed.valid) return parsed;
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.length !== 1) {
        return { valid: false, error: "Expected format: https://www.hackster.io/username" };
      }
      return { valid: true, username: parts[0], canonicalUrl: `https://www.hackster.io/${parts[0]}` };
    },
  },

  behance: {
    id: "behance",
    name: "Behance",
    category: "design",
    expectedDomain: "behance.net",
    placeholder: "https://www.behance.net/username or /gallery/ID/title",
    example: "https://www.behance.net/username",
    hasPublicStats: false,
    description: "UI/UX design portfolios, graphic design, and creative case studies.",
    defaultMetric1Label: "Case Studies",
    defaultMetric2Label: "Design Domain",
    highlightPlaceholder: "e.g., UI/UX Mobile App Redesign Case Study",
    validateAndExtract: (rawUrl: string) => {
      const parsed = parseHttpsUrl(rawUrl, "behance.net");
      if (!parsed.valid) return parsed;
      const parts = parsed.pathname.split("/").filter(Boolean);

      // Support Behance Gallery Project URL: https://www.behance.net/gallery/12345/Project-Title
      if (parts[0] === "gallery" && parts.length >= 2) {
        const projectId = parts[1];
        const slug = parts[2] || "";
        const rawTitle = slug ? decodeURIComponent(slug).replace(/[-_]+/g, " ") : `Project #${projectId}`;
        const titleFormatted = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
        return {
          valid: true,
          username: `gallery/${projectId}`,
          canonicalUrl: `https://www.behance.net/gallery/${projectId}${slug ? `/${slug}` : ""}`,
          extractedHighlight: titleFormatted,
        };
      }

      // Support User Profile URL: https://www.behance.net/username
      const reserved = ["gallery", "search", "live", "joblist", "hire", "pro", "discover", "for_you"];
      if (parts.length < 1 || reserved.includes(parts[0].toLowerCase())) {
        return {
          valid: false,
          error: "Expected format: https://www.behance.net/username or https://www.behance.net/gallery/ID/Project-Name",
        };
      }
      const username = parts[0];
      return { valid: true, username, canonicalUrl: `https://www.behance.net/${username}` };
    },
  },

  dribbble: {
    id: "dribbble",
    name: "Dribbble",
    category: "design",
    expectedDomain: "dribbble.com",
    placeholder: "https://dribbble.com/username",
    example: "https://dribbble.com/designer",
    hasPublicStats: false,
    description: "Visual design shots, typography, and product design work.",
    validateAndExtract: (rawUrl: string) => {
      const parsed = parseHttpsUrl(rawUrl, "dribbble.com");
      if (!parsed.valid) return parsed;
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.length !== 1) {
        return { valid: false, error: "Expected format: https://dribbble.com/username" };
      }
      return { valid: true, username: parts[0], canonicalUrl: `https://dribbble.com/${parts[0]}` };
    },
  },

  googlescholar: {
    id: "googlescholar",
    name: "Google Scholar",
    category: "research",
    expectedDomain: "scholar.google.com",
    placeholder: "https://scholar.google.com/citations?user=USER_ID",
    example: "https://scholar.google.com/citations?user=qc6CJjYAAAAJ",
    hasPublicStats: true,
    description: "Scholarly research papers, citations index, and academic publications.",
    validateAndExtract: (rawUrl: string) => {
      const parsed = parseHttpsUrl(rawUrl, ["scholar.google.com", "scholar.google.co.in", "scholar.google.com.sg"]);
      if (!parsed.valid || !parsed.parsedUrl) return parsed;
      const user = parsed.parsedUrl.searchParams.get("user");
      if (!user || user.length < 4 || !/^[a-zA-Z0-9_-]+$/.test(user)) {
        return {
          valid: false,
          error: "Expected format: https://scholar.google.com/citations?user=USER_ID",
        };
      }
      return {
        valid: true,
        username: user,
        canonicalUrl: `https://scholar.google.com/citations?user=${user}`,
      };
    },
  },

  researchgate: {
    id: "researchgate",
    name: "ResearchGate",
    category: "research",
    expectedDomain: "researchgate.net",
    placeholder: "https://www.researchgate.net/profile/username",
    example: "https://www.researchgate.net/profile/Yann-LeCun",
    hasPublicStats: false,
    description: "Peer-reviewed publications, research papers, RG score, and citations.",
    defaultMetric1Label: "Publications",
    defaultMetric2Label: "Citations / RG",
    highlightPlaceholder: "e.g., Deep Learning in Medical Imaging Research",
    validateAndExtract: (rawUrl: string) => {
      const parsed = parseHttpsUrl(rawUrl, "researchgate.net");
      if (!parsed.valid) return parsed;
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.length < 2 || parts[0] !== "profile") {
        return { valid: false, error: "Expected format: https://www.researchgate.net/profile/username" };
      }
      const username = parts[1];
      return { valid: true, username, canonicalUrl: `https://www.researchgate.net/profile/${username}` };
    },
  },

  orcid: {
    id: "orcid",
    name: "ORCID",
    category: "research",
    expectedDomain: "orcid.org",
    placeholder: "https://orcid.org/0000-0002-1825-0097",
    example: "https://orcid.org/0000-0002-1825-0097",
    hasPublicStats: true,
    description: "Open Researcher and Contributor ID linking researcher publications and grants.",
    validateAndExtract: (rawUrl: string) => {
      const parsed = parseHttpsUrl(rawUrl, "orcid.org");
      if (!parsed.valid) return parsed;
      const parts = parsed.pathname.split("/").filter(Boolean);
      const orcidId = parts[0];
      if (!orcidId || !/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(orcidId)) {
        return { valid: false, error: "Expected format: https://orcid.org/0000-0000-0000-0000 (16-digit ORCID iD)" };
      }
      return { valid: true, username: orcidId, canonicalUrl: `https://orcid.org/${orcidId}` };
    },
  },

  thingiverse: {
    id: "thingiverse",
    name: "Thingiverse",
    category: "cad",
    expectedDomain: "thingiverse.com",
    placeholder: "https://www.thingiverse.com/username",
    example: "https://www.thingiverse.com/maker_dan",
    hasPublicStats: false,
    description: "3D printing models, mechanical CAD assemblies, and open-hardware designs.",
    validateAndExtract: (rawUrl: string) => {
      const parsed = parseHttpsUrl(rawUrl, "thingiverse.com");
      if (!parsed.valid) return parsed;
      const parts = parsed.pathname.split("/").filter(Boolean);
      const reserved = ["thing", "things", "groups", "explore", "dashboard", "apps", "education"];
      if (parts.length !== 1 || reserved.includes(parts[0].toLowerCase())) {
        return { valid: false, error: "Expected format: https://www.thingiverse.com/username" };
      }
      return { valid: true, username: parts[0], canonicalUrl: `https://www.thingiverse.com/${parts[0]}` };
    },
  },

  onshape: {
    id: "onshape",
    name: "Onshape",
    category: "cad",
    expectedDomain: "onshape.com",
    placeholder: "https://cad.onshape.com/user/username",
    example: "https://cad.onshape.com/user/engineer_jane",
    hasPublicStats: false,
    description: "Cloud-native CAD assemblies, parametric mechanical design, and team models.",
    validateAndExtract: (rawUrl: string) => {
      const parsed = parseHttpsUrl(rawUrl, ["onshape.com", "cad.onshape.com"]);
      if (!parsed.valid) return parsed;
      const parts = parsed.pathname.split("/").filter(Boolean);
      let username = "";
      if ((parts[0] === "user" || parts[0] === "users") && parts.length > 1) {
        username = parts[1];
      } else if (parts.length === 1) {
        username = parts[0];
      }
      if (!username) {
        return { valid: false, error: "Expected format: https://cad.onshape.com/user/username" };
      }
      return { valid: true, username, canonicalUrl: `https://cad.onshape.com/user/${username}` };
    },
  },

  autodesk: {
    id: "autodesk",
    name: "Autodesk Gallery",
    category: "cad",
    expectedDomain: "autodesk.com",
    placeholder: "https://gallery.autodesk.com/users/username",
    example: "https://gallery.autodesk.com/users/cad_designer",
    hasPublicStats: false,
    description: "Fusion 360, AutoCAD, Revit, and Inventor design showcases and architectural models.",
    validateAndExtract: (rawUrl: string) => {
      const parsed = parseHttpsUrl(rawUrl, ["autodesk.com", "gallery.autodesk.com"]);
      if (!parsed.valid) return parsed;
      const parts = parsed.pathname.split("/").filter(Boolean);
      let username = "";
      if ((parts[0] === "users" || parts[0] === "user") && parts.length > 1) {
        username = parts[1];
      } else if (parts.length === 1) {
        username = parts[0];
      }
      if (!username) {
        return { valid: false, error: "Expected format: https://gallery.autodesk.com/users/username" };
      }
      return { valid: true, username, canonicalUrl: `https://gallery.autodesk.com/users/${username}` };
    },
  },

  arduinohub: {
    id: "arduinohub",
    name: "Arduino Project Hub",
    category: "hardware",
    expectedDomain: "arduino.cc",
    placeholder: "https://projecthub.arduino.cc/username",
    example: "https://projecthub.arduino.cc/maker_alex",
    hasPublicStats: false,
    description: "Embedded Arduino microcontrollers, sensor schematics, and robotics builds.",
    validateAndExtract: (rawUrl: string) => {
      const parsed = parseHttpsUrl(rawUrl, ["projecthub.arduino.cc", "create.arduino.cc", "arduino.cc"]);
      if (!parsed.valid) return parsed;
      const parts = parsed.pathname.split("/").filter(Boolean);
      let username = "";
      if (parts[0] === "projecthub" && parts.length > 1) {
        username = parts[1];
      } else if (parts.length >= 1) {
        username = parts[parts.length - 1];
      }
      if (!username) {
        return { valid: false, error: "Expected format: https://projecthub.arduino.cc/username" };
      }
      return { valid: true, username, canonicalUrl: `https://projecthub.arduino.cc/${username}` };
    },
  },

  instructables: {
    id: "instructables",
    name: "Instructables",
    category: "hardware",
    expectedDomain: "instructables.com",
    placeholder: "https://www.instructables.com/member/username",
    example: "https://www.instructables.com/member/tech_maker",
    hasPublicStats: false,
    description: "DIY electronics, robotics tutorials, step-by-step engineering projects, and prototypes.",
    validateAndExtract: (rawUrl: string) => {
      const parsed = parseHttpsUrl(rawUrl, "instructables.com");
      if (!parsed.valid) return parsed;
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.length < 2 || parts[0] !== "member") {
        return { valid: false, error: "Expected format: https://www.instructables.com/member/username" };
      }
      const username = parts[1];
      return { valid: true, username, canonicalUrl: `https://www.instructables.com/member/${username}` };
    },
  },

  easyeda: {
    id: "easyeda",
    name: "EasyEDA",
    category: "hardware",
    expectedDomain: "easyeda.com",
    placeholder: "https://easyeda.com/username",
    example: "https://easyeda.com/pcb_circuit_pro",
    hasPublicStats: false,
    description: "Schematic capture, PCB layout design, and open-source hardware circuit boards.",
    validateAndExtract: (rawUrl: string) => {
      const parsed = parseHttpsUrl(rawUrl, ["easyeda.com", "oshwlab.com"]);
      if (!parsed.valid) return parsed;
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.length !== 1) {
        return { valid: false, error: "Expected format: https://easyeda.com/username" };
      }
      return { valid: true, username: parts[0], canonicalUrl: `https://easyeda.com/${parts[0]}` };
    },
  },
};

// -----------------------------------------------------------------------------
// 2. HELPER: STRICT HTTPS & DOMAIN PARSER WITH CROSS-PLATFORM ERROR DETECTION
// -----------------------------------------------------------------------------
function parseHttpsUrl(
  rawUrl: string,
  expectedDomains: string | string[]
): {
  valid: boolean;
  pathname: string;
  parsedUrl?: URL;
  error?: string;
} {
  const trimmed = String(rawUrl || "").trim();
  if (!trimmed.startsWith("https://")) {
    return { valid: false, pathname: "", error: "Only secure https:// profile links are permitted." };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, pathname: "", error: "Invalid URL structure." };
  }

  const domains = Array.isArray(expectedDomains) ? expectedDomains : [expectedDomains];
  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
  const matchedDomain = domains.find((d) => hostname === d || hostname.endsWith(`.${d}`));

  if (!matchedDomain) {
    // Check if user accidentally entered another known platform link
    const otherMatched = Object.values(PLATFORMS_CONFIG).find((p) => {
      const exp = p.expectedDomain;
      return hostname === exp || hostname.endsWith(`.${exp}`);
    });
    const expectedName = domains[0];
    if (otherMatched) {
      return {
        valid: false,
        pathname: "",
        error: `This is a ${otherMatched.name} link (${hostname}), but you selected a different platform. Please select ${otherMatched.name} or provide a valid ${expectedName} profile URL.`,
      };
    }
    return {
      valid: false,
      pathname: "",
      error: `Invalid domain for this platform. Expected ${domains.join(" or ")}, got ${hostname}.`,
    };
  }

  return { valid: true, pathname: parsed.pathname.replace(/\/+$/, ""), parsedUrl: parsed };
}

// -----------------------------------------------------------------------------
// 3. EDITABLE BRANCH-TO-PLATFORM MAPPING CONFIGURATION
// -----------------------------------------------------------------------------
// Maps student degree / department branch to the platforms most relevant to them.
export const BRANCH_PLATFORM_MAP: Record<string, PlatformId[]> = {
  // CSBS / CSE / IT / AI&DS
  cs: [
    "github",
    "leetcode",
    "codeforces",
    "hackerrank",
    "credly",
    "kaggle",
    "codechef",
    "geeksforgeeks",
  ],

  // Mechanical / Civil / Production / Manufacturing / Aerospace / Automobile
  mech_civil: [
    "grabcad",
    "tinkercad",
    "thingiverse",
    "onshape",
    "autodesk",
    "credly",
    "behance",
  ],

  // ECE / EEE / Electronics / Electrical / Instrumentation / IoT / Robotics
  ece_eee: [
    "tinkercad",
    "wokwi",
    "hackster",
    "arduinohub",
    "instructables",
    "easyeda",
    "github",
    "credly",
  ],

  // Design / Architecture / Multimedia
  design: [
    "behance",
    "dribbble",
    "autodesk",
    "credly",
  ],

  // Research / Academia / Sciences / Biotech / Higher Studies
  research: [
    "googlescholar",
    "researchgate",
    "orcid",
    "credly",
  ],
};

/**
 * Resolves the relevant platforms for a given student branch string.
 * If branch is not recognized or empty, returns the full default list.
 */
export function getPlatformsForBranch(branchName?: string): PlatformConfig[] {
  if (!branchName) {
    return Object.values(PLATFORMS_CONFIG);
  }

  const b = branchName.toLowerCase();

  // Match CS / IT / AI / Data Science
  if (
    b.includes("csbs") ||
    b.includes("computer") ||
    b.includes("cse") ||
    b.includes("it") ||
    b.includes("information technology") ||
    b.includes("ai") ||
    b.includes("data science") ||
    b.includes("software")
  ) {
    return BRANCH_PLATFORM_MAP.cs.map((id) => PLATFORMS_CONFIG[id]);
  }

  // Match Research / Pure Sciences / Biotech / PhD / Masters
  if (
    b.includes("research") ||
    b.includes("biotech") ||
    b.includes("chem") ||
    b.includes("phys") ||
    b.includes("math") ||
    b.includes("phd") ||
    b.includes("master") ||
    (b.includes("science") && !b.includes("computer") && !b.includes("data"))
  ) {
    return BRANCH_PLATFORM_MAP.research.map((id) => PLATFORMS_CONFIG[id]);
  }

  // Match Mechanical / Civil / Production / Aero
  if (
    b.includes("mech") ||
    b.includes("civil") ||
    b.includes("production") ||
    b.includes("manufacturing") ||
    b.includes("aero") ||
    b.includes("automobile")
  ) {
    return BRANCH_PLATFORM_MAP.mech_civil.map((id) => PLATFORMS_CONFIG[id]);
  }

  // Match ECE / EEE / Instrumentation / IoT / Robotics
  if (
    b.includes("ece") ||
    b.includes("eee") ||
    b.includes("electron") ||
    b.includes("electric") ||
    b.includes("telecom") ||
    b.includes("instrument") ||
    b.includes("iot") ||
    b.includes("embedded") ||
    b.includes("robot")
  ) {
    return BRANCH_PLATFORM_MAP.ece_eee.map((id) => PLATFORMS_CONFIG[id]);
  }

  // Match Design / Architecture
  if (
    b.includes("design") ||
    b.includes("architect") ||
    b.includes("ui") ||
    b.includes("ux") ||
    b.includes("multimedia") ||
    b.includes("animation")
  ) {
    return BRANCH_PLATFORM_MAP.design.map((id) => PLATFORMS_CONFIG[id]);
  }

  // Fallback: CS list if generic "Engineering", or all platforms
  return Object.values(PLATFORMS_CONFIG);
}
