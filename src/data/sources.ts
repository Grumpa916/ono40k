/** Rules references. Check 40k.app first when a datasheet, points value, or detachment looks wrong. */
export const RULE_SOURCES = [
  {
    name: "40k.app",
    href: "https://www.40k.app/",
    primary: true,
    note: "Datasheets, points, and detachments",
  },
  {
    name: "BSData 11th",
    href: "https://github.com/BSData/wh40k-11e",
    primary: false,
    note: "Automated profile and points check",
  },
] as const;
