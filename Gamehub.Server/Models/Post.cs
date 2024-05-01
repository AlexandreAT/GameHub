using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;

namespace Gamehub.Server.Models
{
    public class Post
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("Autor")]
        public string Author { get; set; } = null;

        [BsonElement("ID do autor")]
        public string? IdAuthor { get; set; } = null;

        [Required(ErrorMessage = "O post precisa de um título.")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "O título do post deve ter no mínimo 2 caracteres.")]
        [BsonElement("Titulo")]
        public string Title { get; set; } = null;

        [Required(ErrorMessage = "O post precisa de um conteúdo.")]
        [StringLength(2000, MinimumLength = 10, ErrorMessage = "O conteúdo do post deve ter no mínimo 10 caracteres.")]
        [BsonElement("Conteúdo")]
        public string Content { get; set; } = null;

        [BsonElement("Comentário")]
        public List<Comment>? Comments { get; set; } = null;

        [BsonElement("Data")]
        public DateTimeOffset? Date { get; set; }

        [BsonElement("Like")]
        public List<LikeDisLike>? Like { get; set; } = null;

        [BsonElement("Dislike")]
        public List<LikeDisLike>? Dislike { get; set; } = null;

        [BsonElement("Jogo relacionado ao post")]
        public string? Game { get; set; } = null;

        [BsonElement("Imagem")]
        public byte[]? ImageSrc { get; set; } = null;
    }
}
