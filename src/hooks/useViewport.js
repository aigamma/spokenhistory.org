import { useEffect, useState } from 'react';

const MOBILE_MAX = 767;
const TABLET_MAX = 1023;

function read() {
  if (typeof window === 'undefined') {
    return {
      width: 1440,
      height: 900,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isPortrait: false,
      isLandscape: true,
      isShortLandscape: false,
    };
  }
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isPortrait = height >= width;
  const isLandscape = !isPortrait;
  return {
    width,
    height,
    isMobile: width <= MOBILE_MAX,
    isTablet: width > MOBILE_MAX && width <= TABLET_MAX,
    isDesktop: width > TABLET_MAX,
    isPortrait,
    isLandscape,
    isShortLandscape: isLandscape && height <= 480,
  };
}

export default function useViewport() {
  const [vp, setVp] = useState(read);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    let frame = 0;
    const onChange = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setVp(read()));
    };
    window.addEventListener('resize', onChange);
    window.addEventListener('orientationchange', onChange);
    const mql = window.matchMedia('(orientation: landscape)');
    if (mql.addEventListener) {
      mql.addEventListener('change', onChange);
    } else if (mql.addListener) {
      mql.addListener(onChange);
    }
    return () => {
      window.removeEventListener('resize', onChange);
      window.removeEventListener('orientationchange', onChange);
      if (mql.removeEventListener) {
        mql.removeEventListener('change', onChange);
      } else if (mql.removeListener) {
        mql.removeListener(onChange);
      }
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return vp;
}

export { MOBILE_MAX, TABLET_MAX };
