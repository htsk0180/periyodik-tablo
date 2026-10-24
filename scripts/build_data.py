#!/usr/bin/env python3
"""Periodic table data builder.

Merges:
  - Bowserinator/Periodic-Table-JSON (CC BY-SA / MIT) for layout + English summaries
  - pse-info.de (MIT) for rich physical/chemical data + emission spectra
  - mendeleev-data (MIT) for isotopes and oxidation states
  - Turkish Wikipedia (CC BY-SA) for Turkish introductions
Outputs: assets/data/elements.json
"""
import json, os, re, time, urllib.parse, urllib.request, unicodedata
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "assets", "data")

TR_NAMES = {
1:"Hidrojen",2:"Helyum",3:"Lityum",4:"Berilyum",5:"Bor",6:"Karbon",7:"Azot",8:"Oksijen",9:"Flor",10:"Neon",
11:"Sodyum",12:"Magnezyum",13:"Alüminyum",14:"Silisyum",15:"Fosfor",16:"Kükürt",17:"Klor",18:"Argon",19:"Potasyum",20:"Kalsiyum",
21:"Skandiyum",22:"Titanyum",23:"Vanadyum",24:"Krom",25:"Manganez",26:"Demir",27:"Kobalt",28:"Nikel",29:"Bakır",30:"Çinko",
31:"Galyum",32:"Germanyum",33:"Arsenik",34:"Selenyum",35:"Brom",36:"Kripton",37:"Rubidyum",38:"Stronsiyum",39:"İtriyum",40:"Zirkonyum",
41:"Niyobyum",42:"Molibden",43:"Teknesyum",44:"Rutenyum",45:"Rodyum",46:"Paladyum",47:"Gümüş",48:"Kadmiyum",49:"İndiyum",50:"Kalay",
51:"Antimon",52:"Tellür",53:"İyot",54:"Ksenon",55:"Sezyum",56:"Baryum",57:"Lantan",58:"Seryum",59:"Praseodim",60:"Neodimyum",
61:"Prometyum",62:"Samaryum",63:"Evropyum",64:"Gadolinyum",65:"Terbiyum",66:"Disprozyum",67:"Holmiyum",68:"Erbiyum",69:"Tulyum",70:"İterbiyum",
71:"Lutesyum",72:"Hafniyum",73:"Tantal",74:"Tungsten",75:"Renyum",76:"Osmiyum",77:"İridyum",78:"Platin",79:"Altın",80:"Cıva",
81:"Talyum",82:"Kurşun",83:"Bizmut",84:"Polonyum",85:"Astatin",86:"Radon",87:"Fransiyum",88:"Radyum",89:"Aktinyum",90:"Toryum",
91:"Protaktinyum",92:"Uranyum",93:"Neptünyum",94:"Plütonyum",95:"Amerikyum",96:"Küriyum",97:"Berkelyum",98:"Kaliforniyum",99:"Aynştaynyum",100:"Fermiyum",
101:"Mendelevyum",102:"Nobelyum",103:"Lavrensiyum",104:"Rutherfordyum",105:"Dubniyum",106:"Seaborgiyum",107:"Bohriyum",108:"Hassiyum",109:"Meitneriyum",110:"Darmstadtiyum",
111:"Röntgenyum",112:"Kopernikyum",113:"Nihonyum",114:"Flerovyum",115:"Moskovyum",116:"Livermoryum",117:"Tennessin",118:"Oganesson",
}

# Wikipedia page titles can differ slightly from the display names.
WIKI_TITLES = dict(TR_NAMES)
WIKI_TITLES.update({63:"Evropiyum",74:"Volfram",99:"Einsteinyum",110:"Darmstadtium"})

CATEGORY_MAP = {
    "alkalimetal":"alkali-metal","alkalineearthmetal":"alkaline-earth-metal",
    "transitionmetal":"transition-metal","metal":"post-transition-metal",
    "metalloid":"metalloid","nonmetal":"nonmetal","noblegas":"noble-gas",
    "halogen":"halogen","lanthanoide":"lanthanide","actinoide":"actinide",
    "unknown":"unknown",
}

