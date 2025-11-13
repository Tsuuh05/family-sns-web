import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { Heart, Loader2, LogOut, MessageCircle, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [newPostContent, setNewPostContent] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: family } = trpc.families.getMyFamily.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: posts, isLoading: postsLoading, refetch } = trpc.posts.list.useQuery(undefined, {
    enabled: isAuthenticated && !!user?.familyId,
  });

  const createPostMutation = trpc.posts.create.useMutation({
    onSuccess: () => {
      toast.success("投稿しました");
      setNewPostContent("");
      setDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "投稿に失敗しました");
    },
  });

  const handleLogout = async () => {
    await logout();
    setLocation("/auth");
  };

  const handleCreatePost = () => {
    if (!newPostContent.trim()) {
      toast.error("投稿内容を入力してください");
      return;
    }

    createPostMutation.mutate({
      content: newPostContent.trim(),
    });
  };

  // Redirect to auth if not authenticated or no family
  useEffect(() => {
    if (!loading && (!isAuthenticated || !user?.familyId)) {
      setLocation("/auth");
    }
  }, [loading, isAuthenticated, user?.familyId, setLocation]);

  if (!loading && (!isAuthenticated || !user?.familyId)) {
    return null;
  }

  if (loading || postsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">{family?.name || APP_TITLE}</h1>
            <p className="text-sm text-muted-foreground">
              {user?.fullName || user?.name}さん、こんにちは
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Create Post Button */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full mb-6" size="lg">
              <Plus className="mr-2 h-5 w-5" />
              新しい投稿
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新しい投稿</DialogTitle>
              <DialogDescription>
                家族に共有したいことを投稿しましょう
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="今日はどんな一日でしたか？"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <DialogFooter>
              <Button
                onClick={handleCreatePost}
                disabled={createPostMutation.isPending || !newPostContent.trim()}
              >
                {createPostMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    投稿中...
                  </>
                ) : (
                  "投稿する"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts && posts.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <p>まだ投稿がありません</p>
                <p className="text-sm mt-2">最初の投稿をしてみましょう！</p>
              </CardContent>
            </Card>
          )}

          {posts?.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-semibold">
                      {post.author?.fullName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <CardTitle className="text-base">{post.author?.fullName || '不明'}</CardTitle>
                      <CardDescription className="text-xs">
                        {formatDistanceToNow(new Date(post.createdAt), {
                          addSuffix: true,
                          locale: ja,
                        })}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-foreground">{post.content}</p>
                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt="投稿画像"
                    className="mt-4 rounded-lg w-full object-cover max-h-96"
                  />
                )}
              </CardContent>
              <CardFooter className="flex gap-4 pt-0">
                <Link href={`/post/${post.id}`}>
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    コメント
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
