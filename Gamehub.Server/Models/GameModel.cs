namespace Gamehub.Server.Models
{
    public class GameModel
    {
        public long? id { get; set; }
        public string name { get; set; }
        public List<string> genres { get; set; }
        public string? imageUrl { get; set; } = null;
        public double? totalRating { get; set; } = null;
        public string? releaseDate { get; set; } = null;
        public string? siteUrl { get; set; } = null;
        public string? summary { get; set; } = null;
        public bool? pin { get; set; } = null;
    }
}