TR_CATEGORY = {
    "alkali-metal":"alkali metal","alkaline-earth-metal":"toprak alkali metal",
    "transition-metal":"geçiş metali","post-transition-metal":"geçiş sonrası metal",
    "metalloid":"metaloid","nonmetal":"ametal","halogen":"halojen",
    "noble-gas":"soy gaz","lanthanide":"lantanit","actinide":"aktinit","unknown":"özellikleri belirsiz",
}

SUP = str.maketrans("0123456789", "⁰¹²³⁴⁵⁶⁷⁸⁹")
NOBLE = {"He","Ne","Ar","Kr","Xe","Rn","Og"}

def sup(n):
    return str(n).translate(SUP)

def expand_config(cfg):
    """Turn 'Xe 4f[14] 5d[10] 6s[1]' into ordered full config '1s² ...'."""
    raw = cfg.replace("[", "").replace("]", "")
    # prefix noble gas core without brackets e.g. 'Xe 4f14'
    m = re.match(r"^([A-Z][a-z]?)\s+(.*)$", raw)
    core = ""
    rest = raw
    if m and m.group(1) in NOBLE:
        core = m.group(1)
        rest = m.group(2)
    subs = {}
    if core:
        # find the core element's own config recursively later
        pass
    for orb, count in re.findall(r"(\d[spdf])\s*(\d+)", rest):
        n = int(orb[0]); l = "spdf".index(orb[1])
        subs[(n, l)] = int(count)
    # recursively expand noble core
    core_map = {"He":2,"Ne":10,"Ar":18,"Kr":36,"Xe":54,"Rn":86,"Og":118}
    if core:
        z = core_map.get(core)
        base = build_config_from_z(z) if z else []
        for (n,l),c in base:
            subs[(n,l)] = c
    ordered = sorted(subs.items(), key=lambda kv: (kv[0][0], kv[0][1]))
    return " ".join(f"{n}{'spdf'[l]}{sup(c)}" for (n,l),c in ordered)

def build_config_from_z(z):
    """Aufbau order, used only to expand noble gas cores (anomalies included in core elements' own configs)."""
    order = [(1,0),(2,0),(2,1),(3,0),(3,1),(4,0),(3,2),(4,1),(5,0),(4,2),(5,1),(6,0),(4,3),(5,2),(6,1),(7,0),(5,3),(6,2),(7,1),(6,3),(7,2),(7,3)]
    cap = {0:2,1:6,2:10,3:14}
    left = z; out = []
    for n,l in order:
        if left <= 0: break
        c = min(cap[l], left)
        out.append(((n,l), c)); left -= c
    return out

def format_config(cfg):
    """PSE style 'Xe 4f[14] 5d[10] 6s[1]' -> '[Xe] 4f¹⁴ 5d¹⁰ 6s¹'."""
    cfg = cfg.strip()
    m = re.match(r"^([A-Z][a-z]?)\s+(.*)$", cfg)
    pre = ""
    rest = cfg
    if m and m.group(1) in NOBLE:
        pre = f"[{m.group(1)}] "
        rest = m.group(2)
    rest = re.sub(r"\[(\d+)\]", lambda m: sup(int(m.group(1))), rest)
    rest = re.sub(r"(?<=[spdf])(\d+)", lambda m: sup(int(m.group(1))), rest)
    return (pre + rest).strip()

def trim_sentences(text, limit=700):
    text = re.sub(r"\s+", " ", text or "").strip()
    if not text: return ""
    out = []
    for part in re.split(r"(?<=[.!?])\s+", text):
        if sum(len(x)+1 for x in out) + len(part) > limit: break
        out.append(part)
    return " ".join(out).strip()

