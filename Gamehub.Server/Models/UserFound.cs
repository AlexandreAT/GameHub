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
        public List<Post> Posts { get; set; }

        [JsonIgnore]
        public string? ImageSrc { get; set; }

        [JsonIgnore]
        public List<AnotherUser>? Following { get; set; } = null;

        [JsonIgnore]
        public List<AnotherUser>? Followers { get; set; } = null;

        [JsonIgnore]
        public List<Community>? UserCommunities { get; set; } = null;

        [JsonIgnore]
        public List<Community>? UserCreatedCommunities { get; set; } = null;

        [JsonIgnore]
        public string? Biography { get; set; } = null;

        [JsonIgnore]
        public string? City { get; set; } = null;

        [JsonIgnore]
        public string? State { get; set; } = null;
    }
}