import React, { useEffect, useState } from 'react';
import { RefreshCw, Search, Briefcase, CheckCircle2, AlertTriangle, TrendingUp, Sparkles } from 'lucide-react';

const SCRIPT_URL = process.env.REACT_APP_GOOGLE_SHEET_URL || "https://script.google.com/macros/s/AKfycbzt2XEOV5vzaLskfyIHcLQtN5dUbL1vwFksKtnUU7U4sqpIRSnWYQxWTOS3_lWIxUGk/exec";

export default function App() {
  const [data, setData] = useState({ metrics: {}, deals: [], jobs: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("jobs");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(SCRIPT_URL);
      const json = await res.json();
      if (json.status === "success") {
        setData(json);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredJobs = (data.jobs || []).filter(j => 
    String(j.client_name || '').toLowerCase().includes(search.toLowerCase()) ||
    String(j.company_name || '').toLowerCase().includes(search.toLowerCase()) ||
    String(j.job_owner || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="text-indigo-400" /> Sales Operations Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Connected to Google Sheets & HubSpot • Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
        <button 
          onClick={fetchData} 
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 rounded-xl font-semibold transition text-sm shadow-lg disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? "Syncing..." : "Sync Hubspot & Sheets"}
        </button>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
          <div className="flex justify-between items-center text-slate-400 text-sm">
            Total Meetings
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-3xl font-extrabold mt-2">{data.metrics?.totalMeetings || 0}</p>
        </div>
        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
          <div className="flex justify-between items-center text-slate-400 text-sm">
            Happened Meetings
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold mt-2 text-emerald-400">{data.metrics?.happenedMeetings || 0}</p>
        </div>
        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
          <div className="flex justify-between items-center text-slate-400 text-sm">
            Jobs Created
            <Briefcase className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-extrabold mt-2 text-blue-400">{data.metrics?.jobsCreated || 0}</p>
        </div>
        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
          <div className="flex justify-between items-center text-slate-400 text-sm">
            Conversion Rate
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold mt-2 text-amber-400">
            {((data.metrics?.conversionRate || 0) * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by client, company, or owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab("jobs")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${activeTab === "jobs" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}
          >
            Jobs Master ({(data.jobs || []).length})
          </button>
          <button 
            onClick={() => setActiveTab("deals")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${activeTab === "deals" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}
          >
            Deals Master ({(data.deals || []).length})
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          {activeTab === "jobs" ? (
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/50 text-slate-400 uppercase text-xs">
                <tr>
                  <th className="p-4">Job ID</th>
                  <th className="p-4">Client / Company</th>
                  <th className="p-4">Owner</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4">SLA Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredJobs.slice(0, 25).map((job, idx) => (
                  <tr key={idx} className="hover:bg-slate-700/50 transition">
                    <td className="p-4 font-mono text-xs text-indigo-300">{job.job_id || 'N/A'}</td>
                    <td className="p-4">
                      <div className="font-semibold text-white">{job.client_name || 'Unnamed Client'}</div>
                      <div className="text-xs text-slate-400">{job.company_name || 'N/A'}</div>
                    </td>
                    <td className="p-4">{job.job_owner || 'Unassigned'}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {job.job_status || 'In Progress'}
                      </span>
                    </td>
                    <td className="p-4 text-xs">{job.job_created_date ? new Date(job.job_created_date).toLocaleDateString() : 'N/A'}</td>
                    <td className="p-4">
                      {job.risk_level === 'Critical' ? (
                        <span className="flex items-center gap-1 text-xs text-red-400 font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" /> Critical
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-400 font-semibold">Normal</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/50 text-slate-400 uppercase text-xs">
                <tr>
                  <th className="p-4">Client Name</th>
                  <th className="p-4">HubSpot Deal ID</th>
                  <th className="p-4">Meeting Status</th>
                  <th className="p-4">Deal Stage</th>
                  <th className="p-4">AI Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {(data.deals || []).slice(0, 25).map((deal, idx) => (
                  <tr key={idx} className="hover:bg-slate-700/50 transition">
                    <td className="p-4 font-semibold text-white">{deal.client_name || 'N/A'}</td>
                    <td className="p-4 font-mono text-xs text-indigo-300">{deal.hubspot_deal_id || 'N/A'}</td>
                    <td className="p-4">{deal.meeting_status_clean || 'N/A'}</td>
                    <td className="p-4">{deal.deal_stage || 'N/A'}</td>
                    <td className="p-4 text-xs text-slate-400 max-w-xs truncate">{deal.ai_summary || 'No summary'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
