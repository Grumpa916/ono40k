import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { UnitDef } from "../data/types.ts";
import { diffCatalogue, parseCatalogue } from "./codex-catalogue.ts";

function sheet(name: string, points: number, stats: UnitDef["stats"], invuln?: number): UnitDef {
  return {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    role: "infantry",
    points,
    stats,
    keywords: [],
    ranged: [],
    melee: [],
    abilities: [],
    invuln,
  };
}

const profile = (name: string, line: string) => ({
  name,
  typeName: "Unit",
  characteristics: ["M", "T", "Sv", "W", "LD", "OC", "InSv"].map((stat, index) => ({
    name: stat,
    $text: line.split(",")[index] ?? "",
  })),
});

describe("parseCatalogue", () => {
  it("resolves a unit profile that is only linked from sharedProfiles", () => {
    const remote = parseCatalogue({
      catalogue: {
        sharedProfiles: [{ ...profile("Termagants", '6",3,5+,1,8+,2,'), id: "term-profile" }],
        sharedSelectionEntries: [
          {
            name: "Termagants",
            type: "unit",
            costs: [{ name: "pts", value: 60 }],
            selectionEntryGroups: [
              {
                selectionEntries: [{ infoLinks: [{ type: "profile", targetId: "term-profile" }] }],
              },
            ],
          },
        ],
      },
    });
    assert.equal(remote[0]?.statsKnown, true);
    assert.equal(remote[0]?.t, 3);
    assert.equal(remote[0]?.points, 60);
    assert.equal(remote[0]?.inv, null);
  });

  it("uses the body profile, not the attached vehicle or a disagreeing composite", () => {
    const remote = parseCatalogue({
      catalogue: {
        sharedSelectionEntries: [
          {
            name: "Outrider Squad",
            type: "unit",
            costs: [{ name: "pts", value: 70 }],
            profiles: [
              profile("Invader ATV", '12",5,3+,8,6+,2,'),
              profile("Outrider Squad", '12",5,3+,4,6+,2,'),
            ],
          },
          {
            name: "Wardens of Ultramar",
            type: "unit",
            costs: [{ name: "pts", value: 120 }],
            profiles: [
              profile("Ancient Gadriel", '6",4,3+,4,6+,1,'),
              profile("Gaius Silva", '6",3,4+,3,6+,1,'),
            ],
          },
          {
            name: "Bladeguard Veteran Squad",
            type: "unit",
            costs: [{ name: "pts", value: 80 }],
            selectionEntryGroups: [
              {
                selectionEntries: [
                  { profiles: [profile("Bladeguard Veteran", '6",4,3+,3,6+,1,4+')] },
                  { profiles: [profile("Bladeguard Veteran Sergeant", '6",4,3+,3,6+,1,4+')] },
                ],
              },
            ],
          },
        ],
      },
    });
    const outrider = remote.find((unit) => unit.name === "Outrider Squad");
    const wardens = remote.find((unit) => unit.name === "Wardens of Ultramar");
    const bladeguard = remote.find((unit) => unit.name === "Bladeguard Veteran Squad");
    assert.equal(outrider?.w, 4);
    assert.equal(wardens?.statsKnown, false);
    assert.equal(wardens?.points, 120);
    assert.equal(bladeguard?.t, 4);
    assert.equal(bladeguard?.inv, 4);

    const changes = diffCatalogue(
      [
        sheet("Outrider Squad", 80, { m: 12, t: 6, sv: 3, w: 4, ld: 6, oc: 2 }),
        sheet("Wardens of Ultramar", 90, { m: 6, t: 5, sv: 3, w: 3, ld: 6, oc: 2 }),
        sheet("Jump Pack Intercessor Squad", 80, { m: 12, t: 4, sv: 3, w: 2, ld: 6, oc: 1 }),
      ],
      [
        ...remote,
        ...parseCatalogue({
          catalogue: {
            sharedSelectionEntries: [
              {
                name: "Assault Intercessors with Jump Packs",
                type: "unit",
                costs: [{ name: "pts", value: 85 }],
                profiles: [profile("Assault Intercessors with Jump Packs", '12",4,3+,2,6+,1,')],
              },
            ],
          },
        }),
      ],
    );
    assert.deepEqual(
      changes.map((change) => `${change.name} ${change.label} ${change.from}->${change.to}`),
      ["Outrider Squad Toughness 6->5", "Outrider Squad Points 80->70", "Wardens of Ultramar Points 90->120", "Jump Pack Intercessor Squad Points 80->85"],
    );
  });
});
