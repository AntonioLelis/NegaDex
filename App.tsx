import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, Modal, TextInput, 
  FlatList, SafeAreaView, StatusBar 
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- TIPAGEM ---
type NoEvent = {
  id: string;
  timestamp: string;
  reason: string;
};

const STORAGE_KEY = '@negadex_events';

// --- TELA 1: O BOTÃO VERMELHO (Registro) ---
function HomeScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [reason, setReason] = useState('');
  const [history, setHistory] = useState<NoEvent[]>([]);
  const [recentReasons, setRecentReasons] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed: NoEvent[] = JSON.parse(data);
        setHistory(parsed);
        const uniqueReasons = Array.from(new Set(parsed.map(item => item.reason)));
        setRecentReasons(uniqueReasons);
      }
    } catch (e) {
      console.error('Erro ao carregar dados', e);
    }
  };

  const handleRegisterNo = async (selectedReason: string) => {
    const newEvent: NoEvent = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      reason: selectedReason.trim() || 'Sem motivo aparente',
    };

    const updatedHistory = [newEvent, ...history];
    setHistory(updatedHistory);
    setReason('');
    setModalVisible(false);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
      loadData();
    } catch (e) {
      console.error('Erro ao salvar', e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>NegaDex</Text>
      <Text style={styles.subtitle}>Registre a rejeição.</Text>

      <View style={styles.centerContent}>
        <TouchableOpacity 
          style={styles.redButton} 
          activeOpacity={0.7}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.redButtonText}>TOMEI UM NÃO</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL DE MOTIVOS */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Qual foi o motivo?</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Digite um novo motivo..."
              value={reason}
              onChangeText={setReason}
            />
            
            <TouchableOpacity style={styles.saveButton} onPress={() => handleRegisterNo(reason)}>
              <Text style={styles.saveButtonText}>Salvar Novo Motivo</Text>
            </TouchableOpacity>

            <Text style={styles.orText}>Ou escolha um anterior:</Text>
            
            <FlatList
              data={recentReasons}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.reasonBadge}
                  onPress={() => handleRegisterNo(item)}
                >
                  <Text style={styles.reasonBadgeText}>{item}</Text>
                </TouchableOpacity>
              )}
              style={styles.list}
            />

            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancelar (Foi alarme falso)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// --- TELA 2: HISTÓRICO COMPLETO ---
function HistoryScreen() {
  const [history, setHistory] = useState<NoEvent[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        setHistory(JSON.parse(data));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit'
    }).replace(',', ' às');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Linha do Tempo</Text>
      
      <TouchableOpacity style={styles.reloadButton} onPress={loadHistory}>
        <Text style={styles.reloadText}>Atualizar Histórico</Text>
      </TouchableOpacity>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.historyCard}>
            <Text style={styles.historyDate}>{formatDate(item.timestamp)}</Text>
            <Text style={styles.historyReason}>Motivo: {item.reason}</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
}

// --- TELA 3: DASHBOARD/RELATÓRIOS ---
function DashboardScreen() {
  const [stats, setStats] = useState<{reason: string; count: number}[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed: NoEvent[] = JSON.parse(data);
        setTotal(parsed.length);

        const counts = parsed.reduce((acc, curr) => {
          acc[curr.reason] = (acc[curr.reason] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const formattedStats = Object.keys(counts).map(key => ({
          reason: key,
          count: counts[key]
        })).sort((a, b) => b.count - a.count);

        setStats(formattedStats);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Relatório de Danos</Text>
      
      <View style={styles.scoreCard}>
        <Text style={styles.scoreTitle}>Total de Nãos</Text>
        <Text style={styles.scoreNumber}>{total}</Text>
      </View>

      <TouchableOpacity style={styles.reloadButton} onPress={loadStats}>
        <Text style={styles.reloadText}>Atualizar Dados</Text>
      </TouchableOpacity>

      <FlatList
        data={stats}
        keyExtractor={(item) => item.reason}
        renderItem={({ item }) => (
          <View style={styles.statRow}>
            <Text style={styles.statReason}>{item.reason}</Text>
            <View style={styles.statBadge}>
              <Text style={styles.statBadgeText}>{item.count}x</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

// --- NAVEGAÇÃO PRINCIPAL ---
const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" />
      <Tab.Navigator screenOptions={{ 
        headerShown: false,
        tabBarActiveTintColor: '#FF3B30',
        tabBarLabelStyle: { fontSize: 14, fontWeight: 'bold' }
      }}>
        <Tab.Screen 
          name="Registro" 
          component={HomeScreen} 
          options={{ tabBarIcon: () => <Text>🔴</Text> }}
        />
        <Tab.Screen 
          name="Histórico" 
          component={HistoryScreen} 
          options={{ tabBarIcon: () => <Text>📜</Text> }}
        />
        <Tab.Screen 
          name="Dashboard" 
          component={DashboardScreen} 
          options={{ tabBarIcon: () => <Text>📊</Text> }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// --- ESTILOS COMPILAÇÕES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7', padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1C1C1E', marginTop: 40, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#8E8E93', textAlign: 'center', marginBottom: 20 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Botão Vermelho
  redButton: {
    backgroundColor: '#FF3B30', width: 250, height: 250, borderRadius: 125,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#FF3B30', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5, shadowRadius: 15, elevation: 10,
    borderWidth: 8, borderColor: '#FF8A84',
  },
  redButtonText: { color: '#FFF', fontSize: 24, fontWeight: '900', letterSpacing: 2 },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', padding: 24, borderTopLeftRadius: 20, borderTopRightRadius: 20, minHeight: '50%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: { backgroundColor: '#F2F2F7', padding: 16, borderRadius: 8, fontSize: 16, marginBottom: 12 },
  saveButton: { backgroundColor: '#007AFF', padding: 16, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  orText: { textAlign: 'center', marginVertical: 16, color: '#8E8E93' },
  list: { maxHeight: 150 },
  reasonBadge: { backgroundColor: '#E5E5EA', padding: 12, borderRadius: 8, marginBottom: 8 },
  reasonBadgeText: { color: '#1C1C1E', fontSize: 16 },
  cancelButton: { marginTop: 16, padding: 16, alignItems: 'center' },
  cancelButtonText: { color: '#FF3B30', fontSize: 16, fontWeight: 'bold' },
  
  // Cards de Histórico
  historyCard: { 
    backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, 
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, 
    shadowRadius: 4, elevation: 2, borderLeftWidth: 4, borderLeftColor: '#FF3B30' 
  },
  historyDate: { fontSize: 12, color: '#8E8E93', fontWeight: 'bold', marginBottom: 4 },
  historyReason: { fontSize: 18, color: '#1C1C1E', fontWeight: '600' },
  
  // Dashboard & Reload
  scoreCard: { backgroundColor: '#FFF', padding: 24, borderRadius: 16, alignItems: 'center', marginVertical: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  scoreTitle: { fontSize: 18, color: '#8E8E93', fontWeight: 'bold' },
  scoreNumber: { fontSize: 64, fontWeight: '900', color: '#FF3B30' },
  reloadButton: { backgroundColor: '#E5E5EA', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  reloadText: { color: '#007AFF', fontWeight: 'bold' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 8, marginBottom: 8 },
  statReason: { fontSize: 16, color: '#1C1C1E', flex: 1 },
  statBadge: { backgroundColor: '#FF3B30', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statBadgeText: { color: '#FFF', fontWeight: 'bold' },
});