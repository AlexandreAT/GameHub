using Gamehub.Server.Models;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace Gamehub.Server.Services
{
    public class CommunityServices
    {
        private readonly IMongoCollection<Community> _communityCollection;

        public CommunityServices(IOptions<CommunityDatabaseSettings> communityServices)
        {

            var mongoClient = new MongoClient(communityServices.Value.ConnectionString);
            var mongoDatabase = mongoClient.GetDatabase(communityServices.Value.DatabaseName);

            _communityCollection = mongoDatabase.GetCollection<Community>(communityServices.Value.CommunityCollectionName);

        }

        public async Task<List<Community>> GetAsync() => await _communityCollection.Find(x => true).ToListAsync();

        public async Task<Community> GetAsync(string id) => await _communityCollection.Find(x => x.Id == id).FirstOrDefaultAsync();

        public async Task CreateAsync(Community community){
            community.Id = null;
            await _communityCollection.InsertOneAsync(community);
            community.Id = community.Id ?? _communityCollection.Find(x => x.Id == community.Id).FirstOrDefault()?.Id;
        }
    }
}
