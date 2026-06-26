export async function register() {
  // Only run in Node.js runtime, not Edge
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const { default: cron } = await import('node-cron')
  const { scheduleDailyFight } = await import('./lib/daily-fight')

  // Chaque jour à 9h00 : crée le combat du jour et clôture celui de la veille
  cron.schedule('0 9 * * *', async () => {
    console.log('[CRON] Lancement du combat quotidien...')
    await scheduleDailyFight()
  }, { timezone: 'Europe/Paris' })

  console.log('[CRON] Planificateur de combats démarré (tous les jours à 9h00 CET)')
}
