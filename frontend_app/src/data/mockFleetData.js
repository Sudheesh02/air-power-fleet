// High-fidelity defense dataset mirroring SQLite DB, 5 Stage Gas Path Digital Twin & IAF Fleet Operations

export const SQUADRONS = [
  { id: 'ALL', name: 'All IAF Squadrons & Units', code: 'ALL_SQUADRONS', base: 'National Aerospace Command' },
  { id: 'No. 222 Tigersharks', name: 'Su-30MKI · No. 222 "Tigersharks"', code: 'SU-30MKI', base: 'AFS Thanjavur' },
  { id: 'No. 45 Flying Daggers', name: 'Tejas Mk1A · No. 45 "Flying Daggers"', code: 'TEJAS_MK1A', base: 'AFS Sulur' },
  { id: 'No. 17 Golden Arrows', name: 'Rafale · No. 17 "Golden Arrows"', code: 'RAFALE_DH', base: 'AFS Ambala' },
  { id: 'No. 81 Skylords', name: 'C-17 Globemaster · No. 81 "Skylords"', code: 'C-17', base: 'AFS Hindan' },
  { id: 'No. 116 Helicopter Unit', name: 'ALH Rudra / Dhruv · No. 116 "Tankbusters"', code: 'ALH_DHRUV', base: 'AFS Jodhpur' }
];

export const MOCK_AIRCRAFT_LIST = [
  // Tigersharks (Su-30MKI) - AFS Thanjavur
  {
    tail_no: 'SB-021',
    aircraft_type: 'Su-30MKI Twin-Jet Air Superiority',
    squadron: "No. 222 'Tigersharks'",
    base_station: 'AFS Thanjavur',
    airframe_hours: 1420.5,
    engine_serial: 'AL31FP-8812',
    status: 'MISSION_CAPABLE',
    health_score: 80.3,
    rul_hours: 102.1,
    next_fault: 'LPT Thermal Creep',
    vibration_index: 0.32,
    oil_pressure_psi: 49.2,
    egt_celsius: 755
  },
  {
    tail_no: 'SB-022',
    aircraft_type: 'Su-30MKI Twin-Jet Air Superiority',
    squadron: "No. 222 'Tigersharks'",
    base_station: 'AFS Thanjavur',
    airframe_hours: 1890.2,
    engine_serial: 'AL31FP-8815',
    status: 'MISSION_CAPABLE',
    health_score: 76.5,
    rul_hours: 88.4,
    next_fault: 'HPC Tip Clearance',
    vibration_index: 0.38,
    oil_pressure_psi: 47.8,
    egt_celsius: 772
  },
  {
    tail_no: 'SB-023',
    aircraft_type: 'Su-30MKI Twin-Jet Air Superiority',
    squadron: "No. 222 'Tigersharks'",
    base_station: 'AFS Thanjavur',
    airframe_hours: 2150.0,
    engine_serial: 'AL31FP-8819',
    status: 'CONDITIONAL_STANDBY',
    health_score: 62.4,
    rul_hours: 42.0,
    next_fault: 'Compressor fouling & RLS sensor gain drift',
    vibration_index: 0.54,
    oil_pressure_psi: 43.1,
    egt_celsius: 810
  },
  {
    tail_no: 'SB-024',
    aircraft_type: 'Su-30MKI Twin-Jet Air Superiority',
    squadron: "No. 222 'Tigersharks'",
    base_station: 'AFS Thanjavur',
    airframe_hours: 2310.8,
    engine_serial: 'AL31FP-8822',
    status: 'MAINTENANCE_GROUNDED',
    health_score: 21.2,
    rul_hours: 14.5,
    next_fault: 'HPC Rotor Stage 1-3 blade tip degradation & micro-cracking',
    vibration_index: 0.94,
    oil_pressure_psi: 32.4,
    egt_celsius: 852
  },
  {
    tail_no: 'SB-025',
    aircraft_type: 'Su-30MKI Twin-Jet Air Superiority',
    squadron: "No. 222 'Tigersharks'",
    base_station: 'AFS Thanjavur',
    airframe_hours: 980.4,
    engine_serial: 'AL31FP-8830',
    status: 'MISSION_CAPABLE',
    health_score: 89.2,
    rul_hours: 135.0,
    next_fault: 'Combustor Liner Coking',
    vibration_index: 0.24,
    oil_pressure_psi: 51.0,
    egt_celsius: 735
  },
  {
    tail_no: 'SB-026',
    aircraft_type: 'Su-30MKI Twin-Jet Air Superiority',
    squadron: "No. 222 'Tigersharks'",
    base_station: 'AFS Thanjavur',
    airframe_hours: 1640.1,
    engine_serial: 'AL31FP-8834',
    status: 'MISSION_CAPABLE',
    health_score: 78.8,
    rul_hours: 94.2,
    next_fault: 'Fan Stator Aerodynamic Loss',
    vibration_index: 0.35,
    oil_pressure_psi: 48.1,
    egt_celsius: 760
  },

  // Flying Daggers (Tejas Mk1A) - AFS Sulur
  {
    tail_no: 'KH-201',
    aircraft_type: 'Tejas Mk1A Light Combat Aircraft',
    squadron: "No. 45 'Flying Daggers'",
    base_station: 'AFS Sulur',
    airframe_hours: 650.0,
    engine_serial: 'F404-IN20-101',
    status: 'MISSION_CAPABLE',
    health_score: 91.5,
    rul_hours: 148.0,
    next_fault: 'Digital HP Fuel Pump',
    vibration_index: 0.21,
    oil_pressure_psi: 52.4,
    egt_celsius: 720
  },
  {
    tail_no: 'KH-202',
    aircraft_type: 'Tejas Mk1A Light Combat Aircraft',
    squadron: "No. 45 'Flying Daggers'",
    base_station: 'AFS Sulur',
    airframe_hours: 820.5,
    engine_serial: 'F404-IN20-104',
    status: 'MISSION_CAPABLE',
    health_score: 87.0,
    rul_hours: 128.5,
    next_fault: 'LPC Vane Tip Rub',
    vibration_index: 0.26,
    oil_pressure_psi: 50.1,
    egt_celsius: 742
  },
  {
    tail_no: 'KH-203',
    aircraft_type: 'Tejas Mk1A Light Combat Aircraft',
    squadron: "No. 45 'Flying Daggers'",
    base_station: 'AFS Sulur',
    airframe_hours: 1120.4,
    engine_serial: 'F404-IN20-108',
    status: 'CONDITIONAL_STANDBY',
    health_score: 65.1,
    rul_hours: 68.0,
    next_fault: 'FADEC Channel B Drift',
    vibration_index: 0.49,
    oil_pressure_psi: 44.2,
    egt_celsius: 798
  },
  {
    tail_no: 'KH-204',
    aircraft_type: 'Tejas Mk1A Light Combat Aircraft',
    squadron: "No. 45 'Flying Daggers'",
    base_station: 'AFS Sulur',
    airframe_hours: 1340.2,
    engine_serial: 'F404-IN20-112',
    status: 'MAINTENANCE_GROUNDED',
    health_score: 28.5,
    rul_hours: 18.2,
    next_fault: 'Digital High Pressure Fuel Pump valve pressure oscillation',
    vibration_index: 0.88,
    oil_pressure_psi: 34.0,
    egt_celsius: 840
  },
  {
    tail_no: 'KH-205',
    aircraft_type: 'Tejas Mk1A Light Combat Aircraft',
    squadron: "No. 45 'Flying Daggers'",
    base_station: 'AFS Sulur',
    airframe_hours: 510.8,
    engine_serial: 'F404-IN20-115',
    status: 'MISSION_CAPABLE',
    health_score: 94.2,
    rul_hours: 156.4,
    next_fault: 'Thermocouple Harness Degradation',
    vibration_index: 0.18,
    oil_pressure_psi: 53.5,
    egt_celsius: 710
  },
  {
    tail_no: 'KH-206',
    aircraft_type: 'Tejas Mk1A Light Combat Aircraft',
    squadron: "No. 45 'Flying Daggers'",
    base_station: 'AFS Sulur',
    airframe_hours: 730.0,
    engine_serial: 'F404-IN20-119',
    status: 'MISSION_CAPABLE',
    health_score: 88.6,
    rul_hours: 132.0,
    next_fault: 'HPC Outlet Stator Seal',
    vibration_index: 0.25,
    oil_pressure_psi: 50.8,
    egt_celsius: 738
  },

  // Golden Arrows (Rafale DH) - AFS Ambala
  {
    tail_no: 'RB-001',
    aircraft_type: 'Rafale Omnirole Combat Fighter',
    squadron: "No. 17 'Golden Arrows'",
    base_station: 'AFS Ambala',
    airframe_hours: 940.6,
    engine_serial: 'M88-4E-901',
    status: 'MISSION_CAPABLE',
    health_score: 86.4,
    rul_hours: 122.0,
    next_fault: 'LPT Nozzle Guide Vane',
    vibration_index: 0.27,
    oil_pressure_psi: 49.5,
    egt_celsius: 750
  },
  {
    tail_no: 'RB-002',
    aircraft_type: 'Rafale Omnirole Combat Fighter',
    squadron: "No. 17 'Golden Arrows'",
    base_station: 'AFS Ambala',
    airframe_hours: 1150.3,
    engine_serial: 'M88-4E-905',
    status: 'MISSION_CAPABLE',
    health_score: 83.2,
    rul_hours: 110.5,
    next_fault: 'HPC Rotor Stage 3 Spalling',
    vibration_index: 0.31,
    oil_pressure_psi: 48.6,
    egt_celsius: 765
  },
  {
    tail_no: 'RB-003',
    aircraft_type: 'Rafale Omnirole Combat Fighter',
    squadron: "No. 17 'Golden Arrows'",
    base_station: 'AFS Ambala',
    airframe_hours: 1480.0,
    engine_serial: 'M88-4E-909',
    status: 'CONDITIONAL_STANDBY',
    health_score: 61.8,
    rul_hours: 52.0,
    next_fault: 'LPT Thermocouple harness drift',
    vibration_index: 0.58,
    oil_pressure_psi: 42.8,
    egt_celsius: 815
  },
  {
    tail_no: 'RB-004',
    aircraft_type: 'Rafale Omnirole Combat Fighter',
    squadron: "No. 17 'Golden Arrows'",
    base_station: 'AFS Ambala',
    airframe_hours: 1720.5,
    engine_serial: 'M88-4E-914',
    status: 'MAINTENANCE_GROUNDED',
    health_score: 31.5,
    rul_hours: 22.0,
    next_fault: 'Turbine Disk thermal barrier coating spallation & EGT creep',
    vibration_index: 0.91,
    oil_pressure_psi: 31.8,
    egt_celsius: 860
  },
  {
    tail_no: 'RB-005',
    aircraft_type: 'Rafale Omnirole Combat Fighter',
    squadron: "No. 17 'Golden Arrows'",
    base_station: 'AFS Ambala',
    airframe_hours: 610.2,
    engine_serial: 'M88-4E-918',
    status: 'MISSION_CAPABLE',
    health_score: 92.8,
    rul_hours: 152.0,
    next_fault: 'Afterburner Flame Holder Erosion',
    vibration_index: 0.20,
    oil_pressure_psi: 52.0,
    egt_celsius: 725
  },
  {
    tail_no: 'RB-006',
    aircraft_type: 'Rafale Omnirole Combat Fighter',
    squadron: "No. 17 'Golden Arrows'",
    base_station: 'AFS Ambala',
    airframe_hours: 870.0,
    engine_serial: 'M88-4E-922',
    status: 'MISSION_CAPABLE',
    health_score: 85.0,
    rul_hours: 118.0,
    next_fault: 'Main Fuel Valve Stiction',
    vibration_index: 0.23,
    oil_pressure_psi: 51.4,
    egt_celsius: 738
  },

  // Skylords (C-17 Globemaster III Strategic Heavy Lift)
  {
    tail_no: 'CB-8001',
    aircraft_type: 'C-17 Globemaster III Strategic Transport',
    squadron: "No. 81 'Skylords'",
    base_station: 'AFS Hindon',
    airframe_hours: 3420.0,
    engine_serial: 'F117-PW-100-301',
    status: 'MISSION_CAPABLE',
    health_score: 92.0,
    rul_hours: 180.0,
    next_fault: 'Avionics Cooling Fan Blower',
    vibration_index: 0.29,
    oil_pressure_psi: 54.0,
    egt_celsius: 690
  },

  // Tankbusters (No. 116 Helicopter Unit - ALH Rudra / Dhruv Combat Utility Helicopter)
  {
    tail_no: 'IA-3104',
    aircraft_type: 'ALH Rudra / Dhruv Combat Utility',
    squadron: "No. 116 Helicopter Unit",
    base_station: 'AFS Jodhpur',
    airframe_hours: 1240.2,
    engine_serial: 'TM333-2B2-401',
    status: 'MAINTENANCE_GROUNDED',
    health_score: 24.0,
    rul_hours: 19.4,
    next_fault: 'TM333 Turboshaft vibration isolator bushing set exhausted',
    vibration_index: 0.36,
    oil_pressure_psi: 46.5,
    egt_celsius: 745
  }
];

