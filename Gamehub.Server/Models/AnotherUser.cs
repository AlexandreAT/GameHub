using MongoDB.Bson.Serialization.Attributes;

namespace Gamehub.Server.Models
{
    public class AnotherUser
    {
        // Modelo usado para tentar manter os dados do usuário seguro
        public string Id { get; set; }
        public string Name { get; set; }
        public string Surname {  get; set; }
        public string Nickname { get; set; } = null;
        public string? ImageSrc { get; set; } = null;
        public List<string>? Following { get; set; } = null;
        public List<string>? Followers { get; set; } = null;
        public string? Biography { get; set; } = null;
        public string? City { get; set; } = null;
        public string? State { get; set; } = null;
        public List<string>? UserCommunities { get; set; } = null;
        public List<string>? UserCreatedCommunities { get; set; } = null;
        public string? BackgroundImage { get; set; } = null;
    }
}
