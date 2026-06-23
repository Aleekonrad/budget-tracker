import { useState, useEffect, useMemo } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const EXPENSE_CATEGORIES = [
  { name: "Housing", color: "#6366f1" },
  { name: "Food", color: "#10b981" },
  { name: "Transport", color: "#f59e0b" },
  { name: "Utilities", color: "#3b82f6" },
  { name: "Entertainment", color: "#ec4899" },
  { name: "Health", color: "#ef4444" },
  { name: "Shopping", color: "#8b5cf6" },
  { name: "Other", color: "#64748b" },
];
const INCOME_CATEGORIES = ["Salary", "Freelance", "Investment", "Other"];
const COLOR_OF = Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c.name, c.color]));

const BUDGETS = {
  Housing: 1200, Food: 500, Transport: 200, Utilities: 250,
  Entertainment: 200, Health: 150, Shopping: 250, Other: 150,
};

const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const monthKey = (iso) => iso.slice(0, 7);
const monthLabel = (key) => {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString("en-US", { month: "short", year: "numeric" });
};
const uid = () => Math.random().toString(36).slice(2, 10);

function seedData() {
  const now = new Date();
  const rows = [];
  for (let back = 3; back >= 0; back--) {
    const d = new Date(now.getFullYear(), now.getMonth() - back, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    rows.push({ id: uid(), type: "income", category: "Salary", amount: 3200, date: `${ym}-01`, note: "Monthly pay" });
    rows.push({ id: uid(), type: "income", category: "Freelance", amount: 450 + back * 60, date: `${ym}-12`, note: "Side project" });
    rows.push({ id: uid(), type: "expense", category: "Housing", amount: 1150, date: `${ym}-03`, note: "Rent" });
    rows.push({ id: uid(), type: "expense", category: "Food", amount: 380 + back * 25, date: `${ym}-08`, note: "Groceries + dining" });
    rows.push({ id: uid(), type: "expense", category: "Transport", amount: 120, date: `${ym}-09`, note: "Transit + fuel" });
    rows.push({ id: uid(), type: "expense", category: "Utilities", amount: 210, date: `${ym}-15`, note: "Power, water, internet" });
    rows.push({ id: uid(), type: "expense", category: "Entertainment", amount: 90 + back * 20, date: `${ym}-18`, note: "Streaming + outings" });
    rows.push({ id: uid(), type: "expense", category: "Shopping", amount: 140, date: `${ym}-22`, note: "Clothes" });
  }
  return rows;
}

const STORAGE_KEY = "budget-tracker-v1";
function loadTx() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) { /* storage unavailable (e.g. preview) */ }
  return seedData();
}

