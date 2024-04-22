namespace Gamehub.Server.Models
{
    public class LikeDisLike
    {
        public string UserId { get; set; }
        public string UserName { get; set; }
        public string UserImageSrc { get; set; }
        public Boolean IsSelected { get; set; }
    }
}
