using System.Net;
using System.Text.Json;

namespace RequestManager.Api.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task Invoke(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception");
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            context.Response.ContentType = "application/problem+json";

            var payload = new
            {
                type = "https://httpstatuses.com/500",
                title = "Internal Server Error",
                status = 500,
                detail = "An unexpected error occurred."
            };
            await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
        }
    }
}