export default function App() {
  const [tx, setTx] = useState(loadTx);
  const today = new Date();
  const currentKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = useState(currentKey);
  const [form, setForm] = useState({
    type: "expense", category: "Food", amount: "", date: today.toISOString().slice(0, 10), note: "",
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tx)); } catch (_) {}
  }, [tx]);

  const months = useMemo(() => {
    const set = new Set(tx.map((t) => monthKey(t.date)));
    set.add(currentKey);
    return [...set].sort().reverse();
  }, [tx, currentKey]);

  const inMonth = useMemo(() => tx.filter((t) => monthKey(t.date) === month), [tx, month]);
  const income = inMonth.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = inMonth.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = income - expenses;
  const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;

  const byCategory = useMemo(() => {
    const map = {};
    inMonth.filter((t) => t.type === "expense").forEach((t) => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [inMonth]);

  const monthlySeries = useMemo(() => {
    return [...months].reverse().slice(-6).map((m) => {
      const rows = tx.filter((t) => monthKey(t.date) === m);
      return {
        month: monthLabel(m).replace(/ \d{4}/, ""),
        Income: rows.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
        Expenses: rows.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [tx, months]);

  function addTx() {
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0 || !form.date) return;
    setTx((prev) => [{ id: uid(), type: form.type, category: form.category, amount, date: form.date, note: form.note.trim() }, ...prev]);
    setForm((f) => ({ ...f, amount: "", note: "" }));
  }
  function removeTx(id) { setTx((prev) => prev.filter((t) => t.id !== id)); }

  const categoryOptions = form.type === "expense" ? EXPENSE_CATEGORIES.map((c) => c.name) : INCOME_CATEGORIES;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-5 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">B</div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Budget Tracker</h1>
              <p className="text-sm text-slate-500">Track income, expenses, and savings at a glance</p>
            </div>
          </div>
          <select value={month} onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium shadow-sm">
            {months.map((m) => (<option key={m} value={m}>{monthLabel(m)}</option>))}
          </select>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-6 space-y-6">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card label="Income" value={fmt(income)} accent="text-emerald-600" />
          <Card label="Expenses" value={fmt(expenses)} accent="text-rose-600" />
          <Card label="Balance" value={fmt(balance)} accent={balance >= 0 ? "text-slate-900" : "text-rose-600"} />
          <Card label="Savings Rate" value={`${savingsRate}%`} accent="text-indigo-600" />
        </section>

        <section className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-3">Spending by Category</h2>
            {byCategory.length === 0 ? (<Empty text="No expenses this month yet." />) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                    {byCategory.map((d) => (<Cell key={d.name} fill={COLOR_OF[d.name] || "#64748b"} />))}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-3">Income vs. Expenses</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend />
                <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4">Budget Progress ({monthLabel(month)})</h2>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
            {EXPENSE_CATEGORIES.map((c) => {
              const spent = byCategory.find((b) => b.name === c.name)?.value || 0;
              const limit = BUDGETS[c.name] || 0;
              const pct = limit ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
              const over = spent > limit;
              return (
                <div key={c.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{c.name}</span>
                    <span className={over ? "text-rose-600 font-semibold" : "text-slate-500"}>{fmt(spent)} / {fmt(limit)}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: over ? "#ef4444" : c.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm lg:col-span-1">
            <h2 className="font-semibold text-slate-900 mb-4">Add Transaction</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {["expense", "income"].map((t) => (
                  <button key={t}
                    onClick={() => setForm((f) => ({ ...f, type: t, category: t === "expense" ? "Food" : "Salary" }))}
                    className={`py-2 rounded-lg text-sm font-medium border ${form.type === t ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-300"}`}>
                    {t === "expense" ? "Expense" : "Income"}
                  </button>
                ))}
              </div>
              <input type="number" placeholder="Amount" value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white">
                {categoryOptions.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
              <input type="date" value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <input type="text" placeholder="Note (optional)" value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <button onClick={addTx} className="w-full py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">Add</button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm lg:col-span-2">
            <h2 className="font-semibold text-slate-900 mb-4">Transactions ({monthLabel(month)})</h2>
            {inMonth.length === 0 ? (<Empty text="Nothing recorded this month." />) : (
              <ul className="divide-y divide-slate-100">
                {[...inMonth].sort((a, b) => b.date.localeCompare(a.date)).map((t) => (
                  <li key={t.id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.type === "income" ? "#10b981" : (COLOR_OF[t.category] || "#64748b") }} />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{t.category}{t.note ? <span className="text-slate-400 font-normal"> &middot; {t.note}</span> : null}</p>
                        <p className="text-xs text-slate-400">{t.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-semibold ${t.type === "income" ? "text-emerald-600" : "text-slate-700"}`}>
                        {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                      </span>
                      <button onClick={() => removeTx(t.id)} className="text-slate-300 hover:text-rose-500 text-lg leading-none">&times;</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <footer className="text-center text-xs text-slate-400 pt-2 pb-6">
          Built with React, Recharts &amp; Tailwind CSS &middot; Alessandro Konrad Tosto
        </footer>
      </main>
    </div>
  );
}

function Card({ label, value, accent }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent}`}>{value}</p>
    </div>
  );
}

function Empty({ text }) {
  return <div className="h-48 flex items-center justify-center text-sm text-slate-400">{text}</div>;
}
