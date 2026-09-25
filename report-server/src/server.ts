import "dotenv/config";
import express from "express";
import cors from "cors";
import { exec, ExecException } from "child_process";
import path from "path";
import fs from "fs";
import https from "https";
import mongoose from "mongoose";

const app = express();

app.use(cors());
app.use(express.json());

const playwrightPath = path.resolve(
  __dirname,
  "../../e2e"
);


const localReportPath = path.join(
  playwrightPath,
  "reports",
  "local",
  "results.json"
);



mongoose
  .connect(process.env.MONGODB_URI as string)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const reportSchema = new mongoose.Schema(
  {
    source: { type: String, required: true, unique: true },
    report: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

const historySchema = new mongoose.Schema(
  {
    source: { type: String, required: true, unique: true },
    history: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true },
);

const ReportModel = mongoose.model("Report", reportSchema);
const HistoryModel = mongoose.model("History", historySchema);

type SourceData = {
  report: any | null;
  reportUpdatedAt: Date | null;
  history: any[];
};


const emptySourceData = (): SourceData => ({
  report: null,
  reportUpdatedAt: null,
  history: [],
});

const store: Record<string, SourceData> = {
  local: emptySourceData(),
  github: emptySourceData(),
};

async function loadStore() {
  const reports = await ReportModel.find({});

  for (const r of reports) {
    if (!store[r.source]) {
      store[r.source] = emptySourceData();
    }
    store[r.source].report = r.report;
    store[r.source].reportUpdatedAt =
      (r as any).updatedAt ?? null;
  }

  const histories = await HistoryModel.find({});

  for (const h of histories) {
    if (!store[h.source]) {
      store[h.source] = emptySourceData();
    }
    store[h.source].history = h.history;
  }

  console.log(
    "Store завантажено з MongoDB:",
    Object.keys(store),
  );
}

async function saveReport(source: string, report: any) {
  if (!store[source]) {
    store[source] = emptySourceData();
  }

  const now = new Date();

  store[source].report = report;
  store[source].reportUpdatedAt = now;

  await ReportModel.findOneAndUpdate(
    { source },
    { source, report },
    { upsert: true },
  );
}

async function saveHistory(source: string, history: any[]) {
  if (!store[source]) {
    store[source] = emptySourceData();
  }
  store[source].history = history;

  await HistoryModel.findOneAndUpdate(
    { source },
    { source, history },
    { upsert: true },
  );
}

function getReport(source: string): any | null {
  return store[source]?.report ?? null;
}

function getReportUpdatedAt(source: string): Date | null {
  return store[source]?.reportUpdatedAt ?? null;
}

function getHistory(source: string): any[] {
  return store[source]?.history ?? [];
}

app.get("/api/results", (req, res) => {

  const source =
    (
      req.query.source ??
      "local"
    ).toString();

  if (source === "all") {

    const localReport = getReport("local");
    const githubReport = getReport("github");

    const localPassed =
      localReport?.stats?.expected ?? 0;

    const localFailed =
      localReport?.stats?.unexpected ?? 0;

    const githubPassed =
      githubReport?.stats?.expected ?? 0;

    const githubFailed =
      githubReport?.stats?.unexpected ?? 0;

    const passedTests =
      localPassed + githubPassed;

    const failedTests =
      localFailed + githubFailed;

    return res.json({
      totalTests:
        passedTests + failedTests,

      passedTests,

      failedTests,

      lastRun: "All Sources",
    });
  }

  try {

    const report = getReport(source);

    if (!report) {
      return res.json({
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        lastRun: "Ei raporttia",
      });
    }

    const updatedAt = getReportUpdatedAt(source);

    return res.json({
      totalTests:
        (report.stats?.expected ?? 0) +
        (report.stats?.unexpected ?? 0),

      passedTests:
        report.stats?.expected ?? 0,

      failedTests:
        report.stats?.unexpected ?? 0,

      lastRun: updatedAt
        ? updatedAt.toLocaleString("fi-FI")
        : "Ei raporttia",
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
    });
  }
});

app.get("/api/history", (req, res) => {

  const source =
    (
      req.query.source ??
      "local"
    ).toString();

  if (source === "all") {
    return res.json([
      ...getHistory("local"),
      ...getHistory("github"),
    ]);
  }

  try {
    return res.json(getHistory(source));
  } catch (error) {

    console.error(error);

    return res.status(500).json([]);
  }
});

app.get("/api/results/failed-tests", (req, res) => {

const source =
  (
    req.query.source ??
    "local"
  ).toString();

  try {

    const report = getReport(source);

    const failedTests: any[] = [];

    const walkSuites = (suites: any[]) => {
      for (const suite of suites) {
        if (suite.specs) {
          for (const spec of suite.specs) {
            if (!spec.ok) {
              const test = spec.tests?.[0];
              const result = test?.results?.[0];

              failedTests.push({
                name: spec.title,
                error: (
              result?.error?.message ??
                 'Unknown error'
                ).replace(
                   /\u001b\[[0-9;]*m/g,
                   ""
                )
              });
            }
          }
        }

        if (suite.suites) {
          walkSuites(suite.suites);
        }
      }
    };

    walkSuites(report?.suites ?? []);

    res.json(failedTests);
  } catch (error) {
    console.error(error);
    res.status(500).json([]);
  }
});

app.post("/api/history/delete", async (req, res) => {
  try {
    const ids = req.body.ids as number[];

    const source =
      (req.body.source ?? "local").toString();

    let history = getHistory(source);

    history = history.filter(
      (item: any) => !ids.includes(item.id)
    );

    await saveHistory(source, history);

    res.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
    });
  }
});


app.get("/api/results/slowest-tests", (req, res) => {

  const source =
  (
    req.query.source ??
    "local"
  ).toString();

  try {
    const report = getReport(source);

    const tests: any[] = [];

    const walkSuites = (suites: any[]) => {
      for (const suite of suites) {
        if (suite.specs) {
          for (const spec of suite.specs) {
            const test = spec.tests?.[0];
            const result = test?.results?.[0];

            tests.push({
              name: spec.title,
              duration:
                result?.duration ?? 0,
            });
          }
        }

        if (suite.suites) {
          walkSuites(suite.suites);
        }
      }
    };

    walkSuites(report?.suites ?? []);

    tests.sort(
      (a, b) =>
        b.duration - a.duration
    );

    res.json(
      tests.slice(0, 5)
    );
  } catch (error) {
    console.error(error);
    res.status(500).json([]);
  }
});

app.get(
  '/api/latest-failure-screenshot',
  (req, res) => {

    const testResultsPath =
      path.join(
        playwrightPath,
        'test-results',
      );

    if (
      !fs.existsSync(
        testResultsPath,
      )
    ) {
      return res
        .status(404)
        .send(
          'No screenshots found',
        );
    }

    const screenshots: string[] = [];

    const walk = (
      directory: string,
    ) => {

      const files =
        fs.readdirSync(directory);

      for (const file of files) {

        const fullPath =
          path.join(
            directory,
            file,
          );

        const stat =
          fs.statSync(
            fullPath,
          );

        if (stat.isDirectory()) {
          walk(fullPath);
        }

        if (
          file.endsWith('.png')
        ) {
          screenshots.push(
            fullPath,
          );
        }
      }
    };

    walk(testResultsPath);

    if (
      screenshots.length === 0
    ) {
      return res
        .status(404)
        .send(
          'No screenshots found',
        );
    }

    screenshots.sort(
      (a, b) =>
        fs.statSync(b).mtimeMs -
        fs.statSync(a).mtimeMs,
    );

    return res.sendFile(
      screenshots[0],
    );
  },
);

app.get(
  "/api/github/latest-run",
  async (req, res) => {

    try {

      const owner =
        "solved13";

      const repo =
        "verkkokauppa";

      const token =
        process.env.GITHUB_TOKEN;

      const response =
        await fetch(
          `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=1`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      const data =
        await response.json();

      const run =
        data.workflow_runs?.[0];

      return res.json({
        status:
          run?.status ??
          "unknown",

        conclusion:
          run?.conclusion ??
          "unknown",

        created_at:
          run?.created_at,
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
      });
    }
  },
);

app.post(
  "/api/run-github-tests",
  async (req, res) => {
    try {

      const owner = "solved13";
      const repo = "verkkokauppa";
      const workflow =
        "e2e-tests.yml";

      const token =
        process.env.GITHUB_TOKEN;

      const body =
        JSON.stringify({
          ref: "main",
        });

      const request =
        https.request(
          {
            hostname:
              "api.github.com",

            path:
              `/repos/${owner}/${repo}/actions/workflows/${workflow}/dispatches`,

            method: "POST",

            headers: {
              Authorization:
                `Bearer ${token}`,

              Accept:
                "application/vnd.github+json",

              "Content-Type":
                "application/json",

              "Content-Length":
                body.length,

              "User-Agent":
                "TestDashboard",
            },
          },

          (response) => {

            if (
              response.statusCode ===
              204
            ) {
              return res.json({
                success: true,
                message:
                  "GitHub Actions workflow started",
              });
            }

            return res.status(500).json({
              success: false,
            });
          },
        );

      request.write(body);

      request.end();

    } catch (error) {

      console.error(error);

      return res.status(500).json({
        success: false,
      });
    }
  },
);

app.post("/api/run-tests", (req, res) => {

  console.log(
    "Playwright testit käynnistetään..."
  );

  exec(
    "npx playwright test",
    {
      cwd: playwrightPath,
      windowsHide: false,
    },

    async (
      error: ExecException | null,
      stdout: string,
      stderr: string
    ) => {

      console.log(stdout);
      console.log(stderr);

      if (fs.existsSync(localReportPath)) {

        try {

          const report = JSON.parse(
            fs.readFileSync(
              localReportPath,
              "utf8"
            )
          );

          const totalTests =
            (report.stats?.expected ?? 0) +
            (report.stats?.unexpected ?? 0);

          const passedTests =
            report.stats?.expected ?? 0;

          const failedTests =
            report.stats?.unexpected ?? 0;

          let history: any[] = getHistory("local");

          const failedTestsDetails: any[] = [];
const slowestTests: any[] = [];

const walkSuites = (suites: any[]) => {
  for (const suite of suites) {

    if (suite.specs) {
      for (const spec of suite.specs) {

        const test =
          spec.tests?.[0];

        const result =
          test?.results?.[0];

        if (!result) {
          continue;
        }

        if (!spec.ok) {
          failedTestsDetails.push({
            name: spec.title,

            error: (
              result?.error?.message ??
              "Unknown error"
            ).replace(
              /\u001b\[[0-9;]*m/g,
              "",
            ),
          });
        }

        slowestTests.push({
          name: spec.title,
          duration:
            result.duration ?? 0,
        });
      }
    }

    if (suite.suites) {
      walkSuites(
        suite.suites,
      );
    }
  }
};

walkSuites(report.suites);

slowestTests.sort(
  (a, b) =>
    b.duration -
    a.duration,
);

history.push({
  id: Date.now(),

  source: "local",

  date:
    new Date()
      .toLocaleString(
        "fi-FI",
      ),

  totalTests,
  passedTests,
  failedTests,

  duration:
    Math.round(
      report.stats?.duration ?? 0,
    ),

  failedTestsDetails,

  slowestTests:
    slowestTests.slice(
      0,
      5,
    ),
});

if (history.length > 10) {
  history = history.slice(-10);
}
          await saveReport("local", report);
          await saveHistory("local", history);

        } catch (historyError) {

          console.error(
            "Historian tallennus epäonnistui"
          );

          console.error(historyError);
        }
      }

      if (error) {

        console.log(
          "Testeissä epäonnistumisia."
        );

        return res.json({
          success: true,
          message:
            "Testiajo suoritettu, osa testeistä epäonnistui",
        });
      }

      return res.json({
        success: true,
        message:
          "Playwright testit suoritettu",
      });
    }
  );
});

app.post(
  "/api/github/import",
  async (req, res) => {

    try {

      const report =
        req.body;

      await saveReport("github", report);

      const passedTests =
        report.stats?.expected ?? 0;

      const failedTests =
        report.stats?.unexpected ?? 0;

      let history: any[] = getHistory("github");

      history.push({
        id: Date.now(),

        source: "github",

        date:
          new Date()
            .toLocaleString(
              "fi-FI",
            ),

        totalTests:
          passedTests +
          failedTests,

        passedTests,

        failedTests,

        duration:
          Math.round(
            report.stats
              ?.duration ?? 0,
          ),
      });

      if (history.length > 10) {
        history = history.slice(-10);
      }

      await saveHistory("github", history);

      return res.json({
        success: true,
      });

    } catch (error) {

      console.error(error);

      return res.status(500).json({
        success: false,
      });
    }
  },
);

const PORT = process.env.PORT
  ? Number(process.env.PORT)
  : 3000;

async function start() {
  await loadStore();

  app.listen(PORT, () => {
    console.log(
      `Server running on port ${PORT}`
    );
  });
}

start();