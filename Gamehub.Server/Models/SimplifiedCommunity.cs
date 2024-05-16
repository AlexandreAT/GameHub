namespace Gamehub.Server.Models
{
    public class SimplifiedCommunity
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string CreatorId { get; set; }
        public string? CreatorImageSrc { get; set; } = null;
        public string? IconeImageSrc { get; set; } = null;
        public string? BackgroundImageSrc { get; set; } = null;
    }
}