def fetch(url, timeout=40):
    req = urllib.request.Request(url, headers={"User-Agent":"PeriyodikTabloSim/1.0 (educational; contact: local)"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))

def get_tr_summaries():
    cache_path = os.path.join(DATA, "wikipedia_tr.json")
    if os.path.exists(cache_path):
        return json.load(open(cache_path, encoding="utf-8"))
    result = {}
    zs = list(range(1,119))
    for i in range(0, len(zs), 20):
        chunk = zs[i:i+20]
        titles = [WIKI_TITLES[z] for z in chunk]
        params = {"action":"query","format":"json","prop":"extracts","exintro":"1",
                  "explaintext":"1","redirects":"1","exlimit":"max","titles":"|".join(titles)}
        try:
            data = fetch("https://tr.wikipedia.org/w/api.php?" + urllib.parse.urlencode(params))
            pages = data.get("query",{}).get("pages",{})
            # map normalized/redirected titles back
            norm = {}
            for n in data.get("query",{}).get("normalized",[]): norm[n["to"]] = n["from"]
            for r in data.get("query",{}).get("redirects",[]): norm.setdefault(r["to"], r["from"])
            by_title = {}
            for p in pages.values():
                t = p.get("title","")
                # walk back to requested title
                seen=set()
                while t in norm and t not in seen:
                    seen.add(t); t = norm[t]
                if p.get("extract"):
                    by_title[t] = p["extract"]
            for z,title in zip(chunk,titles):
                if title in by_title: result[str(z)] = by_title[title]
                else:
                    alt = [v for k,v in by_title.items() if k.lower()==title.lower()]
                    if alt: result[str(z)] = alt[0]
            print(f"TR wiki {chunk[0]}-{chunk[-1]}: {sum(1 for z in chunk if str(z) in result)} ok")
        except Exception as e:
            print("wiki batch error", chunk[0], e)
        time.sleep(0.5)
    # Search fallback for missing
    missing = [z for z in zs if str(z) not in result]
    for z in missing:
        try:
            params={"action":"query","format":"json","list":"search","srsearch":WIKI_TITLES[z],"srlimit":"1"}
            d=fetch("https://tr.wikipedia.org/w/api.php?"+urllib.parse.urlencode(params))
            hits=d.get("query",{}).get("search",[])
            if hits:
                title=hits[0]["title"]
                p={"action":"query","format":"json","prop":"extracts","exintro":"1","explaintext":"1","redirects":"1","titles":title}
                dd=fetch("https://tr.wikipedia.org/w/api.php?"+urllib.parse.urlencode(p))
                for pg in dd.get("query",{}).get("pages",{}).values():
                    if pg.get("extract"): result[str(z)]=pg["extract"]
        except Exception as e:
            print("wiki search error", z, e)
        time.sleep(0.25)
    json.dump(result, open(cache_path,"w",encoding="utf-8"), ensure_ascii=False, indent=0)
    print("TR summaries:", len(result), "/ 118")
    return result

def parse_oxidation(pse_value, mend_states, mend_main=None):
    common = list(mend_main or [])
    if pse_value:
        for token in pse_value.split(","):
            t = token.strip()
            bold = "'''" in t
            t = t.replace("'''","").strip()
            try:
                v = int(t.replace("+",""))
            except ValueError:
                continue
            if bold and v not in common: common.append(v)
    all_states = sorted(set(mend_states) | set(common), key=lambda x: (x != 0, abs(x), x))
    if not common:
        common = [s for s in all_states if s != 0][:3] or [0]
    return {"common": common, "all": all_states}

def density_to_g_cm3(value, unit):
    """Normalise pse-info.de density units to g/cm³."""
    if value is None: return None
    u = (unit or "").replace("−","-").replace("⁻","-").replace("[","").replace("]","").replace("·","").replace(" ","").lower()
    if u in ("kgm-3","kg/m3","kgm3"):
        return value / 1000.0
    if u in ("kgl-1","kg/l","kgl1"):
        return value
    if u in ("gl-1","g/l"):
        return value / 1000.0
    # g·cm-3 and anything already in g/cm³
    return value

