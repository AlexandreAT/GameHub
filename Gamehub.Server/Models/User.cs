using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Gamehub.Server.Models
{
    public class User
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        [BsonElement("Nome")]
        public string Name { get; set; } = null;

        [BsonElement("Sobrenome")]
        public string Surname { get; set; } = null;

        [BsonElement("CPF")]
        public int Cpf { get; set; }

        [BsonElement("Número de telefone")]
        public int? phone { get; set; }

        [BsonElement("Email")]
        public string email { get; set; } = null;

        [BsonElement("Senha")]
        public string password { get; set; } = null;



    }
}
