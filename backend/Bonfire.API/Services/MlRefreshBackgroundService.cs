using Bonfire.API.Data;
using Microsoft.EntityFrameworkCore;

namespace Bonfire.API.Services;

public class MlRefreshBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<MlRefreshBackgroundService> _logger;

    public MlRefreshBackgroundService(IServiceScopeFactory scopeFactory, ILogger<MlRefreshBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Run once per day at midnight (server local time).
                var nowLocal = DateTime.Now;
                var nextMidnightLocal = nowLocal.Date.AddDays(1);
                var delay = nextMidnightLocal - nowLocal;
                if (delay < TimeSpan.FromSeconds(1)) delay = TimeSpan.FromSeconds(1);
                _logger.LogInformation("ML refresh scheduled in {Delay} (next local midnight)", delay);
                await Task.Delay(delay, stoppingToken);

                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var ml = scope.ServiceProvider.GetRequiredService<MlService>();

                var supporterIds = await db.Supporters.AsNoTracking()
                    .Where(s => s.Status == "Active")
                    .Select(s => s.SupporterId)
                    .ToListAsync(stoppingToken);

                foreach (var id in supporterIds)
                {
                    await ml.RefreshPredictionsForEntityAsync("Supporter", id);
                    _logger.LogInformation("ML refresh supporter {Id}", id);
                }

                var residentIds = await db.Residents.AsNoTracking()
                    .Where(r => r.CaseStatus == "Active")
                    .Select(r => r.ResidentId)
                    .ToListAsync(stoppingToken);

                foreach (var id in residentIds)
                {
                    await ml.RefreshPredictionsForEntityAsync("Resident", id);
                    _logger.LogInformation("ML refresh resident {Id}", id);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ML background refresh cycle failed");
            }
            // After running at midnight, sleep a little to avoid double-trigger if clock shifts.
            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
        }
    }
}
