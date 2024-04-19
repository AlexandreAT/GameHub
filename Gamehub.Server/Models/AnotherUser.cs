namespace Gamehub.Server.Models
{
    public class AnotherUser
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string ImgSrc { get; set; }
        public List<Post>? Posts { get; set; } = null;
    }
}