export const MOCK_FLEET_READINESS = {
  total_aircraft: 20,
  mission_capable_aircraft: 13,
  conditional_standby_aircraft: 3,
  maintenance_grounded_aircraft: 4,
  mission_capable_rate_pct: 65.0,
  target_mc_rate_pct: 75.0,
  mc_status: 'WARNING',
  total_airframe_hours: 26995.7,
  active_depot_requisitions: 2,
  squadrons: [
    { squadron: "Su-30MKI · No. 222 'Tigersharks'", base_station: "AFS Thanjavur", aircraft_type: "Su-30MKI Twin-Jet Air Superiority", total: 6, ready: 4 },
    { squadron: "Tejas Mk1A · No. 45 'Flying Daggers'", base_station: "AFS Sulur", aircraft_type: "Tejas Mk1A Light Combat Aircraft", total: 6, ready: 4 },
    { squadron: "Rafale · No. 17 'Golden Arrows'", base_station: "AFS Ambala", aircraft_type: "Rafale Omnirole Combat Fighter", total: 6, ready: 4 },
    { squadron: "C-17 Globemaster · No. 81 'Skylords'", base_station: "AFS Hindan", aircraft_type: "C-17 Globemaster III Strategic Transport", total: 1, ready: 1 },
    { squadron: "ALH Rudra / Dhruv · No. 116 'Tankbusters'", base_station: "AFS Jodhpur", aircraft_type: "ALH Rudra / Dhruv Combat Utility", total: 1, ready: 0 }
  ]
};

