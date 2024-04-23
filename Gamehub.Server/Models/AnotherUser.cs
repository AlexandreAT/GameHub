using MongoDB.Bson.Serialization.Attributes;

namespace Gamehub.Server.Models
{
    public class AnotherUser
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string? ImgSrc { get; set; } = null;
        public List<Post>? Posts { get; set; } = null;
        public List<AnotherUser>? Following { get; set; } = null;
        public string? Biography { get; set; } = null;
        public string? City { get; set; } = null;
        public string? State { get; set; } = null;
        public List<Community>? UserCommunities { get; set; } = null;
        public List<Community>? UserCreatedCommunities { get; set; } = null;
    }
}
