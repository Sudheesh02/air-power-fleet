import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Activity,
  Gauge,
  Zap,
  ArrowRight,
  RefreshCw,
  Layers
} from 'lucide-react';
import GlassCard from '../common/GlassCard';
import StatusBadge from '../common/StatusBadge';
import { useTheme } from '../../context/ThemeContext';
import { fleetApi } from '../../api/fleetApi';
import { MOCK_AIRCRAFT_LIST } from '../../data/mockFleetData';

export default function DigitalTwinView() {
  const { isDark, selectedTail, setSelectedTail, setActiveTab } = useTheme();

  const [twinData, setTwinData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubsystemTab, setActiveSubsystemTab] = useState('ALL'); // ALL, avionics, propulsion, hydraulics, airframe
  const [selectedStageKey, setSelectedStageKey] = useState(null);

  useEffect(() => {
    async function loadTwin() {
      setLoading(true);
      const res = await fleetApi.getAircraftDigitalTwin(selectedTail);
      setTwinData(res.data);
      setLoading(false);
    }
    loadTwin();
  }, [selectedTail]);

  if (!twinData && loading) {
    return (
      <div className="flex items-center justify-center p-16 text-slate-400 font-sans text-sm">
        <RefreshCw className="w-5 h-5 animate-spin mr-2 text-blue-500" />
        Loading 5-Stage Gas-Path Digital Twin & Subsystem Telemetry...
      </div>
    );
  }

  const stageKeys = [
    { key: 'fan', label: '1. Fan & Intake', station: 'STA 2' },
    { key: 'lpc', label: '2. Low-Pressure Comp', station: 'STA 24' },
    { key: 'hpc', label: '3. High-Pressure Comp', station: 'STA 30' },
    { key: 'combustor_hpt', label: '4. Combustor & HPT', station: 'STA 40' },
    { key: 'lpt', label: '5. Low-Pressure Turb', station: 'STA 50' },
  ];

  const tel = twinData?.telemetry || {};
  const prog = twinData?.prognostics || {};
  const stages = twinData?.stages || {};
  const drift = twinData?.in_flight_drift_adaptation || {};
  const subsystems = twinData?.subsystems || {};

  return (
    <div className="space-y-6 pb-8">
      {/* 1. TOP HEADER & TAIL SELECTOR CARD */}
      <GlassCard className="p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-700 border border-blue-500/30 flex items-center justify-center text-white shadow-sm">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-sans px-2.5 py-0.5 rounded-full bg-blue-500/15 text-sky-300 font-semibold border border-blue-500/30">
                Multi-Subsystem Digital Twin
              </span>
              <span className="text-xs text-slate-400 font-sans">
                Sortie Cycle #{twinData?.flight_cycle || 0}
              </span>
            </div>
            <h2 className={`text-lg font-extrabold tracking-tight mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Aircraft Subsystems & Gas-Path Health Monitor
            </h2>
          </div>
        </div>

        {/* Tail Picker */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-400 font-sans uppercase tracking-wider">
            Select Asset:
          </label>
          <select
            value={selectedTail}
            onChange={(e) => setSelectedTail(e.target.value)}
            className={`text-xs font-sans font-semibold py-2 px-3 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
              isDark
                ? 'bg-slate-900 text-slate-200 border border-white/15'
                : 'bg-slate-100 text-slate-900 border border-slate-200'
            }`}
          >
            {MOCK_AIRCRAFT_LIST.map((ac) => (
              <option key={ac.tail_no} value={ac.tail_no} className="bg-slate-900 text-white">
                {ac.tail_no} - {ac.aircraft_type.split(' ')[0]} ({ac.status})
              </option>
            ))}
          </select>
        </div>
      </GlassCard>

      {/* 2. ASSET SUMMARY & OVERALL HEALTH */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="p-4 flex flex-col justify-between">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-sans">
            Airframe & Engine
          </p>
          <div className="mt-2">
            <h4 className="text-xl font-sans font-bold text-cyan-300 tracking-tight">
              {twinData?.tail_no}
            </h4>
            <p className={`text-xs mt-0.5 font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {twinData?.aircraft_type}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-white/5 dark:border-white/5 text-[11px] font-sans text-slate-400">
            Serial: {twinData?.engine_serial || 'AL31FP'}
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex flex-col justify-between">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-sans">
            Squadron & Base
          </p>
          <div className="mt-2">
            <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {twinData?.squadron}
            </h4>
            <p className="text-xs font-sans text-sky-400 mt-0.5 font-medium">
              {twinData?.base_station}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-white/5 dark:border-white/5 text-[11px] font-sans text-slate-400">
            Logged FH: {twinData?.airframe_hours} hrs
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex flex-col justify-between">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-sans">
            Composite Fleet Health
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <h4 className={`text-3xl font-sans font-extrabold tracking-tight ${
              (twinData?.overall_health_pct || 0) > 75
                ? 'text-emerald-400'
                : (twinData?.overall_health_pct || 0) > 50
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}>
              {twinData?.overall_health_pct}%
            </h4>
            <StatusBadge status={twinData?.status} size="sm" />
          </div>
          <div className="mt-3 pt-2 border-t border-white/5 dark:border-white/5">
            <div className="w-full h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  (twinData?.overall_health_pct || 0) > 75
                    ? 'bg-[#10B981]'
                    : (twinData?.overall_health_pct || 0) > 50
                    ? 'bg-[#F59E0B]'
                    : 'bg-[#EF4444]'
                }`}
                style={{ width: `${twinData?.overall_health_pct || 0}%` }}
              />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex flex-col justify-between">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-sans">
            Conservative RUL (90% Conf)
          </p>
          <div className="mt-2">
            <h4 className={`text-2xl font-sans font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {prog.conservative_rul_hours} hrs
            </h4>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Point Estimate (Mean): {prog.predicted_rul_hours} hrs
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-white/5 dark:border-white/5 text-[11px] font-sans text-emerald-300 flex items-center justify-between">
            <span>90% Conformal Interval:</span>
            <span className="font-semibold">[{prog.conformal_interval?.[0]}h - {prog.conformal_interval?.[1]}h]</span>
          </div>
        </GlassCard>
      </div>

      {/* 3. VISUAL 4-SUBSYSTEM BREAKDOWN (Avionics, Propulsion/Engine, Hydraulics, Airframe) */}
      <GlassCard className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 dark:border-white/5 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-400" />
              <h3 className={`font-extrabold text-base tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Aircraft Subsystem Architecture & AI Anomaly Detection Scores
              </h3>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
              Avionics, Propulsion, Hydraulics, and Airframe real-time telemetry with AI anomaly risk scoring
            </p>
          </div>

          {/* Subsystem Filter Tabs */}
          <div className="flex items-center gap-2 font-sans text-xs">
            {[
              { id: 'ALL', label: 'All Subsystems' },
              { id: 'avionics', label: 'Avionics' },
              { id: 'propulsion', label: 'Propulsion' },
              { id: 'hydraulics', label: 'Hydraulics' },
              { id: 'airframe', label: 'Airframe' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubsystemTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl border transition ${
                  activeSubsystemTab === tab.id
                    ? 'bg-blue-700 text-white border-blue-500/40 font-bold shadow-sm'
                    : isDark
                    ? 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Subsystem Bento Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Subsystem 1: Avionics */}
          {(activeSubsystemTab === 'ALL' || activeSubsystemTab === 'avionics') && (
            <div className={`p-5 rounded-2xl border transition-all ${
              isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'
            } ${subsystems.avionics?.health_score < 75 ? 'border-l-4 border-l-amber-500/70' : ''}`}>
              <div className="flex items-center justify-between gap-1.5 min-w-0">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-sky-400 border border-blue-500/20 font-sans whitespace-nowrap shrink-0">
                  Avionics & Bus
                </span>
                <StatusBadge status={subsystems.avionics?.status} size="sm" />
              </div>

              <h4 className={`font-bold text-sm mt-3.5 tracking-tight font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {subsystems.avionics?.name || 'Avionics System'}
              </h4>

              <div className="mt-3 flex items-baseline justify-between font-sans">
                <div>
                  <span className="text-xs text-slate-400 font-medium">Subsystem Health</span>
                  <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                    {subsystems.avionics?.health_score || 94}%
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 font-medium">AI Anomaly Risk</span>
                  <p className={`text-base font-bold mt-0.5 ${
                    (subsystems.avionics?.anomaly_score || 0) > 0.2 ? 'text-amber-300' : 'text-emerald-400'
                  }`}>
                    {Math.round((subsystems.avionics?.anomaly_score || 0.04) * 100)}%
                  </p>
                </div>
              </div>

              {/* 2x2 Clean Bento Metric Grid */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-sans">
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'}`}>
                  <span className="text-[11px] text-slate-400 block font-normal">Bus Voltage</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 block">{subsystems.avionics?.telemetry?.bus_voltage_v || 28.2} V</span>
                </div>
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'}`}>
                  <span className="text-[11px] text-slate-400 block font-normal">FADEC Desync</span>
                  <span className="text-xs font-semibold text-slate-200 mt-0.5 block">{subsystems.avionics?.telemetry?.fadec_channel_desync_ms || 0.02} ms</span>
                </div>
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'}`}>
                  <span className="text-[11px] text-slate-400 block font-normal">Core Temp</span>
                  <span className="text-xs font-semibold text-slate-200 mt-0.5 block">{subsystems.avionics?.telemetry?.processor_core_temp_c || 45.2} °C</span>
                </div>
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'}`}>
                  <span className="text-[11px] text-slate-400 block font-normal">AESA Modules</span>
                  <span className="text-xs font-bold text-emerald-400 mt-0.5 block">{subsystems.avionics?.telemetry?.radar_t_r_modules_active || '1536/1536'}</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 mt-3 font-sans leading-relaxed">
                {subsystems.avionics?.diagnostics}
              </p>
            </div>
          )}

          {/* Subsystem 2: Propulsion & Engine */}
          {(activeSubsystemTab === 'ALL' || activeSubsystemTab === 'propulsion') && (
            <div className={`p-5 rounded-2xl border transition-all ${
              isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'
            } ${
              subsystems.propulsion?.health_score < 50
                ? 'border-l-4 border-l-rose-500/80'
                : subsystems.propulsion?.health_score < 75
                ? 'border-l-4 border-l-amber-500/70'
                : ''
            }`}>
              <div className="flex items-center justify-between gap-1.5 min-w-0">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 font-sans whitespace-nowrap shrink-0">
                  Propulsion & Turbofan
                </span>
                <StatusBadge status={subsystems.propulsion?.status} size="sm" />
              </div>

              <h4 className={`font-bold text-sm mt-3.5 tracking-tight font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {subsystems.propulsion?.name || 'Propulsion System'}
              </h4>

              <div className="mt-3 flex items-baseline justify-between font-sans">
                <div>
                  <span className="text-xs text-slate-400 font-medium">Subsystem Health</span>
                  <p className={`text-2xl font-black tracking-tight mt-0.5 ${
                    (subsystems.propulsion?.health_score || 0) < 50
                      ? 'text-rose-400'
                      : (subsystems.propulsion?.health_score || 0) < 75
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}>
                    {subsystems.propulsion?.health_score || 80.3}%
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 font-medium">AI Anomaly Risk</span>
                  <p className={`text-base font-bold mt-0.5 ${
                    (subsystems.propulsion?.anomaly_score || 0) > 0.5 ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {Math.round((subsystems.propulsion?.anomaly_score || 0.18) * 100)}%
                  </p>
                </div>
              </div>

              {/* 2x2 Clean Bento Metric Grid: EGT, Oil Pressure, Vibration, Fan/Core RPM */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-sans">
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'}`}>
                  <span className="text-[11px] text-slate-400 block font-normal">Exhaust Gas Temp</span>
                  <span className={`text-xs font-bold mt-0.5 block ${
                    (subsystems.propulsion?.telemetry?.exhaust_gas_temperature_c || 750) > 820 ? 'text-rose-400' : 'text-amber-400'
                  }`}>
                    {subsystems.propulsion?.telemetry?.exhaust_gas_temperature_c || 755} °C
                  </span>
                </div>
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'}`}>
                  <span className="text-[11px] text-slate-400 block font-normal">Oil Pressure</span>
                  <span className={`text-xs font-bold mt-0.5 block ${
                    (subsystems.propulsion?.telemetry?.oil_pressure_psi || 48) < 40 ? 'text-rose-400' : 'text-slate-900 dark:text-white'
                  }`}>
                    {subsystems.propulsion?.telemetry?.oil_pressure_psi || 49.2} psi
                  </span>
                </div>
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'}`}>
                  <span className="text-[11px] text-slate-400 block font-normal">Vibration Index</span>
                  <span className={`text-xs font-bold mt-0.5 block ${
                    (subsystems.propulsion?.telemetry?.vibration_anomaly_index || 0.3) > 0.6 ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {subsystems.propulsion?.telemetry?.vibration_anomaly_index || 0.32} mm/s
                  </span>
                </div>
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'}`}>
                  <span className="text-[11px] text-slate-400 block font-normal">Fan / Core RPM</span>
                  <span className="text-xs font-semibold text-slate-200 mt-0.5 block">
                    {subsystems.propulsion?.telemetry?.fan_speed_rpm || 2388} / {subsystems.propulsion?.telemetry?.core_speed_rpm || 9051}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 mt-3 font-sans leading-relaxed">
                {subsystems.propulsion?.diagnostics}
              </p>
            </div>
          )}

          {/* Subsystem 3: Hydraulics */}
          {(activeSubsystemTab === 'ALL' || activeSubsystemTab === 'hydraulics') && (
            <div className={`p-5 rounded-2xl border transition-all ${
              isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'
            } ${subsystems.hydraulics?.health_score < 75 ? 'border-l-4 border-l-amber-500/70' : ''}`}>
              <div className="flex items-center justify-between gap-1.5 min-w-0">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 font-sans whitespace-nowrap shrink-0">
                  Hydraulics & Actuators
                </span>
                <StatusBadge status={subsystems.hydraulics?.status} size="sm" />
              </div>

              <h4 className={`font-bold text-sm mt-3.5 tracking-tight font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {subsystems.hydraulics?.name || 'Hydraulic Subsystem'}
              </h4>

              <div className="mt-3 flex items-baseline justify-between font-sans">
                <div>
                  <span className="text-xs text-slate-400 font-medium">Subsystem Health</span>
                  <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                    {subsystems.hydraulics?.health_score || 91}%
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 font-medium">AI Anomaly Risk</span>
                  <p className="text-base font-bold text-emerald-400 mt-0.5">
                    {Math.round((subsystems.hydraulics?.anomaly_score || 0.06) * 100)}%
                  </p>
                </div>
              </div>

              {/* 2x2 Clean Bento Metric Grid */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-sans">
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'}`}>
                  <span className="text-[11px] text-slate-400 block font-normal">Circuit A Pres</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 block">{subsystems.hydraulics?.telemetry?.sys_a_pressure_psi || 3045} psi</span>
                </div>
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'}`}>
                  <span className="text-[11px] text-slate-400 block font-normal">Circuit B Pres</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 block">{subsystems.hydraulics?.telemetry?.sys_b_pressure_psi || 3020} psi</span>
                </div>
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'}`}>
                  <span className="text-[11px] text-slate-400 block font-normal">Actuator Latency</span>
                  <span className="text-xs font-bold text-emerald-400 mt-0.5 block">{subsystems.hydraulics?.telemetry?.actuator_response_time_ms || 11.8} ms</span>
                </div>
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'}`}>
                  <span className="text-[11px] text-slate-400 block font-normal">Fluid Temp</span>
                  <span className="text-xs font-semibold text-slate-200 mt-0.5 block">{subsystems.hydraulics?.telemetry?.fluid_temperature_c || 58.6} °C</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 mt-3 font-sans leading-relaxed">
                {subsystems.hydraulics?.diagnostics}
              </p>
            </div>
          )}

          {/* Subsystem 4: Airframe Structure */}
          {(activeSubsystemTab === 'ALL' || activeSubsystemTab === 'airframe') && (
            <div className={`p-5 rounded-2xl border transition-all ${
              isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'
            } ${subsystems.airframe?.health_score < 75 ? 'border-l-4 border-l-amber-500/70' : ''}`}>
              <div className="flex items-center justify-between gap-1.5 min-w-0">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-700/30 text-slate-300 border border-slate-600/30 font-sans whitespace-nowrap shrink-0">
                  Airframe Structure
                </span>
                <StatusBadge status={subsystems.airframe?.status} size="sm" />
              </div>

              <h4 className={`font-bold text-sm mt-3.5 tracking-tight font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {subsystems.airframe?.name || 'Airframe Structure'}
              </h4>

              <div className="mt-3 flex items-baseline justify-between font-sans">
                <div>
                  <span className="text-xs text-slate-400 font-medium">Subsystem Health</span>
                  <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                    {subsystems.airframe?.health_score || 88}%
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 font-medium">AI Anomaly Risk</span>
                  <p className="text-base font-bold text-emerald-400 mt-0.5">
                    {Math.round((subsystems.airframe?.anomaly_score || 0.09) * 100)}%
                  </p>
                </div>
              </div>

              {/* 2x2 Clean Bento Metric Grid */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-sans">
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'}`}>
                  <span className="text-[11px] text-slate-400 block font-normal">Vibration Index</span>
                  <span className="text-xs font-bold text-emerald-400 mt-0.5 block">{subsystems.airframe?.telemetry?.vibration_anomaly_index || 0.28} mm/s</span>
                </div>
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'}`}>
                  <span className="text-[11px] text-slate-400 block font-normal">Wing Root Strain</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 block">{subsystems.airframe?.telemetry?.wing_root_strain_g || 3.2} G</span>
                </div>
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'}`}>
                  <span className="text-[11px] text-slate-400 block font-normal">Acoustic dB</span>
                  <span className="text-xs font-semibold text-slate-200 mt-0.5 block">{subsystems.airframe?.telemetry?.acoustic_emission_db || 108.5} dB</span>
                </div>
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'}`}>
                  <span className="text-[11px] text-slate-400 block font-normal">Gear Cycles</span>
                  <span className="text-xs font-semibold text-slate-200 mt-0.5 block">{subsystems.airframe?.telemetry?.landing_gear_cycles_count || 310} cyc</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 mt-3 font-sans leading-relaxed">
                {subsystems.airframe?.diagnostics}
              </p>
            </div>
          )}
        </div>
      </GlassCard>

      {/* 4. VISUAL 5-STAGE GAS-PATH ENGINE DIAGRAM */}
      <GlassCard className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 dark:border-white/5 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <h3 className={`font-extrabold text-base tracking-tight font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Turbofan Gas-Path Cross-Section Breakdown (Stations 2 &rarr; 50)
              </h3>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5 font-sans`}>
              Thermodynamic degradation mapping across stages &bull; NASA C-MAPSS gas-path state
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('predictive')}
              className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-sans text-xs font-semibold transition flex items-center gap-1.5 border border-blue-500/40 shadow-sm"
            >
              Test in Sortie Simulator
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 5 Stages Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {stageKeys.map(({ key, label, station }) => {
            const st = stages[key] || {
              name: label,
              health_pct: 85,
              status: 'NOMINAL',
              key_sensors: [],
              wear_mode: 'Nominal baseline'
            };

            const isCaution = st.status === 'CAUTION';
            const isCritical = st.status === 'CRITICAL';
            const isSelected = selectedStageKey === key;

            // Authentic tactical aerospace border & elevation (no gaudy border-l-4 stripes)
            const cardBorder = isSelected
              ? 'ring-2 ring-blue-500 border-blue-500/60 bg-blue-950/20 shadow-sm'
              : isCritical
              ? (isDark ? 'border-red-500/35 bg-red-950/[0.08]' : 'border-red-300 bg-red-50/60')
              : isCaution
              ? (isDark ? 'border-amber-500/25 bg-amber-950/[0.04]' : 'border-amber-200 bg-amber-50/60')
              : (isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-50/60');

            const valueColor = isCritical
              ? 'text-red-400'
              : isCaution
              ? 'text-amber-300'
              : 'text-emerald-400';

            return (
              <div
                key={key}
                onClick={() => setSelectedStageKey(selectedStageKey === key ? null : key)}
                className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between hover:translate-y-[-2px] cursor-pointer ${cardBorder}`}
              >
                <div>
                  {/* Stage Station Header: Tonal Pill on Left, Status Badge on Right */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-blue-500/10 text-sky-400 border border-blue-500/20 font-sans whitespace-nowrap shrink-0">
                      {station.replace(' ', '\u00A0')}
                    </span>
                    <StatusBadge status={st.status} size="sm" />
                  </div>

                  <h5 className={`font-bold text-xs mt-3 tracking-tight font-sans line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`} title={st.name}>
                    {st.name}
                  </h5>

                  {/* Metric Value Row */}
                  <div className="mt-2.5 mb-1.5 flex items-baseline justify-between font-sans">
                    <span className={`text-2xl font-black tracking-tight ${valueColor}`}>
                      {st.health_pct}%
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Health Index
                    </span>
                  </div>

                  {/* Tactile Progress Meter */}
                  <div className="w-full h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCritical ? 'bg-red-500' : isCaution ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${st.health_pct}%` }}
                    />
                  </div>
                </div>

                {/* Mid-section: Active Station Telemetry (Fills the previous empty gap with real telemetry) */}
                <div className="mt-3.5 pt-3 border-t border-white/5 dark:border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-sans">
                    <span>Active Sensors</span>
                    <span className="text-[9px] text-sky-400 font-mono flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-sky-400 animate-pulse" />
                      LIVE
                    </span>
                  </div>
                  <div className="space-y-1">
                    {st.key_sensors?.map((s, idx) => (
                      <div
                        key={idx}
                        className={`text-[11px] font-medium px-2 py-1 rounded-lg border font-sans truncate flex items-center justify-between ${
                          isDark
                            ? 'bg-slate-900/70 text-slate-200 border-white/10'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                        title={s}
                      >
                        <span className="truncate">{s}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400/80 ml-1.5 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer: Wear Diagnosis */}
                <div className="mt-2.5 pt-2 border-t border-white/5 dark:border-white/5 font-sans">
                  <div className="flex items-start justify-between gap-1 text-[11px]">
                    <span className="text-slate-400 text-[10px] shrink-0">Diagnosis:</span>
                    <span
                      className={`font-medium text-right text-[10px] truncate max-w-[130px] ${
                        isCritical ? 'text-red-300' : isCaution ? 'text-amber-300' : 'text-slate-300'
                      }`}
                      title={st.wear_mode}
                    >
                      {st.wear_mode || 'Normal baseline'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* 5. REAL-TIME SENSORS TELEMETRY STREAM & RLS DRIFT FILTER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Real-Time Sensors Gauge Ribbon */}
        <GlassCard className="p-5 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 dark:border-white/5 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Gauge className="w-5 h-5 text-sky-400" />
                <h3 className={`font-extrabold text-base tracking-tight font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  IoT Gas-Path Sensor Telemetry Stream (Live Values)
                </h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-sans">
                {Object.keys(tel).length > 0 ? Object.keys(tel).length : 6} Telemetry Channels Active
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {/* Sensor 1: T24 */}
              <div className={`p-4 rounded-2xl border transition-all duration-200 hover:border-sky-500/30 flex flex-col justify-between ${
                isDark ? 'bg-white/5 border-white/5 hover:bg-white/[0.07]' : 'bg-slate-50 border-slate-200 hover:bg-white'
              }`}>
                <div className="flex items-center justify-between gap-1.5 font-sans">
                  <span className="text-xs font-semibold text-slate-300">LPC Temp (T24)</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    Station 24
                  </span>
                </div>
                <div className="my-2 flex items-baseline gap-1.5 font-sans">
                  <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {tel.T24_LPC_Temp_R || 642.3}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">°R</span>
                </div>
                <div className="pt-2 border-t border-white/5 dark:border-white/5 flex items-center justify-between text-[11px] font-sans">
                  <span className="text-slate-400">Nominal:</span>
                  <span className="font-semibold text-slate-300">642.3 °R</span>
                </div>
              </div>

              {/* Sensor 2: T30 */}
              <div className={`p-4 rounded-2xl border transition-all duration-200 hover:border-amber-500/30 flex flex-col justify-between ${
                isDark ? 'bg-white/5 border-white/5 hover:bg-white/[0.07]' : 'bg-slate-50 border-slate-200 hover:bg-white'
              }`}>
                <div className="flex items-center justify-between gap-1.5 font-sans">
                  <span className="text-xs font-semibold text-slate-300">HPC Temp (T30)</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    Station 30
                  </span>
                </div>
                <div className="my-2 flex items-baseline gap-1.5 font-sans">
                  <span className="text-2xl font-black text-amber-400 tracking-tight">
                    {tel.T30_HPC_Temp_R || 1588.0}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">°R</span>
                </div>
                <div className="pt-2 border-t border-white/5 dark:border-white/5 flex items-center justify-between text-[11px] font-sans">
                  <span className="text-slate-400">Nominal:</span>
                  <span className="font-semibold text-slate-300">1588.0 °R</span>
                </div>
              </div>

              {/* Sensor 3: P30 */}
              <div className={`p-4 rounded-2xl border transition-all duration-200 hover:border-sky-500/30 flex flex-col justify-between ${
                isDark ? 'bg-white/5 border-white/5 hover:bg-white/[0.07]' : 'bg-slate-50 border-slate-200 hover:bg-white'
              }`}>
                <div className="flex items-center justify-between gap-1.5 font-sans">
                  <span className="text-xs font-semibold text-slate-300">HPC Pressure (P30)</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    Station 30
                  </span>
                </div>
                <div className="my-2 flex items-baseline gap-1.5 font-sans">
                  <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {tel.P30_HPC_Pres_psia || 553.8}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">psia</span>
                </div>
                <div className="pt-2 border-t border-white/5 dark:border-white/5 flex items-center justify-between text-[11px] font-sans">
                  <span className="text-slate-400">Nominal:</span>
                  <span className="font-semibold text-slate-300">553.8 psia</span>
                </div>
              </div>

              {/* Sensor 4: T50 */}
              <div className={`p-4 rounded-2xl border transition-all duration-200 hover:border-rose-500/30 flex flex-col justify-between ${
                isDark ? 'bg-white/5 border-white/5 hover:bg-white/[0.07]' : 'bg-slate-50 border-slate-200 hover:bg-white'
              }`}>
                <div className="flex items-center justify-between gap-1.5 font-sans">
                  <span className="text-xs font-semibold text-slate-300">EGT Exhaust (T50)</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20">
                    Station 50
                  </span>
                </div>
                <div className="my-2 flex items-baseline gap-1.5 font-sans">
                  <span className="text-2xl font-black text-rose-400 tracking-tight">
                    {tel.T50_LPT_Temp_R || 1405.2}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">°R</span>
                </div>
                <div className="pt-2 border-t border-white/5 dark:border-white/5 flex items-center justify-between text-[11px] font-sans">
                  <span className="text-slate-400">Nominal:</span>
                  <span className="font-semibold text-slate-300">1405.2 °R</span>
                </div>
              </div>

              {/* Sensor 5: Fan Speed */}
              <div className={`p-4 rounded-2xl border transition-all duration-200 hover:border-sky-500/30 flex flex-col justify-between ${
                isDark ? 'bg-white/5 border-white/5 hover:bg-white/[0.07]' : 'bg-slate-50 border-slate-200 hover:bg-white'
              }`}>
                <div className="flex items-center justify-between gap-1.5 font-sans">
                  <span className="text-xs font-semibold text-slate-300">Fan Speed (Nf)</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    Rotor
                  </span>
                </div>
                <div className="my-2 flex items-baseline gap-1.5 font-sans">
                  <span className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {tel.Nf_Fan_RPM || 2388.1}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">RPM</span>
                </div>
                <div className="pt-2 border-t border-white/5 dark:border-white/5 flex items-center justify-between text-[11px] font-sans">
                  <span className="text-slate-400">Core Nc:</span>
                  <span className="font-semibold text-slate-300">{tel.Nc_Core_RPM || 9050.5} RPM</span>
                </div>
              </div>

              {/* Sensor 6: Bypass Ratio */}
              <div className={`p-4 rounded-2xl border transition-all duration-200 hover:border-emerald-500/30 flex flex-col justify-between ${
                isDark ? 'bg-white/5 border-white/5 hover:bg-white/[0.07]' : 'bg-slate-50 border-slate-200 hover:bg-white'
              }`}>
                <div className="flex items-center justify-between gap-1.5 font-sans">
                  <span className="text-xs font-semibold text-slate-300">Bypass Ratio (BPR)</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    Aero
                  </span>
                </div>
                <div className="my-2 flex items-baseline gap-1.5 font-sans">
                  <span className="text-2xl font-black text-emerald-400 tracking-tight">
                    {tel.BPR || 8.42}
                  </span>
                </div>
                <div className="pt-2 border-t border-white/5 dark:border-white/5 flex items-center justify-between text-[11px] font-sans">
                  <span className="text-slate-400">Nominal Target:</span>
                  <span className="font-semibold text-slate-300">8.42</span>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Right (1 col): In-Flight RLS Sensor Drift Adaptation */}
        <GlassCard className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 dark:border-white/5 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/25 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`font-bold text-sm tracking-tight font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    RLS Drift Adaptation Filter
                  </h3>
                  <p className="text-[11px] text-slate-400 font-sans">Real-time sensor gain & bias tracking</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30 font-sans">
                Active
              </span>
            </div>

            <div className="space-y-3 font-sans">
              <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">Filter Calibration State</span>
                  <p className="font-bold text-xs text-sky-400 mt-0.5">
                    {drift.drift_type || 'Calibrated RLS State'}
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 font-medium border border-sky-500/20">
                  Locked
                </span>
              </div>

              <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">Online Adaptation Status</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${drift.rls_drift_active ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                    <span className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      {drift.rls_drift_active ? 'Active Residual Compensation' : 'Nominal Gain (No Drift)'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-medium border border-emerald-500/25">
                  Gain D=1.0
                </span>
              </div>

              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Recursive Least Squares continuously tracks sensor gain variations. When sensor drift is detected on Station 30, the filter compensates residuals in real time to prevent false engine grounding.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 dark:border-white/5 flex items-center justify-between text-xs font-sans">
            <span className="text-slate-400 font-normal">Aerospace Protocol</span>
            <span className="text-slate-300 font-semibold">MoD SIH26249 Prognostic Loop</span>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