// Multi-Subsystem Digital Twin Generator (Avionics, Propulsion, Hydraulics, Airframe)
export function getMockDigitalTwin(tailNo) {
  const plane = MOCK_AIRCRAFT_LIST.find(a => a.tail_no === tailNo) || MOCK_AIRCRAFT_LIST[0];
  const isGrounded = plane.status === 'MAINTENANCE_GROUNDED';
  const isStandby = plane.status === 'CONDITIONAL_STANDBY';

  // Subsystem Anomaly Scores (0 to 100, where 100 = perfect, lower = anomaly detected)
  const avionicsHealth = isGrounded ? 88.0 : (isStandby ? 72.0 : 96.5);
  const propulsionHealth = plane.health_score;
  const hydraulicsHealth = isGrounded ? 64.0 : (isStandby ? 82.0 : 93.0);
  const airframeHealth = isGrounded ? 58.0 : (isStandby ? 79.0 : 92.0);

  const hpcHealth = isGrounded ? 21.2 : (isStandby ? 52.4 : 84.6);
  const fanHealth = isGrounded ? 58.0 : (isStandby ? 74.2 : 92.1);
  const lpcHealth = isGrounded ? 52.0 : (isStandby ? 71.0 : 88.5);
  const combustorHealth = isGrounded ? 49.0 : (isStandby ? 68.5 : 86.0);
  const lptHealth = isGrounded ? 31.5 : (isStandby ? 58.2 : 82.4);

  // Dynamically compute conformal bounds strictly matching: Mean, 90% Interval [Lower, Upper], Conservative RUL == Lower
  const rulHours = plane.rul_hours ?? (isGrounded ? 18.2 : (isStandby ? 54.8 : 102.1));
  const rulStdHours = Number((rulHours * 0.0815).toFixed(1));
  const confLower = Number(Math.max(0, rulHours - 1.645 * rulStdHours).toFixed(1));
  const confUpper = Number((rulHours + 1.645 * rulStdHours).toFixed(1));
  const conservativeRulHours = confLower;

  return {
    tail_no: plane.tail_no,
    aircraft_type: plane.aircraft_type,
    squadron: plane.squadron,
    base_station: plane.base_station,
    airframe_hours: plane.airframe_hours,
    engine_serial: plane.engine_serial,
    flight_cycle: isGrounded ? 185 : (isStandby ? 142 : 68),
    overall_health_pct: plane.health_score,
    status: plane.status,
    prognostics: {
      predicted_rul_mean_cycles: isGrounded ? 14.5 : (isStandby ? 42.0 : 92.5),
      predicted_rul_hours: rulHours,
      uncertainty_std: rulStdHours,
      conservative_rul_cycles: isGrounded ? 9.1 : (isStandby ? 30.4 : 49.1),
      conservative_rul_hours: conservativeRulHours,
      conformal_interval: [confLower, confUpper]
    },

    // 4 Key Subsystems (Avionics, Propulsion/Engine, Hydraulics, Airframe)
    subsystems: {
      avionics: {
        name: 'Avionics & Mission Computing',
        health_score: avionicsHealth,
        anomaly_score: isGrounded ? 0.12 : (isStandby ? 0.28 : 0.03),
        status: avionicsHealth > 75 ? 'NOMINAL' : (avionicsHealth > 50 ? 'CAUTION' : 'CRITICAL'),
        telemetry: {
          bus_voltage_v: isStandby ? 27.4 : 28.2,
          processor_core_temp_c: isStandby ? 56.4 : 45.2,
          fadec_channel_desync_ms: isStandby ? 0.14 : 0.02,
          radar_t_r_modules_active: isGrounded ? '1482/1536' : '1536/1536'
        },
        diagnostics: isStandby
          ? 'FADEC Channel B resistance deviation flagged during high altitude loiter'
          : 'MIL-STD-1553B / Ethernet bus running at full throughput with zero parity faults'
      },
      propulsion: {
        name: 'Propulsion & Turbofan Gas Path',
        health_score: propulsionHealth,
        anomaly_score: isGrounded ? 0.88 : (isStandby ? 0.46 : 0.12),
        status: propulsionHealth > 75 ? 'NOMINAL' : (propulsionHealth > 50 ? 'CAUTION' : 'CRITICAL'),
        telemetry: {
          exhaust_gas_temperature_c: plane.egt_celsius,
          oil_pressure_psi: plane.oil_pressure_psi,
          vibration_anomaly_index: plane.vibration_index,
          fan_speed_rpm: isGrounded ? 2376 : 2388,
          core_speed_rpm: isGrounded ? 9078 : 9051,
          bypass_ratio: isGrounded ? 8.62 : 8.43
        },
        diagnostics: isGrounded
          ? 'Critical HPC erosion & tip leakage leading to thermal surge at station 50'
          : 'Gas path thermodynamic efficiencies operating inside nominal tolerances'
      },
      hydraulics: {
        name: 'Hydraulics & Flight Surface Actuators',
        health_score: hydraulicsHealth,
        anomaly_score: isGrounded ? 0.36 : (isStandby ? 0.18 : 0.05),
        status: hydraulicsHealth > 75 ? 'NOMINAL' : (hydraulicsHealth > 50 ? 'CAUTION' : 'CRITICAL'),
        telemetry: {
          sys_a_pressure_psi: isGrounded ? 2840 : 3045,
          sys_b_pressure_psi: isGrounded ? 2910 : 3020,
          actuator_response_time_ms: isGrounded ? 18.4 : 11.8,
          fluid_temperature_c: isGrounded ? 74.2 : 58.6
        },
        diagnostics: isGrounded
          ? 'Elevon actuator manifold micro-leakage detected under high-G simulated backpressure'
          : 'Dual 3000 PSI circuits fully pressurized with nominal damping response'
      },
      airframe: {
        name: 'Airframe Structure & Aeroelasticity',
        health_score: airframeHealth,
        anomaly_score: isGrounded ? 0.42 : (isStandby ? 0.21 : 0.06),
        status: airframeHealth > 75 ? 'NOMINAL' : (airframeHealth > 50 ? 'CAUTION' : 'CRITICAL'),
        telemetry: {
          vibration_anomaly_index: plane.vibration_index,
          wing_root_strain_g: isGrounded ? 4.8 : 3.2,
          acoustic_emission_db: isGrounded ? 124.0 : 108.5,
          landing_gear_cycles_count: isGrounded ? 482 : 310
        },
        diagnostics: isGrounded
          ? 'High cycle acoustic vibration harmonic detected near right engine nacelle'
          : 'Zero micro-fractures in titanium spar box; skin strain gauges nominal'
      }
    },

    // 5 Stage Turbofan Gas Path Cross-Section
    stages: {
      fan: {
        name: 'Fan & Intake Stage',
        health_pct: fanHealth,
        status: fanHealth > 70 ? 'NOMINAL' : (fanHealth > 45 ? 'CAUTION' : 'CRITICAL'),
        key_sensors: ['Nf (Fan Speed 2388 RPM)', 'P2 (Intake Pres 14.7 psia)'],
        wear_mode: 'Leading-edge aerodynamic sand erosion'
      },
      lpc: {
        name: 'Low Pressure Compressor (LPC)',
        health_pct: lpcHealth,
        status: lpcHealth > 70 ? 'NOMINAL' : (lpcHealth > 45 ? 'CAUTION' : 'CRITICAL'),
        key_sensors: ['T24 (LPC Temp 643.2 °R)', 'P24 (LPC Pres 21.4 psia)'],
        wear_mode: 'Surface roughness & boundary layer thickening'
      },
      hpc: {
        name: 'High Pressure Compressor (HPC)',
        health_pct: hpcHealth,
        status: hpcHealth > 70 ? 'NOMINAL' : (hpcHealth > 45 ? 'CAUTION' : 'CRITICAL'),
        key_sensors: ['T30 (Outlet 1589.6 °R)', 'P30 (Static 553.2 psia)'],
        wear_mode: 'Tip clearance widening & stator vane fouling'
      },
      combustor_hpt: {
        name: 'Combustor & HP Turbine',
        health_pct: combustorHealth,
        status: combustorHealth > 70 ? 'NOMINAL' : (combustorHealth > 45 ? 'CAUTION' : 'CRITICAL'),
        key_sensors: ['W31 (Fuel Flow 3.82 pps)', 'HtBleed (394.2 Btu/lb)'],
        wear_mode: 'Thermal barrier coating spalling & oxidation'
      },
      lpt: {
        name: 'Low Pressure Turbine (LPT)',
        health_pct: lptHealth,
        status: lptHealth > 70 ? 'NOMINAL' : (lptHealth > 45 ? 'CAUTION' : 'CRITICAL'),
        key_sensors: ['T50 (EGT 1406.8 °R)', 'P50 (Exhaust Pres 16.8 psia)'],
        wear_mode: 'Thermomechanical blade creep & centrifugal fatigue'
      }
    },
    telemetry: {
      T24_LPC_Temp_R: isGrounded ? 652.8 : 643.2,
      T30_HPC_Temp_R: isGrounded ? 1628.4 : 1589.6,
      P30_HPC_Pres_psia: isGrounded ? 532.1 : 553.2,
      T50_LPT_Temp_R: isGrounded ? 1438.7 : 1406.8,
      Nf_Fan_RPM: isGrounded ? 2376.4 : 2388.1,
      Nc_Core_RPM: isGrounded ? 9078.2 : 9051.4,
      BPR: isGrounded ? 8.62 : 8.43,
      oil_pressure_psi: plane.oil_pressure_psi,
      vibration_index: plane.vibration_index,
      egt_celsius: plane.egt_celsius
    },
    in_flight_drift_adaptation: {
      rls_drift_active: isStandby,
      drift_type: isStandby ? 'Sensor Gain Drift (Gain D=1.5 on T30/P30)' : 'None (Calibrated RLS State)',
      correction_residual_compensated: isStandby
    }
  };
}

