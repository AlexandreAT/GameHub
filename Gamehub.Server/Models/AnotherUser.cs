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
        public byte[]? ImageSrc { get; set; } = null;
        public List<SimplifiedUser>? Following { get; set; } = null;
        public string? Biography { get; set; } = null;
        public string? City { get; set; } = null;
        public string? State { get; set; } = null;
        public List<SimplifiedCommunity>? UserCommunities { get; set; } = null;
        public List<SimplifiedCommunity>? UserCreatedCommunities { get; set; } = null;
    }
}
