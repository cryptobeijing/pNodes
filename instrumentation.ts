export async function register() {
  // Only run on server, not during build
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initRedis } = await import("@/server/services/redis.service");
    const { startStatsEnrichmentJob } = await import(
      "@/server/services/stats-enrichment.service"
    );

    // Initialize Redis connection
    try {
      await initRedis();
      // Start background enrichment job
      startStatsEnrichmentJob();
      console.log("Background services initialized successfully");
    } catch (error) {
      console.warn("Failed to initialize background services:", error);
    }
  }
}
