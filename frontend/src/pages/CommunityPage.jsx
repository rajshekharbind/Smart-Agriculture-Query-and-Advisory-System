import React, { useEffect, useState } from 'react';
import { Users, ThumbsUp, MessageSquare, Send, ImagePlus } from 'lucide-react';
import { Card, Button } from '../components';
import { agriService } from '../services';
import { useAuth, useMode } from '../context';

const CommunityPage = () => {
  const { user } = useAuth();
  const { t } = useMode();
  const [posts, setPosts] = useState([]);
  const [commentText, setCommentText] = useState({});
  const [form, setForm] = useState({
    author_name: user?.name || 'Kisan Farmer',
    title: '',
    content: '',
    crop_tag: 'Paddy',
    image_data: '',
  });
  const [loading, setLoading] = useState(false);

  const loadPosts = async () => {
    const res = await agriService.getPosts();
    setPosts(res.posts || []);
  };

  useEffect(() => {
    loadPosts().catch(() => {});
  }, []);

  const handleImageAttach = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm((p) => ({ ...p, image_data: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await agriService.createPost({
        ...form,
        author_name: user?.name || form.author_name,
      });
      setForm({ author_name: user?.name || 'Kisan Farmer', title: '', content: '', crop_tag: 'Paddy', image_data: '' });
      await loadPosts();
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    await agriService.likePost(postId);
    await loadPosts();
  };

  const handleComment = async (postId) => {
    const txt = (commentText[postId] || '').trim();
    if (!txt) return;
    await agriService.addComment(postId, {
      author_name: user?.name || 'Farmer',
      content: txt,
    });
    setCommentText((prev) => ({ ...prev, [postId]: '' }));
    await loadPosts();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-purple-500" />
          {t('Farmer Community Forum', 'किसान समुदाय मंच')}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          {t('Share questions, crop photos, field experiences, and practical local solutions.', 'अन्य किसानों के साथ प्रश्न, फोटो और खेती के अनुभव साझा करें।')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <Card.Header>
            <Card.Title>{t('Share with Community', 'नई पोस्ट लिखें')}</Card.Title>
          </Card.Header>
          <Card.Content>
            <form onSubmit={handleCreate} className="space-y-3">
              {!user && (
                <div>
                  <label className="block text-xs font-medium mb-1">Your Name</label>
                  <input className="input-field" value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium mb-1">Topic / Crop Tag</label>
                <input className="input-field" value={form.crop_tag} onChange={(e) => setForm({ ...form, crop_tag: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Title</label>
                <input required className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Question or tip headline..." />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Details</label>
                <textarea required rows={4} className="input-field" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Describe your experience or question..." />
              </div>
              <label className="cursor-pointer inline-flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                <ImagePlus className="w-4 h-4" /> Attach Field Photo (optional)
                <input type="file" accept="image/*" className="hidden" onChange={handleImageAttach} />
              </label>
              {form.image_data && (
                <img src={form.image_data} alt="Post attachment" className="w-full h-32 object-cover rounded-xl" />
              )}
              <Button type="submit" loading={loading} className="w-full">
                {t('Publish Post', 'पोस्ट प्रकाशित करें')}
              </Button>
            </form>
          </Card.Content>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 font-medium">
                    {post.crop_tag}
                  </span>
                  <h3 className="text-base font-bold mt-1">{post.title}</h3>
                  <p className="text-xs text-slate-500">By {post.author_name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleLike(post.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-semibold"
                >
                  <ThumbsUp className="w-3.5 h-3.5" /> {post.likes}
                </button>
              </div>

              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{post.content}</p>
              {post.image_data && (
                <img src={post.image_data} alt={post.title} className="w-full max-h-64 object-cover rounded-xl" />
              )}

              {/* Comments */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" /> Comments ({post.comments?.length || 0})
                </p>
                {post.comments?.map((c) => (
                  <div key={c.id} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950/60 text-xs">
                    <span className="font-bold">{c.author_name}: </span>
                    <span>{c.content}</span>
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <input
                    className="input-field flex-1 py-1.5 text-xs"
                    value={commentText[post.id] || ''}
                    onChange={(e) => setCommentText((p) => ({ ...p, [post.id]: e.target.value }))}
                    placeholder="Write a reply..."
                  />
                  <Button size="sm" onClick={() => handleComment(post.id)}>
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;
