import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";

export default function PostDetail() {
  const [, params] = useRoute("/post/:id");
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [newComment, setNewComment] = useState("");

  const postId = params?.id || "";

  const { data: post, isLoading: postLoading } = trpc.posts.getById.useQuery(
    { id: postId },
    { enabled: isAuthenticated && !!postId }
  );

  const { data: comments, isLoading: commentsLoading, refetch: refetchComments } = trpc.comments.list.useQuery(
    { postId },
    { enabled: isAuthenticated && !!postId }
  );

  const createCommentMutation = trpc.comments.create.useMutation({
    onSuccess: () => {
      toast.success("コメントしました");
      setNewComment("");
      refetchComments();
    },
    onError: (error) => {
      toast.error(error.message || "コメントに失敗しました");
    },
  });

  const handleCreateComment = () => {
    if (!newComment.trim()) {
      toast.error("コメント内容を入力してください");
      return;
    }

    createCommentMutation.mutate({
      postId,
      content: newComment.trim(),
    });
  };

  if (!isAuthenticated) {
    setLocation("/auth");
    return null;
  }

  if (postLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">投稿が見つかりません</p>
            <Button onClick={() => setLocation("/")} className="mt-4">
              ホームに戻る
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">投稿の詳細</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Post */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-semibold text-lg">
                {post.author?.fullName?.charAt(0) || '?'}
              </div>
              <div>
                <CardTitle>{post.author?.fullName || '不明'}</CardTitle>
                <CardDescription>
                  {formatDistanceToNow(new Date(post.createdAt), {
                    addSuffix: true,
                    locale: ja,
                  })}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-foreground text-lg">{post.content}</p>
            {post.imageUrl && (
              <img
                src={post.imageUrl}
                alt="投稿画像"
                className="mt-4 rounded-lg w-full object-cover"
              />
            )}
          </CardContent>
        </Card>

        {/* Comment Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">コメントを追加</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="コメントを入力..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleCreateComment}
              disabled={createCommentMutation.isPending || !newComment.trim()}
              className="ml-auto"
            >
              {createCommentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  送信中...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  コメント
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Comments List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            コメント ({comments?.length || 0})
          </h2>

          {commentsLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {comments && comments.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <p>まだコメントがありません</p>
                <p className="text-sm mt-2">最初のコメントをしてみましょう！</p>
              </CardContent>
            </Card>
          )}

          {comments?.map((comment) => (
            <Card key={comment.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white font-semibold text-sm">
                    {comment.author?.fullName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <CardTitle className="text-sm">{comment.author?.fullName || '不明'}</CardTitle>
                    <CardDescription className="text-xs">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                        locale: ja,
                      })}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-foreground">{comment.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
