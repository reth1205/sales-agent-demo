using Testcontainers.PostgreSql;

namespace SalesAgent.Domain.Tests.Fixtures;

/// <summary>
/// Shared real-Postgres fixture for repository tests. Repository tests must run against a real
/// database — mocked-DB repository tests are banned (see rm-api-tester.md): they verify nothing
/// about whether the SQL is actually correct.
/// </summary>
public sealed class PostgresFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder("postgres:16-alpine")
        .WithDatabase("salesagent_test")
        .Build();

    public string ConnectionString => _container.GetConnectionString();

    public Task InitializeAsync() => _container.StartAsync();

    public Task DisposeAsync() => _container.DisposeAsync().AsTask();
}

[CollectionDefinition("Postgres")]
public sealed class PostgresCollection : ICollectionFixture<PostgresFixture>;