// Telemetry Trend History (Predicted Fault Probability vs Flight Hours)
export const MOCK_TELEMETRY_TREND = [
  { hours: '0h', su30_fault_prob: 4.2, tejas_fault_prob: 3.1, rafale_fault_prob: 2.8, nominal_baseline: 5.0 },
  { hours: '250h', su30_fault_prob: 8.5, tejas_fault_prob: 5.4, rafale_fault_prob: 4.5, nominal_baseline: 10.0 },
  { hours: '500h', su30_fault_prob: 14.1, tejas_fault_prob: 9.8, rafale_fault_prob: 7.2, nominal_baseline: 15.0 },
  { hours: '750h', su30_fault_prob: 21.0, tejas_fault_prob: 15.6, rafale_fault_prob: 11.4, nominal_baseline: 20.0 },
  { hours: '1000h', su30_fault_prob: 32.8, tejas_fault_prob: 24.0, rafale_fault_prob: 18.2, nominal_baseline: 25.0 },
  { hours: '1250h', su30_fault_prob: 48.5, tejas_fault_prob: 34.2, rafale_fault_prob: 26.5, nominal_baseline: 30.0 },
  { hours: '1500h', su30_fault_prob: 69.2, tejas_fault_prob: 49.0, rafale_fault_prob: 38.0, nominal_baseline: 35.0 },
  { hours: '1750h', su30_fault_prob: 88.4, tejas_fault_prob: 68.5, rafale_fault_prob: 52.4, nominal_baseline: 40.0 },
  { hours: '2000h', su30_fault_prob: 96.0, tejas_fault_prob: 84.1, rafale_fault_prob: 69.8, nominal_baseline: 45.0 }
];

