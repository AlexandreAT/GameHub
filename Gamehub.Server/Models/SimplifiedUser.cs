namespace Gamehub.Server.Models
{
    public class SimplifiedUser
    {
        public string UserId { get; set; }
        public string NickName { get; set; }
        public string UserImageSrc { get; set; }
        public string? BackgroundImage { get; set; } = null;
    }
}
