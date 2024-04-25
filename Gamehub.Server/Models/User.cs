﻿using Microsoft.AspNetCore.Http.HttpResults;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;

namespace Gamehub.Server.Models
{
    public class User
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [Required(ErrorMessage = "O nome deve ter entre 2 e 100 caracteres.")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "O nome deve ter entre 2 e 100 caracteres.")]
        [BsonElement("Nome")]
        public string Name { get; set; } = null;

        [Required(ErrorMessage = "O sobrenome deve ter entre 2 e 100 caracteres.")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "O sobrenome deve ter entre 2 e 100 caracteres.")]
        [BsonElement("Sobrenome")]
        public string Surname { get; set; } = null;

        [Required(ErrorMessage = "O usuário precisa de um apelido.")]
        [StringLength(15, MinimumLength = 2, ErrorMessage = "O apelido deve ter entre 2 a 15 caracteres.")]
        [BsonElement("Apelido")]
        public string Nickname { get; set; } = null;

        [Required(ErrorMessage = "O CPF deve ser preenchido.")]
        [BsonElement("CPF")]
        public string Cpf { get; set; }

        [BsonElement("Número de telefone")]
        public string? Phone { get; set; } = null;

        [Required(ErrorMessage = "O email deve ser preenchido.")]
        [EmailAddress(ErrorMessage = "O email deve estar no formato válido.")]
        [BsonElement("Email")]
        public string Email { get; set; } = null;

        [Required(ErrorMessage = "A senha deve ser preenchida e ter entre 6 e 20 caracteres.")]
        [StringLength(20, MinimumLength = 6, ErrorMessage = "A senha deve ter entre 6 e 20 caracteres.")]
        [BsonElement("Senha")]
        public string Password { get; set; } = null;

        [BsonElement("Posts")]
        public List<Post>? Posts { get; set; } = null;

        [BsonElement("Imagem")]
        public string? ImageSrc { get; set; } = null;

        [BsonElement("Seguindo")]
        public List<AnotherUser>? Following { get; set; } = null;

        [BsonElement("Seguidores")]
        public List<AnotherUser>? Followers { get; set; } = null;

        [BsonElement("Comunidades")]
        public List<Community>? UserCommunities { get; set; } = null;

        [BsonElement("Comunidades criadas")]
        public List<Community>? UserCreatedCommunities { get; set; } = null;

        [BsonElement("Biografia")]
        public string? Biography { get; set; } = null;

        [BsonElement("Cidade")]
        public string? City { get; set; } = null;

        [BsonElement("Estado")]
        public string? State { get; set; } = null;

    }
}
