import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import { IOSNavBar, IOSNavButton } from '../components/ios';

type Nav = NativeStackNavigationProp<RootStackParamList, 'TaskDetail'>;
type Route = RouteProp<RootStackParamList, 'TaskDetail'>;

export default function TaskDetailScreen({
  navigation,
}: {
  navigation: Nav;
  route: Route;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      <IOSNavBar
        left={<IOSNavButton onPress={() => navigation.goBack()}>‹ Voltar</IOSNavButton>}
        compactTitle="Tarefa"
      />
      <View style={s.center}>
        <Text style={[s.placeholder, { color: colors.textSecondary }]}>
          Detalhes da tarefa em breve
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholder: { fontSize: 16 },
});
