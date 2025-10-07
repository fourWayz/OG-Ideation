// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract ChainchatAI is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public ccToken;

    // ---------- Core Types ----------

    struct User {
        string username;
        address userAddress; // canonical user address (creator)
        address sender; // original EAO/msg.sender used at registration
        bool isRegistered;
        string profileImage; // CID
        string bio;
        string coverPhoto; // CID
        string[] interests;
        string feedPointer; // CID to user feed profile JSON
    }

    struct Post {
        address author;
        string contentCID; // OG Storage CID
        string imageCID; // OG Storage CID (optional)
        uint256 timestamp;
        uint256 likes;
        uint256 commentsCount;
        uint256 originalPostId; // 0 if original; otherwise source post id
        mapping(address => bool) likedBy; // like set
    }

    struct Comment {
        address commenter;
        string content;
        uint256 timestamp;
    }

    // ---------- Econ Settings ----------

    uint256 public postCost = 10 * 10 ** 18;
    uint256 public commentCost = 5 * 10 ** 18;
    uint256 public signupBonus = 100 * 10 ** 18;
    uint256 public referralBonus = 50 * 10 ** 18; 

    // Engagement rewards (per unit)
    uint256 public rewardPerPost = 2 * 10 ** 18;
    uint256 public rewardPerComment = 1 * 10 ** 18;
    uint256 public rewardPerShare = 1 * 10 ** 18;

    // Max payout per week to prevent abuse
    uint256 public maxWeeklyPayout = 200 * 10 ** 18;

    // One claim allowed per 7 days
    uint256 public constant CLAIM_COOLDOWN = 7 days;

    // ---------- State ----------

    string[] public interests; // global interests catalog (optional)

    mapping(address => User) public users;
    mapping(address => address) public walletToCreator; // EAO -> creator (canonical)
    mapping(address => uint256) public freePostsRemaining;
    mapping(address => address) public referrers;
    mapping(address => uint256) public referralCount;

    mapping(uint256 => mapping(uint256 => Comment)) public postComments;
    mapping(uint256 => uint256) public postCommentsCount; // postId => count

    mapping(address => string[]) public userInterests;

    // AI pointers
    mapping(address => string) public userFeedModels; // model/embedding CID

    // User stats
    mapping(address => uint256) public userPostCount;
    mapping(address => uint256) public userLikeCount; // likes GIVEN
    mapping(address => uint256) public userCommentCount;
    mapping(address => uint256) public userShareCount;

    // Engagement reward accounting
    mapping(address => uint256) public lastClaimedAt;
    mapping(address => uint256) public lastClaimedPostCount;
    mapping(address => uint256) public lastClaimedCommentCount;
    mapping(address => uint256) public lastClaimedShareCount;

    Post[] public posts;

    // ---------- Constants ----------

    uint256 public constant FREE_POST_ALLOWANCE = 10;

    // ---------- Events ----------

    event UserRegistered(address indexed userAddress, string username);
    event ProfileImageUpdated(address indexed userAddress, string imageCID);
    event BioUpdated(address indexed userAddress, string bio);
    event CoverImageUpdated(address indexed userAddress, string coverCID);

    event PostCreated(
        address indexed author,
        string contentCID,
        string imageCID,
        uint256 timestamp
    );
    event PostShared(
        address indexed sharer,
        uint256 originalPostId,
        uint256 newPostId
    );
    event PostLiked(address indexed liker, uint256 indexed postId);

    event CommentAdded(
        address indexed commenter,
        uint256 indexed postId,
        string content,
        uint256 timestamp
    );

    event UserFeedUpdated(address indexed user, string feedPointerCID);
    event UserModelUpdated(address indexed user, string modelCID);

    event EngagementRewardsClaimed(
        address indexed user,
        uint256 postsDelta,
        uint256 commentsDelta,
        uint256 sharesDelta,
        uint256 payout
    );

    // ---------- Modifiers ----------

    modifier onlyRegisteredUser() {
        require(
            users[_getUserAddress()].isRegistered,
            "User is not registered"
        );
        _;
    }

    // ---------- Constructor ----------

    constructor(address _tokenAddress) Ownable(msg.sender) {
        ccToken = IERC20(_tokenAddress);
        transferOwnership(msg.sender);
    }

    // ---------- Registration & Profile ----------

    function registerUser(address creator, string memory _username) external {
        require(!users[creator].isRegistered, "User is already registered");
        require(bytes(_username).length > 0, "Username required");

        users[creator] = User({
            username: _username,
            userAddress: creator,
            sender: msg.sender,
            isRegistered: true,
            profileImage: "",
            bio: "",
            coverPhoto: "",
            interests: new string[](0),
            feedPointer: ""
        });

        walletToCreator[msg.sender] = creator;
        freePostsRemaining[msg.sender] = FREE_POST_ALLOWANCE;

        if (signupBonus > 0) {
            ccToken.safeTransfer(msg.sender, signupBonus);
        }

        emit UserRegistered(creator, _username);
    }

    function setProfileImage(
        string memory _imageCID
    ) external onlyRegisteredUser {
        address user = _getUserAddress();
        users[user].profileImage = _imageCID;
        emit ProfileImageUpdated(user, _imageCID);
    }

    function setBio(string memory _bio) external onlyRegisteredUser {
        address user = _getUserAddress();
        users[user].bio = _bio;
        emit BioUpdated(user, _bio);
    }

    function setCoverPhoto(
        string memory _coverCID
    ) external onlyRegisteredUser {
        address user = _getUserAddress();
        users[user].coverPhoto = _coverCID;
        emit CoverImageUpdated(user, _coverCID);
    }

    function editProfile(
        string memory _newUsername,
        string memory _newProfileImageCID,
        string memory _newBio,
        string memory _newCoverImageCID,
        string[] memory _newInterests
    ) external onlyRegisteredUser {
        address creator = walletToCreator[msg.sender];
        require(bytes(_newUsername).length > 0, "Username cannot be empty");

        User storage user = users[creator];
        user.username = _newUsername;
        user.profileImage = _newProfileImageCID;
        user.bio = _newBio;
        user.coverPhoto = _newCoverImageCID;
        user.interests = _newInterests;

        emit ProfileImageUpdated(creator, _newProfileImageCID);
        emit BioUpdated(creator, _newBio);
        emit CoverImageUpdated(creator, _newCoverImageCID);
    }

    // ---------- AI Pointers ----------

    function updateUserFeed(string memory _feedPointerCID) external {
        address user = _getUserAddress();
        require(users[user].isRegistered, "Not registered");

        users[user].feedPointer = _feedPointerCID;
        emit UserFeedUpdated(user, _feedPointerCID);
    }

    function updateUserModel(string memory modelCID) external {
        address user = _getUserAddress();
        require(users[user].isRegistered, "Not registered");

        userFeedModels[user] = modelCID;
        emit UserModelUpdated(user, modelCID);
    }

    // ---------- Posting / Sharing / Liking / Commenting ----------

    function createPost(
        string memory _contentCID,
        string memory _imageCID
    ) external onlyRegisteredUser {
        address user = _getUserAddress();

        if (freePostsRemaining[msg.sender] > 0) {
            freePostsRemaining[msg.sender]--;
        } else {
            if (postCost > 0) {
                ccToken.safeTransferFrom(msg.sender, address(this), postCost);
            }
        }

        require(bytes(_contentCID).length > 0, "contentCID required");

        Post storage newPost = posts.push();
        newPost.author = user;
        newPost.contentCID = _contentCID;
        newPost.imageCID = _imageCID;
        newPost.timestamp = block.timestamp;
        newPost.originalPostId = 0;

        userPostCount[user]++;

        emit PostCreated(user, _contentCID, _imageCID, block.timestamp);
    }

    function sharePost(uint256 _postId) external onlyRegisteredUser {
        require(_postId < posts.length, "Original post does not exist");
        address user = _getUserAddress();

        Post storage source = posts[_postId];

        Post storage sharedPost = posts.push();
        sharedPost.author = user;
        sharedPost.contentCID = source.contentCID;
        sharedPost.imageCID = source.imageCID;
        sharedPost.timestamp = block.timestamp;
        sharedPost.originalPostId = _postId;

        userShareCount[user]++;

        emit PostShared(user, _postId, posts.length - 1);
    }

    function likePost(
        uint256 _postId
    ) external onlyRegisteredUser nonReentrant {
        require(_postId < posts.length, "Post does not exist");
        address user = _getUserAddress();

        Post storage post = posts[_postId];
        require(!post.likedBy[user], "Already liked");

        post.likedBy[user] = true;
        post.likes++;
        userLikeCount[user]++;

        // Reward author per like (fixed 1 token)
        if (address(ccToken) != address(0)) {
            ccToken.safeTransfer(post.author, 1 * 10 ** 18);
        }

        emit PostLiked(user, _postId);
    }

    function addComment(
        uint256 _postId,
        string memory _content
    ) external onlyRegisteredUser nonReentrant {
        require(_postId < posts.length, "Post does not exist");
        require(bytes(_content).length > 0, "Comment cannot be empty");
        address user = _getUserAddress();

        // Optional paid comments (currently disabled in your original)
        if (commentCost > 0) {
            ccToken.safeTransferFrom(msg.sender, address(this), commentCost);
        }

        uint256 commentId = postCommentsCount[_postId];
        postComments[_postId][commentId] = Comment({
            commenter: user,
            content: _content,
            timestamp: block.timestamp
        });

        postCommentsCount[_postId]++;
        posts[_postId].commentsCount++;
        userCommentCount[user]++;

        emit CommentAdded(user, _postId, _content, block.timestamp);
    }

    // ---------- Engagement Rewards ----------

    /**
     * @notice Claim weekly engagement rewards based on newly accumulated activity since last claim.
     *         Rewards are computed on deltas: posts, comments, shares.
     *         One claim per 7 days; payout is capped by maxWeeklyPayout.
     */
    function claimWeeklyEngagementRewards()
        external
        nonReentrant
        onlyRegisteredUser
    {
        address user = _getUserAddress();

        // Cooldown check
        uint256 lastClaim = lastClaimedAt[user];
        require(
            lastClaim == 0 || block.timestamp >= lastClaim + CLAIM_COOLDOWN,
            "Claim cooldown: once per 7 days"
        );

        // Deltas since last claim
        uint256 postsDelta = userPostCount[user] - lastClaimedPostCount[user];
        uint256 commentsDelta = userCommentCount[user] -
            lastClaimedCommentCount[user];
        uint256 sharesDelta = userShareCount[user] -
            lastClaimedShareCount[user];

        require(
            postsDelta + commentsDelta + sharesDelta > 0,
            "No new activity to claim"
        );

        // Compute payout
        uint256 payout = postsDelta *
            rewardPerPost +
            commentsDelta *
            rewardPerComment +
            sharesDelta *
            rewardPerShare;

        // Cap payout
        if (payout > maxWeeklyPayout) {
            payout = maxWeeklyPayout;
        }

        // Effects
        lastClaimedAt[user] = block.timestamp;
        lastClaimedPostCount[user] = userPostCount[user];
        lastClaimedCommentCount[user] = userCommentCount[user];
        lastClaimedShareCount[user] = userShareCount[user];

        // Interactions
        ccToken.safeTransfer(user, payout);

        emit EngagementRewardsClaimed(
            user,
            postsDelta,
            commentsDelta,
            sharesDelta,
            payout
        );
    }

    // ---------- Views ----------

    function getUserByAddress(
        address _userAddress
    ) external view returns (User memory) {
        require(users[_userAddress].isRegistered, "User not found");
        return users[_userAddress];
    }

    function getPostsCount() external view returns (uint256) {
        return posts.length;
    }

    function getPost(
        uint256 _postId
    )
        external
        view
        returns (
            address author,
            string memory contentCID,
            string memory imageCID,
            uint256 timestamp,
            uint256 likes,
            uint256 commentsCount,
            uint256 originalPostId
        )
    {
        require(_postId < posts.length, "Post does not exist");
        Post storage post = posts[_postId];
        return (
            post.author,
            post.contentCID,
            post.imageCID,
            post.timestamp,
            post.likes,
            post.commentsCount,
            post.originalPostId
        );
    }

    function getComment(
        uint256 _postId,
        uint256 _commentId
    )
        external
        view
        returns (address commenter, string memory content, uint256 timestamp)
    {
        require(_postId < posts.length, "Post does not exist");
        require(
            _commentId < postCommentsCount[_postId],
            "Comment does not exist"
        );

        Comment memory comment_ = postComments[_postId][_commentId];
        return (comment_.commenter, comment_.content, comment_.timestamp);
    }

    function getFreePostsRemaining(
        address _user
    ) external view returns (uint256) {
        return freePostsRemaining[_user];
    }

    function getUserStats(
        address user
    )
        external
        view
        returns (
            uint256 posts,
            uint256 likesGiven,
            uint256 comments,
            uint256 shares
        )
    {
        return (
            userPostCount[user],
            userLikeCount[user],
            userCommentCount[user],
            userShareCount[user]
        );
    }

    /// @notice View user’s feed pointer (CID)
    function getUserFeed(address user) external view returns (string memory) {
        return users[user].feedPointer;
    }

    /// @notice View user’s model/embedding CID
    function getUserModel(address user) external view returns (string memory) {
        return userFeedModels[user];
    }

    // ---------- Admin ----------

    function setTokenAddress(address _tokenAddress) external onlyOwner {
        ccToken = IERC20(_tokenAddress);
    }

    function setCosts(
        uint256 _postCost,
        uint256 _commentCost
    ) external onlyOwner {
        postCost = _postCost;
        commentCost = _commentCost;
    }

    function setEngagementRewards(
        uint256 _rewardPerPost,
        uint256 _rewardPerComment,
        uint256 _rewardPerShare,
        uint256 _maxWeeklyPayout
    ) external onlyOwner {
        rewardPerPost = _rewardPerPost;
        rewardPerComment = _rewardPerComment;
        rewardPerShare = _rewardPerShare;
        maxWeeklyPayout = _maxWeeklyPayout;
    }

    function withdrawTokens() external onlyOwner {
        ccToken.safeTransfer(owner(), ccToken.balanceOf(address(this)));
    }

    // ---------- Interests ----------

    function setUserInterests(
        string[] memory _interests
    ) external onlyRegisteredUser {
        address user = _getUserAddress();

        delete userInterests[user];
        for (uint256 i = 0; i < _interests.length; i++) {
            userInterests[user].push(_interests[i]);
        }
    }

    function getUserInterests(
        address _user
    ) external view returns (string[] memory) {
        return userInterests[_user];
    }

    // ---------- Internals ----------

    // Resolve canonical user address (creator) for the caller
    function _getUserAddress() internal view returns (address) {
        address creator = walletToCreator[msg.sender];
        return creator != address(0) ? creator : msg.sender;
    }
}
