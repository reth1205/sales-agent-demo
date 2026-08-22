using DbUp;
using Npgsql;

var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__SalesAgent")
    ?? "Host=localhost;Port=5432;Database=salesagent;Username=postgres;Password=postgres";

var resetDb = Environment.GetEnvironmentVariable("RESET_DB") == "1";

var scriptsPath = Path.Combine(AppContext.BaseDirectory, "scripts");
if (!Directory.Exists(scriptsPath))
{
    // Running via `dotnet run` from source (not a published/copied output) — fall back to the
    // source-tree scripts folder.
    scriptsPath = Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "scripts");
}

// No scripts yet is a valid state (fresh scaffold, zero migrations authored) — DbUp requires the
// directory to exist even when empty.
Directory.CreateDirectory(scriptsPath);

if (resetDb)
{
    var builder = new NpgsqlConnectionStringBuilder(connectionString);
    var targetDatabase = builder.Database;
    builder.Database = "postgres";

    using var adminConnection = new NpgsqlConnection(builder.ConnectionString);
    adminConnection.Open();

    using (var terminate = adminConnection.CreateCommand())
    {
        terminate.CommandText =
            "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = @db AND pid <> pg_backend_pid();";
        terminate.Parameters.AddWithValue("db", targetDatabase!);
        terminate.ExecuteNonQuery();
    }

    using (var drop = adminConnection.CreateCommand())
    {
        drop.CommandText = $"DROP DATABASE IF EXISTS \"{targetDatabase}\";";
        drop.ExecuteNonQuery();
    }

    using (var create = adminConnection.CreateCommand())
    {
        create.CommandText = $"CREATE DATABASE \"{targetDatabase}\";";
        create.ExecuteNonQuery();
    }

    Console.WriteLine($"Database '{targetDatabase}' dropped and recreated.");
}

EnsureDatabase.For.PostgresqlDatabase(connectionString);

var upgrader = DeployChanges.To
    .PostgresqlDatabase(connectionString)
    .WithScriptsFromFileSystem(scriptsPath)
    .LogToConsole()
    .Build();

var result = upgrader.PerformUpgrade();

if (!result.Successful)
{
    Console.ForegroundColor = ConsoleColor.Red;
    Console.WriteLine(result.Error);
    Console.ResetColor();
    return -1;
}

Console.ForegroundColor = ConsoleColor.Green;
Console.WriteLine($"Migration successful — {result.Scripts.Count()} script(s) applied.");
Console.ResetColor();
return 0;
