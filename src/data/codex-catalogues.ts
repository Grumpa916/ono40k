/** Community 11th-edition catalogues used by the in-app update check. 40k.app remains the rules reference. */
export const CATALOGUE_REPO = "https://raw.githubusercontent.com/BSData/wh40k-11e/main";

export const FACTION_CATALOGUES: Record<string, string[]> = {
  sm: ["Imperium - Space Marines.json"],
  um: ["Imperium - Ultramarines.json", "Imperium - Space Marines.json"],
  custodes: ["Imperium - Adeptus Custodes.json"],
  csm: ["Chaos - Chaos Space Marines.json"],
  nids: ["Tyranids.json"],
  tau: ["T'au Empire.json"],
};
