import { AnalysisReport } from "../types";

/** Minimal SARIF 2.1.0 for machine-readable issue lists. */
export function writeSarifReport(report: AnalysisReport): void {
  const rules: { id: string; shortDescription: { text: string } }[] = [];
  const results: {
    ruleId: string;
    message: { text: string };
    level: "warning";
    locations: [{ physicalLocation: { artifactLocation: { uri: string } } }];
  }[] = [];

  let n = 0;
  const cats = report.score.categories;
  const entries: [string, typeof cats.build][] = [
    ["build", cats.build],
    ["deployment", cats.deployment],
    ["environment", cats.environment],
    ["documentation", cats.documentation],
    ["openSource", cats.openSource],
  ];

  for (const [prefix, cat] of entries) {
    for (const issue of cat.issues) {
      const id = `repopilot.${prefix}.${n++}`;
      rules.push({ id, shortDescription: { text: issue } });
      results.push({
        ruleId: id,
        message: { text: issue },
        level: "warning",
        locations: [{ physicalLocation: { artifactLocation: { uri: report.repoPath } } }],
      });
    }
  }

  const sarif = {
    $schema: "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "RepoPilot",
            version: "0.1.0",
            informationUri: "https://github.com/your-org/repopilot",
            rules,
          },
        },
        results,
      },
    ],
  };

  console.log(JSON.stringify(sarif, null, 2));
}
