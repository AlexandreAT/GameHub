using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace Gamehub.Server.Models
{
    public class UserFound
    {
        public string Name { get; set; }
        public string Surname { get; set; }
        public string Nickname { get; set; }
        public string Cpf { get; set; }
        public string Phone { get; set; }
        public string Email { get; set; }

        [JsonIgnore]
        public string Id { get; set; }

        [JsonIgnore]
        public string Password { get; set; }

        [JsonIgnore]
        public byte[]? ImageSrc { get; set; }

        [JsonIgnore]
        public List<SimplifiedUser>? Following { get; set; } = null;

        [JsonIgnore]
        public List<SimplifiedUser>? Followers { get; set; } = null;

        [JsonIgnore]
        public List<SimplifiedCommunity>? UserCommunities { get; set; } = null;

        [JsonIgnore]
        public List<SimplifiedCommunity>? UserCreatedCommunities { get; set; } = null;

        [JsonIgnore]
        public string? Biography { get; set; } = null;

        [JsonIgnore]
        public string? City { get; set; } = null;

        [JsonIgnore]
        public string? State { get; set; } = null;
    }
}