using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson;

namespace Gamehub.Server.Models
{
    public class Comment
    {
        public string? Id{ get; set; }

        public UserComment User { get; set; }
        public string Content { get; set; }
        public int Like { get; set; } = 0;
        public int Dislike { get; set; } = 0;
    }
}
