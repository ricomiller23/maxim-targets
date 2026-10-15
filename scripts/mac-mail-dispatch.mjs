// mac-mail-dispatch.mjs — Dispatch engine for Maxim targets via Apple Mail (ricomiller@gmail.com)
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.resolve(__dirname, "../data/maxim-targets.json");

const raw = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const targets = raw.targets;

const isExecute = process.argv.includes("--execute") || process.env.LIVE_SEND === "1";
const batchArgIndex = process.argv.indexOf("--batch");
const requestedBatch = batchArgIndex !== -1 ? parseInt(process.argv[batchArgIndex + 1], 10) : parseInt(process.env.BATCH_SIZE || "5", 10);
const BATCH_SIZE = isNaN(requestedBatch) ? 5 : requestedBatch;

console.log(`======================================================================`);
console.log(`MAXIM TARGETS — NATIVE MACOS OUTREACH DISPATCH ENGINE`);
console.log(`======================================================================`);
console.log(`Mode: ${isExecute ? "LIVE SEND (Apple Mail ricomiller@gmail.com)" : "DRY RUN (Preview Only)"}`);
console.log(`Universe: ${targets.length} companies | Batch Size: ${BATCH_SIZE}`);
console.log(`======================================================================\n`);

const critical = targets.filter(t => t.financialMetrics.capitalNeedUrgency === "critical");
const batch = critical.slice(0, BATCH_SIZE);

function sendEmailViaAppleMail(to, subject, body) {
  const escapedSubject = subject.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const escapedBody = body.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  const appleScript = `tell application "Mail"
  set newMsg to make new outgoing message with properties {sender:"Eric Miller <ricomiller@gmail.com>", subject:"${escapedSubject}", content:"${escapedBody}", visible:false}
  tell newMsg
    make new to recipient at end of to recipients with properties {address:"${to}"}
    send
  end tell
end tell`;

  try {
    execSync("osascript", { input: appleScript, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
    return true;
  } catch (err) {
    console.error(`❌ Transmission error for ${to}:`, err.message);
    return false;
  }
}

for (let i = 0; i < batch.length; i++) {
  const t = batch[i];
  const ceo = t.contacts.find(c => c.id.includes("ceo")) || t.contacts[0];
  const subject = t.outreach.managementSubject;
  const body = t.outreach.managementBody;

  process.stdout.write(`[${i + 1}/${batch.length}] Target: ${t.ticker} (${t.name}) -> ${ceo.name} <${ceo.email}>... `);

  if (isExecute) {
    const ok = sendEmailViaAppleMail(ceo.email, subject, body);
    if (ok) {
      console.log(`✓ SENT via ricomiller@gmail.com`);
    } else {
      console.log(`✗ FAILED`);
    }
    if (i < batch.length - 1) {
      execSync("sleep 5");
    }
  } else {
    console.log(`[DRY RUN PREVIEW]`);
  }
}

console.log(`\nTo execute live dispatches: node scripts/mac-mail-dispatch.mjs --execute --batch 5`);
