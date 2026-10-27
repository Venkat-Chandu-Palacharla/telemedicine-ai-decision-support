import { describe, expect, it } from "vitest";
import { diseaseConfigs, factorActivation } from "../src/models/diseaseConfig.js";

describe("factorActivation", () => {
  it("scales small Parkinson's voice thresholds using their actual magnitude", () => {
    const voiceJitter = diseaseConfigs.parkinsons.factors.find(
      (factor) => factor.id === "voiceJitter",
    );

    if (!voiceJitter) {
      throw new Error("Parkinson's voice jitter factor is not configured");
    }

    expect(factorActivation(0.007, voiceJitter)).toBeCloseTo(0.5);
    expect(factorActivation(0.014, voiceJitter)).toBeCloseTo(
      1 / (1 + Math.exp(-3)),
    );
  });

  it("increases activation in the configured risk direction", () => {
    const lowerIsRiskier = {
      id: "example",
      label: "Example",
      threshold: 10,
      weight: 1,
      direction: "lower" as const,
    };

    expect(factorActivation(5, lowerIsRiskier)).toBeGreaterThan(
      factorActivation(15, lowerIsRiskier),
    );
  });
});

describe("heuristic model metadata", () => {
  it("does not describe heuristic scores as calibrated", () => {
    for (const disease of ["heart-disease", "diabetes", "hypertension"] as const) {
      const config = diseaseConfigs[disease];
      expect(config.family).toBe("Rule-based heuristic scoring");
      expect(config.methodology.toLowerCase()).not.toContain("calibrated logistic");
    }
  });
});
