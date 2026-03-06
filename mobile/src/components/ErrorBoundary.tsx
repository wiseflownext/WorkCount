import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App crash:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={s.container}>
          <Text style={s.title}>应用出错了</Text>
          <ScrollView style={s.scroll}>
            <Text style={s.msg}>{this.state.error?.message}</Text>
            <Text style={s.stack}>{this.state.error?.stack}</Text>
          </ScrollView>
          <TouchableOpacity
            style={s.btn}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={s.btnText}>重试</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, paddingTop: 80 },
  title: { fontSize: 24, fontWeight: '700', color: '#F44336', marginBottom: 16 },
  scroll: { flex: 1, marginBottom: 16 },
  msg: { fontSize: 16, color: '#333', marginBottom: 12 },
  stack: { fontSize: 12, color: '#999', lineHeight: 18 },
  btn: {
    backgroundColor: '#1976D2', height: 48, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
