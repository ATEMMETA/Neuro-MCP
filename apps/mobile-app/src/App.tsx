import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://your-mcp-server.com';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [queuedTasks, setQueuedTasks] = useState<any[]>([]);

  // Load queued tasks on mount
  useEffect(() => {
    AsyncStorage.getItem('queuedTasks').then((data) => {
      if (data) setQueuedTasks(JSON.parse(data));
    });
  }, []);

  // Save queued tasks
  useEffect(() => {
    AsyncStorage.setItem('queuedTasks', JSON.stringify(queuedTasks));
  }, [queuedTasks]);

  async function callAgent(agentName: string, task: any) {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/agents/${agentName}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      const json = await res.json();
      if (json.success) {
        setResponse(JSON.stringify(json.result, null, 2));
      } else {
        throw new Error(json.error);
      }
    } catch (e) {
      setQueuedTasks([...queuedTasks, { agentName, task }]);
      setResponse(`Offline: Task queued - ${String(e)}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function processQueue() {
    if (!queuedTasks.length) return;
    const tasks = [...queuedTasks];
    setQueuedTasks([]);
    for (const { agentName, task } of tasks) {
      await callAgent(agentName, task);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>MCP Agent Client</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter prompt for Claude"
        value={prompt}
        onChangeText={setPrompt}
      />
      <Button
        title={isLoading ? 'Loading...' : 'Call Claude Agent'}
        onPress={() => callAgent('claude-agent', { prompt })}
        disabled={isLoading}
      />
      <Button
        title={isLoading ? 'Loading...' : 'List Tmux Sessions'}
        onPress={() => callAgent('tmux-agent', { action: 'listSessions' })}
        disabled={isLoading}
      />
      <Button
        title={`Process Queue (${queuedTasks.length})`}
        onPress={processQueue}
        disabled={isLoading || !queuedTasks.length}
      />
      <Text style={styles.response}>{response}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, padding: 10 },
  response: { marginTop: 20, fontSize: 16 },
});

import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';

const API_BASE_URL = '[https://your-mcp-server.com](https://your-mcp-server.com)';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function callAgent(agentName: string, task: any) {
    setIsLoading(true);
    setResponse('Loading...');
    try {
      const res = await fetch(`${API_BASE_URL}/agents/${agentName}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      const json = await res.json();
      if (json.success) {
        setResponse(JSON.stringify(json.result, null, 2));
      } else {
        setResponse(`Error: ${json.error}`);
      }
    } catch (e) {
      setResponse('Network error: ' + String(e));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>MCP Agent Client</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter prompt for Claude"
        value={prompt}
        onChangeText={setPrompt}
      />
      <Button
        title="Call Claude Agent"
        onPress={() => callAgent('claude-agent', { prompt })}
        disabled={isLoading}
      />
      <View style={styles.buttonSpacer} />
      <Button
        title="List Tmux Sessions"
        onPress={() => callAgent('tmux-agent', { action: 'listSessions' })}
        disabled={isLoading}
      />

      {isLoading && <ActivityIndicator size="large" style={styles.loader} />}
      <ScrollView style={styles.responseContainer}>
        <Text style={styles.response}>
          {response}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, padding: 10 },
  buttonSpacer: { marginVertical: 5 },
  loader: { marginVertical: 20 },
  responseContainer: { flex: 1, marginTop: 20, borderWidth: 1, borderColor: '#ccc', padding: 10 },
  response: { fontSize: 14, fontFamily: 'monospace' },
});

