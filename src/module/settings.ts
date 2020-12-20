import { MODULE_ABBREV, MODULE_ID, MySettings } from './constants';

export const registerSettings = function() {
  // Debug use
  CONFIG[MODULE_ID] = { debug: true };
  CONFIG.debug.hooks = true;


	// Register any custom module settings here
}
