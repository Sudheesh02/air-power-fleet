import {
  MOCK_FLEET_READINESS,
  MOCK_AIRCRAFT_LIST,
  getMockDigitalTwin,
  MOCK_BASE_SPARES,
  MOCK_DEPOT_PIPELINE,
  MOCK_WORK_ORDERS,
  MOCK_FLIGHT_LOGS,
  MOCK_TELEMETRY_TREND,
  MOCK_FAULT_TIMELINE,
  MOCK_FAILURE_HEATMAP,
  MOCK_AI_REORDER_TRIGGERS
} from '../data/mockFleetData';


// Mobile port of frontend_app/src/api/fleetApi.js.
// Live backend when configured; bundled mock data (demo mode) otherwise. No API keys here.
let BASE_URL = 'http://127.0.0.1:8000';
let DEMO_MODE = true;
const INITIAL_TIMEOUT_MS = 2500;
const ACTIVE_TIMEOUT_MS = 6000;
const RETRY_COOLDOWN_MS = 15000;
let isBackendReachable = null;
let lastFailedTimestamp = 0;

export function configureApi({ baseUrl, demoMode }) {
  if (typeof baseUrl === 'string') BASE_URL = baseUrl.replace(/\/+$/, '');
  if (typeof demoMode === 'boolean') DEMO_MODE = demoMode;
  isBackendReachable = null;
  lastFailedTimestamp = 0;
}
export function getApiConfig() {
  return { baseUrl: BASE_URL, demoMode: DEMO_MODE };
}

// In-memory session state so triage dispatches, requisitions and work order edits persist across tabs.
let sessionWorkOrders = [...MOCK_WORK_ORDERS];
let sessionDepotPipeline = [...MOCK_DEPOT_PIPELINE];
let sessionAiTriggers = [...MOCK_AI_REORDER_TRIGGERS];
function savePersistedState() {}
const STORAGE_KEYS = { WORK_ORDERS: 'wo', DEPOT_PIPELINE: 'dp', AI_TRIGGERS: 'ai' };

async function fetchWithTimeout(url, options = {}) {
  if (DEMO_MODE || !BASE_URL) {
    isBackendReachable = false;
    throw new Error('Demo mode: using bundled fleet data');
  }
  if (isBackendReachable === false && Date.now() - lastFailedTimestamp < RETRY_COOLDOWN_MS) {
    throw new Error('Backend offline cooldown');
  }
  const timeoutMs = isBackendReachable === true ? ACTIVE_TIMEOUT_MS : INITIAL_TIMEOUT_MS;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    isBackendReachable = true;
    return await res.json();
  } catch (err) {
    clearTimeout(id);
    isBackendReachable = false;
    lastFailedTimestamp = Date.now();
    throw err;
  }
}

