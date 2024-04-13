﻿using Gamehub.Server.Models;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace Gamehub.Server.Services
{
    public class PostServices
    {
        private readonly IMongoCollection<Post> _postCollection;

        public PostServices(IOptions<PostDatabaseSettings> postServices)
        {
            var mongoClient = new MongoClient(postServices.Value.ConnectionString);
            var mongoDatabase = mongoClient.GetDatabase(postServices.Value.DatabaseName);

            _postCollection = mongoDatabase.GetCollection<Post>(postServices.Value.PostCollectionName);
        }

        public async Task<List<Post>> GetAsync() => await _postCollection.Find(x => true).ToListAsync();

        public async Task<Post> CreateAsync(Post post)
        {
            post.Id = null;
            await _postCollection.InsertOneAsync(post);
            post.Id = post.Id ?? _postCollection.Find(x => x.Id == post.Id).FirstOrDefault()?.Id;
            return post;
        }

        public async Task RemoveAsync(string id) => await _postCollection.DeleteOneAsync(x => x.Id == id);
    }
}