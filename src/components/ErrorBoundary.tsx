import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface State { hasError: boolean; message: string }

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message ?? String(error) };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={s.container}>
        <Text style={s.emoji}>⚠️</Text>
        <Text style={s.title}>Algo deu errado</Text>
        <Text style={s.msg}>{this.state.message}</Text>
        <TouchableOpacity style={s.btn} onPress={() => { this.setState({ hasError: false, message: '' }); }}>
          <Text style={s.btnText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A', alignItems: 'center', justifyContent: 'center', padding: 24 },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  msg: { color: '#aaa', fontSize: 13, textAlign: 'center', marginBottom: 32, fontFamily: 'monospace' },
  btn: { backgroundColor: '#007AFF', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
