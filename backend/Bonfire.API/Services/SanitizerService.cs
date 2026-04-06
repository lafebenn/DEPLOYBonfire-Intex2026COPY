namespace Bonfire.API.Services;

public class SanitizerService
{
    private readonly Ganss.Xss.HtmlSanitizer _sanitizer;

    public SanitizerService()
    {
        _sanitizer = new Ganss.Xss.HtmlSanitizer();
        _sanitizer.AllowedTags.Clear();
    }

    public string? Sanitize(string? input) =>
        string.IsNullOrWhiteSpace(input) ? input : _sanitizer.Sanitize(input);
}
