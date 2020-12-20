// Import TypeScript modules
import { MODULE_ID, MySettings, TEMPLATES, ConfettiStrength } from './module/constants';
import { registerSettings } from './module/settings.js';
import { log } from './module/helpers';
import { Confetti } from './module/classes/Confetti';

let confettiInstance: Confetti | undefined;

/* ------------------------------------ */
/* Initialize module					*/
/* ------------------------------------ */
Hooks.once('init', async function () {
  log(true, `Initializing ${MODULE_ID}`);

  // Assign custom classes and constants here

  // Register custom module settings
  registerSettings();

  // Preload Handlebars templates
  await loadTemplates(Object.values(flattenObject(TEMPLATES)));

  // Register custom sheets (if any)
});

/* ------------------------------------ */
/* Setup module							*/
/* ------------------------------------ */
Hooks.once('setup', function () {
  // Do anything after initialization but before
  // ready
});

/* ------------------------------------ */
/* When ready							*/
/* ------------------------------------ */
Hooks.once('ready', function () {
  // Do anything once the module is ready
  confettiInstance = new Confetti();
});

Hooks.on('sidebarCollapse', () => {
  confettiInstance.resizeConfettiCanvas();
});

/**
 * Add confetti buttons after the chat-form element.
 *
 * @param html
 */
async function _addConfettiButtons(html: JQuery<HTMLElement>) {
  const chatForm = html.find('#chat-form');

  const gmScreenButtonHtml = await renderTemplate(TEMPLATES.buttons, {});

  chatForm.after(gmScreenButtonHtml);

  const gmScreenButton = html.find('.confetti-buttons > button');

  gmScreenButton.on('click', (event) => {
    event.preventDefault();

    // convert to api.
    const strength = ConfettiStrength[event.currentTarget.dataset.strength];

    log(false, 'Confetti Time', {
      strength,
    });

    const shootConfettiProps = Confetti.getShootConfettiProps(strength);

    confettiInstance.shootConfetti(shootConfettiProps);
  });
}

Hooks.on('renderChatLog', (app: any, html: JQuery<HTMLElement>) => {
  const gmOnly = game.settings.get(MODULE_ID, MySettings.GmOnly);
  if (gmOnly && game.user.isGM) {
    _addConfettiButtons(html);
  }
});
