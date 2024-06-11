using Gamehub.Server.Models;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace Gamehub.Server.Services
{
    public class CommunityServices
    {
        private readonly IMongoCollection<Community> _communityCollection;
        private readonly UserServices _userServices;

        public CommunityServices(IOptions<CommunityDatabaseSettings> communityServices, UserServices userServices)
        {

            var mongoClient = new MongoClient(communityServices.Value.ConnectionString);
            var mongoDatabase = mongoClient.GetDatabase(communityServices.Value.DatabaseName);

            _communityCollection = mongoDatabase.GetCollection<Community>(communityServices.Value.CommunityCollectionName);
            _userServices = userServices;
        }

        public async Task<List<Community>> GetAsync() => await _communityCollection.Find(x => true).ToListAsync();

        public async Task<Community> GetAsync(string id) => await _communityCollection.Find(x => x.Id == id).FirstOrDefaultAsync();

        public async Task<List<SimplifiedCommunity>> SearchCommunitiesAsync(string query)
        {
            var communities = await _communityCollection.Find(c => c.Name.ToLower().StartsWith(query.ToLower()))
                                                     .ToListAsync();
            var orderedCommunities = communities.OrderByDescending(c => (c.Followers ?? new List<string>()).Count).Take(5);
            var simplifiedCommunities = orderedCommunities.Select(c => new SimplifiedCommunity
            {
                Id = c.Id,
                Name = c.Name,
                CreatorId = c.Creator,
                CreatorName = c.Creator,
                IconeImageSrc = c.iconeImageSrc,
                BackgroundImageSrc = c.backgroundImageSrc
            }).ToList();

            return simplifiedCommunities;
        }

        public async Task<List<SimplifiedCommunity>> SearchAllCommunitiesAsync(string query)
        {
            var communities = await _communityCollection.Find(c => c.Name.ToLower().Contains(query.ToLower()))
                                                     .ToListAsync();
            var simplifiedCommunities = communities.Select(c => new SimplifiedCommunity
            {
                Id = c.Id,
                Name = c.Name,
                CreatorId = c.Creator,
                CreatorName = c.Creator,
                IconeImageSrc = c.iconeImageSrc,
                BackgroundImageSrc = c.backgroundImageSrc
            }).ToList();

            return simplifiedCommunities;
        }

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

        public async Task RemoveAsync(string id) => await _communityCollection.DeleteOneAsync(x => x.Id == id);

        public async Task UpdateAsync(string id, Community community) => await _communityCollection.ReplaceOneAsync(x => x.Id == id, community);

        public async Task<User> HandleFollowing(User user, Community community)
        {
            if (user != null)
            {

                if (community.Followers == null)
                {
                    community.Followers = new List<string>();
                }

                if (user.UserCommunities == null)
                {
                    user.UserCommunities = new List<string>();
                }

                var followingFound = community.Followers.FirstOrDefault(x => x == user.Id);
                if (followingFound == null)
                {
                    community.Followers.Add(user.Id);
                    await _communityCollection.ReplaceOneAsync(x => x.Id == community.Id, community);

                    user.UserCommunities.Add(community.Id);
                    return user;
                }
                else
                {
                    var currentCommunityIndex = community.Followers.FindIndex(x => x == user.Id);
                    if (currentCommunityIndex >= 0)
                    {
                        community.Followers.RemoveAt(currentCommunityIndex);
                        await _communityCollection.ReplaceOneAsync(x => x.Id == community.Id, community);
                    }

                    var currentUserIndex = user.UserCommunities.FindIndex(x => x == community.Id);
                    if (currentUserIndex >= 0)
                    {
                        user.UserCommunities.RemoveAt(currentUserIndex);
                    }
                    return user;
                }
            }
            else
            {
                throw new Exception("Usuário não encontrado!");
            }
        }

        public async Task AddPost(Post post, string communityId)
        {
            if (post != null)
            {
                Community community = await GetAsync(communityId);
                if (community.Post == null)
                {
                    community.Post = new List<string>();
                }

                community.Post.Add(post.Id);
                await _communityCollection.ReplaceOneAsync(x => x.Id == community.Id, community);
            }
            else
            {
                throw new Exception("Post incorreto");
            }
        }

        public async Task<List<SimplifiedUser>> GetSimplifiedUsersAsync(Community community)
        {
            List<SimplifiedUser> users = new List<SimplifiedUser>();
            if (community.Followers != null)
            {
                foreach (string followerId in community.Followers)
                {
                    User currentUser = await _userServices.GetAsync(followerId);
                    SimplifiedUser newSimplifiedUser = new SimplifiedUser
                    {
                        UserId = followerId,
                        NickName = currentUser.Nickname,
                        UserImageSrc = currentUser.ImageSrc,
                        BackgroundImage = currentUser.BackgroundImage
                    };
                    users.Add(newSimplifiedUser);
                }
                return users;
            }
            else
            {
                throw new Exception("Comunidade sem seguidores");
            }
        }

        public async Task DeleteUserCreatedCommunities(string userId)
        {
            List<Community> communities = await _communityCollection.Find(x => x.Creator == userId).ToListAsync();

            foreach (Community community in communities)
            {
                await _communityCollection.DeleteOneAsync(x => x.Id == community.Id);
            }
        }

        public async Task DeleteUserFromCommunityFollowers(string userId)
        {
            List<Community> communities = await _communityCollection.Find(x => x.Followers.Contains(userId)).ToListAsync();

            foreach (Community community in communities)
            {
                community.Followers.Remove(userId);
                await _communityCollection.ReplaceOneAsync(x => x.Id == community.Id, community);
            }
        }
    }
}
