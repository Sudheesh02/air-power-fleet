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

const BASE_URL = 'http://127.0.0.1:8000';
const TIMEOUT_MS = 2500;

let isBackendReachable = null;

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    isBackendReachable = true;
    return await res.json();
  } catch (err) {
    clearTimeout(id);
    isBackendReachable = false;
    throw err;
  }
}

export const fleetApi = {
  getBackendStatus: () => isBackendReachable,

  // 1. Fleet Readiness
  async getFleetReadiness() {
    try {
      const data = await fetchWithTimeout(`${BASE_URL}/api/fleet/readiness`);
      return { data, isLive: true };
    } catch {
      return { data: MOCK_FLEET_READINESS, isLive: false };
    }
  },

  // 2. Fleet Aircraft List
  async getFleetAircraft() {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/api/fleet/aircraft`);
      // Prefer live backend digital twin health scores and RUL
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
      // High fidelity offline simulation
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
        reasons.push(`Aircraft ${tailNo} is currently grounded for high-priority gas path wear.`);
        recommendations.push('Immediate hangar induction. Do not clear for flight.');
      } else if (conservativeRul < requiredMargin) {
        decision = 'NO_GO';
        clearanceCode = 'INSUFFICIENT_RUL_MARGIN';
        reasons.push(`Conservative remaining flight life (${conservativeRul}h) is below required mission margin (${requiredMargin}h for ${durationHours}h ${sortieType}).`);
        recommendations.push('Reassign sortie to another squadron tail; schedule proactive maintenance.');
      } else if (twin.stages.hpc.health_pct < 55.0 || twin.stages.lpt.health_pct < 55.0) {
        decision = 'CONDITIONAL_GO';
        clearanceCode = 'RESTRICTED_COMBAT_ENVELOPE';
        reasons.push('Compressor/Turbine degradation detected above caution threshold.');
        recommendations.push('Cleared for subsonic cruise only. Avoid sustained afterburner.');
      } else {
        reasons.push(`All 5 gas-path stages nominal. Healthy RUL margin (${conservativeRul}h available vs ${requiredMargin}h required).`);
        recommendations.push('Cleared for full flight envelope.');
      }

      const isDegraded = isGrounded || (conservativeRul < 40.0) || (twin.stages.hpc?.health_pct < 65.0) || (twin.stages.lpt?.health_pct < 65.0);

      const sparesStatus = isDegraded ? {
        critical_subsystem: isGrounded ? 'HPC' : 'LPT',
        component_name: isGrounded ? 'HPC Rotor Blade Stage 1-3 Set' : 'Turbine Disk Thermal Assembly',
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

  // 5. Trigger Autonomous Triage Dispatch
  async dispatchTriage(tailNo) {
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
          order_id: `WO-${tailNo}-1015-AUTO`,
          tail_no: tailNo,
          severity_label: 'CRITICAL_AOG',
          action_required: `AOG EMERGENCY: Critical LRU requisition raised to Central Depot for tail ${tailNo}. Priority dispatch in transit.`,
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
      return { data, isLive: true };
    } catch {
      return {
        data: {
          base_spares: MOCK_BASE_SPARES,
          depot_pipeline: MOCK_DEPOT_PIPELINE
        },
        isLive: false
      };
    }
  },

  // 7. Work Orders
  async getWorkOrders() {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/api/work-orders`);
      return { data: res.work_orders, isLive: true };
    } catch {
      return { data: MOCK_WORK_ORDERS, isLive: false };
    }
  },

  async updateWorkOrder(orderId, updates) {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/api/work-orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      return { data: res.work_order, isLive: true };
    } catch {
      return { isLive: false };
    }
  },

  async createEmergencyRequisition(requisition) {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/api/logistics/requisition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requisition)
      });
      return { data: res.requisition, isLive: true };
    } catch {
      return { isLive: false };
    }
  },

  // 8. Flight Logs
  async getFlightLogs(tailNo) {
    try {
      const url = tailNo ? `${BASE_URL}/api/aircraft/${tailNo}` : `${BASE_URL}/api/flight-logs`;
      const res = await fetchWithTimeout(url);
      const rawLogs = tailNo ? (res.recent_flight_logs || []) : (res.flight_logs || []);
      // Automatically enrich with mock NLP multi-modal telemetry fusion object if present
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
    return MOCK_AI_REORDER_TRIGGERS;
  }
};
