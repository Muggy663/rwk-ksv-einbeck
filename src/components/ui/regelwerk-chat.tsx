"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  question: string;
  answer: string;
  timestamp: Date;
}

export function RegelwerkChat() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [remainingQuestions, setRemainingQuestions] = useState<number>(5);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    setIsLoading(true);
    const currentQuestion = question;
    setQuestion('');

    try {
      const response = await fetch('/api/regelwerk-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: currentQuestion })
      });

      const data = await response.json();
      
      if (data.success) {
        const newMessage: ChatMessage = {
          id: Date.now().toString(),
          question: currentQuestion,
          answer: data.answer,
          timestamp: new Date()
        };
        setMessages(prev => [newMessage, ...prev]);
        setRemainingQuestions(data.remaining || 0);
      } else if (response.status === 429) {
        toast({ title: "Tageslimit erreicht", description: data.message, variant: "destructive" });
        setRemainingQuestions(0);
      } else {
        toast({ title: "Fehler", description: "Frage konnte nicht beantwortet werden.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Fehler", description: "Verbindungsfehler.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          🤖 Regelwerk-Assistent
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="z.B. Wie funktioniert Auf-/Abstieg in der Liga?"
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !question.trim() || remainingQuestions === 0}>
            {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
        
        <div className="text-xs text-muted-foreground text-center">
          {remainingQuestions > 0 ? (
            `Noch ${remainingQuestions} Fragen heute verfügbar`
          ) : (
            "Tageslimit erreicht - morgen wieder 5 Fragen verfügbar"
          )}
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-2 p-3 bg-muted/30 rounded-lg">
              <div className="font-medium text-sm">❓ {msg.question}</div>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">🤖 {msg.answer}</div>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Stellen Sie Fragen zum RWK-Regelwerk!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
