import React, { useEffect, useState } from 'react';
import { RefreshCw, Search, Briefcase, TrendingUp, ArrowUpRight, ShieldAlert, BarChart3, Layers, Sparkles, Clock, UserCheck } from 'lucide-react';

const SCRIPT_URL = process.env.REACT_APP_GOOGLE_SHEET_URL || "https://script.google.com/macros/s/AKfycbwZUzZSbWw7tOGv6jCoCACzlWZkX6itx6YbKQycsxvF04xVsRuiMroeo7Nh6jxYyEEi/exec";

export default function App() {
  const [data, setData] = useState({ monthlyResults: [], deals: [], jobs: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(SCRIPT_URL);
      const json = await res.json();
      if (json.status === "success" || json.monthlyResults) {
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

  const getVal = (obj, keys) => {
    if (!obj) return '—';
    for (let k of keys) {
      if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') {
        return obj[k];
      }
    }
    return '—';
  };

  const formatPct = (val) => {
    if (val === undefined || val === null || val === '—' || val === '' || isNaN(val)) return '—';
    const num = Number(val);
    return num <= 1 ? (num * 100).toFixed(1) + '%' : num.toFixed(1) + '%';
  };

  const getDaysElapsed = (dateVal) => {
    if (!dateVal || dateVal === '—') return null;
    const parsedDate = new Date(dateVal);
    if (isNaN(parsedDate.getTime())) return null;
    
    const today = new Date();
    const diffTime = Math.abs(today - parsedDate);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const isJobTrulyActive = (j) => {
    const jobStatus = String(getVal(j, ['job_status', 'Job Status', 'status'])).toLowerCase();
    const dealStage = String(getVal(j, ['deal_stage', 'Deal Stage', 'stage'])).toLowerCase();
    const closedDate = getVal(j, ['closed_date', 'Closed Date']);

    if (closedDate && closedDate !== '—' && closedDate !== '') return false;
    if (dealStage.includes('lost') || dealStage.includes('closed') || dealStage.includes('close_lost') || dealStage.includes('won')) return false;
    if (jobStatus.includes('filled') || jobStatus.includes('cancelled') || jobStatus.includes('closed') || jobStatus.includes('lost')) return false;

    return true;
  };

  // 1. FILTER BOX 1: Resumes Sent > 5 Days Ago (EXCLUDING those with TS Date / Interview Stage)
  const stuckResumesSent = (data.jobs || []).map(j => {
    const endDate = getVal(j, ['endorsements_date', 'endorsement_date', 'Endorsement Date']);
    const tsDate = getVal(j, ['ts_date', 'TS Date', 'ts date']);
    const dealStage = String(getVal(j, ['deal_stage', 'Deal Stage', 'stage'])).toLowerCase();
    
    const days = getDaysElapsed(endDate);
    const hasPassedToInterview = (tsDate && tsDate !== '—') || dealStage.includes('interview');
    
    return { ...j, calculatedDays: days, rawDate: endDate, hasPassedToInterview };
  }).filter(j => isJobTrulyActive(j) && j.calculatedDays !== null && j.calculatedDays > 5 && !j.hasPassedToInterview);

  // 2. FILTER BOX 2: TS Date > 10 Days Ago (In Interview Stage)
  const stuckInterviews = (data.jobs || []).map(j => {
    const tsDate = getVal(j, ['ts_date', 'TS Date', 'ts date']);
    const days = getDaysElapsed(tsDate);
    return { ...j, calculatedDays: days, rawDate: tsDate };
  }).filter(j => isJobTrulyActive(j) && j.calculatedDays !== null && j.calculatedDays > 10);

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

  const getCurrentMonthKey = () => {
    const now = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[now.getMonth()]} ${now.getFullYear()}`;
  };

  const currentMonthKey = getCurrentMonthKey();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-slate-100 bg-slate-900 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="text-indigo-400" /> Sales & Recruitment Operations Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Connected to Google Sheets & HubSpot CRM Private API
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

      {/* Navigation Tabs */}
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

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="text-emerald-400 w-5 h-5" /> Month-by-Month Sales Results
              </h2>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Active Month Emphasis Auto-Applied
              </span>
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
                    <th className="p-3.5 text-center">Total Meetings Conv.</th>
                    <th className="p-3.5 text-center">Roles / Qual. Meetings</th>
                    
                    <th className="p-3.5 text-center text-amber-400 font-black bg-amber-500/10 border-x border-amber-500/20">
                      Roles/Meetings Conv.
                    </th>
                    
                    <th className="p-3.5 text-center">Roles W/ TS</th>
                    
                    <th className="p-3.5 text-center text-emerald-400 font-black bg-emerald-500/10 border-x border-emerald-500/20">
                      % Roles TS
                    </th>
                    
                    <th className="p-3.5 text-center text-emerald-400">Active Roles (WIN)</th>
                    <th className="p-3.5 text-center">% WIN</th>
                    <th className="p-3.5 text-center">Lost Roles</th>
                    <th className="p-3.5 text-center">In Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {(data.monthlyResults || []).map((m, idx) => {
                    const rawMonth = getVal(m, ['Month', 'Month Start', 'month']);
                    if (!rawMonth || rawMonth === '—' || String(rawMonth).toLowerCase().includes('definition')) return null;
                    
                    const monthStr = String(rawMonth).split('T')[0];
                    const isCurrentMonth = monthStr.toLowerCase().includes(currentMonthKey.toLowerCase()) || 
                                           (monthStr.toLowerCase().includes('aug') && currentMonthKey.includes('Aug'));

                    return (
                      <tr 
                        key={idx} 
                        className={`transition duration-150 ${
                          isCurrentMonth 
                            ? 'bg-indigo-950/60 font-bold border-l-8 border-indigo-500 text-sm shadow-inner' 
                            : 'hover:bg-slate-700/40 text-xs'
                        }`}
                      >
                        <td className="p-4 font-extrabold text-white">
                          <div className="flex items-center gap-2">
                            <span>{monthStr}</span>
                            {isCurrentMonth && (
                              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-black uppercase px-2 py-0.5 rounded-full border border-indigo-500/40 tracking-wider">
                                Current
                              </span>
                            )}
                          </div>
                        </td>

                        <td className={`p-4 text-center font-black ${isCurrentMonth ? 'text-blue-300 text-base' : 'text-blue-400'}`}>
                          {getVal(m, ['Roles Opened', 'roles_opened'])}
                        </td>
                        <td className="p-4 text-center">{getVal(m, ['Meetings: Happened + Not Qualified', 'Meetings', 'total_meetings'])}</td>
                        <td className="p-4 text-center text-emerald-400">{getVal(m, ['Happened Meetings', 'Happened'])}</td>
                        <td className="p-4 text-center">{getVal(m, ['Not Qualified'])}</td>
                        <td className="p-4 text-center">{formatPct(getVal(m, ['No Shows %', 'No Shows']))}</td>
                        <td className="p-4 text-center">{formatPct(getVal(m, ['total meetings booked conversion', 'total meetings conversion']))}</td>
                        <td className="p-4 text-center">{formatPct(getVal(m, ['Roles Opened ÷ Meetings that actually Happened and qualified', 'Roles Opened + Meetings that actually Happened and qualified']))}</td>
                        
                        <td className={`p-4 text-center font-extrabold bg-amber-500/10 border-x border-amber-500/20 text-amber-300 ${isCurrentMonth ? 'text-base font-black' : ''}`}>
                          {formatPct(getVal(m, ['Conversion: Roles / Meetings']))}
                        </td>

                        <td className="p-4 text-center">{getVal(m, ['Roles With TS'])}</td>

                        <td className={`p-4 text-center font-extrabold bg-emerald-500/10 border-x border-emerald-500/20 text-emerald-300 ${isCurrentMonth ? 'text-base font-black' : ''}`}>
                          {formatPct(getVal(m, ['% Roles With TS']))}
                        </td>

                        <td className={`p-4 text-center font-black text-emerald-400 ${isCurrentMonth ? 'text-lg' : 'text-sm'}`}>
                          {getVal(m, ['Active Roles (WIN)', 'Active Roles'])}
                        </td>
                        <td className="p-4 text-center text-emerald-400">{formatPct(getVal(m, ['% Active Roles']))}</td>
                        <td className="p-4 text-center text-slate-400">{getVal(m, ['Lost Roles'])}</td>
                        <td className={`p-4 text-center font-extrabold ${isCurrentMonth ? 'text-indigo-200 text-base' : 'text-indigo-300'}`}>
                          {getVal(m, ['Still in progress', 'In Progress'])}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* JOBS NEEDING ACTION SECTION (SIDE-BY-SIDE PANELS) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* BOX 1: STUCK ON RESUMES SENT (Only if NOT moved to Interview stage yet) */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-amber-500/30 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-700/80 pb-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                  <Clock className="w-5 h-5 shrink-0" /> Resumes Sent &gt; 5 Days Without Action ({stuckResumesSent.length})
                </div>
                <span className="text-xs bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full font-bold border border-amber-500/20">
                  Strictly Resumes Phase
                </span>
              </div>

              {stuckResumesSent.length === 0 ? (
                <div className="text-slate-400 text-xs text-center py-6">No active jobs stuck in Resumes Sent &gt; 5 days.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                  {stuckResumesSent.map((job, i) => (
                    <div key={i} className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-700 hover:border-amber-500/50 transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-white text-xs">{getVal(job, ['client_name', 'Client Name']) || 'Unnamed Client'}</div>
                          <div className="text-[11px] text-slate-400">{getVal(job, ['company_name', 'Company']) || '—'}</div>
                        </div>
                        <span className="text-[10px] font-mono text-amber-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                          {getVal(job, ['job_id', 'Job ID'])}
                        </span>
                      </div>
                      <div className="mt-2 text-[11px] space-y-0.5">
                        <div className="text-slate-300">Owner: <span className="text-white font-semibold">{getVal(job, ['job_owner', 'TS Owner'])}</span></div>
                        <div className="text-amber-400 font-bold">Endorsed: {job.calculatedDays} Days Ago</div>
                        <div className="text-slate-400 text-[10px]">Date: {String(job.rawDate).split('T')[0]}</div>
                        <p className="text-slate-400 truncate mt-1 text-[10px]">{getVal(job, ['thais date and feedback', 'comment']) || 'No recent notes'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* BOX 2: STUCK IN INTERVIEW STAGE (TS Date > 10 Days) */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-red-500/30 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-700/80 pb-3">
                <div className="flex items-center gap-2 text-red-400 font-bold text-base">
                  <UserCheck className="w-5 h-5 shrink-0" /> Interview Stage &gt; 10 Days Without Progress ({stuckInterviews.length})
                </div>
                <span className="text-xs bg-red-500/10 text-red-400 px-3 py-1 rounded-full font-bold border border-red-500/20">
                  Strictly Interview Phase
                </span>
              </div>

              {stuckInterviews.length === 0 ? (
                <div className="text-slate-400 text-xs text-center py-6">No active jobs with TS Date &gt; 10 days ago.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                  {stuckInterviews.map((job, i) => (
                    <div key={i} className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-700 hover:border-red-500/50 transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-white text-xs">{getVal(job, ['client_name', 'Client Name']) || 'Unnamed Client'}</div>
                          <div className="text-[11px] text-slate-400">{getVal(job, ['company_name', 'Company']) || '—'}</div>
                        </div>
                        <span className="text-[10px] font-mono text-indigo-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                          {getVal(job, ['job_id', 'Job ID'])}
                        </span>
                      </div>
                      <div className="mt-2 text-[11px] space-y-0.5">
                        <div className="text-slate-300">Owner: <span className="text-white font-semibold">{getVal(job, ['job_owner', 'TS Owner'])}</span></div>
                        <div className="text-red-400 font-bold">TS Attached: {job.calculatedDays} Days Ago</div>
                        <div className="text-slate-400 text-[10px]">Date: {String(job.rawDate).split('T')[0]}</div>
                        <p className="text-slate-400 truncate mt-1 text-[10px]">{getVal(job, ['thais date and feedback', 'comment']) || 'No recent notes'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* DEALS TAB */}
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

      {/* JOBS TAB */}
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