// Dynamic relative date generator based on aircraft sortie tempo (~2.5 flight hrs/day)
function getRelativeProjectionDate(flightHours) {
  if (flightHours <= 15) return 'Immediate Action / Grounded';
  const daysAhead = Math.max(1, Math.round(flightHours / 2.5));
  const targetDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${targetDate.getDate()} ${months[targetDate.getMonth()]} ${targetDate.getFullYear()} (~${daysAhead}d)`;
}

// Chronological Fault Prediction Timeline
export const MOCK_FAULT_TIMELINE = [
  {
    id: 'FPT-01',
    tail_no: 'SB-024',
    horizon_hours: '+14.5h',
    severity: 'CRITICAL',
    component: 'HPC Rotor Blades (Stage 1-3)',
    predicted_date: 'Immediate / Grounded',
    action_type: 'Depot Overhaul Induction',
    details: 'Severe blade leading-edge spalling detected via acoustic signature and T30 temperature spikes.'
  },
  {
    id: 'FPT-02',
    tail_no: 'KH-204',
    horizon_hours: '+18.2h',
    severity: 'CRITICAL',
    component: 'Digital HP Fuel Metering Pump',
    predicted_date: getRelativeProjectionDate(18.2),
    action_type: 'Hangar Bay Replacement',
    details: 'Fuel rail delivery pressure oscillations exceeding ±8% during climb profile.'
  },
  {
    id: 'FPT-03',
    tail_no: 'RB-004',
    horizon_hours: '+22.0h',
    severity: 'CRITICAL',
    component: 'Turbine Disk Thermal Barrier Layer',
    predicted_date: getRelativeProjectionDate(22.0),
    action_type: 'Borescope NDT Inspection',
    details: 'M88 turbine thermal coating ablation approaching micro-crack threshold.'
  },
  {
    id: 'FPT-04',
    tail_no: 'SB-023',
    horizon_hours: '+42.0h',
    severity: 'CAUTION',
    component: 'Compressor Stator Vanes (RLS Sensor Drift)',
    predicted_date: getRelativeProjectionDate(42.0),
    action_type: 'Water Wash & Sensor Recalibration',
    details: 'Fine dust deposit build-up across stator stages 4-7 causing 3.2% flow deceleration.'
  },
  {
    id: 'FPT-05',
    tail_no: 'RB-003',
    horizon_hours: '+62.1h',
    severity: 'CAUTION',
    component: 'LPT Exhaust Thermocouple Harness',
    predicted_date: getRelativeProjectionDate(62.1),
    action_type: 'Harness Continuity Test',
    details: 'Periodic desynchronization observed between dual EGT thermocouple probes.'
  },
  {
    id: 'FPT-06',
    tail_no: 'KH-203',
    horizon_hours: '+68.0h',
    severity: 'CAUTION',
    component: 'FADEC Dual-Channel Controller B',
    predicted_date: getRelativeProjectionDate(68.0),
    action_type: 'Firmware Diagnostic Dump',
    details: 'Intermittent signal latency on channel B control loop under sustained G-load.'
  },
  {
    id: 'FPT-07',
    tail_no: 'SB-022',
    horizon_hours: '+88.4h',
    severity: 'NOMINAL_MONITOR',
    component: 'HPC Tip Clearance Seal',
    predicted_date: getRelativeProjectionDate(88.4),
    action_type: 'Scheduled Routine Inspection',
    details: 'Tip clearance widening within predicted bounds; no operational restriction necessary.'
  }
];

// Failure Probability Heatmaps Matrix (Subsystems x Flight Regimes)
export const MOCK_FAILURE_HEATMAP = {
  regimes: [
    'Takeoff & Max Afterburner',
    'High-G Combat Air Patrol',
    'Transonic High-Altitude Cruise',
    'Low-Level Terrain Ingress',
    'Cold Soak Combat Loiter'
  ],
  subsystems: [
    {
      name: 'HPC Turbofan Stages',
      code: 'PROP_HPC',
      risks: [
        { regime: 'Takeoff & Max Afterburner', risk_pct: 88, status: 'HIGH_RISK', driver: 'Thermal expansion & high pressure surge' },
        { regime: 'High-G Combat Air Patrol', risk_pct: 64, status: 'ELEVATED', driver: 'Gyroscopic bending moment on rotor bearings' },
        { regime: 'Transonic High-Altitude Cruise', risk_pct: 22, status: 'LOW_RISK', driver: 'Stable continuous combustion' },
        { regime: 'Low-Level Terrain Ingress', risk_pct: 74, status: 'HIGH_RISK', driver: 'Sand & foreign particulate ingestion' },
        { regime: 'Cold Soak Combat Loiter', risk_pct: 18, status: 'LOW_RISK', driver: 'Low thermal gradient stress' }
      ]
    },
    {
      name: 'LPT Turbine Blades',
      code: 'PROP_LPT',
      risks: [
        { regime: 'Takeoff & Max Afterburner', risk_pct: 76, status: 'HIGH_RISK', driver: 'Peak EGT creep acceleration (>820°C)' },
        { regime: 'High-G Combat Air Patrol', risk_pct: 58, status: 'ELEVATED', driver: 'Centrifugal strain on blade roots' },
        { regime: 'Transonic High-Altitude Cruise', risk_pct: 16, status: 'LOW_RISK', driver: 'Moderate continuous temperature' },
        { regime: 'Low-Level Terrain Ingress', risk_pct: 42, status: 'MODERATE', driver: 'Abrasive particle pitting on trailing edge' },
        { regime: 'Cold Soak Combat Loiter', risk_pct: 12, status: 'LOW_RISK', driver: 'Optimal cooling air bleed ratio' }
      ]
    },
    {
      name: 'HP Fuel Delivery Pump',
      code: 'FUEL_SYS',
      risks: [
        { regime: 'Takeoff & Max Afterburner', risk_pct: 82, status: 'HIGH_RISK', driver: 'Maximum flow rate cavitation risk' },
        { regime: 'High-G Combat Air Patrol', risk_pct: 48, status: 'MODERATE', driver: 'G-induced fuel surge pressure dampening' },
        { regime: 'Transonic High-Altitude Cruise', risk_pct: 15, status: 'LOW_RISK', driver: 'Steady state flow metering' },
        { regime: 'Low-Level Terrain Ingress', risk_pct: 35, status: 'MODERATE', driver: 'Rapid throttle cycling demands' },
        { regime: 'Cold Soak Combat Loiter', risk_pct: 28, status: 'MODERATE', driver: 'Fuel viscosity elevation at sub-zero temp' }
      ]
    },
    {
      name: 'Hydraulic Actuator Loop',
      code: 'HYD_FLT',
      risks: [
        { regime: 'Takeoff & Max Afterburner', risk_pct: 32, status: 'MODERATE', driver: 'Landing gear retraction pressure spike' },
        { regime: 'High-G Combat Air Patrol', risk_pct: 84, status: 'HIGH_RISK', driver: 'Peak aerodynamic hinge moments on elevons' },
        { regime: 'Transonic High-Altitude Cruise', risk_pct: 12, status: 'LOW_RISK', driver: 'Micro-trim corrections only' },
        { regime: 'Low-Level Terrain Ingress', risk_pct: 68, status: 'ELEVATED', driver: 'Continuous terrain following servo activity' },
        { regime: 'Cold Soak Combat Loiter', risk_pct: 24, status: 'LOW_RISK', driver: 'Fluid recirculation loop nominal' }
      ]
    },
    {
      name: 'FADEC & Avionics Bus',
      code: 'AVIONICS',
      risks: [
        { regime: 'Takeoff & Max Afterburner', risk_pct: 28, status: 'MODERATE', driver: 'Acoustic resonance vibration on circuit boards' },
        { regime: 'High-G Combat Air Patrol', risk_pct: 42, status: 'MODERATE', driver: 'High-G load on connector harnesses' },
        { regime: 'Transonic High-Altitude Cruise', risk_pct: 10, status: 'LOW_RISK', driver: 'Nominal bus operation' },
        { regime: 'Low-Level Terrain Ingress', risk_pct: 38, status: 'MODERATE', driver: 'Thermal dissipation in humid atmosphere' },
        { regime: 'Cold Soak Combat Loiter', risk_pct: 34, status: 'MODERATE', driver: 'Extreme sub-zero cold soak envelope' }
      ]
    }
  ]
};

// Spares Inventory at Forward Operating Bases
export const MOCK_BASE_SPARES = [
  { item_id: 'LRU-HPC-01-THA', base_station: 'AFS Thanjavur', part_number: 'P/N-48201', component_name: 'HPC Rotor Blade Stage 1-3 Set', subsystem: 'HPC', quantity_on_hand: 0, safety_stock_threshold: 3, unit_cost_inr: 4200000, location_bin: 'BIN-A12' },
  { item_id: 'LRU-HPC-02-THA', base_station: 'AFS Thanjavur', part_number: 'P/N-48202', component_name: 'HPC Stator Vane Assembly', subsystem: 'HPC', quantity_on_hand: 2, safety_stock_threshold: 2, unit_cost_inr: 2800000, location_bin: 'BIN-A15' },
  { item_id: 'LRU-LPC-01-THA', base_station: 'AFS Thanjavur', part_number: 'P/N-31904', component_name: 'Fan Rotor Blade Set (Titanium)', subsystem: 'LPC/Fan', quantity_on_hand: 3, safety_stock_threshold: 2, unit_cost_inr: 6500000, location_bin: 'BIN-B04' },
  { item_id: 'LRU-LPT-01-THA', base_station: 'AFS Thanjavur', part_number: 'P/N-88219', component_name: 'LPT Thermocouple Wiring Harness', subsystem: 'LPT', quantity_on_hand: 6, safety_stock_threshold: 4, unit_cost_inr: 350000, location_bin: 'BIN-C08' },
  { item_id: 'LRU-FUEL-01-THA', base_station: 'AFS Thanjavur', part_number: 'P/N-19043', component_name: 'Digital High Pressure Fuel Pump', subsystem: 'Fuel System', quantity_on_hand: 2, safety_stock_threshold: 2, unit_cost_inr: 1850000, location_bin: 'BIN-D01' },
  { item_id: 'LRU-FADEC-01-THA', base_station: 'AFS Thanjavur', part_number: 'P/N-99412', component_name: 'Dual-Channel FADEC EEC Unit', subsystem: 'FADEC/Avionics', quantity_on_hand: 1, safety_stock_threshold: 1, unit_cost_inr: 9500000, location_bin: 'BIN-E02' },

  { item_id: 'LRU-HPC-01-SUL', base_station: 'AFS Sulur', part_number: 'P/N-48201', component_name: 'HPC Rotor Blade Stage 1-3 Set', subsystem: 'HPC', quantity_on_hand: 4, safety_stock_threshold: 3, unit_cost_inr: 4200000, location_bin: 'BIN-A12' },
  { item_id: 'LRU-FUEL-01-SUL', base_station: 'AFS Sulur', part_number: 'P/N-19043', component_name: 'Digital High Pressure Fuel Pump', subsystem: 'Fuel System', quantity_on_hand: 1, safety_stock_threshold: 2, unit_cost_inr: 1850000, location_bin: 'BIN-D01' },
  { item_id: 'LRU-FADEC-01-SUL', base_station: 'AFS Sulur', part_number: 'P/N-99412', component_name: 'Dual-Channel FADEC EEC Unit', subsystem: 'FADEC/Avionics', quantity_on_hand: 2, safety_stock_threshold: 1, unit_cost_inr: 9500000, location_bin: 'BIN-E02' },

  { item_id: 'LRU-HPC-01-AMB', base_station: 'AFS Ambala', part_number: 'P/N-48201', component_name: 'HPC Rotor Blade Stage 1-3 Set', subsystem: 'HPC', quantity_on_hand: 3, safety_stock_threshold: 3, unit_cost_inr: 4200000, location_bin: 'BIN-A12' },
  { item_id: 'LRU-LPT-01-AMB', base_station: 'AFS Ambala', part_number: 'P/N-88219', component_name: 'LPT Thermocouple Wiring Harness', subsystem: 'LPT', quantity_on_hand: 5, safety_stock_threshold: 4, unit_cost_inr: 350000, location_bin: 'BIN-C08' },
  { item_id: 'LRU-LPC-01-AMB', base_station: 'AFS Ambala', part_number: 'P/N-31904', component_name: 'Fan Rotor Blade Set (Titanium)', subsystem: 'LPC/Fan', quantity_on_hand: 2, safety_stock_threshold: 2, unit_cost_inr: 6500000, location_bin: 'BIN-B04' }
];

// Automated AI Reorder Triggers (Proactive Supply Chain Integration)
export const MOCK_AI_REORDER_TRIGGERS = [
  {
    trigger_id: 'TRIG-AI-2026-01',
    tail_no: 'SB-024',
    base_station: 'AFS Thanjavur',
    lru_component: 'HPC Rotor Blade Stage 1-3 Set',
    part_number: 'P/N-48201',
    current_stock: 0,
    safety_stock: 3,
    predicted_demand_hours: 14.5,
    confidence_score: 98.4,
    trigger_reason: 'RUL < 20h and base stock at ZERO. Autonomous emergency requisition to Central Depot required.',
    recommended_action: 'AIR_EXPRESS_DISPATCH',
    status: 'ACTIVE_PENDING_APPROVAL'
  },
  {
    trigger_id: 'TRIG-AI-2026-02',
    tail_no: 'KH-204',
    base_station: 'AFS Sulur',
    lru_component: 'Digital High Pressure Fuel Pump',
    part_number: 'P/N-19043',
    current_stock: 1,
    safety_stock: 2,
    predicted_demand_hours: 18.2,
    confidence_score: 95.1,
    trigger_reason: 'Base stock depleted to 1 unit against threshold of 2. Grounded Tejas KH-204 will consume last unit.',
    recommended_action: 'REPLENISHMENT_SHIPMENT',
    status: 'DISPATCHED_TO_DEPOT'
  },
  {
    trigger_id: 'TRIG-AI-2026-03',
    tail_no: 'RB-004',
    base_station: 'AFS Ambala',
    lru_component: 'Turbine Disk Thermal Assembly',
    part_number: 'P/N-M88-DISK-04',
    current_stock: 0,
    safety_stock: 1,
    predicted_demand_hours: 22.0,
    confidence_score: 92.8,
    trigger_reason: 'Rafale RB-004 borescope inspection confirmed disk thermal micro-fatigue. Stockout imminent.',
    recommended_action: 'ALLOCATE_FROM_DEPOT',
    status: 'IN_TRANSIT'
  }
];

// Depot Logistics Pipeline & Turnaround Tracking
export const MOCK_DEPOT_PIPELINE = [
  {
    req_id: 'REQ-2026-091',
    tail_no: 'RB-004',
    base_station: 'AFS Ambala',
    component_name: 'Turbine Disk Thermal Assembly',
    priority: 'CRITICAL_AOG',
    status: 'IN_TRANSIT',
    eta_hours: 8,
    created_at: '2.5h ago',
    depot_source: 'Central Technical Depot (Gwalior)',
    transit_mode: 'Air Transport Scramble',
    tat_elapsed_hours: 4.5,
    tat_target_hours: 18.0,
    tracking_steps: [
      { step: 'Requisition Raised by AI Engine', done: true, time: '2.5h ago' },
      { step: 'Depot Allocation & Quality Clearance', done: true, time: '1.8h ago' },
      { step: 'Air Transit En Route to Base', done: true, time: 'In Flight (ETA in 8h)' },
      { step: 'Forward Base Handover & Hangar Fit', done: false, time: 'Scheduled +8h' }
    ]
  },
  {
    req_id: 'REQ-2026-088',
    tail_no: 'KH-204',
    base_station: 'AFS Sulur',
    component_name: 'Digital High Pressure Fuel Pump',
    priority: 'EXPEDITED_MISSION',
    status: 'ALLOCATED',
    eta_hours: 28,
    created_at: '6.0h ago',
    depot_source: 'HAL Engine Division Depot (Bengaluru)',
    transit_mode: 'Dedicated Military Logistics Courier',
    tat_elapsed_hours: 12.0,
    tat_target_hours: 36.0,
    tracking_steps: [
      { step: 'Requisition Raised by AI Engine', done: true, time: '6.0h ago' },
      { step: 'Depot Allocation & Quality Clearance', done: true, time: '3.5h ago' },
      { step: 'Air Transit En Route to Base', done: false, time: 'Departs +4h' },
      { step: 'Forward Base Handover & Hangar Fit', done: false, time: 'ETA +28h' }
    ]
  },
  {
    req_id: 'REQ-2026-082',
    tail_no: 'SB-024',
    base_station: 'AFS Thanjavur',
    component_name: 'HPC Rotor Blade Stage 1-3 Set',
    priority: 'CRITICAL_AOG',
    status: 'IN_TRANSIT',
    eta_hours: 14,
    created_at: '8.0h ago',
    depot_source: 'Central IAF Depot No. 3 (Chandigarh)',
    transit_mode: 'Indian Air Force C-130J Special Air Delivery',
    tat_elapsed_hours: 7.5,
    tat_target_hours: 24.0,
    tracking_steps: [
      { step: 'Requisition Raised by AI Engine', done: true, time: '8.0h ago' },
      { step: 'Depot Allocation & Quality Clearance', done: true, time: '6.0h ago' },
      { step: 'Air Transit En Route to Base', done: true, time: 'En Route (In Transit)' },
      { step: 'Forward Base Handover & Hangar Fit', done: false, time: 'ETA +14h' }
    ]
  },
  {
    req_id: 'REQ-2026-079',
    tail_no: 'SB-023',
    base_station: 'AFS Thanjavur',
    component_name: 'HPC Stator Vane Assembly',
    priority: 'ROUTINE_DEPOT',
    status: 'PENDING_APPROVAL',
    eta_hours: 48,
    created_at: '12.0h ago',
    depot_source: 'Central IAF Depot No. 3 (Chandigarh)',
    transit_mode: 'Routine Scheduled Rail/Road Container',
    tat_elapsed_hours: 10.0,
    tat_target_hours: 72.0,
    tracking_steps: [
      { step: 'Requisition Raised by AI Engine', done: true, time: '12.0h ago' },
      { step: 'Depot Allocation & Quality Clearance', done: false, time: 'Under Batch Review' },
      { step: 'Air Transit En Route to Base', done: false, time: 'Pending' },
      { step: 'Forward Base Handover & Hangar Fit', done: false, time: 'ETA +48h' }
    ]
  }
];

// Maintenance Work Orders - Balanced 8 orders across all 4 Kanban columns (2 per column)
export const MOCK_WORK_ORDERS = [
  // 1. AWAITING_SPARES (2 orders)
  {
    order_id: 'WO-SB-024-1014-0932',
    tail_no: 'SB-024',
    aircraft_type: 'Su-30MKI Flanker-H',
    squadron: "No. 222 Sqn 'Tigersharks'",
    base_station: 'AFS Thanjavur',
    severity_tier: 3,
    severity_label: 'CRITICAL_AOG',
    fault_subsystem: 'HPC (High Pressure Compressor)',
    predicted_rul: 14.5,
    lower_bound_rul: 11.8,
    action_required: 'AOG EMERGENCY: HPC Rotor Blade Stage 1-3 out of stock at AFS Thanjavur. Automated Requisition REQ-2026-082 en route via C-130J.',
    spares_allocated: 0,
    status: 'AWAITING_SPARES',
    technician: 'Sqn Ldr R. Sharma (Chief Tech)',
    hangar_bay: 'Hangar Bay 03 (Heavy Overhaul)',
    required_tooling: 'Borescope Kit BS-40, AL-31FP Hydraulic Puller Rig',
    linked_requisition: 'REQ-2026-082',
    created_at: '8.0h ago'
  },
  {
    order_id: 'WO-IA-3104-1019-0900',
    tail_no: 'IA-3104',
    aircraft_type: 'ALH Dhruv Mk III',
    squadron: "IAF Rotary Wing Wing",
    base_station: 'AFS Jodhpur',
    severity_tier: 3,
    severity_label: 'CRITICAL_AOG',
    fault_subsystem: 'Transmission / Mast',
    predicted_rul: 19.4,
    lower_bound_rul: 16.2,
    action_required: 'TM333 Turboshaft vibration isolator bushing set exhausted. Fast-track requisition submitted to HAL Rotary Division.',
    spares_allocated: 0,
    status: 'AWAITING_SPARES',
    technician: 'Sgt P. Nambiar (Rotary Lead)',
    hangar_bay: 'Rotary Maintenance Bay 02',
    required_tooling: 'Main Rotor Dynamic Balancer, Bushing Press Jig',
    linked_requisition: 'REQ-2026-094',
    created_at: '5.5h ago'
  },

  // 2. IN_PROGRESS (2 orders)
  {
    order_id: 'WO-KH-204-1013-1420',
    tail_no: 'KH-204',
    aircraft_type: 'LCA Tejas Mk1A',
    squadron: "No. 45 Sqn 'Flying Daggers'",
    base_station: 'AFS Sulur',
    severity_tier: 3,
    severity_label: 'CRITICAL_AOG',
    fault_subsystem: 'Fuel System & Metering',
    predicted_rul: 18.2,
    lower_bound_rul: 15.0,
    action_required: 'Inducted into Bay 01. Tejas Mk1A HP Fuel pump pressure fluctuations bench overhaul and filter mesh replacement in progress.',
    spares_allocated: 1,
    status: 'IN_PROGRESS',
    technician: 'Flt Lt K. Patel (Propulsion Lead)',
    hangar_bay: 'Hangar Bay 01 (Engine Test Bed)',
    required_tooling: 'Fuel Metering Bench FMB-02, High Pressure Leak Rig',
    linked_requisition: 'REQ-2026-088',
    created_at: '6.0h ago'
  },
  {
    order_id: 'WO-RB-004-1015-0210',
    tail_no: 'RB-004',
    aircraft_type: 'Dassault Rafale EH',
    squadron: "No. 17 Sqn 'Golden Arrows'",
    base_station: 'AFS Ambala',
    severity_tier: 3,
    severity_label: 'CRITICAL_AOG',
    fault_subsystem: 'LPT (Low Pressure Turbine)',
    predicted_rul: 22.0,
    lower_bound_rul: 18.2,
    action_required: 'M88-4E Turbine Disk thermal barrier inspection underway. Laser ultrasound scan active on turbine stage 2 blades.',
    spares_allocated: 1,
    status: 'IN_PROGRESS',
    technician: 'Wg Cdr V. Rao (Quality Assurance)',
    hangar_bay: 'Hangar Bay 02 (Advanced Composites)',
    required_tooling: 'Laser Ultrasonic Scanner LUS-88, Thermal Scope',
    linked_requisition: 'REQ-2026-091',
    created_at: '2.5h ago'
  },

  // 3. DISPATCHED (2 orders)
  {
    order_id: 'WO-SB-023-1014-1600',
    tail_no: 'SB-023',
    aircraft_type: 'Su-30MKI Flanker-H',
    squadron: "No. 222 Sqn 'Tigersharks'",
    base_station: 'AFS Thanjavur',
    severity_tier: 2,
    severity_label: 'PREVENTIVE_ADVISORY',
    fault_subsystem: 'HPC & Stator Vanes',
    predicted_rul: 42.0,
    lower_bound_rul: 35.8,
    action_required: 'Scheduled compressor detergent water wash and RLS streaming drift filter recalibration on stations 24 & 30.',
    spares_allocated: 1,
    status: 'DISPATCHED',
    technician: 'JWO A. Verma (Avionics Tech)',
    hangar_bay: 'Hangar Bay 04 (Line Maintenance)',
    required_tooling: 'Turbine Wash Mobile Cart TWC-4, RLS Calibration Link',
    linked_requisition: 'REQ-2026-079',
    created_at: '3.0h ago'
  },
  {
    order_id: 'WO-RB-002-1018-0830',
    tail_no: 'RB-002',
    aircraft_type: 'Dassault Rafale EH',
    squadron: "No. 17 Sqn 'Golden Arrows'",
    base_station: 'AFS Ambala',
    severity_tier: 2,
    severity_label: 'PREVENTIVE_ADVISORY',
    fault_subsystem: 'FADEC & M88 Sensor Harness',
    predicted_rul: 78.5,
    lower_bound_rul: 71.0,
    action_required: 'Preventive 100-hour diagnostic dump for FADEC Channel A/B optical link synchronizer. Pre-sortie check assigned.',
    spares_allocated: 1,
    status: 'DISPATCHED',
    technician: 'MWO S. Sengupta (Avionics Supervisor)',
    hangar_bay: 'Hangar Bay 02 (Avionics Test)',
    required_tooling: 'M88 FADEC Diagnostic Bus Adapter, MIL-STD-1553 Analyzer',
    linked_requisition: 'LOCAL_DEPOT_ALLOCATED',
    created_at: '4.2h ago'
  },

  // 4. RESOLVED (2 orders)
  {
    order_id: 'WO-KH-203-1012-1100',
    tail_no: 'KH-203',
    aircraft_type: 'LCA Tejas Mk1A',
    squadron: "No. 45 Sqn 'Flying Daggers'",
    base_station: 'AFS Sulur',
    severity_tier: 2,
    severity_label: 'PREVENTIVE_ADVISORY',
    fault_subsystem: 'FADEC / Avionics',
    predicted_rul: 68.0,
    lower_bound_rul: 62.0,
    action_required: 'FADEC Channel B resistance check and firmware diagnostic dump completed. Post-overhaul ground run certified.',
    spares_allocated: 1,
    status: 'RESOLVED',
    technician: 'Sgt M. Singh (Avionics Tech)',
    hangar_bay: 'Hangar Bay 01 (Cleared)',
    required_tooling: 'FADEC Multimeter Rig, Telemetry Downlink Dongle',
    linked_requisition: 'RESOLVED_INTERNAL',
    created_at: '14.0h ago'
  },
  {
    order_id: 'WO-SB-022-1017-1540',
    tail_no: 'SB-022',
    aircraft_type: 'Su-30MKI Flanker-H',
    squadron: "No. 222 Sqn 'Tigersharks'",
    base_station: 'AFS Thanjavur',
    severity_tier: 1,
    severity_label: 'WATCHLIST',
    fault_subsystem: 'Hydraulic Circuit A Actuator',
    predicted_rul: 92.0,
    lower_bound_rul: 84.5,
    action_required: 'Hydraulic Circuit A seal pack replacement and bleed procedure completed. Pressure held nominal at 3,050 psi.',
    spares_allocated: 1,
    status: 'RESOLVED',
    technician: 'WO D. Mukherjee (Mechanical Lead)',
    hangar_bay: 'Hangar Bay 05 (Line Maintenance)',
    required_tooling: 'Hydraulic Test Bench HTB-3000, Bleed Hose Kit',
    linked_requisition: 'RESOLVED_INTERNAL',
    created_at: '18.0h ago'
  }
];

// Historical Pilot Flight Logs & Snags with Multimodal NLP Telemetry Correlation
export const MOCK_FLIGHT_LOGS = [
  {
    log_id: 'LOG-SB-024-05',
    tail_no: 'SB-024',
    mission_date: 'Today 14:20',
    mission_type: 'Combat Air Patrol (CAP)',
    duration_hours: 3.8,
    pilot_callsign: 'Garuda-1 (Su-30 Lead)',
    g_force_peak: 7.4,
    pilot_remarks: 'Core vibration spike observed on afterburner engagement. High T30 thermal trend flagged by copilot.',
    snags_reported: 1,
    nlp_fusion: {
      extracted_entities: [
        { category: 'Subsystem', value: 'HPC (Station 30)' },
        { category: 'Observed Symptom', value: 'Core Vibration Spike on Afterburner' },
        { category: 'Thermal Severity', value: 'Elevated T30 Combustor Ingress Trend' }
      ],
      telemetry_correlations: [
        { station: 'STA 30 (T30 Outlet Temp)', reading: '684.2 °C', delta: '+28.4 °C vs envelope', status: 'CRITICAL' },
        { station: 'Sensor 11 (Vibration RMS)', reading: '1.92 g', delta: '+52% over nominal', status: 'CRITICAL' }
      ],
      multi_modal_confidence: 98.4,
      confidence_lift_pct: 22.4,
      diagnosis: 'HPC Rotor Stage 1-3 blade tip degradation confirmed via sensor-debrief multi-modal fusion.',
      recommended_action: 'Grounded for AOG HPC Blade replacement. Work order WO-SB-024-1014-0932 active.'
    }
  },
  {
    log_id: 'LOG-KH-204-05',
    tail_no: 'KH-204',
    mission_date: 'Yesterday 13:40',
    mission_type: 'Combat Training',
    duration_hours: 2.2,
    pilot_callsign: 'Dagger-2 (Tejas Mk1A)',
    g_force_peak: 6.2,
    pilot_remarks: 'Fuel flow rate oscillation noted during low-altitude terrain hugging maneuver.',
    snags_reported: 1,
    nlp_fusion: {
      extracted_entities: [
        { category: 'Subsystem', value: 'Fuel Metering System' },
        { category: 'Observed Symptom', value: 'Fuel Flow Rate Oscillation' },
        { category: 'Flight Regime', value: 'Low-Altitude High-G Terrain Following' }
      ],
      telemetry_correlations: [
        { station: 'STA 25 (P25 Interstage Pres)', reading: '28.4 psia', delta: '±4.2 psia ripple', status: 'CRITICAL' },
        { station: 'Fuel Metering Unit (FMU)', reading: '4,120 pph', delta: 'Cyclic surging detected', status: 'CRITICAL' }
      ],
      multi_modal_confidence: 96.8,
      confidence_lift_pct: 19.5,
      diagnosis: 'Digital High Pressure Fuel Pump valve stutter correlated with pilot throttle oscillation.',
      recommended_action: 'Fuel pump bench overhaul underway in Hangar Bay 01.'
    }
  },
  {
    log_id: 'LOG-RB-004-05',
    tail_no: 'RB-004',
    mission_date: 'Yesterday 10:00',
    mission_type: 'Combat Training',
    duration_hours: 2.4,
    pilot_callsign: 'Arrow-2 (Rafale)',
    g_force_peak: 7.1,
    pilot_remarks: 'Exhaust gas temp limit reached during climb. Caution light triggered on MFD.',
    snags_reported: 1,
    nlp_fusion: {
      extracted_entities: [
        { category: 'Subsystem', value: 'LPT & Exhaust Nozzle' },
        { category: 'Observed Symptom', value: 'EGT Thermal Limit Exceeded' },
        { category: 'Cockpit Indication', value: 'MFD Amber Caution' }
      ],
      telemetry_correlations: [
        { station: 'STA 50 (T50 EGT Exducer)', reading: '912.0 °C', delta: '+34 °C above redline', status: 'CRITICAL' },
        { station: 'Nozzle Area A8', reading: '0.41 m²', delta: 'Lagging actuator response', status: 'CAUTION' }
      ],
      multi_modal_confidence: 97.2,
      confidence_lift_pct: 21.0,
      diagnosis: 'Turbine Disk thermal coating spallation detected; laser ultrasound confirms micro-stress.',
      recommended_action: 'Depot procurement REQ-2026-091 dispatched via Air Transport Scramble.'
    }
  },
  {
    log_id: 'LOG-SB-021-05',
    tail_no: 'SB-021',
    mission_date: 'Today 08:30',
    mission_type: 'Combat Air Patrol (CAP)',
    duration_hours: 2.5,
    pilot_callsign: 'Trishul-4 (Su-30MKI)',
    g_force_peak: 5.6,
    pilot_remarks: 'Standard maritime CAP sortie over Indian Ocean. Systems nominal, no pilot snags recorded.',
    snags_reported: 0,
    nlp_fusion: null
  },
  {
    log_id: 'LOG-KH-201-05',
    tail_no: 'KH-201',
    mission_date: 'Today 11:15',
    mission_type: 'Tactical Intercept',
    duration_hours: 1.9,
    pilot_callsign: 'Dagger-Lead (Tejas)',
    g_force_peak: 6.8,
    pilot_remarks: 'High-G intercept simulation completed. Fly by Wire and GE-F404 turbine operating smoothly.',
    snags_reported: 0,
    nlp_fusion: null
  },
  {
    log_id: 'LOG-RB-001-05',
    tail_no: 'RB-001',
    mission_date: 'Today 15:50',
    mission_type: 'Tactical Intercept',
    duration_hours: 3.1,
    pilot_callsign: 'Arrow-Lead (Rafale)',
    g_force_peak: 7.8,
    pilot_remarks: 'Sector high-altitude intercept mission. Radar and M88-4E thrust vectoring responsive.',
    snags_reported: 0,
    nlp_fusion: null
  },
  {
    log_id: 'LOG-CB-8001-01',
    tail_no: 'CB-8001',
    mission_date: 'Today 06:15',
    mission_type: 'Strategic Heavy Airlift',
    duration_hours: 4.5,
    pilot_callsign: 'Skylord-Heavy (C-17)',
    g_force_peak: 2.3,
    pilot_remarks: 'Forward airbase logistics sortie to AFS Leh. Turbofan Pratt & Whitney F117 parameters nominal.',
    snags_reported: 0,
    nlp_fusion: null
  },
  {
    log_id: 'LOG-IA-3104-01',
    tail_no: 'IA-3104',
    mission_date: 'Today 12:45',
    mission_type: 'Combat SAR & Recon',
    duration_hours: 2.0,
    pilot_callsign: 'Rudra-Flight (ALH)',
    g_force_peak: 3.8,
    pilot_remarks: 'Forward desert border reconnaissance. Minor rotor hub vibration during high-speed transit.',
    snags_reported: 1,
    nlp_fusion: {
      extracted_entities: [
        { category: 'Subsystem', value: 'Rotary Dynamic Mast' },
        { category: 'Observed Symptom', value: 'High-Speed Transit Hub Shudder' }
      ],
      telemetry_correlations: [
        { station: 'Mast Bearing Accel', reading: '1.25 g', delta: '+22% over nominal', status: 'CAUTION' }
      ],
      multi_modal_confidence: 94.1,
      confidence_lift_pct: 16.5,
      diagnosis: 'Bushing elastomer fatigue correlated with terrain roughness.',
      recommended_action: 'Work order WO-IA-3104-1019-0900 queued awaiting depot bushing set.'
    }
  }
];
