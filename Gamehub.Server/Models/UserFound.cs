using System.Text.Json.Serialization;

namespace Gamehub.Server.Models
{
    public class UserFound
    {
        public string Name { get; set; }
        public string Surname { get; set; }
        public string Cpf { get; set; }
        public string Phone { get; set; }
        public string Email { get; set; }

        [JsonIgnore]
        public string Id { get; set; }

        [JsonIgnore]
        public string Password { get; set; }

        [JsonIgnore]
        public List<Post> Posts { get; set; }
    }
}