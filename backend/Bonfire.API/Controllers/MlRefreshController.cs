using Bonfire.API.Data;
using Bonfire.API.Infrastructure;
using Bonfire.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Bonfire.API.Controllers;

[ApiController]
[Authorize(Roles = "Admin,Staff")]
[Route("api/ml/refresh")]
public class MlRefreshController : ControllerBase
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<MlRefreshController> _logger;

    public MlRefreshController(IServiceScopeFactory scopeFactory, ILogger<MlRefreshController> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    [HttpPost("supporters")]
    public ActionResult<ApiResponse<object>> RefreshSupporters()
    {
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var ml = scope.ServiceProvider.GetRequiredService<MlService>();

                var ids = await db.Supporters.AsNoTracking()
                    .Where(s => s.Status == "Active")
                    .Select(s => s.SupporterId)
                    .ToListAsync();

                foreach (var id in ids)
                {
                    await ml.RefreshPredictionsForEntityAsync("Supporter", id);
                }

                _logger.LogInformation("ML supporter refresh completed: {Count} supporters", ids.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ML supporter refresh failed");
            }
        });

        return Accepted(ApiResponse<object>.Ok(new { queued = true }, "Refresh queued"));
    }
}

