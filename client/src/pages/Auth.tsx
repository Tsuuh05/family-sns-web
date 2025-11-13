import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Auth() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  // Form state
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [validatedFamily, setValidatedFamily] = useState<string | null>(null);

  // Mutations
  const validateCodeQuery = trpc.auth.validateInviteCode.useQuery(
    { code: inviteCode },
    { enabled: false }
  );

  const signUpMutation = trpc.auth.signUp.useMutation({
    onSuccess: () => {
      toast.success("アカウントを作成しました。ログインしてください。");
      setMode('signin');
      setPassword("");
    },
    onError: (error: any) => {
      toast.error(error.message || "サインアップに失敗しました");
    },
  });

  const signInMutation = trpc.auth.signIn.useMutation({
    onSuccess: () => {
      toast.success("ログインしました");
      setLocation("/");
    },
    onError: (error: any) => {
      toast.error(error.message || "ログインに失敗しました");
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setLocation("/");
    }
  }, [isAuthenticated, user, setLocation]);

  const handleValidateCode = async () => {
    if (!inviteCode.trim()) {
      toast.error("招待コードを入力してください");
      return;
    }

    try {
      const result = await validateCodeQuery.refetch();
      if (result.data) {
        setValidatedFamily(result.data.familyName);
        toast.success(`${result.data.familyName}への招待コードが確認されました`);
      }
    } catch (error: any) {
      toast.error(error.message || "招待コードの確認に失敗しました");
      setValidatedFamily(null);
    }
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim() || !fullName.trim() || !inviteCode.trim()) {
      toast.error("すべての項目を入力してください");
      return;
    }

    if (!validatedFamily) {
      toast.error("招待コードを確認してください");
      return;
    }

    signUpMutation.mutate({
      email: email.trim(),
      password: password.trim(),
      fullName: fullName.trim(),
      inviteCode: inviteCode.trim(),
    });
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error("メールアドレスとパスワードを入力してください");
      return;
    }

    signInMutation.mutate({
      email: email.trim(),
      password: password.trim(),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">{APP_TITLE}</CardTitle>
          <CardDescription className="text-center">
            {mode === 'signin' ? 'アカウントにログイン' : '新しいアカウントを作成'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === 'signup' && (
            <>
              {/* Invite Code Section */}
              <div className="space-y-2">
                <Label htmlFor="inviteCode">招待コード</Label>
                <div className="flex gap-2">
                  <Input
                    id="inviteCode"
                    type="text"
                    placeholder="招待コードを入力"
                    value={inviteCode}
                    onChange={(e) => {
                      setInviteCode(e.target.value);
                      setValidatedFamily(null);
                    }}
                    disabled={validateCodeQuery.isFetching}
                  />
                  <Button
                    onClick={handleValidateCode}
                    disabled={validateCodeQuery.isFetching || !inviteCode.trim()}
                    variant="outline"
                  >
                    {validateCodeQuery.isFetching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "確認"
                    )}
                  </Button>
                </div>
                {validatedFamily && (
                  <p className="text-sm text-green-600">✓ {validatedFamily}への参加が承認されました</p>
                )}
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">氏名</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="山田 太郎"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {mode === 'signup' && (
              <p className="text-xs text-muted-foreground">6文字以上で入力してください</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            className="w-full"
            onClick={mode === 'signin' ? handleSignIn : handleSignUp}
            disabled={signInMutation.isPending || signUpMutation.isPending}
          >
            {(signInMutation.isPending || signUpMutation.isPending) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                処理中...
              </>
            ) : mode === 'signin' ? (
              'ログイン'
            ) : (
              'アカウント作成'
            )}
          </Button>

          {/* Toggle Mode */}
          <div className="text-center text-sm">
            {mode === 'signin' ? (
              <>
                アカウントをお持ちでないですか？{' '}
                <button
                  className="text-primary hover:underline font-medium"
                  onClick={() => setMode('signup')}
                >
                  新規登録
                </button>
              </>
            ) : (
              <>
                すでにアカウントをお持ちですか？{' '}
                <button
                  className="text-primary hover:underline font-medium"
                  onClick={() => setMode('signin')}
                >
                  ログイン
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
