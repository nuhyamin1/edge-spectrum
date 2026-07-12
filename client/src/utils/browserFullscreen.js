export const getFullscreenElement = () => (
  document.fullscreenElement || document.webkitFullscreenElement || null
);

export const requestAppFullscreen = async () => {
  const root = document.documentElement;
  const requestFullscreen = root.requestFullscreen || root.webkitRequestFullscreen;

  if (!requestFullscreen || getFullscreenElement()) {
    return Boolean(getFullscreenElement());
  }

  try {
    const result = root.requestFullscreen
      ? root.requestFullscreen({ navigationUI: 'hide' })
      : requestFullscreen.call(root);
    await Promise.resolve(result);
    return true;
  } catch (error) {
    console.warn('Browser fullscreen request was not allowed:', error);
    return false;
  }
};

export const exitAppFullscreen = async () => {
  if (!getFullscreenElement()) {
    return true;
  }

  const exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen;
  if (!exitFullscreen) {
    return false;
  }

  try {
    await Promise.resolve(exitFullscreen.call(document));
    return true;
  } catch (error) {
    console.warn('Could not exit browser fullscreen:', error);
    return false;
  }
};
