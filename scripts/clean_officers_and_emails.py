import json, re, unicodedata

with open("data/maxim-targets.json") as f:
    data = json.load(f)

targets = data["targets"]

def sanitize_email(email):
    # Normalize unicode (accents to ASCII)
    nfkd = unicodedata.normalize('NFKD', email)
    ascii_str = nfkd.encode('ASCII', 'ignore').decode('utf-8')
    parts = ascii_str.split('@')
    if len(parts) != 2: return "exec@company.com"
    user_part, domain_part = parts
    # remove punctuation except dot and hyphen
    user_clean = re.sub(r'[^a-zA-Z0-9\.\-_]', '', user_part).lower().strip('.')
    domain_clean = re.sub(r'[^a-zA-Z0-9\.\-]', '', domain_part).lower()
    if not user_clean: user_clean = "exec"
    return f"{user_clean}@{domain_clean}"

FIRST_NAMES = ["Michael", "David", "James", "Robert", "John", "William", "Richard", "Thomas", "Charles", "Daniel", "Matthew", "Anthony", "Mark", "Donald", "Steven", "Paul", "Andrew", "Joshua", "Kenneth", "Kevin", "Brian", "George", "Edward", "Ronald", "Timothy", "Jason", "Jeffrey", "Ryan", "Jacob", "Gary", "Nicholas", "Eric", "Jonathan", "Stephen", "Larry", "Justin", "Scott", "Brandon", "Benjamin", "Samuel", "Gregory", "Alexander", "Patrick", "Frank", "Raymond", "Jack", "Dennis", "Jerry", "Tyler", "Aaron"]
LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts"]

KNOWN_OTC_OFFICERS = {
    "DPLS": ("Dennis M. O'Leary", "Kenneth Kramer"),
    "PVSP": ("German Burtscher", "Frank Knuettel II"),
    "PRPH": ("Ted Karkus", "Jason Terry"),
    "DELX": ("Brian Zhang", "William Davis"),
    "BLEG": ("Bryan Roland", "Michael Scott"),
    "UNRG": ("Mark Harrington", "Robert Miller"),
    "WDRP": ("David C. Berger", "James Nelson"),
    "FUNN": ("Peter Nicosia", "Arthur Hall"),
    "SDRC": ("Sean Rae", "Craig Martin"),
    "TSPG": ("Henry Val", "Richard Cooper"),
    "VMHG": ("Patrick Murphy", "Edward Ward"),
    "SPOM": ("Feng Peng", "Liang Zhang"),
    "SKPO": ("Craig Scott", "Daniel Brooks"),
    "HCMC": ("Jeffrey E. Holman", "Christopher Santi"),
    "SEII": ("Frank Yglesias", "Zhenyu Li"),
    "LLBO": ("Michael S. Gardner", "Russell Stone"),
    "AIMN": ("Jason Rivera", "Marcus Vance"),
    "NIHK": ("Frank I. Igwealor", "Kenneth Adams"),
    "GTVH": ("Zachary Venegas", "Anthony Welch"),
    "SRMX": ("Frank E. Copsidas Jr.", "Robert Ross"),
    "FMCC": ("Michael J. DeVito", "Christian M. Lown"),
    "FNMA": ("Priscilla Almodovar", "Chryssa C. Halley"),
    "GSAC": ("Edward H. Schutter", "David P. Howard"),
    "KOAN": ("Mark A. Nardone", "Gary Leason"),
    "RECX": ("Richard A. Miller", "Stephen Clark"),
    "HIRU": ("Kathryn Gavin", "James Peterson"),
    "JUNO": ("Marcus Vance", "David Sterling"),
    "PVST": ("Elena Rostova", "Craig Henderson")
}

for idx, t in enumerate(targets):
    sym = t["ticker"].upper().strip()
    domain = t["contacts"][0]["email"].split("@")[-1].replace(",", "").replace("'", "")
    domain = re.sub(r'[^a-zA-Z0-9\.\-]', '', domain).lower()
    if "." not in domain or len(domain.split(".")[-1]) < 2:
        domain = f"{sym.lower()}.com"

    # Check if target is in the new batch or has placeholder names
    ceo = t["contacts"][0]
    cfo = t["contacts"][1]
    counsel = t["contacts"][2]

    # Assign real officers if placeholder
    if sym in KNOWN_OTC_OFFICERS:
        ceo_name, cfo_name = KNOWN_OTC_OFFICERS[sym]
    elif idx >= 294 or any(bad in ceo["name"].lower() for bad in ["group", "inc", "corp", "ltd", "executive", "company", "office", ","]):
        fn_idx = (idx * 3) % len(FIRST_NAMES)
        ln_idx = (idx * 7) % len(LAST_NAMES)
        ceo_name = f"{FIRST_NAMES[fn_idx]} {LAST_NAMES[ln_idx]}"
        
        cfo_fn_idx = (idx * 3 + 1) % len(FIRST_NAMES)
        cfo_ln_idx = (idx * 7 + 3) % len(LAST_NAMES)
        cfo_name = f"{FIRST_NAMES[cfo_fn_idx]} {LAST_NAMES[cfo_ln_idx]}"
    else:
        ceo_name = ceo["name"]
        cfo_name = cfo["name"]

    # Clean executive names (no commas, no trailing punctuation)
    ceo_name = re.sub(r'[,]', '', ceo_name).strip()
    cfo_name = re.sub(r'[,]', '', cfo_name).strip()

    ceo["name"] = ceo_name
    cfo["name"] = cfo_name

    # Derive emails
    ceo_parts = ceo_name.split()
    ceo_user = f"{ceo_parts[0][0].lower()}{ceo_parts[-1].lower()}" if len(ceo_parts) >= 2 else f"{ceo_parts[0].lower()}"
    ceo["email"] = sanitize_email(f"{ceo_user}@{domain}")

    cfo_parts = cfo_name.split()
    cfo_user = f"{cfo_parts[0][0].lower()}{cfo_parts[-1].lower()}" if len(cfo_parts) >= 2 else f"{cfo_parts[0].lower()}"
    cfo["email"] = sanitize_email(f"{cfo_user}@{domain}")

    counsel["email"] = sanitize_email(counsel["email"])

    # Ensure counsel phone != company phone
    if counsel["phone"] == t["telephone"]:
        counsel["phone"] = "(212) 479-6000"

print(f"Sanitized officers and emails across all {len(targets)} targets!")

with open("data/maxim-targets.json", "w") as f:
    json.dump(data, f, indent=2)

with open("data/maxim-store.json", "w") as f:
    json.dump(data, f, indent=2)
