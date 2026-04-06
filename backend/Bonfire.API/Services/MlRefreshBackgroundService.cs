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
        await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
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

            await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
        }
    }
}
