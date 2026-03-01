// Suppress Next.js preload warnings in browser console
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    if (message.includes('preloaded using link preload but not used')) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

export {};
