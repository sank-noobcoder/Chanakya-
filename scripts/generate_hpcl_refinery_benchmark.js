const fs = require("fs");
const path = require("path");

function generateHpclModel(outputPath, numPeriods = 12, numDepots = 8) {
  const crudes = [
    { name: "ARAB_LIGHT", cost: 6250.0, naphtha: 0.22, dist: 0.32, gasoil: 0.26, res: 0.2, max: 150000.0 },
    { name: "ARAB_HEAVY", cost: 5400.0, naphtha: 0.16, dist: 0.26, gasoil: 0.28, res: 0.3, max: 120000.0 },
    { name: "BOMBAY_HIGH", cost: 6800.0, naphtha: 0.25, dist: 0.38, gasoil: 0.25, res: 0.12, max: 90000.0 },
    { name: "BASRAH_MEDIUM", cost: 5850.0, naphtha: 0.18, dist: 0.28, gasoil: 0.29, res: 0.25, max: 140000.0 },
    { name: "MURBAN_SWEET", cost: 6950.0, naphtha: 0.28, dist: 0.35, gasoil: 0.24, res: 0.13, max: 100000.0 },
    { name: "MANGALA_RAJASTHAN", cost: 5900.0, naphtha: 0.12, dist: 0.30, gasoil: 0.34, res: 0.24, max: 80000.0 },
    { name: "URALS_BLEND", cost: 5100.0, naphtha: 0.20, dist: 0.31, gasoil: 0.27, res: 0.22, max: 160000.0 },
  ];

  const depots = [
    { name: "MUMBAI_TERMINAL", dist: 15, ms: 45000.0, hsd: 95000.0, atf: 38000.0 },
    { name: "PUNE_DEPOT", dist: 160, ms: 22000.0, hsd: 62000.0, atf: 8000.0 },
    { name: "NAGPUR_HUB", dist: 820, ms: 14000.0, hsd: 48000.0, atf: 4000.0 },
    { name: "AHMEDABAD_DEPOT", dist: 530, ms: 19000.0, hsd: 54000.0, atf: 6500.0 },
    { name: "INDORE_CENTRAL", dist: 585, ms: 12000.0, hsd: 41000.0, atf: 3500.0 },
    { name: "HYDERABAD_SECTOR", dist: 710, ms: 24000.0, hsd: 68000.0, atf: 12000.0 },
    { name: "GOA_VASCO_DEPOT", dist: 590, ms: 8000.0, hsd: 21000.0, atf: 5000.0 },
    { name: "BHOPAL_REGIONAL", dist: 775, ms: 11000.0, hsd: 37000.0, atf: 2800.0 },
  ].slice(0, numDepots);

  const rate = 1.45;
  const lines = [];

  lines.push("\\* =========================================================================");
  lines.push("\\* HPCL (HINDUSTAN PETROLEUM) MUMBAI REFINERY ENTERPRISE OPTIMIZATION MODEL");
  lines.push(`\\* Multi-Period Production & Distribution (${numPeriods} Months, ${depots.length} Regional Depots)`);
  lines.push("\\* Standard Compliance: Bharat Stage VI (BS-VI) Ultra-Low Sulfur & High Octane");
  lines.push("\\* Sovereign Solver Target: Chanakya High-Performance LP Engine");
  lines.push("\\* =========================================================================\n");

  lines.push("Minimize\n  Total_HPCL_Refinery_Operating_Cost:\n");

  for (let t = 1; t <= numPeriods; t++) {
    for (const c of crudes) {
      lines.push(`    + ${c.cost.toFixed(2)} CRUDE_PROC_${c.name}_T${t}`);
    }
    lines.push(`    + 145.00 FCCU_THROUGHPUT_T${t}`);
    lines.push(`    + 210.00 CCR_REFORMER_FEED_T${t}`);
    lines.push(`    + 85.00 DHDS_HYDROTREATER_FEED_T${t}`);
    lines.push(`    + 320.00 HYDROCRACKER_FEED_T${t}`);
    lines.push(`    + 45.00 CDU_VDU_TOTAL_DISTILLATION_T${t}`);

    for (const d of depots) {
      const freight = d.dist * rate;
      lines.push(`    + ${freight.toFixed(2)} DISPATCH_MS_${d.name}_T${t}`);
      lines.push(`    + ${freight.toFixed(2)} DISPATCH_HSD_${d.name}_T${t}`);
      lines.push(`    + ${(freight * 1.15).toFixed(2)} DISPATCH_ATF_${d.name}_T${t}`);
    }
  }

  lines.push("\nSubject To");

  for (let t = 1; t <= numPeriods; t++) {
    const cSum = crudes.map((c) => `CRUDE_PROC_${c.name}_T${t}`).join(" + ");
    lines.push(`  CDU_Capacity_Limit_T${t}: ${cSum} <= 650000.0`);
    lines.push(`  CDU_Min_Turndown_T${t}: ${cSum} >= 350000.0`);
    lines.push(`  CDU_Total_Equate_T${t}: ${cSum} - CDU_VDU_TOTAL_DISTILLATION_T${t} = 0.0`);

    const nSum = crudes.map((c) => `${c.naphtha.toFixed(3)} CRUDE_PROC_${c.name}_T${t}`).join(" + ");
    lines.push(`  StraightRun_Naphtha_Yield_T${t}: ${nSum} - SR_NAPHTHA_RAW_T${t} = 0.0`);

    const dSum = crudes.map((c) => `${c.dist.toFixed(3)} CRUDE_PROC_${c.name}_T${t}`).join(" + ");
    lines.push(`  Middle_Distillate_Yield_T${t}: ${dSum} - RAW_MIDDLE_DIST_T${t} = 0.0`);

    const gSum = crudes.map((c) => `${c.gasoil.toFixed(3)} CRUDE_PROC_${c.name}_T${t}`).join(" + ");
    lines.push(`  Heavy_Gasoil_Yield_T${t}: ${gSum} - RAW_VACUUM_GASOIL_T${t} = 0.0`);

    const rSum = crudes.map((c) => `${c.res.toFixed(3)} CRUDE_PROC_${c.name}_T${t}`).join(" + ");
    lines.push(`  Vacuum_Residue_Yield_T${t}: ${rSum} - RESIDUE_BITUMEN_T${t} = 0.0`);

    // Secondary Conversion Units
    lines.push(`  CCR_Feed_Balance_T${t}: SR_NAPHTHA_RAW_T${t} - CCR_REFORMER_FEED_T${t} - PETROCHEM_NAPHTHA_EXPORT_T${t} = 0.0`);
    lines.push(`  CCR_Capacity_Limit_T${t}: CCR_REFORMER_FEED_T${t} <= 140000.0`);
    lines.push(`  Reformate_Production_T${t}: 0.86 CCR_REFORMER_FEED_T${t} - HIGH_OCTANE_REFORMATE_T${t} = 0.0`);

    lines.push(`  FCCU_Feed_Balance_T${t}: RAW_VACUUM_GASOIL_T${t} - FCCU_THROUGHPUT_T${t} - HYDROCRACKER_FEED_T${t} = 0.0`);
    lines.push(`  FCCU_Capacity_Limit_T${t}: FCCU_THROUGHPUT_T${t} <= 180000.0`);
    lines.push(`  Hydrocracker_Capacity_Limit_T${t}: HYDROCRACKER_FEED_T${t} <= 120000.0`);

    lines.push(`  FCC_Gasoline_Yield_T${t}: 0.48 FCCU_THROUGHPUT_T${t} - FCC_GASOLINE_COMPONENT_T${t} = 0.0`);
    lines.push(`  FCC_LightCycleOil_Yield_T${t}: 0.32 FCCU_THROUGHPUT_T${t} - FCC_LCO_DIESEL_T${t} = 0.0`);
    lines.push(`  HCU_Diesel_Yield_T${t}: 0.62 HYDROCRACKER_FEED_T${t} - HCU_ULTRALOW_SULFUR_DIESEL_T${t} = 0.0`);
    lines.push(`  HCU_Kero_Yield_T${t}: 0.24 HYDROCRACKER_FEED_T${t} - HCU_JET_KEROSENE_T${t} = 0.0`);

    lines.push(`  DHDS_Feed_Balance_T${t}: RAW_MIDDLE_DIST_T${t} + FCC_LCO_DIESEL_T${t} - DHDS_HYDROTREATER_FEED_T${t} = 0.0`);
    lines.push(`  DHDS_Capacity_Limit_T${t}: DHDS_HYDROTREATER_FEED_T${t} <= 240000.0`);
    lines.push(`  DHDS_Product_Yield_T${t}: 0.98 DHDS_HYDROTREATER_FEED_T${t} - HYDROTREATED_DIESEL_T${t} = 0.0`);

    // Finished Product Blends & Standards
    const msDispatches = depots.map((d) => `DISPATCH_MS_${d.name}_T${t}`).join(" + ");
    lines.push(`  MS_Blend_Mass_Balance_T${t}: HIGH_OCTANE_REFORMATE_T${t} + FCC_GASOLINE_COMPONENT_T${t} + ALKYLATE_OCTANE_T${t} - ${msDispatches} = 0.0`);
    lines.push(`  MS_Octane_Specification_T${t}: 102.0 HIGH_OCTANE_REFORMATE_T${t} + 91.0 FCC_GASOLINE_COMPONENT_T${t} + 96.0 ALKYLATE_OCTANE_T${t} - 95.0 DISPATCH_MS_MUMBAI_TERMINAL_T${t} >= 0.0`);

    const hsdDispatches = depots.map((d) => `DISPATCH_HSD_${d.name}_T${t}`).join(" + ");
    lines.push(`  HSD_Blend_Mass_Balance_T${t}: HYDROTREATED_DIESEL_T${t} + HCU_ULTRALOW_SULFUR_DIESEL_T${t} - ${hsdDispatches} = 0.0`);

    const atfDispatches = depots.map((d) => `DISPATCH_ATF_${d.name}_T${t}`).join(" + ");
    lines.push(`  ATF_Blend_Mass_Balance_T${t}: HCU_JET_KEROSENE_T${t} - ${atfDispatches} >= 0.0`);

    for (const d of depots) {
      lines.push(`  Demand_MS_${d.name}_T${t}: DISPATCH_MS_${d.name}_T${t} >= ${d.ms.toFixed(1)}`);
      lines.push(`  Demand_HSD_${d.name}_T${t}: DISPATCH_HSD_${d.name}_T${t} >= ${d.hsd.toFixed(1)}`);
      lines.push(`  Demand_ATF_${d.name}_T${t}: DISPATCH_ATF_${d.name}_T${t} >= ${d.atf.toFixed(1)}`);
    }
  }

  lines.push("\nBounds");
  for (let t = 1; t <= numPeriods; t++) {
    for (const c of crudes) {
      lines.push(`  0.0 <= CRUDE_PROC_${c.name}_T${t} <= ${c.max.toFixed(1)}`);
    }
    lines.push(`  0.0 <= ALKYLATE_OCTANE_T${t} <= 45000.0`);
    lines.push(`  0.0 <= PETROCHEM_NAPHTHA_EXPORT_T${t} <= 60000.0`);
  }

  lines.push("\nEnd\n");

  fs.writeFileSync(outputPath, lines.join("\n"), "utf8");
  const stats = fs.statSync(outputPath);
  console.log(`Generated ${outputPath} (${(stats.size / 1024).toFixed(1)} KB, ${lines.length} lines)`);
}

const targetPath = path.join(__dirname, "..", "test_samples", "hpcl_mumbai_refinery_benchmark.lp");
generateHpclModel(targetPath, 12, 8);
