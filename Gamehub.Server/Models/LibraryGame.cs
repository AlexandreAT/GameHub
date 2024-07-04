namespace Gamehub.Server.Models
{
    public class LibraryGame
    {
        public string id { get; set; } = null;
        public string? state { get; set; } = null;
        public bool? pin {  get; set; } = false;
        public float? rating { get; set; } = null;
    }
}
