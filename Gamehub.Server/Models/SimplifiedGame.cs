namespace Gamehub.Server.Models
{
    public class SimplifiedGame
    {
        public long? gameId { get; set; }
        public string name { get; set; }
        public string? imageUrl { get; set; } = null;
        public string? siteUrl { get; set; } = null;
    }
}
