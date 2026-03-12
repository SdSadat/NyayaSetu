// =============================================================================
// West Bengal Jurisdiction Rules
// =============================================================================
// State-specific legal rules for West Bengal. Each rule encodes a symbolic
// legal position that the resolver can surface for a given topic.
// =============================================================================

import type { JurisdictionRule } from '../resolver.js';

export const westBengalRules: JurisdictionRule[] = [
  {
    id: 'wb-rent-001',
    state: 'west-bengal',
    topic: 'rent',
    condition: 'Tenant renting premises in West Bengal',
    legalPosition:
      'The West Bengal Premises Tenancy Act, 1997 restricts the amount of advance rent a landlord may demand. ' +
      'A landlord cannot demand more than one month\u2019s rent as advance. Excessive advance rent demands are not enforceable.',
    act: 'West Bengal Premises Tenancy Act, 1997',
    section: 'Section 5',
  },
  {
    id: 'wb-alcohol-001',
    state: 'west-bengal',
    topic: 'alcohol',
    condition: 'Possession or consumption of alcohol in West Bengal',
    legalPosition:
      'Alcohol is legal in West Bengal. The sale, distribution, and consumption of liquor is regulated ' +
      'under the Bengal Excise Act, 1909. A valid license is required for sale and manufacture.',
    act: 'Bengal Excise Act, 1909',
    section: 'Section 17',
  },
  {
    id: 'wb-vehicle-001',
    state: 'west-bengal',
    topic: 'vehicle',
    condition: 'Motor vehicle offences or regulations in West Bengal',
    legalPosition:
      'The standard Motor Vehicles Act, 1988 applies in West Bengal. The state follows central MV Act provisions ' +
      'for licensing, registration, and traffic offences without significant state-level amendments.',
    act: 'Motor Vehicles Act, 1988',
    section: 'Section 3',
  },
];