def half_life_seconds(value, unit):
    if value is None or unit is None: return -1
    mult = {"nsec":1e-9,"usec":1e-6,"msec":1e-3,"sec":1,"minute":60,"hour":3600,
            "day":86400,"year":3.15576e7,"kyear":3.15576e10,"Myear":3.15576e13,
            "Gyear":3.15576e16,"Tyear":3.15576e19,"Pyear":3.15576e22,
            "Eyear":3.15576e25,"Zyear":3.15576e28,"Yyear":3.15576e31,
            "asec":1e-18,"zsec":1e-21,"ysec":1e-24,"psec":1e-12}
    return value * mult.get(unit, 1)

def build_isotopes(z, isotopes):
    items = [i for i in isotopes if i["atomic_number"] == z]
    natural = [i for i in items if (i.get("abundance") or 0) > 0]
    if not natural:
        natural = [i for i in items if i.get("mass_number")]
        # pick the longest-lived few
        natural = sorted(natural, key=lambda i: half_life_seconds(i.get("half_life"), i.get("half_life_unit")), reverse=True)[:4]
    else:
        # add up to two notable long-lived radioisotopes (>1 year)
        extra = [i for i in items if (i.get("abundance") or 0) <= 0 and i.get("half_life")
                 and half_life_seconds(i.get("half_life"), i.get("half_life_unit")) > 3.15576e7]
        extra = sorted(extra, key=lambda i: half_life_seconds(i.get("half_life"), i.get("half_life_unit")), reverse=True)[:2]
        natural = natural + extra
    natural.sort(key=lambda i: i["mass_number"])
    out = []
    for i in natural[:8]:
        out.append({
            "massNumber": i["mass_number"],
            "mass": round(i["mass"], 6) if i.get("mass") else None,
            "abundance": i.get("abundance") if (i.get("abundance") or 0) > 0 else 0,
            "halfLife": i.get("half_life"),
            "halfLifeUnit": i.get("half_life_unit"),
            "radioactive": bool(i.get("is_radioactive")),
            "spin": i.get("spin"),
        })
    return out

