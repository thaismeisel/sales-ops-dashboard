import React, { useEffect, useState } from 'react';
import { RefreshCw, Search, Briefcase, CheckCircle2, AlertTriangle, TrendingUp, Users, ArrowUpRight, ShieldAlert, BarChart3, Layers } from 'lucide-react';

const SCRIPT_URL = process.env.REACT_APP_GOOGLE_SHEET_URL || "https://script.google.com/macros/s/AKfycbzt2XEOV5vzaLskfyIHcLQtN5dUbL1vwFksKtnUU7U4sqpIRSnWYQxWTOS3_lWIxUGk/exec";

export default function App() {
  const [data, setData] = useState({ monthlyResults: [], deals: [], jobs: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "deals" | "jobs"

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

  // Action Items requiring attention in Current Month (August 2026)
  const urgentJobs = (data.jobs || []).filter(j => 
    String(j.aging_bucket || '').toLowerCase().includes('critical') || 
    Number(j['Days Since Resume Sent']) > 10 ||
    String(j.AT_RISK || '').toLowerCase().includes('yes')
  );

  const filteredJobs = (data.jobs || []).filter(j =>
    String(j.client_name || '').toLowerCase().includes(search.toLowerCase()) ||
    String(j.company_name || '').toLowerCase().includes(search.toLowerCase()) ||
    String(j.job_owner || '').toLowerCase().includes(search.toLowerCase()) ||
    String(j.job_id || '').includes(search)
  );

  const filteredDeals = (data.deals || []).filter(d =>
    String(d.client_name || '').toLowerCase().includes(search.toLowerCase()) ||
    String(d.hubspot_deal_id || '').includes(search) ||
    String(d.deal_stage || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-slate-100 bg-slate-900 min-h-screen">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="text-indigo-400" /> Sales & Recruitment Operations Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Connected to Google Sheets Backend & HubSpot CRM Private API
          </p>
        </div>

        <button 
          onClick={fetchData} 
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 rounded-xl font-semibold transition text-sm shadow-lg disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? "Syncing..." : "Refresh Data"}
        </button>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex gap-3 border-b border-slate-800 pb-3">
        <button 
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition ${activeTab === "overview" ? "bg-indigo-600 text-white shadow-lg" : "bg-slate-800 text-slate-400 hover:text-white"}`}
        >
          <BarChart3 className="w-4 h-4" /> Monthly Comparison Overview
        </button>
        <button 
          onClick={() => setActiveTab("deals")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition ${activeTab === "deals" ? "bg-indigo-600 text-white shadow-lg" : "bg-slate-800 text-slate-400 hover:text-white"}`}
        >
          <Layers className="w-4 h-4" /> Deals Master (Lead Phase: {(data.deals || []).length})
        </button>
        <button 
          onClick={() => setActiveTab("jobs")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition ${activeTab === "jobs" ? "bg-indigo-600 text-white shadow-lg" : "bg-slate-800 text-slate-400 hover:text-white"}`}
        >
          <Briefcase className="w-4 h-4" /> Jobs Master (Recruitment Phase: {(data.jobs || []).length})
        </button>
      </div>

      {/* TAB 1: MONTHLY COMPARISON OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Monthly Comparison Table */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="text-emerald-400 w-5 h-5" /> Month-by-Month Sales Results
              </h2>
              <span className="text-xs text-slate-400">Source: monthly_results tab</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-bold">
                  <tr>
                    <th className="p-3.5">Month</th>
                    <th className="p-3.5 text-center">Roles Opened</th>
                    <th className="p-3.5 text-center">Total Meetings</th>
                    <th className="p-3.5 text-center">Happened</th>
                    <th className="p-3.5 text-center">Not Qual.</th>
                    <th className="p-3.5 text-center">No Shows %</th>
                    <th className="p-3.5 text-center">Roles/Meetings Conv.</th>
                    <th className="p-3.5 text-center">Roles W/ TS</th>
                    <th className="p-3.5 text-center">% Roles TS</th>
                    <th className="p-3.5 text-center text-emerald-400">Active Roles (WIN)</th>
                    <th className="p-3.5 text-center">% WIN</th>
                    <th className="p-3.5 text-center">Lost Roles</th>
                    <th className="p-3.5 text-center">In Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {(data.monthlyResults || []).map((m, idx) => (
                    <tr key={idx} className={`hover:bg-slate-700/50 transition ${String(m.Month || '').includes('Aug') ? 'bg-indigo-950/30 font-bold border-l-4 border-indigo-500' : ''}`}>
                      <td className="p-3.5 font-bold text-white">{m.Month || '—'}</td>
                      <td className="p-3.5 text-center text-blue-400 font-extrabold">{m['Roles Opened'] ?? '—'}</td>
                      <td className="p-3.5 text-center">{m['Meetings: Happened + Not Qualified'] ?? '—'}</td>
                      <td className="p-3.5 text-center text-emerald-400">{m['Happened Meetings'] ?? '—'}</td>
                      <td className="p-3.5 text-center">{m['Not Qualified'] ?? '—'}</td>
                      <td className="p-3.5 text-center">{m['No Shows %'] ? (Number(m['No Shows %']) * 100).toFixed(1) + '%' : '—'}</td>
                      <td className="p-3.5 text-center font-bold text-amber-400">
                        {m['Conversion: Roles / Meetings'] ? (Number(m['Conversion: Roles / Meetings']) * 100).toFixed(1) + '%' : '—'}
                      </td>
                      <td className="p-3.5 text-center">{m['Roles With TS'] ?? '—'}</td>
                      <td className="p-3.5 text-center">{m['% Roles With TS'] ? (Number(m['% Roles With TS']) * 100).toFixed(1) + '%' : '—'}</td>
                      <td className="p-3.5 text-center font-black text-emerald-400 text-sm">{m['Active Roles (WIN)'] ?? '—'}</td>
                      <td className="p-3.5 text-center text-emerald-400">{m['% Active Roles'] ? (Number(m['% Active Roles']) * 100).toFixed(1) + '%' : '—'}</td>
                      <td className="p-3.5 text-center text-slate-400">{m['Lost Roles'] ?? '—'}</td>
                      <td className="p-3.5 text-center text-indigo-300 font-bold">{m['Still in progress'] ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CURRENT MONTH ATTENTION HIGHLIGHT BOX */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-red-500/30 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-red-400 font-bold text-base">
                <ShieldAlert className="w-5 h-5" /> Current Month Deals Needing Attention ({urgentJobs.length} Critical SLA Risks)
              </div>
              <span className="text-xs bg-red-500/10 text-red-400 px-3 py-1 rounded-full font-bold border border-red-500/20">
                Action Required
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {urgentJobs.slice(0, 6).map((job, i) => (
                <div key={i} className="bg-slate-900 p-4 rounded-xl border border-slate-700 hover:border-red-500/50 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-white text-sm">{job.client_name || 'Unnamed Client'}</div>
                      <div className="text-xs text-slate-400">{job.company_name || '—'}</div>
                    </div>
                    <span className="text-xs font-mono text-indigo-300 bg-slate-800 px-2 py-0.5 rounded">{job.job_id}</span>
                  </div>
                  <div className="mt-3 text-xs space-y-1">
                    <div className="text-slate-300">Owner: <span className="text-white font-semibold">{job.job_owner || 'Unassigned'}</span></div>
                    <div className="text-red-400 font-bold">Aging: {job.aging_bucket || '>10 Days Without Feedback'}</div>
                    <p className="text-slate-400 truncate mt-1">{job['thais date and feedback'] || job.comment || 'No recent notes'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DEALS MASTER (LEAD / DISCOVERY STAGE) */}
      {activeTab === "deals" && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search deals by client, HubSpot ID, or stage..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 pl-10 pr-4 py-2 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-bold">
                  <tr>
                    <th className="p-3.5">Client Name & Email</th>
                    <th className="p-3.5">HubSpot Deal ID</th>
                    <th className="p-3.5">Discovery Date</th>
                    <th className="p-3.5">Meeting Status</th>
                    <th className="p-3.5">Deal Stage</th>
                    <th className="p-3.5">AI Insights & Next Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredDeals.slice(0, 50).map((deal, idx) => (
                    <tr key={idx} className="hover:bg-slate-700/40 transition">
                      <td className="p-3.5">
                        <div className="font-bold text-white">{deal.client_name || 'N/A'}</div>
                        <div className="text-slate-400 text-[11px]">{deal.email || '—'}</div>
                      </td>
                      <td className="p-3.5 font-mono text-indigo-300">{deal.hubspot_deal_id || 'N/A'}</td>
                      <td className="p-3.5">{deal.discovery_date || '—'}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-1 rounded text-[10px] font-extrabold uppercase ${
                          deal.meeting_status_clean === 'happened' ? 'bg-emerald-500/10 text-emerald-400' :
                          deal.meeting_status_clean === 'no_show' ? 'bg-red-500/10 text-red-400' : 'bg-slate-700 text-slate-300'
                        }`}>
                          {deal.meeting_status_clean || 'N/A'}
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-200">{deal.deal_stage || 'N/A'}</td>
                      <td className="p-3.5 max-w-sm">
                        <div className="text-slate-300">{deal.ai_summary || 'No AI summary'}</div>
                        {deal.ai_next_step && <div className="text-indigo-400 font-semibold mt-0.5">Next: {deal.ai_next_step}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: JOBS MASTER (RECRUITMENT STAGE) */}
      {activeTab === "jobs" && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search jobs by client, company, Job ID, or TS owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 pl-10 pr-4 py-2 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-bold">
                  <tr>
                    <th className="p-3.5">Job ID & Link</th>
                    <th className="p-3.5">Client & Company</th>
                    <th className="p-3.5">TS Owner</th>
                    <th className="p-3.5">Job Status</th>
                    <th className="p-3.5">Milestone Dates</th>
                    <th className="p-3.5">SLA / Feedback Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredJobs.slice(0, 50).map((job, idx) => {
                    const isCritical = String(job.aging_bucket || '').toLowerCase().includes('critical') || Number(job['Days Since Resume Sent']) > 10;
                    return (
                      <tr key={idx} className="hover:bg-slate-700/40 transition">
                        <td className="p-3.5 font-mono">
                          <span className="text-indigo-300 font-bold">{job.job_id || 'N/A'}</span>
                          {job.hubspot_link && (
                            <a href={job.hubspot_link} target="_blank" rel="noreferrer" className="block text-[10px] text-slate-400 hover:text-indigo-400 flex items-center gap-0.5 mt-0.5">
                              HubSpot Link <ArrowUpRight className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-white">{job.client_name || 'Unnamed Client'}</div>
                          <div className="text-slate-400">{job.company_name || '—'}</div>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-200">{job.job_owner || 'Unassigned'}</td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            job.job_status === 'filled' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            job.job_status === 'cancelled' ? 'bg-slate-700 text-slate-400' :
                            'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {job.job_status || 'In Progress'}
                          </span>
                        </td>
                        <td className="p-3.5 space-y-0.5 text-[11px]">
                          <div>Created: <span className="text-slate-200">{job.job_created_date ? String(job.job_created_date).split('T')[0] : '—'}</span></div>
                          {job.endorsements_date && <div>Endorsed: <span className="text-slate-200">{String(job.endorsements_date).split('T')[0]}</span></div>}
                          {job.active_date && <div>Active: <span className="text-emerald-400 font-bold">{String(job.active_date).split('T')[0]}</span></div>}
                        </td>
                        <td className="p-3.5 max-w-xs">
                          {isCritical ? (
                            <div className="flex items-center gap-1 text-red-400 font-bold mb-1">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>Critical SLA ({job['Days Since Resume Sent'] || '10+'} Days)</span>
                            </div>
                          ) : (
                            <div className="text-slate-400 font-medium mb-1">{job.aging_bucket || 'On Track'}</div>
                          )}
                          <p className="text-[11px] text-slate-400 truncate">{job['thais date and feedback'] || job.comment || 'No feedback notes'}</p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
