'use strict';
/* =====================================================================
   CONFIG  - edit this file to change incident types or responders
   ===================================================================== */

// Incident types shown to citizens (key => label)
const TYPES = {
  fire:     'Fire',
  crime:    'Crime',
  medical:  'Medical Emergency',
  traffic:  'Traffic Accident',
  disaster: 'Flood / Disaster',
};

// Which unit types respond to each incident type.
// (The server enforces the same rules in api/admin.php - keep both in sync.)
const REQUIRED = {
  fire:     ['fire', 'medical'],
  crime:    ['police'],
  medical:  ['medical'],
  traffic:  ['police', 'medical'],
  disaster: ['drrmo', 'medical', 'fire'],
};

// Display names of the unit types
const UNIT_LABEL = {
  fire:    'Fire',
  police:  'Police',
  medical: 'Ambulance / Medical',
  drrmo:   'DRRMO Rescue',
};
