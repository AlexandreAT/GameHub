namespace Gamehub.Server.Models
{
    public class CommunityDatabaseSettings
    {
        public string ConnectionString { get; set; } = null;
        public string DatabaseName { get; set; } = null;
        public string CommunityCollectionName { get; set; } = null;
    }
}
