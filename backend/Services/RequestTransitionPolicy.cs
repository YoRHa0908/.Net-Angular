using RequestManager.Api.Models;

namespace RequestManager.Api.Services;

public class RequestTransitionPolicy : IRequestTransitionPolicy
{
    public bool CanTransition(RequestStatus from, RequestStatus to, bool isManager)
    {
        if (from == to) return true;

        return (from, to) switch
        {
            (RequestStatus.Draft, RequestStatus.Open) => true,
            (RequestStatus.Open, RequestStatus.InProgress) => true,
            (RequestStatus.InProgress, RequestStatus.Done) => isManager,
            (RequestStatus.Open, RequestStatus.Cancelled) => isManager,
            (RequestStatus.InProgress, RequestStatus.Cancelled) => isManager,
            _ => false
        };
    }
}
