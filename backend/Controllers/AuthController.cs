using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using RequestManager.Api.Dtos;
using RequestManager.Api.Models;
using RequestManager.Api.Services;

namespace RequestManager.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(
    UserManager<AppUser> userManager,
    SignInManager<AppUser> signInManager,
    IJwtTokenService jwtTokenService) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest dto)
    {
        var existingUser = await userManager.FindByEmailAsync(dto.Email);
        if (existingUser is not null)
        {
            return BadRequest("Email is already registered.");
        }

        var user = new AppUser
        {
            UserName = dto.Email,
            Email = dto.Email
        };

        var result = await userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
        {
            return BadRequest(result.Errors.Select(e => e.Description));
        }

        var role = dto.Role == Roles.Manager ? Roles.Manager : Roles.User;
        await userManager.AddToRoleAsync(user, role);

        var roles = await userManager.GetRolesAsync(user);
        var token = jwtTokenService.CreateToken(user, roles);

        return Ok(new AuthResponse(token, user.Email!, role));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest dto)
    {
        var user = await userManager.FindByEmailAsync(dto.Email);
        if (user is null)
        {
            return Unauthorized("Invalid credentials.");
        }

        var result = await signInManager.CheckPasswordSignInAsync(user, dto.Password, false);
        if (!result.Succeeded)
        {
            return Unauthorized("Invalid credentials.");
        }

        var roles = await userManager.GetRolesAsync(user);
        var token = jwtTokenService.CreateToken(user, roles);

        return Ok(new AuthResponse(token, user.Email!, roles.FirstOrDefault() ?? Roles.User));
    }
}
