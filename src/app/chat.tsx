import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Text, KeyboardAvoidingView, Platform, useColorScheme, FlatList } from 'react-native';
import { CustomAlert } from '@/components/feedback/CustomAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useAppStore } from '@/stores/useAppStore';
import { db } from '@/db';
import { chatMessages } from '@/db/schema';
import { Card, Button, TextInput, ProgressRing } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { getFinancialSummary, getRecentTransactions } from '@/db/queries/financials';
import * as FileSystem from 'expo-file-system/legacy';
import { initLlama } from 'llama.rn';
import { modelDownloader, getModelFileName } from '@/utils/modelDownloader';
import { router } from 'expo-router';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

import { useAppTheme } from '@/hooks/useAppTheme';

export default function ChatScreen() {
  const { colors } = useAppTheme();

  const {
    llmModelTier,
    llmStatus,
    llmDownloadProgress,
    setLlmStatus,
    setLlmDownloadProgress,
  } = useAppStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Load chat messages on mount
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const storedMsgs = await db.select().from(chatMessages).orderBy(chatMessages.createdAt);
        if (storedMsgs.length === 0) {
          // Welcome message if chat empty
          const welcomeMsg: Message = {
            id: 'welcome',
            sender: 'assistant',
            content: "Hi, I'm your offline AI spending companion! Ask me about your accounts, transaction histories, or how to optimize your budgets.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages([welcomeMsg]);
        } else {
          setMessages(
            storedMsgs.map((m) => ({
              id: m.id,
              sender: m.role as 'user' | 'assistant',
              content: m.content,
              timestamp: new Date(m.createdAt || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }))
          );
        }
      } catch (e) {
        console.error('Error fetching chat messages:', e);
      }
    };

    loadMessages();
  }, []);

  const handleStartDownload = async () => {
    modelDownloader.startDownload(llmModelTier || 'lite');
  };

  const handleCancelDownload = async () => {
    modelDownloader.cancelDownload();
  };

  const handleClearChat = () => {
    CustomAlert.alert(
      'Clear Chat History',
      'Are you sure you want to permanently delete all messages in this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.delete(chatMessages);
              const welcomeMsg: Message = {
                id: 'welcome',
                sender: 'assistant',
                content: "Hi, I'm your offline AI spending companion! Ask me about your accounts, transaction histories, or how to optimize your budgets.",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              };
              setMessages([welcomeMsg]);
            } catch (e) {
              console.error('Failed to clear chat history:', e);
            }
          },
        },
      ]
    );
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      await db.insert(chatMessages).values({
        id: userMessage.id,
        role: 'user',
        content: userMessage.content,
      });
    } catch (e) {
      console.error('Failed to save user message:', e);
    }

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    const summary = await getFinancialSummary();
    const recentTx = await getRecentTransactions(10);
    const txContext = recentTx
      .map(
        (t) =>
          `- ${t.date}: ${t.merchant || t.description || 'Tx'} ${t.type === 'expense' ? 'spent' : 'earned'} $${t.amount} in category ${
            t.categoryName || 'General'
          }`
      )
      .join('\n');

    const assistantMsgId = (Date.now() + 1).toString();
    const placeholderMsg: Message = {
      id: assistantMsgId,
      sender: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, placeholderMsg]);

    const tier = llmModelTier || 'lite';
    const modelFileName = getModelFileName(tier);
    const modelPath = `${FileSystem.documentDirectory}models/${modelFileName}`;

    let streamResult = '';

    try {
      console.log('Loading local model context:', modelPath);
      
      const context = await initLlama({
        model: modelPath,
        use_mlock: true,
        n_ctx: 1024,
        n_gpu_layers: 1,
      });

      const systemPrompt = `You are PowerMoney AI, an offline-first financial assistant.
Answer the user's questions truthfully and concisely using their local financial summary:
- Net Balance: $${summary.netBalance.toFixed(2)}
- Total Income: $${summary.totalIncome.toFixed(2)}
- Total Expense: $${summary.totalExpense.toFixed(2)}
- Savings Rate: ${Math.round(summary.savingsRate)}%

Recent Transactions:
${txContext || 'No recent transactions.'}

Be precise, polite, and helpful. Do not refer to internet search or external services.`;

      const prompt = `System: ${systemPrompt}\nUser: ${userMessage.content}\nAssistant:`;
      const stopWords = ['</s>', '<|end|>', '<|eot_id|>', 'User:', 'System:'];

      const response = await context.completion(
        {
          prompt,
          n_predict: 250,
          stop: stopWords,
        },
        (data) => {
          const { token } = data;
          streamResult += token;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId ? { ...msg, content: streamResult } : msg
            )
          );
        }
      );

      await context.release();
      setIsTyping(false);

      await db.insert(chatMessages).values({
        id: assistantMsgId,
        role: 'assistant',
        content: streamResult.trim() || response.text.trim(),
      });
    } catch (err) {
      console.log('llama.rn offline generation failed, executing rule-based fallback response.', err);
      
      let responseText = "I'm looking at your financial ledgers. ";
      const query = userMessage.content.toLowerCase();
      if (query.includes('balance') || query.includes('how much money') || query.includes('wealth')) {
        responseText += `Your current net balance across all active accounts is $${summary.netBalance.toFixed(2)}.`;
      } else if (query.includes('spend') || query.includes('expense') || query.includes('outflow')) {
        responseText += `You have spent $${summary.totalExpense.toFixed(2)} in total during this period. Your recent transactions are:\n${txContext || 'No recent transactions recorded.'}`;
      } else if (query.includes('income') || query.includes('earn')) {
        responseText += `Your total logged income is $${summary.totalIncome.toFixed(2)}. Your savings rate is currently ${Math.round(summary.savingsRate)}%.`;
      } else {
        responseText += `Your net balance is $${summary.netBalance.toFixed(2)} and your total savings rate is ${Math.round(summary.savingsRate)}%. Let me know if you would like me to list details of your categories or specific transactions!`;
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId ? { ...msg, content: responseText } : msg
        )
      );
      setIsTyping(false);

      try {
        await db.insert(chatMessages).values({
          id: assistantMsgId,
          role: 'assistant',
          content: responseText,
        });
      } catch (e) {
        console.error('Failed to save AI response:', e);
      }
    }

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Button
          label=""
          onPress={() => router.back()}
          variant="outline"
          size="sm"
          leftIcon={<Ionicons name="arrow-back" size={20} color={colors.text} />}
          style={styles.backBtn}
        />
        <Text style={[styles.title, { color: colors.text }]}>AI Money Assistant</Text>
        <View style={styles.headerRight}>
          {llmStatus === 'ready' && (
            <View style={[styles.modelTag, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.modelTagText, { color: colors.primary }]}>
                {llmModelTier?.toUpperCase() || 'LITE'}
              </Text>
            </View>
          )}
          {messages.length > 1 && (
            <Button
              label=""
              onPress={handleClearChat}
              variant="outline"
              size="sm"
              leftIcon={<Ionicons name="trash-outline" size={18} color={colors.danger} />}
              style={styles.clearBtn}
            />
          )}
          {llmStatus !== 'ready' && messages.length <= 1 && (
            <View style={{ width: 40 }} />
          )}
        </View>
      </View>

      {/* Model Not Downloaded Block */}
      {llmStatus !== 'ready' ? (
        <View style={styles.downloadContainer}>
          <Card style={styles.downloadCard} padding={24}>
            <Ionicons name="hardware-chip-outline" size={48} color={colors.primary} />
            <Text style={[styles.downloadTitle, { color: colors.text }]}>
              {llmStatus === 'downloading' ? 'Downloading Model Weights...' : 'Offline Model Needed'}
            </Text>
            <Text style={[styles.downloadSubtitle, { color: colors.textSecondary }]}>
              To analyze spend behaviors securely without sending data to the cloud, download the {llmModelTier || 'lite'} tier weights ({llmModelTier === 'pro' ? '~2.2 GB' : llmModelTier === 'standard' ? '~350 MB' : '~70 MB'}).
            </Text>

            {llmStatus === 'downloading' ? (
              <View style={styles.progressSection}>
                <ProgressRing progress={llmDownloadProgress / 100} size={90} strokeWidth={8} />
                <Text style={[styles.downloadPercent, { color: colors.text }]}>
                  {llmDownloadProgress}% Completed
                </Text>
                <Button
                  label="Cancel Download"
                  onPress={handleCancelDownload}
                  variant="outline"
                  size="sm"
                  style={{ marginTop: 12 }}
                />
              </View>
            ) : (
              <Button
                label="Download Model"
                onPress={handleStartDownload}
                variant="primary"
                style={styles.downloadBtn}
              />
            )}
          </Card>
        </View>
      ) : (
        // Chat Timeline Screen
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          style={styles.keyboardContainer}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.chatTimeline}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => {
              const isUser = item.sender === 'user';
              return (
                <View style={[styles.bubbleWrapper, isUser ? styles.userWrapper : styles.assistantWrapper]}>
                  <View
                    style={[
                      styles.chatBubble,
                      isUser
                        ? { backgroundColor: colors.primary }
                        : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
                    ]}
                  >
                    <Text style={[styles.bubbleText, isUser ? { color: '#FFFFFF' } : { color: colors.text }]}>
                      {item.content}
                    </Text>
                    <Text style={[styles.bubbleTime, isUser ? { color: 'rgba(255,255,255,0.7)' } : { color: colors.textSecondary }]}>
                      {item.timestamp}
                    </Text>
                  </View>
                </View>
              );
            }}
          />

          {isTyping && (
            <View style={styles.typingIndicatorRow}>
              <Text style={[styles.typingText, { color: colors.textSecondary }]}>
                Assistant is formulating spending insights...
              </Text>
            </View>
          )}

          {/* Chat input box */}
          <View style={[styles.inputBar, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
            <TextInput
              placeholder="Ask anything about your money..."
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSendMessage}
              containerStyle={styles.textInputContainer}
            />
            <Button
              label=""
              onPress={handleSendMessage}
              variant="primary"
              size="sm"
              disabled={!inputText.trim()}
              leftIcon={<Ionicons name="send" size={16} color="#FFFFFF" />}
              style={styles.sendBtn}
            />
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 40,
    justifyContent: 'flex-end',
  },
  backBtn: {
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  clearBtn: {
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  modelTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  modelTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  downloadContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  downloadCard: {
    alignItems: 'center',
    textAlign: 'center',
  },
  downloadTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 8,
  },
  downloadSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  progressSection: {
    alignItems: 'center',
    marginTop: 16,
  },
  downloadPercent: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
  },
  downloadBtn: {
    width: '100%',
    marginTop: 16,
  },
  keyboardContainer: {
    flex: 1,
  },
  chatTimeline: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    width: '100%',
  },
  userWrapper: {
    justifyContent: 'flex-end',
  },
  assistantWrapper: {
    justifyContent: 'flex-start',
  },
  chatBubble: {
    maxWidth: '80%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  typingIndicatorRow: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1.5,
  },
  textInputContainer: {
    flex: 1,
    marginBottom: 0,
  },
  sendBtn: {
    height: 56,
    width: 56,
    borderRadius: 16,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
