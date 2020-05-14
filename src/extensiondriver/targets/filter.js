/**
 * Filters debugger targets that we can use
 */

/**
 * We also exclude chromedriver internal extension from available targets
 * See: https://chromium.googlesource.com/chromium/src.git/+/master/chrome/test/chromedriver/extension/
 */
const CHROMEDRIVER_EXTENSION_ID = 'aapnijgdinlhnhlmodcfapnahmbfebeb';

exports.isCorrectTarget = function (target) {
  return isSuitableType(target)
    && !isDevtools(target)
    && !isDonkeyScriptBg(target)
    && !isChromedriverExtensionBg(target)
    && !isDonkeyScriptUi(target)
};

function isSuitableType(target) {
  // allowing 'background_page' type is extra feature to test chrome extensions
  return target.type === 'page' || target.type === 'background_page';
}

function isDevtools(target) {
  return target.url.startsWith('chrome-devtools://');
}

function isDonkeyScriptBg(target) {
  return target.type === 'background_page' && target.extensionId === chrome.runtime.id;
}

function isChromedriverExtensionBg(target) {
  return target.type === 'background_page' && target.extensionId === CHROMEDRIVER_EXTENSION_ID;
}

function isDonkeyScriptUi(target) {
  return target.type === 'page' && target.url === chrome.runtime.getURL('core/ui/ui.html');
}

function isEnabledExtension(target, enabledExtensions) {
  return target.type === 'background_page'
    ? Boolean(enabledExtensions.filter(e => e.id === target.extensionId).length)
    : true
}
