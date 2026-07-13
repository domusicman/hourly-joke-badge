const fs = require("fs");

const JOKES_FILE = "jokes.json";
const BADGE_FILE = "badge.json";
const STATE_FILE = "state.json";

// Set your timezone here or in GitHub Actions env.
// Examples: America/Los_Angeles, America/New_York, Europe/London
const tz = process.env.TZ_NAME || "America/Los_Angeles";

const source = JSON.parse(fs.readFileSync(JOKES_FILE, "utf8"));
const jokes = source.jokes || [];
if (!jokes.length) throw new Error("No jokes found in jokes.json");

function getHourInTimeZone(timeZone) {
  const h = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    hourCycle: "h23"
  }).format(new Date());
  return Number(h);
}

const hour = getHourInTimeZone(tz);
const inAllowedWindow = hour >= 8 && hour <= 21;

// Outside 8:00-21:59 local time: do nothing unless ALLOW_OFFHOURS=1.
if (!inAllowedWindow && process.env.ALLOW_OFFHOURS !== "1") {
  console.log(`Outside allowed window (${hour}:00 in ${tz}). No update.`);
  process.exit(0);
}

let state = { lastIndex: -1 };
if (fs.existsSync(STATE_FILE)) {
  try {
    state = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    state = { lastIndex: -1 };
  }
}

let idx = Math.floor(Math.random() * jokes.length);

// Avoid immediate repeat when possible
if (jokes.length > 1) {
  let guard = 0;
  while (idx === state.lastIndex && guard < 10) {
    idx = Math.floor(Math.random() * jokes.length);
    guard += 1;
  }
}

const joke = jokes[idx];
const payload = {
  schemaVersion: 1,
  label: "joke of the hour",
  message: `[${joke.category}] ${joke.text}`,
  color: "orange",
  cacheSeconds: 300
};

fs.writeFileSync(BADGE_FILE, JSON.stringify(payload, null, 2) + "\n");
fs.writeFileSync(
  STATE_FILE,
  JSON.stringify(
    {
      lastIndex: idx,
      timezone: tz,
      lastUpdatedUtc: new Date().toISOString()
    },
    null,
    2
  ) + "\n"
);

console.log(`Updated badge: ${payload.message}`);
