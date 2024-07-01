namespace Gamehub.Server.Models
{
    public class GameModel
    {
        public long? id { get; set; }
        public string name { get; set; }
        public List<string> genres { get; set; }
        public string? imageUrl { get; set; } = null;
    }
}
