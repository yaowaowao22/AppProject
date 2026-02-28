import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useTheme, H2, Input, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useRewardedAd } from '@massapp/ads';
import { itemRepository } from '../repository';

export function CreateScreen() {
  const { spacing } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const { show: showRewardedAd, loaded: rewardedLoaded } = useRewardedAd();

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('エラー', 'タイトルを入力してください');
      return;
    }

    await itemRepository.insert({
      title: title.trim(),
      description: description.trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    setTitle('');
    setDescription('');
    Alert.alert('完了', '保存しました');
  };

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.lg }]}>
        <H2 style={{ marginBottom: spacing.lg }}>新規作成</H2>

        <Card>
          <Input
            value={title}
            onChangeText={setTitle}
            placeholder="タイトル"
            label="タイトル"
          />
          <View style={{ height: spacing.md }} />
          <Input
            value={description}
            onChangeText={setDescription}
            placeholder="詳細（任意）"
            label="詳細"
            multiline
          />
          <View style={{ height: spacing.lg }} />
          <Button title="保存する" onPress={handleCreate} />
        </Card>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
