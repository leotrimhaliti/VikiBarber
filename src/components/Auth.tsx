import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { User, Lock, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { ModeToggle } from './mode-toggle';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Gabim në Kyçje:', error.message);
      setMessage(`Gabim në kyçje: ${error.message}. Kontrolloni të dhënat.`);
      setLoading(false);
    } else {
      setMessage('Kyçja u bë me sukses! Duke u ridrejtuar...');
      // Keep loading true while redirecting/parent updates
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 p-4 transition-colors duration-300">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <Card className="w-full max-w-md shadow-xl border dark:border-gray-800">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <img
              src="/image.png"
              alt="VikiBarber Logo"
              className="w-16 h-16 object-contain invert dark:invert-0"
            />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Viki Barber
          </CardTitle>
          <CardDescription>
            Hyni qe ti menaxhoni rezervimet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Fjalekalimi</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {message && (
              <div
                className={`text-sm p-3 rounded-md flex items-center gap-2 ${message.includes('Gabim')
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  }`}
              >
                {message}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-base font-medium"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Duke u kyçur...
                </>
              ) : (
                'Kyçu'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;