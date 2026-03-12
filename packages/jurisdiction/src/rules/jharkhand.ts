// =============================================================================
// Jharkhand Jurisdiction Rules
// =============================================================================
// State-specific legal rules for Jharkhand. Each rule encodes a symbolic
// legal position that the resolver can surface for a given topic.
// =============================================================================

import type { JurisdictionRule } from '../resolver.js';

export const jharkhandRules: JurisdictionRule[] = [
  {
    id: 'jh-alcohol-001',
    state: 'jharkhand',
    topic: 'alcohol',
    condition: 'Possession or consumption of alcohol in Jharkhand',
    legalPosition:
      'Alcohol is legal but regulated in Jharkhand under the Jharkhand Excise Act, 1915. ' +
      'The state government controls licensing of manufacture, sale, and distribution. ' +
      'Illicit distillation and sale without license are punishable offences.',
    act: 'Jharkhand Excise Act, 1915',
    section: 'Section 34',
  },
  {
    id: 'jh-vehicle-001',
    state: 'jharkhand',
    topic: 'vehicle',
    condition: 'Motor vehicle offences or regulations in Jharkhand',
    legalPosition:
      'The Motor Vehicles Act, 1988 applies in Jharkhand with state-level amendments. ' +
      'Jharkhand has adopted additional penalties and enforcement rules for traffic violations ' +
      'under the Jharkhand Motor Vehicles Rules.',
    act: 'Motor Vehicles Act, 1988',
    section: 'Section 3 (with Jharkhand amendments)',
  },
  {
    id: 'jh-rent-001',
    state: 'jharkhand',
    topic: 'rent',
    condition: 'Tenant renting premises in Jharkhand',
    legalPosition:
      'The Jharkhand Rent Control Act governs the relationship between landlords and tenants. ' +
      'It provides protections against arbitrary eviction and regulates fair rent determination. ' +
      'Landlords must follow due process for eviction proceedings.',
    act: 'Jharkhand Rent Control Act',
    section: 'Section 4',
  },
];