export const fleetApi = {
  getBackendStatus: () => isBackendReachable,

  async synthesize(text, speaker) {
    const res = await fetchWithTimeout(`${BASE_URL}/api/voice/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, speaker })
    });
    return res;
  },

  // 1. Fleet Readiness
  async getFleetReadiness() {
    try {
      const data = await fetchWithTimeout(`${BASE_URL}/api/fleet/readiness`);
      return { data, isLive: true };
    } catch {
      return {
        data: {
          ...MOCK_FLEET_READINESS,
          active_depot_requisitions: sessionDepotPipeline.length
        },
        isLive: false
      };
    }
  },

  // 2. Fleet Aircraft List
  async getFleetAircraft() {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/api/fleet/aircraft`);
      const aircraft = res.aircraft.map(ac => {
        const mock = MOCK_AIRCRAFT_LIST.find(m => m.tail_no === ac.tail_no);
        return {
          ...ac,
          health_score: ac.health_score ?? (mock ? mock.health_score : 85.0),
          rul_hours: ac.rul_hours ?? (mock ? mock.rul_hours : 100.0),
          conservative_rul_hours: ac.conservative_rul_hours ?? (mock ? mock.conservative_rul_hours : 85.0),
          next_fault: ac.next_fault ?? (mock ? mock.next_fault : 'Standard Inspection')
        };
      });
      return { data: aircraft, isLive: true };
    } catch {
      return { data: MOCK_AIRCRAFT_LIST, isLive: false };
    }
  },

  // 3. Aircraft Digital Twin
  async getAircraftDigitalTwin(tailNo) {
    try {
      const data = await fetchWithTimeout(`${BASE_URL}/api/aircraft/${tailNo}/digital-twin`);
      return { data, isLive: true };
    } catch {
      return { data: getMockDigitalTwin(tailNo), isLive: false };
    }
  },

  // 4. Sortie Feasibility Evaluation
  async evaluateSortie(tailNo, sortieType, durationHours) {
    try {
      const data = await fetchWithTimeout(`${BASE_URL}/api/sortie/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tail_no: tailNo,
          sortie_type: sortieType,
          duration_hours: durationHours
        })
      });
      return { data, isLive: true };
    } catch {
      const twin = getMockDigitalTwin(tailNo);
      const isGrounded = twin.status === 'MAINTENANCE_GROUNDED';
      const multipliers = {
        'Combat Air Patrol (CAP)': 1.6,
        'Tactical Intercept': 1.5,
        'Reconnaissance': 1.3,
        'Combat Training': 1.25
      };
      const multiplier = multipliers[sortieType] || 1.35;
      const requiredMargin = Number((durationHours * multiplier).toFixed(1));
      const conservativeRul = twin.prognostics.conservative_rul_hours;

      let decision = 'MISSION_GO';
      let clearanceCode = 'UNRESTRICTED_COMBAT_CLEARED';
      let reasons = [];
      let recommendations = [];

      if (isGrounded) {
        decision = 'NO_GO';
        clearanceCode = 'GROUNDED_CRITICAL_WEAR';
        reasons.push(`Aircraft ${tailNo} is currently grounded for high-priority gas path wear (${twin.wear_mode}).`);
        recommendations.push('Immediate hangar induction. Do not clear for flight.');
      } else if (conservativeRul < requiredMargin) {
        decision = 'NO_GO';
        clearanceCode = 'INSUFFICIENT_RUL_MARGIN';
        reasons.push(`Conservative remaining flight life (${conservativeRul}h) is below required mission margin (${requiredMargin}h for ${durationHours}h ${sortieType}).`);
        recommendations.push('Reassign sortie to another squadron tail; schedule proactive maintenance.');
      } else if (
        twin.stages.hpc.health_pct < 60.0 ||
        twin.stages.lpt.health_pct < 60.0 ||
        twin.stages.lpc.health_pct < 60.0
      ) {
        decision = 'CONDITIONAL_GO';
        clearanceCode = 'RESTRICTED_COMBAT_ENVELOPE';
        reasons.push('Compressor/Turbine degradation detected above caution threshold.');
        recommendations.push('Cleared for subsonic cruise only. Avoid sustained afterburner.');
      } else {
        reasons.push(`All 5 gas-path stages nominal. Healthy RUL margin (${conservativeRul}h available vs ${requiredMargin}h required).`);
        recommendations.push('Cleared for full flight envelope.');
      }

      const isDegraded =
        isGrounded ||
        conservativeRul < 40.0 ||
        twin.stages.hpc?.health_pct < 65.0 ||
        twin.stages.lpt?.health_pct < 65.0 ||
        twin.stages.lpc?.health_pct < 65.0;

      let criticalSub = 'HPC';
      let compName = 'HPC Rotor Blade Stage 1-3 Set';
      if (tailNo === 'KH-204' || twin.stages.lpc?.health_pct < 50) {
        criticalSub = 'LPC / Fuel System';
        compName = 'Digital High Pressure Fuel Pump';
      } else if (tailNo === 'RB-004' || twin.stages.lpt?.health_pct < 50) {
        criticalSub = 'LPT';
        compName = 'Turbine Disk Thermal Assembly';
      }

      const sparesStatus = isDegraded ? {
        critical_subsystem: criticalSub,
        component_name: compName,
        quantity_on_hand: isGrounded ? 0 : 2,
        safety_threshold: 2,
        stock_sufficient: !isGrounded,
        supply_alert: isGrounded ? 'STOCK_EXHAUSTED_AOG_RISK' : 'STOCK_OPTIMAL'
      } : {
        critical_subsystem: 'None (All Stages Nominal)',
        component_name: 'Nominal - Zero Critical LRUs Required',
        quantity_on_hand: 5,
        safety_threshold: 2,
        stock_sufficient: true,
        supply_alert: 'NO_LRU_REQUIRED_NOMINAL'
      };

      return {
        data: {
          tail_no: tailNo,
          aircraft_type: twin.aircraft_type,
          squadron: twin.squadron,
          base_station: twin.base_station,
          mission_requested: {
            sortie_type: sortieType,
            planned_duration_hours: durationHours,
            required_margin_hours: requiredMargin
          },
          prognostic_state: {
            overall_health_pct: twin.overall_health_pct,
            conservative_rul_hours: conservativeRul,
            predicted_mean_hours: twin.prognostics.predicted_rul_hours
          },
          decision,
          clearance_code: clearanceCode,
          reasons,
          recommendations,
          spares_status: sparesStatus
        },
        isLive: false
      };
    }
  },

  // 5. Trigger Autonomous Triage Dispatch (Persists across Work Orders & Spares tabs!)
  async dispatchTriage(tailNo) {
    const twin = getMockDigitalTwin(tailNo);
    const timeSuffix = String(new Date().getMinutes()).padStart(2, '0') + String(new Date().getSeconds()).padStart(2, '0');
    const generatedOrderId = `WO-${tailNo}-${timeSuffix}-AUTO`;
    const generatedReqId = `REQ-2026-${tailNo}-AUTO`;

    let faultSubsystem = 'HPC (High Pressure Compressor)';
    let componentName = 'HPC Rotor Blade Stage 1-3 Set';
    let depotSource = 'Central IAF Depot No. 3 (Chandigarh)';

    if (tailNo.startsWith('KH')) {
      faultSubsystem = 'LPC & Digital Fuel Metering';
      componentName = 'Digital High Pressure Fuel Pump';
      depotSource = 'HAL Engine Division Depot (Bengaluru)';
    } else if (tailNo.startsWith('RB')) {
      faultSubsystem = 'LPT (Low Pressure Turbine Disk)';
      componentName = 'Turbine Disk Thermal Assembly';
      depotSource = 'Central Technical Depot (Gwalior)';
    } else if (tailNo.startsWith('IA')) {
      faultSubsystem = 'Transmission & Turboshaft Isolator';
      componentName = 'TM333 Vibration Isolator Bushing Set';
      depotSource = 'HAL Rotary Wing Depot (Bengaluru)';
    }

    const actionText = `AOG EMERGENCY: Autonomous triage dispatched for ${tailNo} (${twin.wear_mode}). Priority requisition ${generatedReqId} transmitted to ${depotSource}.`;

    const newWorkOrder = {
      order_id: generatedOrderId,
      tail_no: tailNo,
      aircraft_type: twin.aircraft_type,
      squadron: twin.squadron,
      base_station: twin.base_station,
      severity_tier: 3,
      severity_label: 'CRITICAL_AOG',
      fault_subsystem: faultSubsystem,
      predicted_rul: twin.prognostics.predicted_rul_hours,
      lower_bound_rul: twin.prognostics.conservative_rul_hours,
      action_required: actionText,
      spares_allocated: 0,
      status: 'AWAITING_SPARES',
      technician: 'Sqn Ldr R. Sharma (Auto-Assigned)',
      hangar_bay: 'Hangar Bay 01 (Priority AOG Induction)',
      required_tooling: 'Borescope NDT Rig, OEM Line Replacement Kit',
      linked_requisition: generatedReqId,
      created_at: 'Just now'
    };

    const newRequisition = {
      req_id: generatedReqId,
      tail_no: tailNo,
      base_station: twin.base_station,
      component_name: componentName,
      priority: 'CRITICAL_AOG',
      status: 'IN_TRANSIT',
      eta_hours: 6,
      created_at: 'Just now',
      depot_source: depotSource,
      transit_mode: 'IAF C-130J Autonomous Scramble Airlift',
      tat_elapsed_hours: 0.5,
      tat_target_hours: 12.0,
      tracking_steps: [
        { step: 'Autonomous AI Triage Requisition Raised', done: true, time: 'Just now' },
        { step: 'Depot Allocation & Quality Clearance', done: true, time: 'Immediate' },
        { step: 'Air Transit En Route to Base', done: true, time: 'In Flight (ETA 6h)' },
        { step: 'Forward Base Handover & Hangar Fit', done: false, time: 'Scheduled +6h' }
      ]
    };

    // Persist to session state so Kanban & Spares tabs immediately display the new dispatch
    sessionWorkOrders = [
      newWorkOrder,
      ...sessionWorkOrders.filter(w => w.order_id !== generatedOrderId)
    ];
    savePersistedState(STORAGE_KEYS.WORK_ORDERS, sessionWorkOrders);

    sessionDepotPipeline = [
      newRequisition,
      ...sessionDepotPipeline.filter(r => r.req_id !== generatedReqId)
    ];
    savePersistedState(STORAGE_KEYS.DEPOT_PIPELINE, sessionDepotPipeline);

    try {
      const data = await fetchWithTimeout(`${BASE_URL}/api/triage/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tail_no: tailNo })
      });
      return { data, isLive: true };
    } catch {
      return {
        data: {
          order_id: generatedOrderId,
          requisition_id: generatedReqId,
          tail_no: tailNo,
          severity_label: 'CRITICAL_AOG',
          action_required: actionText,
          spares_allocated: false,
          order_status: 'AWAITING_SPARES'
        },
        isLive: false
      };
    }
  },

  // 6. Logistics Inventory & Spares
  async getLogisticsInventory() {
    try {
      const data = await fetchWithTimeout(`${BASE_URL}/api/logistics/inventory`);
      // Merge any newly dispatched session requisitions with live depot pipeline
      const existingIds = new Set((data.depot_pipeline || []).map(r => r.req_id));
      const mergedPipeline = [
        ...sessionDepotPipeline.filter(r => !existingIds.has(r.req_id)),
        ...(data.depot_pipeline || [])
      ];
      return {
        data: {
          base_spares: data.base_spares,
          depot_pipeline: mergedPipeline
        },
        isLive: true
      };
    } catch {
      return {
        data: {
          base_spares: MOCK_BASE_SPARES,
          depot_pipeline: sessionDepotPipeline
        },
        isLive: false
      };
    }
  },

  // 7. Work Orders
  async getWorkOrders() {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/api/work-orders`);
      const existingIds = new Set((res.work_orders || []).map(w => w.order_id));
      const mergedOrders = [
        ...sessionWorkOrders.filter(w => !existingIds.has(w.order_id)),
        ...(res.work_orders || [])
      ];
      return { data: mergedOrders, isLive: true };
    } catch {
      return { data: sessionWorkOrders, isLive: false };
    }
  },

  async updateWorkOrder(orderId, updates) {
    sessionWorkOrders = sessionWorkOrders.map(wo =>
      wo.order_id === orderId ? { ...wo, ...updates } : wo
    );
    savePersistedState(STORAGE_KEYS.WORK_ORDERS, sessionWorkOrders);

    try {
      const res = await fetchWithTimeout(`${BASE_URL}/api/work-orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      return { data: res.work_order, isLive: true };
    } catch {
      const updated = sessionWorkOrders.find(wo => wo.order_id === orderId);
      return { data: updated, isLive: false };
    }
  },

  async createEmergencyRequisition(requisition) {
    const newReq = {
      req_id: requisition.req_id || `REQ-${Math.floor(1000 + Math.random() * 9000)}-EMG`,
      tail_no: requisition.tail_no,
      base_station: requisition.base_station,
      component_name: requisition.component_name,
      priority: requisition.priority || 'CRITICAL_AOG',
      status: requisition.status || 'IN_TRANSIT',
      eta_hours: requisition.eta_hours || 12,
      created_at: 'Just now',
      depot_source: requisition.depot_source || 'Central IAF Depot (Air Express)',
      transit_mode: requisition.transit_mode || 'Dedicated Logistics Airlift',
      tat_elapsed_hours: 1.0,
      tat_target_hours: 24.0,
      tracking_steps: [
        { step: 'Requisition Raised by Commander', done: true, time: 'Just now' },
        { step: 'Depot Allocation & Quality Clearance', done: true, time: 'Immediate' },
        { step: 'Air Transit En Route to Base', done: true, time: 'In Transit' },
        { step: 'Forward Base Handover & Hangar Fit', done: false, time: 'Pending' }
      ]
    };

    sessionDepotPipeline = [newReq, ...sessionDepotPipeline];
    savePersistedState(STORAGE_KEYS.DEPOT_PIPELINE, sessionDepotPipeline);

    try {
      const res = await fetchWithTimeout(`${BASE_URL}/api/logistics/requisition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requisition)
      });
      return { data: res.requisition, isLive: true };
    } catch {
      return { data: newReq, isLive: false };
    }
  },

  // 8. Flight Logs
  async getFlightLogs(tailNo) {
    try {
      const url = tailNo ? `${BASE_URL}/api/aircraft/${tailNo}` : `${BASE_URL}/api/flight-logs`;
      const res = await fetchWithTimeout(url);
      const rawLogs = tailNo ? (res.recent_flight_logs || []) : (res.flight_logs || []);
      const enriched = rawLogs.map(log => {
        const mockLog = MOCK_FLIGHT_LOGS.find(m => m.tail_no === log.tail_no || m.log_id === log.log_id);
        return {
          ...log,
          nlp_fusion: log.nlp_fusion || (mockLog ? mockLog.nlp_fusion : null)
        };
      });
      return { data: enriched.length > 0 ? enriched : MOCK_FLIGHT_LOGS, isLive: true };
    } catch {
      const filtered = tailNo
        ? MOCK_FLIGHT_LOGS.filter(l => l.tail_no === tailNo)
        : MOCK_FLIGHT_LOGS;
      return { data: filtered.length > 0 ? filtered : MOCK_FLIGHT_LOGS, isLive: false };
    }
  },

  // 9. Telemetry Trends
  getTelemetryTrends() {
    return MOCK_TELEMETRY_TREND;
  },

  // 10. Fault Prediction Timeline
  getFaultTimeline() {
    return MOCK_FAULT_TIMELINE;
  },

  // 11. Failure Probability Heatmaps
  getFailureHeatmap() {
    return MOCK_FAILURE_HEATMAP;
  },

  // 12. Automated AI Reorder Triggers
  getAiReorderTriggers() {
    return sessionAiTriggers;
  },

  approveAiReorderTrigger(triggerId) {
    sessionAiTriggers = sessionAiTriggers.map(t =>
      t.trigger_id === triggerId ? { ...t, status: 'APPROVED_DISPATCHED' } : t
    );
    savePersistedState(STORAGE_KEYS.AI_TRIGGERS, sessionAiTriggers);
    return sessionAiTriggers;
  }
};
