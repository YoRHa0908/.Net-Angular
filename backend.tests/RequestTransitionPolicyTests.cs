using RequestManager.Api.Models;
using RequestManager.Api.Services;
using Xunit;

namespace RequestManager.Api.Tests;

public class RequestTransitionPolicyTests
{
    private readonly RequestTransitionPolicy _policy = new();

    [Theory]
    [InlineData(RequestStatus.Draft, RequestStatus.Open, false, true)]
    [InlineData(RequestStatus.Open, RequestStatus.InProgress, false, true)]
    [InlineData(RequestStatus.InProgress, RequestStatus.Done, false, false)]
    [InlineData(RequestStatus.InProgress, RequestStatus.Done, true, true)]
    [InlineData(RequestStatus.Open, RequestStatus.Cancelled, false, false)]
    [InlineData(RequestStatus.Open, RequestStatus.Cancelled, true, true)]
    [InlineData(RequestStatus.Done, RequestStatus.Open, true, false)]
    [InlineData(RequestStatus.Open, RequestStatus.Overdue, true, false)]
    public void CanTransition_UsesConfiguredRules(
        RequestStatus from,
        RequestStatus to,
        bool isManager,
        bool expected)
    {
        var actual = _policy.CanTransition(from, to, isManager);
        Assert.Equal(expected, actual);
    }
}
