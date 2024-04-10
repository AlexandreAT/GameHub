using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Gamehub.Server.Models
{
    public class Post
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("Autor")]
        public string Author { get; set; }

        [BsonElement("Titulo")]
        public string Title { get; set; }

        [BsonElement("Conteúdo")]
        public string Content { get; set; }

        [BsonElement("Comentário")]
        public string Comments { get; set; }

        [BsonElement("Data")]
        public int Date { get; set; }
    }
}
