export const REGIONS = [
  'Brust',
  'Rücken',
  'Schultern',
  'Bizeps',
  'Trizeps',
  'Beine',
  'Gesäß',
  'Waden',
  'Bauch',
  'Unterarme',
] as const

export type Region = (typeof REGIONS)[number]

/** Eingebauter Übungskatalog: Name (Gerät) → Körperregion */
const CATALOG_DATA: Record<Region, string[]> = {
  Brust: [
    'Bankdrücken (Langhantel)',
    'Bankdrücken (Kurzhanteln)',
    'Bankdrücken (Multipresse)',
    'Schrägbankdrücken (Langhantel)',
    'Schrägbankdrücken (Kurzhanteln)',
    'Schrägbankdrücken (Multipresse)',
    'Negativbankdrücken (Langhantel)',
    'Brustpresse (Maschine)',
    'Schrägbank-Brustpresse (Maschine)',
    'Butterfly (Maschine)',
    'Fliegende (Kurzhanteln)',
    'Cable Crossover (Kabelzug)',
    'Liegestütze (Körpergewicht)',
    'Dips (Körpergewicht)',
    'Dips mit Unterstützung (Maschine)',
  ],
  Rücken: [
    'Kreuzheben (Langhantel)',
    'Klimmzüge (Körpergewicht)',
    'Klimmzüge mit Unterstützung, Untergriff (Maschine)',
    'Klimmzüge mit Unterstützung, Obergriff (Maschine)',
    'Latziehen (Kabelzug)',
    'Latziehen eng (Kabelzug)',
    'Latziehen mit Untergriff (Kabelzug)',
    'Rudern vorgebeugt (Langhantel)',
    'Einarmiges Rudern (Kurzhantel)',
    'Rudern weit mit Neutralgriff (Kabelzug)',
    'Rudern eng (Kabelzug)',
    'Rudern (Maschine)',
    'T-Bar-Rudern (Langhantel)',
    'Überzüge (Kabelzug)',
    'Hyperextensions (Körpergewicht)',
    'Shrugs (Kurzhanteln)',
  ],
  Schultern: [
    'Schulterdrücken im Stehen (Langhantel)',
    'Schulterdrücken (Kurzhanteln)',
    'Schulterdrücken (Maschine)',
    'Schulterdrücken (Multipresse)',
    'Arnold Press (Kurzhanteln)',
    'Seitheben (Kurzhanteln)',
    'Seitheben (Kabelzug)',
    'Seitheben (Maschine)',
    'Frontheben (Kurzhanteln)',
    'Vorgebeugtes Seitheben (Kurzhanteln)',
    'Reverse Butterfly (Maschine)',
    'Face Pulls (Kabelzug)',
    'Aufrechtes Rudern (Langhantel)',
  ],
  Bizeps: [
    'Bizepscurls (Langhantel)',
    'Bizepscurls (Kurzhanteln)',
    'Bizepscurls (SZ-Stange)',
    'Bizepscurls (Kabelzug)',
    'Hammer Curls (Kurzhanteln)',
    'Hammer Curls (Kabelzug)',
    'Konzentrationscurls (Kurzhantel)',
    'Scottcurls (Maschine)',
    'Schrägbankcurls (Kurzhanteln)',
  ],
  Trizeps: [
    'Trizepsdrücken mit dem Seil (Kabelzug)',
    'Trizepsdrücken mit der Stange (Kabelzug)',
    'Überkopf-Trizepsdrücken (Kabelzug)',
    'Überkopf-Trizepsdrücken (Kurzhantel)',
    'French Press (SZ-Stange)',
    'Enges Bankdrücken (Langhantel)',
    'Dips (Maschine)',
    'Kickbacks (Kurzhantel)',
  ],
  Beine: [
    'Kniebeugen (Langhantel)',
    'Kniebeugen (Multipresse)',
    'Frontkniebeugen (Langhantel)',
    'Goblet Squats (Kurzhantel)',
    'Beinpresse (Maschine)',
    'Hackenschmidt-Kniebeugen (Maschine)',
    'Ausfallschritte (Kurzhanteln)',
    'Bulgarian Split Squats (Kurzhanteln)',
    'Beinstrecker (Maschine)',
    'Beinbeuger liegend (Maschine)',
    'Beinbeuger sitzend (Maschine)',
    'Rumänisches Kreuzheben (Langhantel)',
    'Rumänisches Kreuzheben (Kurzhanteln)',
    'Adduktoren (Maschine)',
  ],
  Gesäß: [
    'Hip Thrusts (Langhantel)',
    'Hip Thrusts (Maschine)',
    'Abduktoren (Maschine)',
    'Glute Kickbacks (Kabelzug)',
    'Glute Bridge (Körpergewicht)',
  ],
  Waden: [
    'Wadenheben stehend (Maschine)',
    'Wadenheben sitzend (Maschine)',
    'Wadenheben an der Beinpresse (Maschine)',
  ],
  Bauch: [
    'Bauchmaschine',
    'Crunches (Körpergewicht)',
    'Kabel-Crunches (Kabelzug)',
    'Beinheben hängend (Körpergewicht)',
    'Beinheben an der Dip-Station (Körpergewicht)',
    'Plank (Körpergewicht)',
    'Russian Twists (Körpergewicht)',
    'Ab Roller (Körpergewicht)',
  ],
  Unterarme: [
    'Handgelenkcurls (Langhantel)',
    'Reverse Curls (SZ-Stange)',
    "Farmer's Walk (Kurzhanteln)",
  ],
}

export interface CatalogEntry {
  name: string
  region: Region
}

export const CATALOG: CatalogEntry[] = REGIONS.flatMap((region) =>
  CATALOG_DATA[region].map((name) => ({ name, region })),
)

const byName = new Map(CATALOG.map((e) => [e.name.toLowerCase(), e.region]))

export const catalogRegion = (name: string): Region | undefined => byName.get(name.trim().toLowerCase())
