"use client";

import React, { useMemo, useState } from "react";
import Papa from "papaparse";
import {
  Upload,
  Filter,
  LayoutDashboard,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  FileSpreadsheet,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

type Row = Record<string, string | number | null | undefined>;

type StatCardProps = {
  label: string;
  value: string;
  helper?: string;
};

type DataPreviewProps = {
  rows: Row[];
  columns: string[];
};

type SectionDashboardProps = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const COLORS = ["#2563eb", "#7c3aed", "#0f766e", "#ea580c", "#db2777", "#16a34a"];

function coerceNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const cleaned = String(value).replace(/[$,%\s,]/g, "");
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function inferNumericColumns(rows: Row[], columns: string[]): string[] {
  return columns.filter((col) => {
    const sample = rows
      .slice(0, 100)
      .map((r) => coerceNumber(r[col]))
      .filter((v): v is number => v !== null);

    return sample.length > 0 && sample.length >= Math.max(3, Math.floor(rows.slice(0, 100).length * 0.4));
  });
}

function inferCategoricalColumns(columns: string[], numericColumns: string[]): string[] {
  return columns.filter((col) => !numericColumns.includes(col));
}

function findYearColumn(columns: string[]): string {
  const preferred = columns.find((col) => /^(year|date|period|time)$/i.test(col));
  if (preferred) return preferred;
  return columns.find((col) => /year/i.test(col)) || "";
}

function getUniqueValues(rows: Row[], key: string): string[] {
  if (!key) return [];

  return Array.from(new Set(rows.map((r) => String(r[key] ?? "")).filter(Boolean))).sort((a, b) => {
    const an = Number(a);
    const bn = Number(b);
    if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
    return a.localeCompare(b);
  });
}

function aggregateData(
  rows: Row[],
  xKey: string,
  yKey: string,
  metricMode: "sum" | "avg"
): Array<Record<string, string | number>> {
  if (!xKey || !yKey) return [];

  const map = new Map<string, { [key: string]: string | number } & { value: number; count: number }>();

  for (const row of rows) {
    const x = row[xKey];
    const y = coerceNumber(row[yKey]);
    if (x === undefined || x === null || x === "" || y === null) continue;

    const bucket = String(x);
    if (!map.has(bucket)) {
      map.set(bucket, { [xKey]: bucket, value: 0, count: 0 });
    }

    const item = map.get(bucket)!;
    item.value += y;
    item.count += 1;
  }

  const metric = metricMode === "avg" ? "avg" : "value";

  return Array.from(map.values())
    .map((item) => ({ ...item, avg: item.count ? item.value / item.count : 0 }))
    .sort((a, b) => {
      const an = Number(a[xKey]);
      const bn = Number(b[xKey]);
      if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
      return String(a[xKey]).localeCompare(String(b[xKey]));
    })
    .map((item) => ({ ...item, metric: item[metric] as number }));
}

function summarize(rows: Row[], yKey: string) {
  const nums = rows.map((r) => coerceNumber(r[yKey])).filter((v): v is number => v !== null);
  if (!nums.length) return { total: 0, avg: 0, min: 0, max: 0 };

  const total = nums.reduce((a, b) => a + b, 0);
  return {
    total,
    avg: total / nums.length,
    min: Math.min(...nums),
    max: Math.max(...nums),
  };
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return Number(value).toLocaleString();
}

function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm">
      <CardContent className="p-5">
        <div className="text-sm text-slate-500">{label}</div>
        <div className="mt-1 text-2xl font-semibold text-slate-950">{value}</div>
        {helper ? <div className="mt-2 text-xs text-slate-500">{helper}</div> : null}
      </CardContent>
    </Card>
  );
}

