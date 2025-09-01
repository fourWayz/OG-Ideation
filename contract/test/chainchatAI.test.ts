import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Signer } from "ethers";

describe("ChainchatAI", function () {
  // We define a fixture to reuse the same setup in every test.
  async function deployChainchatAIFixture() {
    const [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy CC Token
    const MockToken = await ethers.getContractFactory("CCToken");
    const mockToken = await MockToken.deploy();
    await mockToken.waitForDeployment();


    // Deploy ChainchatAI
    const ChainchatAI = await ethers.getContractFactory("ChainchatAI");
    const chainchat = await ChainchatAI.deploy(mockToken.target);
    await chainchat.waitForDeployment();

    // Fund ChainchatAI contract with CCT for rewards
    const rewardPoolAmount = ethers.parseEther("10000"); // 10,000 CCT for rewards pool
    await mockToken.transfer(chainchat.target, rewardPoolAmount);

    // Approve token spending
    await mockToken.connect(user1).approve(chainchat.target, ethers.MaxUint256);
    await mockToken.connect(user2).approve(chainchat.target, ethers.MaxUint256);
    await mockToken.connect(user3).approve(chainchat.target, ethers.MaxUint256);

    return { chainchat, mockToken, owner, user1, user2, user3 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { chainchat, owner } = await loadFixture(deployChainchatAIFixture);
      expect(await chainchat.owner()).to.equal(owner.address);
    });

    it("Should set the correct token address", async function () {
      const { chainchat, mockToken } = await loadFixture(deployChainchatAIFixture);
      expect(await chainchat.ccToken()).to.equal(mockToken.target);
    });

    it("Should set correct initial costs and rewards", async function () {
      const { chainchat } = await loadFixture(deployChainchatAIFixture);

      expect(await chainchat.postCost()).to.equal(ethers.parseEther("10"));
      expect(await chainchat.commentCost()).to.equal(ethers.parseEther("5"));
      expect(await chainchat.signupBonus()).to.equal(ethers.parseEther("100"));
      expect(await chainchat.rewardPerPost()).to.equal(ethers.parseEther("2"));
      expect(await chainchat.rewardPerComment()).to.equal(ethers.parseEther("1"));
      expect(await chainchat.rewardPerShare()).to.equal(ethers.parseEther("1"));
      expect(await chainchat.maxWeeklyPayout()).to.equal(ethers.parseEther("200"));
    });
  });

  describe("User Registration", function () {
    it("Should register a new user successfully", async function () {
      const { chainchat, user1, mockToken } = await loadFixture(deployChainchatAIFixture);

      const initialBalance = await mockToken.balanceOf(user1.address);

      await expect(chainchat.connect(user1).registerUser(user1.address, "user1"))
        .to.emit(chainchat, "UserRegistered")
        .withArgs(user1.address, "user1");

      // Check if user is registered
      const user = await chainchat.getUserByAddress(user1.address);
      expect(user.isRegistered).to.be.true;
      expect(user.username).to.equal("user1");

      // Check if signup bonus was given
      const finalBalance = await mockToken.balanceOf(user1.address);
      expect(finalBalance - initialBalance).to.equal(ethers.parseEther("100"));

      // Check free posts allowance
      expect(await chainchat.getFreePostsRemaining(user1.address)).to.equal(10);
    });

    it("Should prevent duplicate registration", async function () {
      const { chainchat, user1 } = await loadFixture(deployChainchatAIFixture);

      await chainchat.connect(user1).registerUser(user1.address, "user1");

      await expect(
        chainchat.connect(user1).registerUser(user1.address, "user1_duplicate")
      ).to.be.revertedWith("User is already registered");
    });

    it("Should require non-empty username", async function () {
      const { chainchat, user1 } = await loadFixture(deployChainchatAIFixture);

      await expect(
        chainchat.connect(user1).registerUser(user1.address, "")
      ).to.be.revertedWith("Username required");
    });
  });

  describe("Profile Management", function () {
    it("Should update profile image", async function () {
      const { chainchat, user1 } = await loadFixture(deployChainchatAIFixture);

      await chainchat.connect(user1).registerUser(user1.address, "user1");

      await expect(chainchat.connect(user1).setProfileImage("ipfs://QmProfileImage"))
        .to.emit(chainchat, "ProfileImageUpdated")
        .withArgs(user1.address, "ipfs://QmProfileImage");

      const user = await chainchat.getUserByAddress(user1.address);
      expect(user.profileImage).to.equal("ipfs://QmProfileImage");
    });

    it("Should update bio", async function () {
      const { chainchat, user1 } = await loadFixture(deployChainchatAIFixture);

      await chainchat.connect(user1).registerUser(user1.address, "user1");

      await expect(chainchat.connect(user1).setBio("This is my bio"))
        .to.emit(chainchat, "BioUpdated")
        .withArgs(user1.address, "This is my bio");

      const user = await chainchat.getUserByAddress(user1.address);
      expect(user.bio).to.equal("This is my bio");
    });

    it("Should update cover photo", async function () {
      const { chainchat, user1 } = await loadFixture(deployChainchatAIFixture);

      await chainchat.connect(user1).registerUser(user1.address, "user1");

      await expect(chainchat.connect(user1).setCoverPhoto("ipfs://QmCoverPhoto"))
        .to.emit(chainchat, "CoverImageUpdated")
        .withArgs(user1.address, "ipfs://QmCoverPhoto");

      const user = await chainchat.getUserByAddress(user1.address);
      expect(user.coverPhoto).to.equal("ipfs://QmCoverPhoto");
    });

    it("Should edit complete profile", async function () {
      const { chainchat, user1 } = await loadFixture(deployChainchatAIFixture);

      await chainchat.connect(user1).registerUser(user1.address, "user1");

      const newInterests = ["web3", "ai", "blockchain"];
      await chainchat.connect(user1).editProfile(
        "newUsername",
        "ipfs://QmNewProfile",
        "New bio",
        "ipfs://QmNewCover",
        newInterests
      );

      const user = await chainchat.getUserByAddress(user1.address);
      expect(user.username).to.equal("newUsername");
      expect(user.profileImage).to.equal("ipfs://QmNewProfile");
      expect(user.bio).to.equal("New bio");
      expect(user.coverPhoto).to.equal("ipfs://QmNewCover");
    });
  });

  describe("Post Creation", function () {
    it("Should create post with free allowance", async function () {
      const { chainchat, user1 } = await loadFixture(deployChainchatAIFixture);

      await chainchat.connect(user1).registerUser(user1.address, "user1");

      await expect(chainchat.connect(user1).createPost("ipfs://QmPostContent", "ipfs://QmPostImage"))
        .to.emit(chainchat, "PostCreated")
        .withArgs(user1.address, "ipfs://QmPostContent", "ipfs://QmPostImage", anyValue);

      expect(await chainchat.getFreePostsRemaining(user1.address)).to.equal(9);
      expect(await chainchat.getPostsCount()).to.equal(1);
    });

    it("Should charge token after free posts exhausted", async function () {
      const { chainchat, user1, mockToken } = await loadFixture(deployChainchatAIFixture);

      await chainchat.connect(user1).registerUser(user1.address, "user1");

      // Use all free posts
      for (let i = 0; i < 10; i++) {
        await chainchat.connect(user1).createPost(`ipfs://QmPost${i}`, "");
      }

      const initialBalance = await mockToken.balanceOf(user1.address);

      // Next post should cost tokens
      await chainchat.connect(user1).createPost("ipfs://QmPaidPost", "");

      const finalBalance = await mockToken.balanceOf(user1.address);
      expect(initialBalance - finalBalance).to.equal(ethers.parseEther("10"));
    });

    it("Should require content CID for post", async function () {
      const { chainchat, user1 } = await loadFixture(deployChainchatAIFixture);

      await chainchat.connect(user1).registerUser(user1.address, "user1");

      await expect(
        chainchat.connect(user1).createPost("", "ipfs://QmImage")
      ).to.be.revertedWith("contentCID required");
    });
  });

  describe("Post Interactions", function () {
    it("Should like a post and reward author", async function () {
      const { chainchat, user1, user2, mockToken } = await loadFixture(deployChainchatAIFixture);

      await chainchat.connect(user1).registerUser(user1.address, "user1");
      await chainchat.connect(user2).registerUser(user2.address, "user2");

      await chainchat.connect(user1).createPost("ipfs://QmPost", "");

      const initialBalance = await mockToken.balanceOf(user1.address);

      await expect(chainchat.connect(user2).likePost(0))
        .to.emit(chainchat, "PostLiked")
        .withArgs(user2.address, 0);

      const finalBalance = await mockToken.balanceOf(user1.address);
      expect(finalBalance - initialBalance).to.equal(ethers.parseEther("1"));

      const post = await chainchat.getPost(0);
      expect(post.likes).to.equal(1);
    });

    it("Should prevent double liking", async function () {
      const { chainchat, user1, user2 } = await loadFixture(deployChainchatAIFixture);

      await chainchat.connect(user1).registerUser(user1.address, "user1");
      await chainchat.connect(user2).registerUser(user2.address, "user2");

      await chainchat.connect(user1).createPost("ipfs://QmPost", "");
      await chainchat.connect(user2).likePost(0);

      await expect(
        chainchat.connect(user2).likePost(0)
      ).to.be.revertedWith("Already liked");
    });

    it("Should add comment to post", async function () {
      const { chainchat, user1, user2 } = await loadFixture(deployChainchatAIFixture);

      await chainchat.connect(user1).registerUser(user1.address, "user1");
      await chainchat.connect(user2).registerUser(user2.address, "user2");

      await chainchat.connect(user1).createPost("ipfs://QmPost", "");

      await expect(chainchat.connect(user2).addComment(0, "Great post!"))
        .to.emit(chainchat, "CommentAdded")
        .withArgs(user2.address, 0, "Great post!", anyValue);

      const comment = await chainchat.getComment(0, 0);
      expect(comment.commenter).to.equal(user2.address);
      expect(comment.content).to.equal("Great post!");
    });

    it("Should share a post", async function () {
      const { chainchat, user1, user2 } = await loadFixture(deployChainchatAIFixture);

      await chainchat.connect(user1).registerUser(user1.address, "user1");
      await chainchat.connect(user2).registerUser(user2.address, "user2");

      await chainchat.connect(user1).createPost("ipfs://QmPost", "");

      await expect(chainchat.connect(user2).sharePost(0))
        .to.emit(chainchat, "PostShared")
        .withArgs(user2.address, 0, 1);

      expect(await chainchat.getPostsCount()).to.equal(2);

      const sharedPost = await chainchat.getPost(1);
      expect(sharedPost.author).to.equal(user2.address);
      expect(sharedPost.originalPostId).to.equal(0);
    });
  });

  describe("Engagement Rewards", function () {
    it("Should claim weekly engagement rewards", async function () {
      const { chainchat, user1, mockToken } = await loadFixture(deployChainchatAIFixture);

      await chainchat.connect(user1).registerUser(user1.address, "user1");

      // Create some engagement
      await chainchat.connect(user1).createPost("ipfs://QmPost1", "");
      await chainchat.connect(user1).createPost("ipfs://QmPost2", "");
      await chainchat.connect(user1).addComment(0, "Comment");

      const initialBalance = await mockToken.balanceOf(user1.address);

      await expect(chainchat.connect(user1).claimWeeklyEngagementRewards())
        .to.emit(chainchat, "EngagementRewardsClaimed")
        .withArgs(user1.address, 2, 1, 0, anyValue);

      const finalBalance = await mockToken.balanceOf(user1.address);
      console.log("Final Balance:", ethers.formatEther(finalBalance));
      console.log("Initial Balance:", ethers.formatEther(initialBalance));
      console.log("Difference:", ethers.formatEther(finalBalance - initialBalance));
      const expectedReward = ethers.parseEther("5"); // 2 posts * 2 + 1 comment * 1
      expect(finalBalance - initialBalance).to.equal(expectedReward);

      // const expectedReward = ethers.parseEther("2").mul(2).add(ethers.parseEther("1")); // 2 posts * 2 + 1 comment
      // expect(finalBalance - initialBalance).to.equal(expectedReward);
    });

    it("Should enforce cooldown period", async function () {
      const { chainchat, user1 } = await loadFixture(deployChainchatAIFixture);

      await chainchat.connect(user1).registerUser(user1.address, "user1");
      await chainchat.connect(user1).createPost("ipfs://QmPost", "");
      await chainchat.connect(user1).claimWeeklyEngagementRewards();

      await expect(
        chainchat.connect(user1).claimWeeklyEngagementRewards()
      ).to.be.revertedWith("Claim cooldown: once per 7 days");
    });

    it("Should cap weekly payout", async function () {
      const { chainchat, user1, mockToken } = await loadFixture(deployChainchatAIFixture);

      await chainchat.connect(user1).registerUser(user1.address, "user1");

      // Set max payout to low value for testing
      await chainchat.connect(await ethers.getImpersonatedSigner(await chainchat.owner())).setEngagementRewards(
        ethers.parseEther("10"), // rewardPerPost
        ethers.parseEther("10"), // rewardPerComment
        ethers.parseEther("10"), // rewardPerShare
        ethers.parseEther("50")  // maxWeeklyPayout
      );

      // Create engagement that would exceed cap
      for (let i = 0; i < 10; i++) {
        await chainchat.connect(user1).createPost(`ipfs://QmPost${i}`, "");
      }

      const initialBalance = await mockToken.balanceOf(user1.address);
      await chainchat.connect(user1).claimWeeklyEngagementRewards();
      const finalBalance = await mockToken.balanceOf(user1.address);

      // Should be capped at 50 tokens, not 100 (10 posts * 10)
      expect(finalBalance - initialBalance).to.equal(ethers.parseEther("50"));
    });
  });

  describe("AI Features", function () {
    it("Should update user feed pointer", async function () {
      const { chainchat, user1 } = await loadFixture(deployChainchatAIFixture);

      await chainchat.connect(user1).registerUser(user1.address, "user1");

      await expect(chainchat.connect(user1).updateUserFeed("ipfs://QmFeedPointer"))
        .to.emit(chainchat, "UserFeedUpdated")
        .withArgs(user1.address, "ipfs://QmFeedPointer");

      expect(await chainchat.getUserFeed(user1.address)).to.equal("ipfs://QmFeedPointer");
    });

    it("Should update user model", async function () {
      const { chainchat, user1 } = await loadFixture(deployChainchatAIFixture);

      await chainchat.connect(user1).registerUser(user1.address, "user1");

      await expect(chainchat.connect(user1).updateUserModel("ipfs://QmModel"))
        .to.emit(chainchat, "UserModelUpdated")
        .withArgs(user1.address, "ipfs://QmModel");

      expect(await chainchat.getUserModel(user1.address)).to.equal("ipfs://QmModel");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update token address", async function () {
      const { chainchat, owner } = await loadFixture(deployChainchatAIFixture);

      const newToken = await (await ethers.getContractFactory("CCToken")).deploy();
      await newToken.waitForDeployment();

      await chainchat.connect(owner).setTokenAddress(newToken.target);
      expect(await chainchat.ccToken()).to.equal(newToken.target);
    });

    it("Should allow owner to update costs", async function () {
      const { chainchat, owner } = await loadFixture(deployChainchatAIFixture);

      await chainchat.connect(owner).setCosts(
        ethers.parseEther("20"),
        ethers.parseEther("10")
      );

      expect(await chainchat.postCost()).to.equal(ethers.parseEther("20"));
      expect(await chainchat.commentCost()).to.equal(ethers.parseEther("10"));
    });

    it("Should allow owner to withdraw tokens", async function () {
      const { chainchat, owner, user1, mockToken } = await loadFixture(deployChainchatAIFixture);

      await chainchat.connect(user1).registerUser(user1.address, "user1");

      // Use paid post to put tokens in contract
      for (let i = 0; i < 11; i++) {
        await chainchat.connect(user1).createPost(`ipfs://QmPost${i}`, "");
      }

      const contractBalance = await mockToken.balanceOf(chainchat.target);
      const ownerBalance = await mockToken.balanceOf(owner.address);

      await chainchat.connect(owner).withdrawTokens();

      expect(await mockToken.balanceOf(chainchat.target)).to.equal(0);
      expect(await mockToken.balanceOf(owner.address) - ownerBalance).to.equal(contractBalance);
    });

    it("Should prevent non-owners from admin functions", async function () {
      const { chainchat, user1 } = await loadFixture(deployChainchatAIFixture);

      await expect(
        chainchat.connect(user1).setTokenAddress(user1.address)
      ).to.be.revertedWithCustomError(chainchat, "OwnableUnauthorizedAccount");
    });
  });

  describe("Interests Management", function () {
    it("Should set user interests", async function () {
      const { chainchat, user1 } = await loadFixture(deployChainchatAIFixture);

      await chainchat.connect(user1).registerUser(user1.address, "user1");

      const interests = ["web3", "ai", "blockchain"];
      await chainchat.connect(user1).setUserInterests(interests);

      const userInterests = await chainchat.getUserInterests(user1.address);
      expect(userInterests).to.deep.equal(interests);
    });
  });

  // Helper function for anyValue matcher
  function anyValue() {
    return true;
  }
});