def build():
    raw = json.load(open(os.path.join(DATA,"raw_periodic_table.json"), encoding="utf-8"))["elements"]
    bow = {e["number"]: e for e in raw if e["number"] <= 118}
    pse = json.load(open(os.path.join(DATA,"pse_elements.json"), encoding="utf-8"))
    pse_by_z = {v["number"]: v for v in pse.values()}
    isotopes = json.load(open(os.path.join(DATA,"isotopes_raw.json"), encoding="utf-8"))
    ox_raw = json.load(open(os.path.join(DATA,"oxidation_raw.json"), encoding="utf-8"))
    ox = defaultdict(list)
    ox_main = defaultdict(list)
    for o in ox_raw:
        ox[o["atomic_number"]].append(o["oxidation_state"])
        if o.get("category") == "main":
            ox_main[o["atomic_number"]].append(o["oxidation_state"])
    spectra = json.load(open(os.path.join(DATA,"pse_spectrum.json"), encoding="utf-8"))
    tr_summaries = get_tr_summaries()

    elements = []
    for z in range(1,119):
        b = bow[z]; p = pse_by_z.get(z, {})
        symbol = b["symbol"]
        cat = CATEGORY_MAP.get(p.get("set","unknown"), "unknown")
        # predicted superheavy categories from position when unknown
        if cat == "unknown":
            g = b.get("group")
            if g == 17: cat = "halogen"
            elif g == 18: cat = "noble-gas"
            elif g and 3 <= g <= 12: cat = "transition-metal"
            elif g in (13,14,15,16): cat = "post-transition-metal"
        name_en = b["name"]
        name_tr = TR_NAMES[z]
        # electron config
        cfg_raw = p.get("electron_config") or b.get("electron_configuration","")
        if z == 2: cfg_raw = "1s[2]"
        cfg = format_config(cfg_raw)
        cfg_full = expand_config(cfg_raw)
        # sanity check: total configured electrons should equal Z
        total_e = sum(int(x) for x in re.findall(r"[spdf](\d+)", cfg_full.replace("⁰","0").replace("¹","1").replace("²","2").replace("³","3").replace("⁴","4").replace("⁵","5").replace("⁶","6").replace("⁷","7").replace("⁸","8").replace("⁹","9")))
        if total_e != z:
            print(f"config electron mismatch Z={z} {symbol}: {total_e} vs {z} ({cfg_full})")
        # properties
        def num(path, default=None):
            cur = p
            for k in path.split("."):
                if not isinstance(cur, dict) or k not in cur: return default
                cur = cur[k]
            if isinstance(cur, dict):
                return cur.get("value", default)
            return cur if cur is not None else default
        melt = num("temperature.melting")
        boil = num("temperature.boiling")
        if melt is None and b.get("melt") is not None: melt = b["melt"]
        if boil is None and b.get("boil") is not None: boil = b["boil"]
        density = p.get("density")
        dens_val = None
        if isinstance(density, dict):
            dens_val = density.get("value")
            dens_val = density_to_g_cm3(dens_val, density.get("unit"))
        elif isinstance(density, list) and density:
            entry = next((x for x in density if "gas" in str(x.get("label",""))), density[0])
            dens_val = density_to_g_cm3(entry.get("value"), entry.get("unit"))
        if dens_val is None and b.get("density") is not None:
            dens_val = b["density"]
            if (b.get("phase","") or "").lower() == "gas":
                dens_val = dens_val / 1000.0
        radii = p.get("radius", {}) or {}
        def rval(k):
            q = radii.get(k)
            return q.get("value") if isinstance(q, dict) else q
        ion = p.get("ionization",{}).get("values") or []
        if not ion and b.get("ionization_energies"):
            ion = [round(x/96.485, 4) for x in b["ionization_energies"][:8]]
        ea = b.get("electron_affinity")
        ea_ev = round(ea/96.485, 4) if ea is not None else None
        phase = p.get("phase") or (b.get("phase","").lower() if b.get("phase") else None)
        discovery = p.get("discovery") or {}
        year = discovery.get("value")
        by = discovery.get("by")
        if year is None:
            y = b.get("discovered_by")
            by = by or b.get("discovered_by")
        if year is None:
            era = p.get("era")
            year = {"antiquity":"antiquity","18th century":"18th-century",
                    "19th century":"19th-century","20th century":"20th-century"}.get(era)
        if isinstance(year, str) and year.startswith("Antik"):
            year = "antiquity"
        appearance = (p.get("appearance") or {}).get("en")
        summary_en = trim_sentences(b.get("summary",""), 720)
        summary_tr = trim_sentences(tr_summaries.get(str(z),""), 760)
        if not summary_tr:
            state_tr = {"solid":"katı","liquid":"sıvı","gas":"gaz"}.get(phase,"bilinmeyen")
            summary_tr = (f"{name_tr}, sembolü {symbol} ve atom numarası {z} olan bir {TR_CATEGORY[cat]} elementtir. "
                          f"{b.get('period')}. periyotta ve {b.get('group')}. grupta yer alır. "
                          f"Standart koşullarda {state_tr} hâldedir.")
        hazard = p.get("hazard") or None
        if hazard:
            hazard = {k:hazard.get(k) for k in ("ghs","h","p","hazard","adr","nfpa") if hazard.get(k)}
        abundance = p.get("abundance") or {}
        ab = {k:(v.get("value") if isinstance(v,dict) else v) for k,v in abundance.items()}
        price = p.get("price") or {}
        props = p.get("properties") or []
        if dens_val is not None:
            dens_val = round(dens_val, 9)
        elements.append({
            "z": z, "symbol": symbol,
            "name": {"tr": name_tr, "en": name_en},
            "mass": p.get("standard_atomic_weight",{}).get("value") or b.get("atomic_mass"),
            "category": cat,
            "group": b.get("group"), "period": b.get("period"), "block": b.get("block"),
            "x": b.get("xpos"), "y": b.get("ypos"),
            "electronConfig": cfg, "electronConfigFull": cfg_full,
            "shells": p.get("shell") or b.get("shells"),
            "valence": (2 if z == 2 else
                        (b.get("group") if b.get("group") and b["group"] <= 2 else
                         (b["group"]-10 if b.get("group") and b["group"] >= 13 else
                          (b.get("group") if b.get("group") and 3 <= b["group"] <= 12 else 3)))),
            "oxidationStates": parse_oxidation(p.get("oxidation_state",""), ox.get(z,[]), ox_main.get(z,[])),
            "electronegativity": (p.get("negativity") or {}).get("pauling") or b.get("electronegativity_pauling"),
            "atomicRadius": rval("empirical"),
            "covalentRadius": rval("covalent"),
            "vdwRadius": rval("vdw"),
            "ionizationEnergies": [round(x,4) for x in ion[:8]],
            "electronAffinity": ea_ev,
            "melting": melt, "boiling": boil,
            "density": dens_val, "densityUnit": "g/cm³",
            "phase": phase,
            "crystal": p.get("crystal_structure"),
            "magnetic": p.get("magnetic_ordering"),
            "thermalConductivity": num("heat.thermal_conductivity"),
            "molarHeat": num("heat.heat_capacity"),
            "soundSpeed": num("sound_speed"),
            "abundance": {k:ab.get(k) for k in ("universe","crust","water","human","sun","meteorite") if ab.get(k) is not None},
            "discovery": {"year": year, "by": by},
            "appearanceEn": appearance,
            "summary": {"tr": summary_tr, "en": summary_en},
            "image": (p.get("image") or {}).get("url") or (b.get("image") or {}).get("url"),
            "spectrum": spectra.get(symbol.lower()) or None,
            "isotopes": build_isotopes(z, isotopes),
            "hazard": hazard,
            "radioactive": bool(p.get("radioactive") or b.get("radioactive")),
            "natural": "natural" in props or "native" in props,
            "price": price.get("value") if isinstance(price,dict) else price,
            "cas": next((c.get("value") for c in (p.get("classification",{}) or {}).get("cas",[])), None),
            "era": p.get("era"),
            "predicted": cat == "unknown" or (z >= 109),
        })
    meta = {
        "count": len(elements),
        "generated": time.strftime("%Y-%m-%d"),
        "sources": [
            "Bowserinator/Periodic-Table-JSON (MIT/CC BY-SA)",
            "pse-info.de / komed3/periodic-table (MIT)",
            "lmmentel/mendeleev-data (MIT)",
            "Turkish Wikipedia (CC BY-SA 4.0)",
        ],
    }
    out = {"meta": meta, "elements": elements}
    path = os.path.join(DATA, "elements.json")
    json.dump(out, open(path,"w",encoding="utf-8"), ensure_ascii=False, separators=(",",":"))
    js_path = os.path.join(DATA, "elements.js")
    with open(js_path, "w", encoding="utf-8") as f:
        f.write("/* Generated by scripts/build_data.py — do not edit by hand. */\n")
        f.write("window.PERIODIC_DATA = ")
        json.dump(out, f, ensure_ascii=False, separators=(",",":"))
        f.write(";\n")
    size = os.path.getsize(path)/1024
    print(f"Wrote {path} ({size:.0f} KB), {len(elements)} elements")
    print(f"Wrote {js_path} ({os.path.getsize(js_path)/1024:.0f} KB)")
    missing = [z for z in range(1,119) if str(z) not in tr_summaries]
    print("TR summaries missing:", missing)

if __name__ == "__main__":
    build()