function DataPreview({ rows, columns }: DataPreviewProps) {
  return (
    <div className="overflow-auto rounded-2xl border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            {columns.slice(0, 10).map((col) => (
              <th key={col} className="whitespace-nowrap px-4 py-3 text-left font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 20).map((row, idx) => (
            <tr key={idx} className="border-t border-slate-100">
              {columns.slice(0, 10).map((col) => (
                <td key={col} className="whitespace-nowrap px-4 py-3 text-slate-700">
                  {String(row[col] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionDashboard({ title, description, icon: Icon }: SectionDashboardProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [search, setSearch] = useState("");
  const [yearColumn, setYearColumn] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [xKey, setXKey] = useState("");
  const [yKey, setYKey] = useState("");
  const [chartStyle, setChartStyle] = useState("bar");
  const [metricMode, setMetricMode] = useState<"sum" | "avg">("sum");
  const [topN, setTopN] = useState("15");

  const numericColumns = useMemo(() => inferNumericColumns(rows, columns), [rows, columns]);
  const categoricalColumns = useMemo(() => inferCategoricalColumns(columns, numericColumns), [columns, numericColumns]);
  const yearValues = useMemo(() => getUniqueValues(rows, yearColumn), [rows, yearColumn]);

  const filteredRows = useMemo(() => {
    let next = rows;

    if (selectedYear !== "all" && yearColumn) {
      next = next.filter((row) => String(row[yearColumn] ?? "") === selectedYear);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      next = next.filter((row) =>
        Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(q))
      );
    }

    return next;
  }, [rows, yearColumn, selectedYear, search]);

  const chartData = useMemo(() => {
    const data = aggregateData(filteredRows, xKey, yKey, metricMode);
    const limit = Number(topN);
    return Number.isFinite(limit) && limit > 0 ? data.slice(0, limit) : data;
  }, [filteredRows, xKey, yKey, metricMode, topN]);

  const stats = useMemo(() => summarize(filteredRows, yKey), [filteredRows, yKey]);

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => {
        const parsed = Array.isArray(results.data) ? results.data : [];
        const cols = results.meta?.fields || Object.keys(parsed[0] || {});
        const inferredNumeric = inferNumericColumns(parsed, cols);
        const inferredCategorical = inferCategoricalColumns(cols, inferredNumeric);
        const detectedYear = findYearColumn(cols);
        const defaultDimension =
          inferredCategorical.find((col) => col !== detectedYear) || inferredCategorical[0] || cols[0] || "";
        const defaultMetric = inferredNumeric[0] || "";

        setRows(parsed);
        setColumns(cols);
        setYearColumn(detectedYear);
        setSelectedYear("all");
        setXKey(defaultDimension);
        setYKey(defaultMetric);
      },
      error: (error) => {
        console.error("CSV parse error", error);
      },
    });
  };

  const renderChart = () => {
    if (!chartData.length || !xKey || !yKey) {
      return (
        <div className="flex h-[360px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-slate-500">
          Upload a CSV and choose fields to display this section.
        </div>
      );
    }

    if (chartStyle === "line") {
      return (
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="metric" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (chartStyle === "area") {
      return (
        <ResponsiveContainer width="100%" height={360}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Area type="monotone" dataKey="metric" strokeWidth={2} fillOpacity={0.2} />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    if (chartStyle === "pie") {
      return (
        <ResponsiveContainer width="100%" height={360}>
          <PieChart>
            <Pie data={chartData} dataKey="metric" nameKey={xKey} outerRadius={120} label>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="metric" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card className="overflow-hidden rounded-[24px] border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Icon className="h-5 w-5" />
              {title}
            </CardTitle>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
          <Badge variant="secondary" className="rounded-full">
            Own CSV source
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-2xl border-slate-200 shadow-none">
            <CardHeader>
              <CardTitle className="text-lg">Data source</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label>
                <input type="file" accept=".csv" className="hidden" onChange={handleUpload} />
                <Button className="h-11 rounded-2xl px-5" asChild>
                  <span className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload CSV for this section
                  </span>
                </Button>
              </label>
              <div className="text-sm text-slate-600">
                {fileName ? (
                  <>
                    Loaded file: <span className="font-medium">{fileName}</span>
                  </>
                ) : (
                  "No CSV uploaded yet"
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <StatCard label="Rows" value={formatValue(filteredRows.length)} helper="After this section's filters" />
            <StatCard label="Columns" value={formatValue(columns.length)} helper="Detected from this CSV" />
            <StatCard label="Numeric fields" value={formatValue(numericColumns.length)} helper="Available metrics" />
            <StatCard
              label="Year filter"
              value={selectedYear === "all" ? "All years" : selectedYear}
              helper={yearColumn || "No year column selected"}
            />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
          <Card className="rounded-2xl border-slate-200 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5" />
                Section controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Search rows</Label>
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter this section's dataset"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label>Year column</Label>
                <Select value={yearColumn || "none"} onValueChange={(value) => setYearColumn(value === "none" ? "" : value)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select year column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {columns.map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Selected year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Choose year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All years</SelectItem>
                    {yearValues.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>X-axis</Label>
                <Select value={xKey || undefined} onValueChange={setXKey}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select a dimension" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoricalColumns.concat(columns.filter((c) => !categoricalColumns.includes(c))).map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Y-axis metric</Label>
                <Select value={yKey || undefined} onValueChange={setYKey}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select a metric" />
                  </SelectTrigger>
                  <SelectContent>
                    {numericColumns.map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Chart style</Label>
                <Select value={chartStyle} onValueChange={setChartStyle}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select a chart" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">Bar</SelectItem>
                    <SelectItem value="line">Line</SelectItem>
                    <SelectItem value="area">Area</SelectItem>
                    <SelectItem value="pie">Pie</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Metric mode</Label>
                <Select value={metricMode} onValueChange={(value: "sum" | "avg") => setMetricMode(value)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sum">Sum</SelectItem>
                    <SelectItem value="avg">Average</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Top categories</Label>
                <Input value={topN} onChange={(e) => setTopN(e.target.value)} className="rounded-xl" />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-2xl border-slate-200 shadow-none">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5" />
                  Visualization
                </CardTitle>
                <Badge variant="secondary" className="rounded-full">
                  {chartStyle}
                </Badge>
              </CardHeader>
              <CardContent>{renderChart()}</CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileSpreadsheet className="h-5 w-5" />
                  Data preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DataPreview rows={filteredRows} columns={columns} />
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900" suppressHydrationWarning>
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-10 md:py-14">
        <motion.div suppressHydrationWarning
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]"
        >
          <Card className="rounded-[28px] border-slate-200 bg-white/90 shadow-sm backdrop-blur">
            <CardContent className="space-y-6 p-8 md:p-10">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <LayoutDashboard className="h-4 w-4" />
                Next.js multi-file presentation dashboard
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-semibold leading-tight tracking-tight text-slate-950 md:text-6xl">
                  Present each section with its own CSV, controls, and charts.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                  Each section works independently, so you can upload a different dataset for each one and present them in the same clean Next.js interface.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[28px] border-slate-200 bg-slate-950 text-white shadow-sm">
            <CardContent className="flex h-full flex-col justify-between gap-8 p-8 md:p-10">
              <div className="space-y-4">
                <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">Flexible setup</Badge>
                <div className="text-2xl font-semibold leading-tight">Three sections now, easy to expand later.</div>
                <p className="text-sm leading-7 text-slate-300">
                  Every section has its own CSV upload, year selector, filters, chart settings, and preview table.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/5 p-4">
                  <div className="text-sm text-slate-300">Section 1</div>
                  <div className="mt-1 text-lg font-medium">CSV A</div>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <div className="text-sm text-slate-300">Section 2</div>
                  <div className="mt-1 text-lg font-medium">CSV B</div>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <div className="text-sm text-slate-300">Section 3</div>
                  <div className="mt-1 text-lg font-medium">CSV C</div>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <div className="text-sm text-slate-300">Future</div>
                  <div className="mt-1 text-lg font-medium">Add more sections</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Tabs defaultValue="section1" className="w-full">
          <TabsList className="flex h-auto flex-wrap gap-1 rounded-2xl bg-slate-100 p-1">
            <TabsTrigger value="section1" className="gap-2 rounded-xl">
              <BarChart3 className="h-4 w-4" /> Section 1
            </TabsTrigger>
            <TabsTrigger value="section2" className="gap-2 rounded-xl">
              <LineChartIcon className="h-4 w-4" /> Section 2
            </TabsTrigger>
            <TabsTrigger value="section3" className="gap-2 rounded-xl">
              <PieChartIcon className="h-4 w-4" /> Section 3
            </TabsTrigger>
          </TabsList>

          <TabsContent value="section1" className="mt-6">
            <SectionDashboard
              title="Section 1"
              description="Upload the first CSV and configure this section independently."
              icon={BarChart3}
            />
          </TabsContent>

          <TabsContent value="section2" className="mt-6">
            <SectionDashboard
              title="Section 2"
              description="Upload a different CSV here for your second view."
              icon={LineChartIcon}
            />
          </TabsContent>

          <TabsContent value="section3" className="mt-6">
            <SectionDashboard
              title="Section 3"
              description="Use a third CSV here for another angle or summary."
              icon={PieChartIcon}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
