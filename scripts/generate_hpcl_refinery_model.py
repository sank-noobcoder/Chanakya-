#!/usr/bin/env python3
"""
HPCL (Hindustan Petroleum Corporation Limited) - Mumbai Refinery Enterprise Optimizer
Large-Scale Mathematical Optimization Benchmark Generator for Chanakya Sovereign Engine.

Formulation covers:
- Multi-Crude Assay Selection (Arab Light, Arab Heavy, Bombay High, Basrah, Murban, Urals)
- Atmospheric & Vacuum Distillation Units (CDU & VDU)
- Catalytic Cracking (FCCU), Continuous Catalytic Reforming (CCR), Hydrocracker (HCU)
- Diesel Hydrodesulfurization (DHDS) ensuring BS-VI (<10 ppm Sulfur) compliance
- Blending Pools: Motor Spirit (MS BS-VI), High Speed Diesel (HSD BS-VI), Jet A-1 (ATF), LPG, Fuel Oil
- Multi-Period Depot Logistics across Western and Central India (Mumbai, Pune, Nagpur, Ahmedabad, Indore, Hyderabad)
"""

import os
import sys

def generate_hpcl_model(output_path: str, num_periods: int = 12, num_depots: int = 8):
    crudes = [
        {"name": "ARAB_LIGHT", "cost": 6250.0, "sulfur": 0.0175, "naphtha_yield": 0.22, "distillate_yield": 0.32, "gasoil_yield": 0.26, "residue_yield": 0.20, "max_avail": 150000.0},
        {"name": "ARAB_HEAVY", "cost": 5400.0, "sulfur": 0.0285, "naphtha_yield": 0.16, "distillate_yield": 0.26, "gasoil_yield": 0.28, "residue_yield": 0.30, "max_avail": 120000.0},
        {"name": "BOMBAY_HIGH", "cost": 6800.0, "sulfur": 0.0015, "naphtha_yield": 0.25, "distillate_yield": 0.38, "gasoil_yield": 0.25, "residue_yield": 0.12, "max_avail": 90000.0},
        {"name": "BASRAH_MEDIUM", "cost": 5850.0, "sulfur": 0.0240, "naphtha_yield": 0.18, "distillate_yield": 0.28, "gasoil_yield": 0.29, "residue_yield": 0.25, "max_avail": 140000.0},
        {"name": "MURBAN_SWEET", "cost": 6950.0, "sulfur": 0.0075, "naphtha_yield": 0.28, "distillate_yield": 0.35, "gasoil_yield": 0.24, "residue_yield": 0.13, "max_avail": 100000.0},
        {"name": "MANGALA_RAJASTHAN", "cost": 5900.0, "sulfur": 0.0012, "naphtha_yield": 0.12, "distillate_yield": 0.30, "gasoil_yield": 0.34, "residue_yield": 0.24, "max_avail": 80000.0},
        {"name": "URALS_BLEND", "cost": 5100.0, "sulfur": 0.0145, "naphtha_yield": 0.20, "distillate_yield": 0.31, "gasoil_yield": 0.27, "residue_yield": 0.22, "max_avail": 160000.0},
    ]

    depots = [
        {"name": "MUMBAI_TERMINAL", "dist_km": 15, "ms_demand": 45000.0, "hsd_demand": 95000.0, "atf_demand": 38000.0},
        {"name": "PUNE_DEPOT", "dist_km": 160, "ms_demand": 22000.0, "hsd_demand": 62000.0, "atf_demand": 8000.0},
        {"name": "NAGPUR_HUB", "dist_km": 820, "ms_demand": 14000.0, "hsd_demand": 48000.0, "atf_demand": 4000.0},
        {"name": "AHMEDABAD_DEPOT", "dist_km": 530, "ms_demand": 19000.0, "hsd_demand": 54000.0, "atf_demand": 6500.0},
        {"name": "INDORE_CENTRAL", "dist_km": 585, "ms_demand": 12000.0, "hsd_demand": 41000.0, "atf_demand": 3500.0},
        {"name": "HYDERABAD_SECTOR", "dist_km": 710, "ms_demand": 24000.0, "hsd_demand": 68000.0, "atf_demand": 12000.0},
        {"name": "GOA_VASCO_DEPOT", "dist_km": 590, "ms_demand": 8000.0, "hsd_demand": 21000.0, "atf_demand": 5000.0},
        {"name": "BHOPAL_REGIONAL", "dist_km": 775, "ms_demand": 11000.0, "hsd_demand": 37000.0, "atf_demand": 2800.0},
    ][:num_depots]

    # Freight cost per ton-km by pipeline/rail
    pipeline_rate_per_ton_km = 1.45

    print(f"Generating HPCL Refinery LP model ({num_periods} periods, {len(depots)} depots, {len(crudes)} crude assays)...")

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\\* =========================================================================\n")
        f.write("\\* HPCL MUMBAI REFINERY ENTERPRISE PRODUCTION & DISTRIBUTION LP MODEL\n")
        f.write(f"\\* Periods: {num_periods} | Regional Hubs: {len(depots)} | Crude Sources: {len(crudes)}\n")
        f.write("\\* Standards Compliance: Bharat Stage VI (BS-VI) Fuel Specifications\n")
        f.write("\\* Generated for Sovereign Mathematical Optimization Engine: Chanakya v1.0\n")
        f.write("\\* =========================================================================\n\n")

        # Objective Function: Minimize Total Operating Cost (Crude Purchase + Processing Units + Transportation)
        f.write("Minimize\n  Total_HPCL_Refinery_Operating_Cost:\n")

        cost_terms = []

        # 1. Crude procurement cost
        for t in range(1, num_periods + 1):
            for c in crudes:
                cost_terms.append(f"    + {c['cost']:.2f} CRUDE_PROC_{c['name']}_T{t}\n")

        # 2. Conversion Unit operating costs (FCCU, CCR, DHDS, HCU)
        for t in range(1, num_periods + 1):
            cost_terms.append(f"    + 145.00 FCCU_THROUGHPUT_T{t}\n")
            cost_terms.append(f"    + 210.00 CCR_REFORMER_FEED_T{t}\n")
            cost_terms.append(f"    + 85.00 DHDS_HYDROTREATER_FEED_T{t}\n")
            cost_terms.append(f"    + 320.00 HYDROCRACKER_FEED_T{t}\n")
            cost_terms.append(f"    + 45.00 CDU_VDU_TOTAL_DISTILLATION_T{t}\n")

        # 3. Blending and transportation costs to depots
        for t in range(1, num_periods + 1):
            for d in depots:
                freight = d["dist_km"] * pipeline_rate_per_ton_km
                cost_terms.append(f"    + {freight:.2f} DISPATCH_MS_{d['name']}_T{t}\n")
                cost_terms.append(f"    + {freight:.2f} DISPATCH_HSD_{d['name']}_T{t}\n")
                cost_terms.append(f"    + {freight * 1.15:.2f} DISPATCH_ATF_{d['name']}_T{t}\n")

        f.writelines(cost_terms)

        f.write("\nSubject To\n")

        # Constraints
        # 1. Crude Distillation Unit (CDU) Capacity & Balance per period
        for t in range(1, num_periods + 1):
            crude_sum = " + ".join([f"CRUDE_PROC_{c['name']}_T{t}" for c in crudes])
            f.write(f"  CDU_Capacity_Limit_T{t}: {crude_sum} <= 650000.0\n")
            f.write(f"  CDU_Min_Turndown_T{t}: {crude_sum} >= 350000.0\n")
            f.write(f"  CDU_Total_Equate_T{t}: {crude_sum} - CDU_VDU_TOTAL_DISTILLATION_T{t} = 0.0\n")

            # Crude Component Yield Balances
            naphtha_sum = " + ".join([f"{c['naphtha_yield']:.3f} CRUDE_PROC_{c['name']}_T{t}" for c in crudes])
            f.write(f"  StraightRun_Naphtha_Yield_T{t}: {naphtha_sum} - SR_NAPHTHA_RAW_T{t} = 0.0\n")

            dist_sum = " + ".join([f"{c['distillate_yield']:.3f} CRUDE_PROC_{c['name']}_T{t}" for c in crudes])
            f.write(f"  Middle_Distillate_Yield_T{t}: {dist_sum} - RAW_MIDDLE_DIST_T{t} = 0.0\n")

            gasoil_sum = " + ".join([f"{c['gasoil_yield']:.3f} CRUDE_PROC_{c['name']}_T{t}" for c in crudes])
            f.write(f"  Heavy_Gasoil_Yield_T{t}: {gasoil_sum} - RAW_VACUUM_GASOIL_T{t} = 0.0\n")

            res_sum = " + ".join([f"{c['residue_yield']:.3f} CRUDE_PROC_{c['name']}_T{t}" for c in crudes])
            f.write(f"  Vacuum_Residue_Yield_T{t}: {res_sum} - RESIDUE_BITUMEN_T{t} = 0.0\n")

        # 2. Secondary Conversion Unit Processing Balances
        for t in range(1, num_periods + 1):
            # CCR Reforming: converts straight-run naphtha to high-octane reformate for MS
            f.write(f"  CCR_Feed_Balance_T{t}: SR_NAPHTHA_RAW_T{t} - CCR_REFORMER_FEED_T{t} - PETROCHEM_NAPHTHA_EXPORT_T{t} = 0.0\n")
            f.write(f"  CCR_Capacity_Limit_T{t}: CCR_REFORMER_FEED_T{t} <= 140000.0\n")
            f.write(f"  Reformate_Production_T{t}: 0.86 CCR_REFORMER_FEED_T{t} - HIGH_OCTANE_REFORMATE_T{t} = 0.0\n")

            # Hydrocracker & FCCU: converts gasoil into gasoline & diesel streams
            f.write(f"  FCCU_Feed_Balance_T{t}: RAW_VACUUM_GASOIL_T{t} - FCCU_THROUGHPUT_T{t} - HYDROCRACKER_FEED_T{t} = 0.0\n")
            f.write(f"  FCCU_Capacity_Limit_T{t}: FCCU_THROUGHPUT_T{t} <= 180000.0\n")
            f.write(f"  Hydrocracker_Capacity_Limit_T{t}: HYDROCRACKER_FEED_T{t} <= 120000.0\n")

            f.write(f"  FCC_Gasoline_Yield_T{t}: 0.48 FCCU_THROUGHPUT_T{t} - FCC_GASOLINE_COMPONENT_T{t} = 0.0\n")
            f.write(f"  FCC_LightCycleOil_Yield_T{t}: 0.32 FCCU_THROUGHPUT_T{t} - FCC_LCO_DIESEL_T{t} = 0.0\n")
            f.write(f"  HCU_Diesel_Yield_T{t}: 0.62 HYDROCRACKER_FEED_T{t} - HCU_ULTRALOW_SULFUR_DIESEL_T{t} = 0.0\n")
            f.write(f"  HCU_Kero_Yield_T{t}: 0.24 HYDROCRACKER_FEED_T{t} - HCU_JET_KEROSENE_T{t} = 0.0\n")

            # DHDS: Hydrodesulfurization of middle distillates to BS-VI diesel
            f.write(f"  DHDS_Feed_Balance_T{t}: RAW_MIDDLE_DIST_T{t} + FCC_LCO_DIESEL_T{t} - DHDS_HYDROTREATER_FEED_T{t} = 0.0\n")
            f.write(f"  DHDS_Capacity_Limit_T{t}: DHDS_HYDROTREATER_FEED_T{t} <= 240000.0\n")
            f.write(f"  DHDS_Product_Yield_T{t}: 0.98 DHDS_HYDROTREATER_FEED_T{t} - HYDROTREATED_DIESEL_T{t} = 0.0\n")

        # 3. Product Blending & BS-VI Specifications (Octane, Sulfur, Cetane)
        for t in range(1, num_periods + 1):
            # Motor Spirit (Petrol) Blending
            ms_dispatch_sum = " + ".join([f"DISPATCH_MS_{d['name']}_T{t}" for d in depots])
            f.write(f"  MS_Blend_Mass_Balance_T{t}: HIGH_OCTANE_REFORMATE_T{t} + FCC_GASOLINE_COMPONENT_T{t} + ALKYLATE_OCTANE_T{t} - ({ms_dispatch_sum}) = 0.0\n")

            # Research Octane Number (RON >= 95 for Premium Petrol)
            # Reformate RON ~ 102, FCC Gasoline ~ 91, Alkylate ~ 96
            f.write(f"  MS_Octane_Specification_T{t}: 102.0 HIGH_OCTANE_REFORMATE_T{t} + 91.0 FCC_GASOLINE_COMPONENT_T{t} + 96.0 ALKYLATE_OCTANE_T{t} - 95.0 ({ms_dispatch_sum}) >= 0.0\n")

            # BS-VI Sulfur in Petrol (<= 10 ppm)
            f.write(f"  MS_BS6_Sulfur_Specification_T{t}: 2.0 HIGH_OCTANE_REFORMATE_T{t} + 18.0 FCC_GASOLINE_COMPONENT_T{t} + 1.0 ALKYLATE_OCTANE_T{t} - 10.0 ({ms_dispatch_sum}) <= 0.0\n")

            # High Speed Diesel (HSD) Blending
            hsd_dispatch_sum = " + ".join([f"DISPATCH_HSD_{d['name']}_T{t}" for d in depots])
            f.write(f"  HSD_Blend_Mass_Balance_T{t}: HYDROTREATED_DIESEL_T{t} + HCU_ULTRALOW_SULFUR_DIESEL_T{t} - ({hsd_dispatch_sum}) = 0.0\n")

            # BS-VI Sulfur in Diesel (<= 10 ppm)
            f.write(f"  HSD_BS6_Sulfur_Specification_T{t}: 8.5 HYDROTREATED_DIESEL_T{t} + 3.0 HCU_ULTRALOW_SULFUR_DIESEL_T{t} - 10.0 ({hsd_dispatch_sum}) <= 0.0\n")

            # Cetane Index (>= 51 for BS-VI diesel)
            f.write(f"  HSD_Cetane_Number_Spec_T{t}: 52.5 HYDROTREATED_DIESEL_T{t} + 56.0 HCU_ULTRALOW_SULFUR_DIESEL_T{t} - 51.0 ({hsd_dispatch_sum}) >= 0.0\n")

            # Aviation Turbine Fuel (ATF)
            atf_dispatch_sum = " + ".join([f"DISPATCH_ATF_{d['name']}_T{t}" for d in depots])
            f.write(f"  ATF_Blend_Mass_Balance_T{t}: HCU_JET_KEROSENE_T{t} - ({atf_dispatch_sum}) >= 0.0\n")

        # 4. Regional Depot Demand Fulfillments
        for t in range(1, num_periods + 1):
            for d in depots:
                f.write(f"  Demand_MS_{d['name']}_T{t}: DISPATCH_MS_{d['name']}_T{t} >= {d['ms_demand']:.1f}\n")
                f.write(f"  Demand_HSD_{d['name']}_T{t}: DISPATCH_HSD_{d['name']}_T{t} >= {d['hsd_demand']:.1f}\n")
                f.write(f"  Demand_ATF_{d['name']}_T{t}: DISPATCH_ATF_{d['name']}_T{t} >= {d['atf_demand']:.1f}\n")

        # Bounds
        f.write("\nBounds\n")
        for t in range(1, num_periods + 1):
            for c in crudes:
                f.write(f"  0.0 <= CRUDE_PROC_{c['name']}_T{t} <= {c['max_avail']:.1f}\n")
            f.write(f"  0.0 <= ALKYLATE_OCTANE_T{t} <= 45000.0\n")
            f.write(f"  0.0 <= PETROCHEM_NAPHTHA_EXPORT_T{t} <= 60000.0\n")

        f.write("\nEnd\n")

    size_kb = os.path.getsize(output_path) / 1024
    print(f"Successfully generated {output_path} ({size_kb:.1f} KB)")

if __name__ == "__main__":
    out_file = os.path.join("test_samples", "hpcl_mumbai_refinery_benchmark.lp")
    generate_hpcl_model(out_file, num_periods=12, num_depots=8)
