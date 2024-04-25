using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson;

namespace Gamehub.Server.Models
{
    public class Comment
    {
        public string? Id{ get; set; }

        public SimplifiedUser User { get; set; }
        public string Content { get; set; }
        public List<LikeDisLike>? Like { get; set; } = null;
        public List<LikeDisLike>? Dislike { get; set; } = null;
    }
}
