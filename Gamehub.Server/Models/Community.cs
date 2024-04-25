using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson;
using System.ComponentModel.DataAnnotations;

namespace Gamehub.Server.Models
{
    public class Community
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [Required]
        [BsonElement("Criador")]
        public SimplifiedUser Creator { get; set; } = null;

        [Required(ErrorMessage = "A comunidade precisa de um nome.")]
        [BsonElement("Nome da comunidade")]
        public string Name { get; set; } = null;

        [BsonElement("Jogo relacionado a comunidade")]
        public string? Game { get; set; } = null;

        [BsonElement("Descrição")]
        public string? Description { get; set; } = null;

        [BsonElement("Posts")]
        public List<Post>? Post { get; set; } = null;

        [BsonElement("Seguidores")]
        public List<SimplifiedUser>? Followers { get; set; } = null;

    }
}