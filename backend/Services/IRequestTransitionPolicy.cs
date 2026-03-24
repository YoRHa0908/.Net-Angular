using RequestManager.Api.Models;

namespace RequestManager.Api.Services;

public interface IRequestTransitionPolicy
{
    bool CanTransition(RequestStatus from, RequestStatus to, bool isManager);
}
