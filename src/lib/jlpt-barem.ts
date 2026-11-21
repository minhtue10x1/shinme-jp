import baremData from "../../JLPT-barem.json";
import type { MondaiType } from "@/lib/test-center-store";

export type JLPTSkill = "vocabulary" | "grammar" | "reading" | "listening";
export type JLPTLevelKey = "N5" | "N4" | "N3" | "N2" | "N1";

type MondaiConfig = {
  mondai: number;
  type: string;
  typical_questions: number;
  points_per_question: number;
};

type ScoringSection = {
  section_id: string;
  name: string;
  max_score: number;
  sectional_pass_mark: number;
  skills: Partial<Record<JLPTSkill, MondaiConfig[]>>;
};

type LevelConfig = {
  total_max: number;
  pass_mark: number;
  scoring_sections: ScoringSection[];
};

const LEVELS = baremData.levels as Record<JLPTLevelKey, LevelConfig>;

/**
 * Formats a compact, accurate JLPT barem reference table for Gemini's System Prompt.
 * If `levelHint` is a valid N5–N1 key, prioritizes that level's table to keep the prompt crisp.
 */
export function formatBaremForPrompt(levelHint?: string): string {
  const normalized = (levelHint || "").toUpperCase() as JLPTLevelKey;
  const targetLevels: JLPTLevelKey[] =
    normalized in LEVELS ? [normalized] : ["N5", "N4", "N3", "N2", "N1"];

  const lines: string[] = [];
  for (const lvl of targetLevels) {
    const cfg = LEVELS[lvl];
    lines.push(`Level ${lvl} (total_max=${cfg.total_max}, pass_mark=${cfg.pass_mark}):`);
    for (const sec of cfg.scoring_sections) {
      for (const [skill, mondais] of Object.entries(sec.skills) as [JLPTSkill, MondaiConfig[]][]) {
        const items = mondais
          .map((m) => `Mondai ${m.mondai} (${m.type}) = ${m.points_per_question}pt`)
          .join("; ");
        lines.push(`  - ${skill}: ${items}`);
      }
    }
  }
  return lines.join("\n");
}

/**
 * Deterministically resolves raw points for a question using JLPT-barem.json.
 * Falls back to mini-test defaults if not matching a standard JLPT Mondai:
 *   - Vocabulary / Grammar = 1
 *   - Short Reading = 2, Medium/Long Reading = 3
 *   - Listening = 2
 */
export function resolveQuestionPoints(params: {
  level?: string;
  skill?: string;
  mondaiNumber?: number;
  qType: MondaiType;
  passageText?: string;
  aiPoints?: number;
}): number {
  const lvl = (params.level || "").toUpperCase() as JLPTLevelKey;
  const skill = (params.skill || "").toLowerCase() as JLPTSkill;
  const mondaiNum = typeof params.mondaiNumber === "number" ? Math.floor(params.mondaiNumber) : NaN;

  // 1. Exact lookup from JLPT-barem.json when (level, skill, mondaiNumber) match
  if (lvl in LEVELS && !Number.isNaN(mondaiNum) && mondaiNum > 0) {
    const cfg = LEVELS[lvl];
    for (const sec of cfg.scoring_sections) {
      const skillList = sec.skills[skill];
      if (skillList) {
        const matched = skillList.find((m) => m.mondai === mondaiNum);
        if (matched) return matched.points_per_question;
      }
    }
  }

  // 2. Trust valid positive integer from AI if within reasonable raw-weight range (1..10)
  if (typeof params.aiPoints === "number" && Number.isInteger(params.aiPoints) && params.aiPoints >= 1 && params.aiPoints <= 10) {
    return params.aiPoints;
  }

  // 3. Mini-test / non-standard fallback rules
  if (skill === "listening" || params.qType === "choukai") return 2;
  if (skill === "reading" || params.qType === "dokkai") {
    const passageLen = (params.passageText || "").trim().length;
    return passageLen > 280 ? 3 : 2;
  }
  return 1;
}
