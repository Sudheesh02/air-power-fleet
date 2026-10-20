import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fleetApi } from '../api/fleetApi';
import { useSettings } from './settings';

const useKey = () => {
  const { s } = useSettings();
  return [s.demoMode ? 'demo' : s.backendUrl];
};

export const useReadiness = () => { const k = useKey(); return useQuery({ queryKey: ['readiness', ...k], queryFn: () => fleetApi.getFleetReadiness() }); };
export const useAircraft = () => { const k = useKey(); return useQuery({ queryKey: ['aircraft', ...k], queryFn: () => fleetApi.getFleetAircraft() }); };
export const useTwin = (tail: string) => { const k = useKey(); return useQuery({ queryKey: ['twin', tail, ...k], queryFn: () => fleetApi.getAircraftDigitalTwin(tail), enabled: !!tail }); };
export const useLogs = (tail?: string) => { const k = useKey(); return useQuery({ queryKey: ['logs', tail || 'all', ...k], queryFn: () => fleetApi.getFlightLogs(tail) }); };
export const useInventory = () => { const k = useKey(); return useQuery({ queryKey: ['inventory', ...k], queryFn: () => fleetApi.getLogisticsInventory() }); };
export const useWorkOrders = () => { const k = useKey(); return useQuery({ queryKey: ['workorders', ...k], queryFn: () => fleetApi.getWorkOrders() }); };

export function useInvalidateOps() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['workorders'] });
    qc.invalidateQueries({ queryKey: ['inventory'] });
    qc.invalidateQueries({ queryKey: ['readiness'] });
  };
}

export function useUpdateWorkOrder() {
  const inv = useInvalidateOps();
  return useMutation({ mutationFn: (v: { id: string; u: Record<string, any> }) => fleetApi.updateWorkOrder(v.id, v.u), onSuccess: inv });
}

/** Normalised readiness counts derived from the aircraft list (falls back to the readiness endpoint). */
export function fleetCounts(list: any[] | undefined, readiness?: any) {
  if (list && list.length) {
    const mc = list.filter((a) => a.status === 'MISSION_CAPABLE').length;
    const deg = list.filter((a) => a.status === 'CONDITIONAL_STANDBY').length;
    const gr = list.filter((a) => a.status === 'MAINTENANCE_GROUNDED').length;
    return { total: list.length, mc, deg, gr, pct: Math.round((mc / list.length) * 100) };
  }
  const r = readiness || {};
  return {
    total: r.total_aircraft || 0, mc: r.mission_capable_aircraft || 0, deg: r.conditional_standby_aircraft || 0,
    gr: r.maintenance_grounded_aircraft || 0, pct: Math.round(r.mission_capable_rate_pct || 0),
  };
}
