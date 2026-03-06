import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import './CommunityPage.css';

export default function CommunityPage() {
  const { 
    wallet, 
    isConnected, 
    isLoading,
    createPost,
    getPosts,
    likePost,
    unlikePost,
    createComment,
    getComments
  } = useApp();
  
  const [newPost, setNewPost] = useState('');
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [posting, setPosting] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (isConnected) {
      loadPosts();
    }
  }, [isConnected]);

  const loadPosts = async () => {
    setLoadingPosts(true);
    try {
      const fetchedPosts = await getPosts(null, null, 'recent', 20, 0);
      setPosts(fetchedPosts || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim()) return;
    
    setPosting(true);
    try {
      const post = await createPost(newPost.trim());
      if (post) {
        setPosts([post, ...posts]);
        setNewPost('');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  const handleLikePost = async (post) => {
    try {
      const isLiked = post.isLikedByUser;
      const success = isLiked ? await unlikePost(post.postId) : await likePost(post.postId);
      
      if (success) {
        setPosts(posts.map(p => 
          p.postId === post.postId 
            ? { 
                ...p, 
                likesCount: isLiked ? p.likesCount - 1 : p.likesCount + 1,
                isLikedByUser: !isLiked
              }
            : p
        ));
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleShowComments = async (post) => {
    if (selectedPost?.postId === post.postId) {
      setSelectedPost(null);
      return;
    }

    setSelectedPost(post);
    if (!comments[post.postId]) {
      const fetchedComments = await getComments(post.postId);
      setComments({ ...comments, [post.postId]: fetchedComments || [] });
    }
  };

  const handleCreateComment = async (postId) => {
    if (!newComment.trim()) return;

    try {
      const comment = await createComment(postId, newComment.trim());
      if (comment) {
        setComments({
          ...comments,
          [postId]: [comment, ...(comments[postId] || [])]
        });
        setPosts(posts.map(p => 
          p.postId === postId 
            ? { ...p, commentsCount: p.commentsCount + 1 }
            : p
        ));
        setNewComment('');
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      alert('Failed to create comment');
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const postDate = new Date(timestamp);
    const diffMs = now - postDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return postDate.toLocaleDateString();
  };

  const getAuthorAvatar = (address) => {
    return address?.substring(2, 4).toUpperCase() || '??';
  };

  if (!isConnected) {
    return (
      <div className="community-page">
        <div className="not-connected">
          <h2>Connect Wallet</h2>
          <p>Please connect your wallet to join the community.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="community-page">
      <div className="community-container">
        <h1>👥 Community</h1>
        <p className="subtitle">Connect with other CIVITAS members</p>

        {/* Create Post */}
        <div className="create-post-card">
          <div className="user-avatar">
            {getAuthorAvatar(wallet?.address)}
          </div>
          <div className="post-input-container">
            <textarea
              className="post-input"
              placeholder="Share your thoughts with the community..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              rows={3}
              disabled={posting}
            />
            <button 
              className="post-btn"
              onClick={handleCreatePost}
              disabled={!newPost.trim() || posting}
            >
              {posting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>

        {/* Posts Feed */}
        <div className="posts-feed">
          {loadingPosts ? (
            <div className="loading-posts">
              <div className="spinner"></div>
              <p>Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="no-posts">
              <p>No posts yet. Be the first to share something!</p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.postId} className="post-card">
                <div className="post-header">
                  <div className="post-author-avatar">
                    {getAuthorAvatar(post.author.address)}
                  </div>
                  <div className="post-author-info">
                    <div className="post-author">
                      {post.author.name || post.author.address}
                    </div>
                    <div className="post-timestamp">
                      {formatTimestamp(post.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="post-content">{post.content}</div>
                {post.tags && post.tags.length > 0 && (
                  <div className="post-tags">
                    {post.tags.map((tag, idx) => (
                      <span key={idx} className="post-tag">#{tag}</span>
                    ))}
                  </div>
                )}
                <div className="post-actions">
                  <button 
                    className={`action-btn ${post.isLikedByUser ? 'liked' : ''}`}
                    onClick={() => handleLikePost(post)}
                  >
                    {post.isLikedByUser ? '❤️' : '🤍'} {post.likesCount}
                  </button>
                  <button 
                    className="action-btn"
                    onClick={() => handleShowComments(post)}
                  >
                    💬 {post.commentsCount}
                  </button>
                  <button className="action-btn">
                    🔗 Share
                  </button>
                </div>

                {/* Comments Section */}
                {selectedPost?.postId === post.postId && (
                  <div className="comments-section">
                    <div className="comment-input-container">
                      <input
                        type="text"
                        className="comment-input"
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleCreateComment(post.postId);
                          }
                        }}
                      />
                      <button 
                        className="comment-btn"
                        onClick={() => handleCreateComment(post.postId)}
                        disabled={!newComment.trim()}
                      >
                        Send
                      </button>
                    </div>
                    <div className="comments-list">
                      {comments[post.postId]?.length === 0 ? (
                        <p className="no-comments">No comments yet. Be the first!</p>
                      ) : (
                        comments[post.postId]?.map((comment) => (
                          <div key={comment.commentId} className="comment-item">
                            <div className="comment-avatar">
                              {getAuthorAvatar(comment.author.address)}
                            </div>
                            <div className="comment-content">
                              <div className="comment-author">
                                {comment.author.name || comment.author.address}
                              </div>
                              <div className="comment-text">{comment.content}</div>
                              <div className="comment-timestamp">
                                {formatTimestamp(comment.createdAt)}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

