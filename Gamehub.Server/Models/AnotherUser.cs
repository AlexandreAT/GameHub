namespace Gamehub.Server.Models
{
    public class AnotherUser
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string? ImgSrc { get; set; } = null;
        public List<Post>? Posts { get; set; } = null;
    }
}
