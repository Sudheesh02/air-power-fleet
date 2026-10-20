import React, { useState, useEffect, useMemo } from 'react';
import {
  Plane,
  AlertTriangle,
  Clock,
  Activity,
  Search,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Calendar,
  Share2,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis
} from 'recharts';
import StatCard from '../common/StatCard';
import GlassCard from '../common/GlassCard';
import StatusBadge from '../common/StatusBadge';
import { useTheme } from '../../context/ThemeContext';
import { fleetApi } from '../../api/fleetApi';
import { SQUADRONS } from '../../data/mockFleetData';

export default function CommandOverview() {
  const { isDark, selectedSquadron, setSelectedTail, setActiveTab } = useTheme();

  const [fleetReadiness, setFleetReadiness] = useState(null);
  const [aircraftList, setAircraftList] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Sorting state for Live Fleet Table
  const [sortField, setSortField] = useState('tail_no');
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

  const telemetryData = fleetApi.getTelemetryTrends();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [readinessRes, aircraftRes] = await Promise.all([
        fleetApi.getFleetReadiness(),
        fleetApi.getFleetAircraft()
      ]);
      setFleetReadiness(readinessRes.data);
      setAircraftList(aircraftRes.data);
      setLoading(false);
    }
    loadData();
  }, []);

  // Resolve human-readable active squadron name with real aircraft designation
  const activeSquadronLabel = useMemo(() => {
    if (selectedSquadron === 'ALL') return 'Fleet-wide';
    const sq = SQUADRONS.find(s => s.id === selectedSquadron);
    return sq ? sq.name : selectedSquadron;
  }, [selectedSquadron]);

  // Filter aircraft by Squadron and Search Query and Status Filter
  const filteredAircraft = useMemo(() => {
    return aircraftList.filter((ac) => {
      const clean = (s) => (s || '').replace(/['"]/g, '').toLowerCase().trim();
      const normAc = clean(ac.squadron);
      const normSel = clean(selectedSquadron);

      const selNumMatch = normSel.match(/\b(17|45|81|116|222)\b/) || normSel.match(/\d+/);
      const selNum = selNumMatch ? selNumMatch[0] : null;

      const matchesSquadron =
        selectedSquadron === 'ALL' ||
        normAc === normSel ||
        normAc.includes(normSel) ||
        normSel.includes(normAc) ||
        (selNum && normAc.includes(selNum)) ||
        (ac.aircraft_type && normSel.includes(clean(ac.aircraft_type.split(' ')[0])));

      const matchesStatus =
        statusFilter === 'ALL' || ac.status === statusFilter;

      const matchesSearch =
        (ac.tail_no || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
        (ac.aircraft_type || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
        (ac.base_station || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
        (ac.next_fault || '').toLowerCase().includes(searchFilter.toLowerCase());

      return matchesSquadron && matchesStatus && matchesSearch;
    });
  }, [aircraftList, selectedSquadron, statusFilter, searchFilter]);

  // Sort filtered aircraft
  const sortedAircraft = useMemo(() => {
    return [...filteredAircraft].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredAircraft, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Dynamically compute KPIs from currently active squadron context
  const targetFleet = filteredAircraft.length > 0 ? filteredAircraft : aircraftList;
  const totalCount = targetFleet.length;
  const capableCount = targetFleet.filter(a => a.status === 'MISSION_CAPABLE').length;
  const standbyCount = targetFleet.filter(a => a.status === 'CONDITIONAL_STANDBY').length;
  const groundedCount = targetFleet.filter(a => a.status === 'MAINTENANCE_GROUNDED').length;
  const criticalRulCount = targetFleet.filter(a => (a.rul_hours || 100) < 30).length;

  const dynamicMcRate = totalCount > 0 ? Math.round((capableCount / totalCount) * 1000) / 10 : 75.0;

  // Mini Sparkline Data Series (representing 7 operational cycles)
  const availabilitySparkline = dynamicMcRate >= 75
    ? [72.0, 73.5, 74.0, 75.2, 76.8, 78.4, dynamicMcRate]
    : [61.0, 62.5, 63.8, 64.5, 65.2, 66.0, dynamicMcRate];

  const capableSparkline = [10.0, 10.5, 11.0, 11.2, 11.8, capableCount, capableCount];
  const criticalRulSparkline = [2.0, 2.2, 2.5, 2.8, 2.9, criticalRulCount, criticalRulCount];
  const aogSparkline = groundedCount === 0
    ? [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
    : [
        Number((groundedCount * 5.2).toFixed(1)),
        Number((groundedCount * 4.8).toFixed(1)),
        Number((groundedCount * 4.4).toFixed(1)),
        Number((groundedCount * 4.1).toFixed(1)),
        Number((groundedCount * 3.8).toFixed(1)),
        Number((groundedCount * 3.6).toFixed(1)),
        Number((groundedCount * 3.5).toFixed(1))
      ];

  const radialData = [
    { name: 'Target', value: 75, fill: '#373A4D' },
    { name: 'Availability', value: dynamicMcRate, fill: '#8B5CF6' }
  ];

  const renderSortIndicator = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40 inline" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 ml-1 text-purple-400 inline" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-1 text-purple-400 inline" />
    );
  };

  if (loading && !fleetReadiness) {
    return (
      <div className="flex items-center justify-center p-16 text-slate-400 font-sans text-sm">
        <Plane className="w-5 h-5 animate-pulse mr-2 text-purple-500" />
        Loading Fleet Readiness Telemetry...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* 0. HEADER SECTION: Reference-Inspired Title, Date Pill & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className={`text-xl sm:text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Air Power Fleet AI Overview
          </h1>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Multi-silo prognostics, 5-stage digital twin telemetry, and sortie readiness
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium ${
            isDark ? 'bg-[#12131C] border-white/[0.08] text-slate-300' : 'bg-white border-slate-200 text-slate-700'
          }`}>
            <Calendar className="w-3.5 h-3.5 text-purple-400" />
            <span>Operational Cycle 142</span>
          </div>

          <button
            onClick={() => setActiveTab('predictive')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-950/40 transition"
          >
            <span>Sortie Planner</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 1. TOP KPI BENTO ROW (4 Sleek Compact Cards with Reference Arrow & Sparklines) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Fleet Availability"
          value={`${dynamicMcRate}%`}
          change={dynamicMcRate >= 75 ? `+${(dynamicMcRate - 75.0).toFixed(1)}%` : `${(dynamicMcRate - 75.0).toFixed(1)}%`}
          changeType={dynamicMcRate >= 75 ? 'positive' : 'amber'}
          icon={Activity}
          glowColor="purple"
          subtitle={`MoD Target: 75.0% (${activeSquadronLabel})`}
          sparklineData={availabilitySparkline}
        />

        <StatCard
          title="Mission Capable Fleet"
          value={`${capableCount} / ${totalCount}`}
          change="+2 Active"
          changeType="positive"
          icon={Plane}
          glowColor="purple"
          subtitle="Cleared for combat sortie envelope"
          sparklineData={capableSparkline}
        />

        <StatCard
          title="Critical RUL Alerts"
          value={`${criticalRulCount} Tails`}
          change={criticalRulCount > 0 ? "ACTION REQ" : "NOMINAL"}
          changeType={criticalRulCount > 0 ? "negative" : "positive"}
          icon={Clock}
          glowColor="amber"
          subtitle="Conservative RUL < 30 flight hrs"
          sparklineData={criticalRulSparkline}
        />

        <StatCard
          title="Grounded Downtime"
          value={`${groundedCount} Grounded`}
          change={groundedCount > 0 ? `~${(groundedCount * 3.5).toFixed(1)}h` : "0.0h"}
          changeType={groundedCount > 0 ? "negative" : "positive"}
          icon={AlertTriangle}
          glowColor="rose"
          subtitle={groundedCount > 0 ? "Depot express transit pipeline" : "100% Squadron Flight Cleared"}
          sparklineData={aogSparkline}
        />
      </div>

      {/* 2. MAIN ANALYTICS ROW: Line Chart & Semicircular Readiness Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Predicted Fault Probability vs Flight Hours */}
        <GlassCard className="p-5 lg:col-span-2 flex flex-col justify-between border border-white/[0.08] bg-[#12131C]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_#8B5CF6]" />
                <h3 className={`font-bold text-base tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Predicted Fault Probability vs. Flight Hours
                </h3>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
                Multi-squadron prognostic degradation telemetry mapped across NASA C-MAPSS gas-path regimes
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-sans">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 font-semibold border border-purple-500/30 text-[11px]">
                Prognostic ML
              </span>
            </div>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetryData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'} />
                <XAxis
                  dataKey="hours"
                  stroke={isDark ? '#717694' : '#718096'}
                  fontSize={11}
                  fontFamily="JetBrains Mono"
                />
                <YAxis
                  stroke={isDark ? '#717694' : '#718096'}
                  fontSize={11}
                  fontFamily="JetBrains Mono"
                  unit="%"
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#12131C',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontFamily: 'JetBrains Mono',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    color: '#FFF'
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono' }}
                />
                <Line
                  type="monotone"
                  dataKey="su30_fault_prob"
                  name="Su-30MKI (No. 222)"
                  stroke="#C084FC"
                  strokeWidth={2.8}
                  dot={{ r: 3, fill: '#C084FC' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="tejas_fault_prob"
                  name="Tejas Mk1A (No. 45)"
                  stroke="#38BDF8"
                  strokeWidth={2.2}
                  dot={{ r: 3, fill: '#38BDF8' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="rafale_fault_prob"
                  name="Rafale (No. 17)"
                  stroke="#F59E0B"
                  strokeWidth={2.2}
                  dot={{ r: 3, fill: '#F59E0B' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="nominal_baseline"
                  name="Nominal Baseline"
                  stroke="#22C55E"
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Right (1 col): Circular Readiness Score Gauge (Reference Quality Score Style) */}
        <GlassCard className="p-5 flex flex-col justify-between border border-white/[0.08] bg-[#12131C]">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-2">
            <div>
              <h3 className={`font-bold text-base tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Squadron Readiness Score
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
                Composite index for {selectedSquadron === 'ALL' ? 'Combined Fleet' : activeSquadronLabel}
              </p>
            </div>
            <div className="w-6 h-6 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-slate-400 shrink-0">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="relative flex items-center justify-center my-4 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="65%"
                outerRadius="100%"
                barSize={14}
                data={radialData}
                startAngle={180}
                endAngle={0}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar
                  background={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                  dataKey="value"
                  cornerRadius={10}
                />
              </RadialBarChart>
            </ResponsiveContainer>

            {/* Inner Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
              <span className="text-4xl font-extrabold font-sans text-purple-300 tracking-tight">
                {dynamicMcRate}%
              </span>
              <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
                Average Score
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 font-sans font-medium mt-1">
                MoD Target: 75.0%
              </span>
            </div>
          </div>

          <div className={`p-3.5 rounded-2xl border text-xs space-y-2.5 ${
            isDark ? 'bg-[#181926] border-white/[0.06] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Combat Mission Ready:</span>
              </div>
              <span className="font-bold font-sans text-emerald-400 text-xs">{capableCount} Aircraft</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Predictive Maintenance:</span>
              </div>
              <span className="font-bold font-sans text-amber-400 text-xs">{standbyCount} Aircraft</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Critical Alert / Grounded:</span>
              </div>
              <span className="font-bold font-sans text-rose-400 text-xs">{groundedCount} Aircraft</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* 3. REFERENCE FEATURED INSIGHT CARD & AI ADVISORY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Reference Signature Purple Gradient Card */}
        <div className="reference-insight-card p-6 rounded-2xl flex flex-col justify-between text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-white border border-white/20 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>AI Insights</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold leading-snug">
              Squadron readiness is at <span className="underline decoration-purple-300 font-extrabold">{dynamicMcRate}%</span> with optimal mission sortie envelope.
            </h3>
            <p className="text-xs text-white/80 mt-3 leading-relaxed">
              Based on C-MAPSS gas-path trend analysis, high-pressure turbine degradation is controlled. Next depot scheduled in 48 flight hours.
            </p>
          </div>

          {/* Reference Bottom Progress Capsule Bars */}
          <div className="mt-6 pt-4 border-t border-white/15 relative z-10 flex items-center justify-between">
            <div className="flex gap-1.5">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    i < 4 ? 'w-5 bg-white' : 'w-2.5 bg-white/30'
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] font-semibold text-white/90">Cycle 142/200</span>
          </div>

          {/* Subtle Ambient Decorative Circles */}
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-8 -bottom-8 w-40 h-40 bg-purple-900/40 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Right (2 cols): LIVE FLEET STATUS & RUL MATRIX TABLE */}
        <GlassCard className="p-5 lg:col-span-2 border border-white/[0.08] bg-[#12131C] flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Plane className="w-5 h-5 text-purple-400" />
                <h3 className={`font-bold text-base tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Live Fleet Status & RUL Matrix
                </h3>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
                Showing {sortedAircraft.length} aircraft &bull; Click any tail to inspect its Digital Twin
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-2.5">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`text-xs font-semibold py-1.5 px-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 transition ${
                  isDark
                    ? 'bg-[#181926] text-purple-200 border border-white/[0.08]'
                    : 'bg-slate-100 text-slate-800 border border-slate-200'
                }`}
              >
                <option value="ALL">All Statuses</option>
                <option value="MISSION_CAPABLE">Mission Ready</option>
                <option value="CONDITIONAL_STANDBY">Maintenance Scheduled</option>
                <option value="MAINTENANCE_GROUNDED">Critical Alert (AOG)</option>
              </select>

              {/* Quick Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter tail, model, base..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className={`text-xs py-1.5 pl-8 pr-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 transition ${
                    isDark
                      ? 'bg-[#181926] text-white placeholder-slate-500 border border-white/[0.08]'
                      : 'bg-slate-100 text-slate-800 placeholder-slate-400 border border-slate-200'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className={`uppercase font-sans font-bold text-[11px] tracking-wider border-b ${
                isDark ? 'text-slate-400 bg-[#161722] border-white/[0.08]' : 'text-slate-500 bg-slate-100 border-slate-200'
              }`}>
                <tr>
                  <th
                    onClick={() => handleSort('tail_no')}
                    className="p-3 cursor-pointer hover:text-purple-400 transition select-none"
                  >
                    Tail No {renderSortIndicator('tail_no')}
                  </th>
                  <th
                    onClick={() => handleSort('aircraft_type')}
                    className="p-3 cursor-pointer hover:text-purple-400 transition select-none"
                  >
                    Model {renderSortIndicator('aircraft_type')}
                  </th>
                  <th
                    onClick={() => handleSort('squadron')}
                    className="p-3 cursor-pointer hover:text-purple-400 transition select-none"
                  >
                    Squadron & Base {renderSortIndicator('squadron')}
                  </th>
                  <th
                    onClick={() => handleSort('health_score')}
                    className="p-3 cursor-pointer hover:text-purple-400 transition select-none"
                  >
                    Health Score {renderSortIndicator('health_score')}
                  </th>
                  <th
                    onClick={() => handleSort('rul_hours')}
                    className="p-3 cursor-pointer hover:text-purple-400 transition select-none"
                  >
                    Est. RUL {renderSortIndicator('rul_hours')}
                  </th>
                  <th
                    onClick={() => handleSort('status')}
                    className="p-3 cursor-pointer hover:text-purple-400 transition select-none"
                  >
                    Status {renderSortIndicator('status')}
                  </th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] font-medium">
                {sortedAircraft.slice(0, 7).map((ac) => {
                  return (
                    <tr
                      key={ac.tail_no}
                      onClick={() => {
                        setSelectedTail(ac.tail_no);
                        setActiveTab('twin');
                      }}
                      className={`cursor-pointer transition-colors ${
                        isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="p-3 font-sans font-bold text-purple-400 text-sm tracking-tight">
                        {ac.tail_no}
                      </td>
                      <td className={`p-3 font-medium text-xs ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        {ac.aircraft_type}
                      </td>
                      <td className="p-3">
                        <div className={`font-semibold text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {ac.squadron}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {ac.base_station}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className={`font-sans font-bold text-xs ${
                            ac.health_score > 75 ? 'text-emerald-400' : (ac.health_score > 50 ? 'text-amber-400' : 'text-rose-400')
                          }`}>
                            {ac.health_score}%
                          </span>
                          <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                ac.health_score > 75
                                  ? 'bg-emerald-500'
                                  : ac.health_score > 50
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${ac.health_score}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className={`p-3 font-sans font-bold text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        ~{ac.rul_hours} h
                      </td>
                      <td className="p-3">
                        <StatusBadge status={ac.status} size="sm" />
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTail(ac.tail_no);
                            setActiveTab('twin');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/25 text-xs font-sans font-semibold transition flex items-center gap-1 ml-auto"
                        >
                          Inspect
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
