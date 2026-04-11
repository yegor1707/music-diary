import app from "./app";
import { logger } from "./lib/logger";
import { createClient } from "@supabase/supabase-js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

    const pingSupabase = async () => {
      try {
        const { error } = await supabase.storage.listBuckets();
        if (error) {
          logger.warn({ error }, "Supabase keep-alive ping failed");
        } else {
          logger.info("Supabase keep-alive ping OK");
        }
      } catch (err) {
        logger.warn({ err }, "Supabase keep-alive ping error");
      }
    };

    setInterval(pingSupabase, SIX_HOURS_MS);
    logger.info("Supabase keep-alive cron started (every 6 hours)");
  } else {
    logger.info("Supabase env vars not set, keep-alive cron skipped");
  }
});
