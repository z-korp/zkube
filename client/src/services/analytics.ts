import * as amplitude from "@amplitude/analytics-browser";

const AMPLITUDE_API_KEY = import.meta.env.VITE_AMPLITUDE_API_KEY;
const IS_PRODUCTION = true;

// Helper function to track events
export const trackEvent = (
  eventName: string,
  eventProperties?: Record<string, any>,
) => {
  if (!AMPLITUDE_API_KEY) {
    console.warn("Amplitude API key is not defined");
    return;
  }

  try {
    amplitude.track(eventName, {
      ...eventProperties,
      environment: IS_PRODUCTION ? "production" : "development",
    });
  } catch (error) {
    console.error("Failed to track event:", error);
  }
};

// Initialize Amplitude only if API key is available
if (AMPLITUDE_API_KEY) {
  amplitude.init(AMPLITUDE_API_KEY, {
    defaultTracking: {
      sessions: true,
      pageViews: true,
      formInteractions: true,
      fileDownloads: true,
    },
    logLevel: IS_PRODUCTION
      ? amplitude.Types.LogLevel.Warn
      : amplitude.Types.LogLevel.Debug,
  });
} else {
  console.warn("Amplitude initialization skipped - API key not found");
}

// Export amplitude instance for direct access if needed
export { amplitude };
