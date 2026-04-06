using System.Security.Claims;
using Bonfire.API.Infrastructure;
using Bonfire.API.Models;
using Bonfire.API.Services;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace Bonfire.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;
    private readonly SignInManager<AppUser> _signInManager;
    private readonly JwtTokenService _jwt;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        UserManager<AppUser> userManager,
        SignInManager<AppUser> signInManager,
        JwtTokenService jwt,
        IConfiguration configuration,
        ILogger<AuthController> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _jwt = jwt;
        _configuration = configuration;
        _logger = logger;
    }

    public class RegisterRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class Verify2FaRequest
    {
        public string Email { get; set; } = string.Empty;
        public string TotpCode { get; set; } = string.Empty;
    }

    public class GoogleLoginRequest
    {
        public string IdToken { get; set; } = string.Empty;
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<object>>> Register([FromBody] RegisterRequest req)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Validation failed"));

        var role = req.Role?.Trim();
        if (role is not ("Admin" or "Staff" or "Donor"))
            return BadRequest(ApiResponse<object>.Fail("Invalid role."));

        var user = new AppUser
        {
            UserName = req.Email.Trim(),
            Email = req.Email.Trim(),
            EmailConfirmed = true,
            DisplayName = req.DisplayName.Trim(),
            Role = role,
            CreatedAt = DateTime.UtcNow,
            TwoFactorEnabled = false
        };

        var result = await _userManager.CreateAsync(user, req.Password);
        if (!result.Succeeded)
            return BadRequest(ApiResponse<object>.Fail(string.Join(" ", result.Errors.Select(e => e.Description))));

        await _userManager.AddToRoleAsync(user, role);
        return StatusCode(201, ApiResponse<object>.Ok(new { userId = user.Id }, "Created"));
    }

    [AllowAnonymous]
    [EnableRateLimiting("login")]
    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<object>>> Login([FromBody] LoginRequest req)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Validation failed"));

        var user = await _userManager.FindByEmailAsync(req.Email.Trim());
        if (user == null)
            return BadRequest(ApiResponse<object>.Fail("Invalid credentials."));

        var chk = await _signInManager.CheckPasswordSignInAsync(user, req.Password, lockoutOnFailure: true);
        if (chk.IsLockedOut)
            return StatusCode(423, ApiResponse<object>.Fail("Account locked."));
        if (!chk.Succeeded)
            return BadRequest(ApiResponse<object>.Fail("Invalid credentials."));

        if (await _userManager.GetTwoFactorEnabledAsync(user))
        {
            return Ok(ApiResponse<object>.Ok(new { requiresTwoFactor = true, email = user.Email }));
        }

        var token = await _jwt.CreateTokenAsync(user, _userManager);
        return Ok(ApiResponse<object>.Ok(new { token }));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<object>>> Me()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null)
            return NotFound(ApiResponse<object>.Fail("Not found"));

        var roles = await _userManager.GetRolesAsync(user);
        return Ok(ApiResponse<object>.Ok(new
        {
            id = user.Id,
            email = user.Email,
            displayName = user.DisplayName,
            role = roles.FirstOrDefault() ?? user.Role,
            linkedSupporterId = user.LinkedSupporterId
        }));
    }

    [Authorize]
    [HttpPost("logout")]
    public ActionResult<ApiResponse<object>> Logout()
    {
        return Ok(ApiResponse<object>.Ok(null, "Signed out"));
    }

    [Authorize]
    [HttpPost("enable-2fa")]
    public async Task<ActionResult<ApiResponse<object>>> EnableTwoFactor()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null)
            return Unauthorized(ApiResponse<object>.Fail("Unauthorized"));

        await _userManager.ResetAuthenticatorKeyAsync(user);
        var key = await _userManager.GetAuthenticatorKeyAsync(user);
        if (string.IsNullOrEmpty(key))
            return BadRequest(ApiResponse<object>.Fail("Could not generate authenticator key."));

        var email = user.Email ?? user.UserName ?? "";
        var issuer = Uri.EscapeDataString("Sanctuary");
        var account = Uri.EscapeDataString(email);
        var secret = Uri.EscapeDataString(key);
        var uri = $"otpauth://totp/{issuer}:{account}?secret={secret}&issuer={issuer}&digits=6";

        return Ok(ApiResponse<object>.Ok(new { sharedKey = key, authenticatorUri = uri }));
    }

    [AllowAnonymous]
    [HttpPost("verify-2fa")]
    public async Task<ActionResult<ApiResponse<object>>> VerifyTwoFactor([FromBody] Verify2FaRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.TotpCode))
            return BadRequest(ApiResponse<object>.Fail("Email and code required."));

        var user = await _userManager.FindByEmailAsync(req.Email.Trim());
        if (user == null)
            return NotFound(ApiResponse<object>.Fail("Not found"));

        var valid = await _userManager.VerifyTwoFactorTokenAsync(
            user,
            TokenOptions.DefaultAuthenticatorProvider,
            req.TotpCode.Trim());

        if (!valid)
            return BadRequest(ApiResponse<object>.Fail("Invalid code."));

        if (!await _userManager.GetTwoFactorEnabledAsync(user))
            await _userManager.SetTwoFactorEnabledAsync(user, true);

        var token = await _jwt.CreateTokenAsync(user, _userManager);
        return Ok(ApiResponse<object>.Ok(new { token }));
    }

    [AllowAnonymous]
    [HttpPost("google-login")]
    public async Task<ActionResult<ApiResponse<object>>> GoogleLogin([FromBody] GoogleLoginRequest req)
    {
        var clientId = _configuration["Google:ClientId"]
                       ?? Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID");
        if (string.IsNullOrWhiteSpace(clientId))
            return StatusCode(500, ApiResponse<object>.Fail("Google OAuth not configured."));

        try
        {
            var payload = await GoogleJsonWebSignature.ValidateAsync(req.IdToken, new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { clientId }
            });

            var email = payload.Email;
            if (string.IsNullOrEmpty(email))
                return BadRequest(ApiResponse<object>.Fail("Token has no email."));

            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                var name = payload.Name ?? email.Split('@')[0];
                user = new AppUser
                {
                    UserName = email,
                    Email = email,
                    EmailConfirmed = true,
                    DisplayName = name,
                    Role = "Donor",
                    CreatedAt = DateTime.UtcNow,
                    TwoFactorEnabled = false
                };
                var tempPwd = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
                var create = await _userManager.CreateAsync(user, tempPwd);
                if (!create.Succeeded)
                    return BadRequest(ApiResponse<object>.Fail(string.Join(" ", create.Errors.Select(e => e.Description))));
                await _userManager.AddToRoleAsync(user, "Donor");
            }

            var token = await _jwt.CreateTokenAsync(user, _userManager);
            return Ok(ApiResponse<object>.Ok(new { token }));
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Google token validation failed");
            return BadRequest(ApiResponse<object>.Fail("Invalid Google token."));
        }
    }
}
