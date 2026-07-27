FROM mcr.microsoft.com/dotnet/sdk:8.0-bookworm-slim AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

COPY ["Gamehub.Server/Gamehub.Server.csproj", "Gamehub.Server/"]
RUN dotnet restore "Gamehub.Server/Gamehub.Server.csproj"

COPY Gamehub.Server/ Gamehub.Server/
RUN dotnet publish "Gamehub.Server/Gamehub.Server.csproj" \
    --configuration "$BUILD_CONFIGURATION" \
    --no-restore \
    --output /app/publish \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0-bookworm-slim AS final
WORKDIR /app

ENV ASPNETCORE_HTTP_PORTS=8080 \
    DOTNET_EnableDiagnostics=0

EXPOSE 8080

COPY --from=build /app/publish .
USER $APP_UID

ENTRYPOINT ["dotnet", "Gamehub.Server.dll"]
