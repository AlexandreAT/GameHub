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

        public async Task<Community> CreateAsync(Community community)
        {
            community.Id = null;
            await _communityCollection.InsertOneAsync(community);
            community.Id = community.Id ?? _communityCollection.Find(x => x.Id == community.Id).FirstOrDefault()?.Id;
            return community;
        }

        public async Task<List<SimplifiedCommunity>> GetSimplifiedCommunity(string opt, User user)
        {
            if (opt == "following")
            {
                List<SimplifiedCommunity> communities = new List<SimplifiedCommunity>();
                if (user.UserCommunities != null)
                {
                    if (user.UserCommunities.Count > 0)
                    {
                        foreach (string communityId in user.UserCommunities)
                        {
                            Community currentCommunity = await GetAsync(communityId);
                            SimplifiedCommunity newSimplifiedCommunity = new SimplifiedCommunity
                            {
                                Id = communityId,
                                CreatorId = currentCommunity.Creator,
                                CreatorImageSrc = currentCommunity.CreatorImageSrc,
                                Name = currentCommunity.Name,
                                IconeImageSrc = currentCommunity.iconeImageSrc,
                                BackgroundImageSrc = currentCommunity.backgroundImageSrc
                            };
                            communities.Add(newSimplifiedCommunity);
                        }
                        return communities;
                    }
                    else
                    {
                        throw new Exception("Usuário não criou uma comunidade");
                    }
                }
                else
                {
                    throw new Exception("Usuário não faz parte de comunidades");
                }
            }
            else if (opt == "created")
            {
                List<SimplifiedCommunity> communities = new List<SimplifiedCommunity>();
                if (user.UserCreatedCommunities != null)
                {
                    if (user.UserCreatedCommunities.Count > 0)
                    {
                        foreach (string communityId in user.UserCreatedCommunities)
                        {
                            Community currentCommunity = await GetAsync(communityId);
                            SimplifiedCommunity newSimplifiedCommunity = new SimplifiedCommunity
                            {
                                Id = communityId,
                                CreatorId = currentCommunity.Creator,
                                CreatorImageSrc = currentCommunity.CreatorImageSrc,
                                Name = currentCommunity.Name,
                                IconeImageSrc = currentCommunity.iconeImageSrc,
                                BackgroundImageSrc = currentCommunity.backgroundImageSrc
                            };
                            communities.Add(newSimplifiedCommunity);
                        }
                        return communities;
                    }
                    else
                    {
                        throw new Exception("Usuário não criou uma comunidade");
                    }
                }
                else
                {
                    throw new Exception("Usuário não criou uma comunidade");
                }
            }
            else
            {
                throw new Exception("Erro ao verificar a opção passada!");
            }
        }

        public async Task UpdateAsync(string id, Community community) => await _communityCollection.ReplaceOneAsync(x => x.Id == id, community);

        public async Task UpdateUserInCommunitiesAsync(User user)
        {
            List<Community> allCommunities = await GetAsync();

            foreach(Community community in allCommunities)
            {
                if (community.Post != null)
                {
                    for (int i = 0; i < community.Post.Count; i++)
                    {
                        if (community.Post[i].IdAuthor == user.Id)
                        {
                            if (community.Post[i].AuthorImage != user.ImageSrc)
                            {
                                community.Post[i].AuthorImage = user.ImageSrc;
                            }
                            if (community.Post[i].Author != user.Nickname)
                            {
                                community.Post[i].Author = user.Nickname;
                            }
                        }
                        if (community.Post[i].Comments != null)
                        {
                            for (int j = 0; j < community.Post[i].Comments.Count; j++)
                            {
                                if (community.Post[i].Comments[j].User.UserId == user.Id)
                                {
                                    if (community.Post[i].Comments[j].User.UserImageSrc != user.ImageSrc)
                                    {
                                        community.Post[i].Comments[j].User.UserImageSrc = user.ImageSrc;
                                    }
                                    if (community.Post[i].Comments[j].User.NickName != user.Nickname)
                                    {
                                        community.Post[i].Comments[j].User.NickName = user.Nickname;
                                    }
                                }
                            }
                        }
                    }
                }

                await _communityCollection.ReplaceOneAsync(x => x.Id == community.Id, community);
            }
        }

    }
}
