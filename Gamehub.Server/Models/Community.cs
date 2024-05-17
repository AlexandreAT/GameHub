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

        [BsonElement("Criador Id")]
        public string? Creator { get; set; } = null;

        [Required(ErrorMessage = "A comunidade precisa de um nome.")]
        [BsonElement("Nome da comunidade")]
        public string Name { get; set; } = null;

        [BsonElement("Jogo relacionado a comunidade")]
        public string? Game { get; set; } = null;

        [BsonElement("Imagem de fundo")]
        public string? backgroundImageSrc { get; set; } = null;

        [BsonElement("Icone")]
        public string? iconeImageSrc { get; set; } = null;

        [BsonElement("Descrição")]
        public string? Description { get; set; } = null;

        [BsonElement("Posts")]
        public List<string>? Post { get; set; } = null;

        [BsonElement("Seguidores")]
        public List<string>? Followers { get; set; } = null;

    }
}