export const CMS_SETTINGS_STORAGE_KEY = 'cms-settings-updated-at';
export const CMS_SETTINGS_EVENT = 'cms-settings-updated';

export const notifyCmsSettingsUpdated = () => {
  const timestamp = String(Date.now());
  try {
    localStorage.setItem(CMS_SETTINGS_STORAGE_KEY, timestamp);
  } catch {
    // Ignore storage failures (private browsing, quota, etc.)
  }
  window.dispatchEvent(new Event(CMS_SETTINGS_EVENT));
};
