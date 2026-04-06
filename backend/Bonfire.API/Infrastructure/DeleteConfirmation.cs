namespace Bonfire.API.Infrastructure;

public static class DeleteConfirmation
{
    public static bool IsConfirmed(IQueryCollection query) =>
        query.TryGetValue("confirm", out var v) &&
        string.Equals(v.ToString(), "true", StringComparison.OrdinalIgnoreCase);

    public const string Message = "Delete requires confirmation. Add ?confirm=true to the request.";
}
