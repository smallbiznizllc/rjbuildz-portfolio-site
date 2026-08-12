/**
 * Public feed ordering: publishedAt DESC, then sortOrder ASC, then id ASC.
 * createdAt must never influence public list order.
 */

import { describe, expect, it } from "vitest";
import {
  comparePublicOrder,
  sortByPublicOrder,
} from "@/lib/utils/ordering";

describe("comparePublicOrder / sortByPublicOrder", () => {
  it("sorts by publishedAt descending (not createdAt)", () => {
    const postA = {
      id: "post-a",
      publishedAt: new Date("2025-01-10T14:00:00.000Z"),
      sortOrder: 0,
      createdAt: new Date("2026-08-10T16:00:00.000Z"),
    };
    const postB = {
      id: "post-b",
      publishedAt: new Date("2025-02-15T15:00:00.000Z"),
      sortOrder: 0,
      createdAt: new Date("2026-08-10T16:00:00.000Z"),
    };
    const postC = {
      id: "post-c",
      publishedAt: new Date("2024-12-01T18:00:00.000Z"),
      sortOrder: 0,
      createdAt: new Date("2026-08-10T16:00:00.000Z"),
    };

    const ordered = sortByPublicOrder([postA, postC, postB]);
    expect(ordered.map((p) => p.id)).toEqual(["post-b", "post-a", "post-c"]);
  });

  it("uses sortOrder ASC when publishedAt ties", () => {
    const day = new Date("2025-03-01T12:00:00.000Z");
    const a = { id: "z-id", publishedAt: day, sortOrder: 2 };
    const b = { id: "a-id", publishedAt: day, sortOrder: 0 };
    const c = { id: "m-id", publishedAt: day, sortOrder: 1 };

    expect(sortByPublicOrder([a, b, c]).map((p) => p.id)).toEqual([
      "a-id",
      "m-id",
      "z-id",
    ]);
  });

  it("uses id ASC when publishedAt and sortOrder tie", () => {
    const day = new Date("2025-03-01T12:00:00.000Z");
    const a = { id: "post-z", publishedAt: day, sortOrder: 1 };
    const b = { id: "post-a", publishedAt: day, sortOrder: 1 };

    expect(comparePublicOrder(a, b)).toBeGreaterThan(0);
    expect(sortByPublicOrder([a, b]).map((p) => p.id)).toEqual([
      "post-a",
      "post-z",
    ]);
  });

  it("treats null publishedAt as oldest", () => {
    const published = {
      id: "live",
      publishedAt: new Date("2024-01-01T00:00:00.000Z"),
      sortOrder: 0,
    };
    const draftish = { id: "null-date", publishedAt: null, sortOrder: 0 };

    expect(sortByPublicOrder([draftish, published]).map((p) => p.id)).toEqual([
      "live",
      "null-date",
    ]);
  });
});
