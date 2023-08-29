export function isBrowserEnvironment() {
  try {
    const globalWindow = window;
    return true;
  } catch (error) {}
  return false;
}
