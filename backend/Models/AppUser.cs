using Microsoft.AspNetCore.Identity;

namespace RequestManager.Api.Models;

public class AppUser : IdentityUser
{
}

public static class Roles
{
    public const string User = "User";
    public const string Manager = "Manager";
}
