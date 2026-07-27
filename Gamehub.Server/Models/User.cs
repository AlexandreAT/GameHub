using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Gamehub.Server.Models;

public class User
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("Nome")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("Sobrenome")]
    public string Surname { get; set; } = string.Empty;

    [BsonElement("Apelido")]
    public string Nickname { get; set; } = string.Empty;

    [BsonElement("CPF")]
    [BsonIgnoreIfDefault]
    public string Cpf { get; set; } = string.Empty;

    [BsonElement("Número de telefone")]
    public string? Phone { get; set; }

    [BsonElement("Email")]
    public string Email { get; set; } = string.Empty;

    [BsonElement("Senha")]
    public string Password { get; set; } = string.Empty;

    [BsonElement("Redefinição de senha obrigatória")]
    [BsonDefaultValue(false)]
    public bool PasswordResetRequired { get; set; }

    [BsonElement("Versão do token")]
    [BsonDefaultValue(0)]
    public int TokenVersion { get; set; }

    [BsonElement("Imagem")]
    public string? ImageSrc { get; set; }

    [BsonElement("Seguindo")]
    public List<string>? Following { get; set; }

    [BsonElement("Seguidores")]
    public List<string>? Followers { get; set; }

    [BsonElement("Comunidades")]
    public List<string>? UserCommunities { get; set; }

    [BsonElement("Comunidades criadas")]
    public List<string>? UserCreatedCommunities { get; set; }

    [BsonElement("Biografia")]
    public string? Biography { get; set; }

    [BsonElement("Cidade")]
    public string? City { get; set; }

    [BsonElement("Estado")]
    public string? State { get; set; }

    [BsonElement("Background")]
    public string? BackgroundImage { get; set; }

    [BsonElement("Biblioteca")]
    public List<LibraryGame>? GamesLibrary { get; set; }
}
