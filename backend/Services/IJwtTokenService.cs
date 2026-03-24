using RequestManager.Api.Models;

namespace RequestManager.Api.Services;

public interface IJwtTokenService
{
    string CreateToken(AppUser user, IList<string> roles);
}
