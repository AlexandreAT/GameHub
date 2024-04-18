using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson;

namespace Gamehub.Server.Models
{
    public class Comment
    {
        public string? Id{ get; set; }

        public UserComment User { get; set; }
        public string Content { get; set; }
        public List<LikeDisLike> Likes { get; set; } = null;
        public List<LikeDisLike> Dislikes { get; set; } = null;
    }
}
