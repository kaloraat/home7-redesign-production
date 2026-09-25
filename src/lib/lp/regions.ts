export type RegionKey = "all" | "liverpool" | "campbelltown" | "parramatta";

export const REGION_KEYS = ["liverpool", "campbelltown", "parramatta"] as const;

type Region = { name: string; label: string; suburbs: string[] };

const LIVERPOOL = ["Liverpool", "Casula", "Prestons", "Edmondson Park", "Moorebank", "Hoxton Park", "West Hoxton", "Green Valley", "Austral", "Leppington", "Carnes Hill", "Chipping Norton", "Wattle Grove", "Middleton Grange", "Cecil Hills", "Lurnea", "Hinchinbrook", "Horningsea Park", "Warwick Farm"];
const CAMPBELLTOWN = ["Campbelltown", "Ingleburn", "Minto", "Leumeah", "Macquarie Fields", "Glenfield", "Ambarvale", "Rosemeadow", "St Helens Park", "Bradbury", "Eagle Vale", "Raby", "St Andrews", "Glen Alpine", "Denham Court"];
const PARRAMATTA = ["Parramatta", "North Parramatta", "Harris Park", "Westmead", "Granville", "Rosehill", "Rydalmere", "Ermington", "Dundas", "Carlingford", "Epping", "Winston Hills", "Northmead", "Oatlands", "Telopea", "Wentworth Point", "Toongabbie"];

export const REGIONS: Record<RegionKey, Region> = {
  all: {
    name: "Liverpool, Campbelltown & Parramatta",
    label: "Liverpool, Campbelltown and Parramatta",
    suburbs: [...new Set([...LIVERPOOL, ...CAMPBELLTOWN, ...PARRAMATTA])],
  },
  liverpool: { name: "Liverpool", label: "the Liverpool area", suburbs: LIVERPOOL },
  campbelltown: { name: "Campbelltown", label: "the Campbelltown area", suburbs: CAMPBELLTOWN },
  parramatta: { name: "Parramatta", label: "the Parramatta area", suburbs: PARRAMATTA },
};

export function isRegionKey(value: string): value is Exclude<RegionKey, "all"> {
  return (REGION_KEYS as readonly string[]).includes(value);
}
