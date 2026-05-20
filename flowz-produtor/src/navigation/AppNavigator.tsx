import React, { useEffect, useState } from 'react';
import { Platform, Easing } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { Session } from '@supabase/supabase-js';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import ShowListScreen from '../screens/ShowListScreen';
import CreateShowScreen from '../screens/CreateShowScreen';
import ShowDetailScreen from '../screens/ShowDetailScreen';
import CalendarScreen from '../screens/CalendarScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TeamSettingsScreen from '../screens/TeamSettingsScreen';
import LoginScreen from '../screens/LoginScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';

export type RootStackParamList = {
  // Auth
  Login: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  // App
  ShowList: undefined;
  ShowDetail: { showId: string };
  CreateShow: { editId?: string } | undefined;
  Calendar: undefined;
  Settings: undefined;
  TeamSettings: undefined;
  TaskDetail: { taskId: string };
};

const Stack = createStackNavigator<RootStackParamList>();

const slideSpec = {
  open:  { animation: 'timing' as const, config: { duration: 520, easing: Easing.out(Easing.poly(5)) } },
  close: { animation: 'timing' as const, config: { duration: 400, easing: Easing.in(Easing.poly(4)) } },
};

function slideInterpolator({ current, layouts }: any) {
  const w = layouts.screen.width;
  const translateX = current.progress.interpolate({
    inputRange: [0, 1], outputRange: [w, 0], extrapolate: 'clamp',
  });
  const opacity = current.progress.interpolate({
    inputRange: [0, 0.4, 1], outputRange: [0, 0.7, 1], extrapolate: 'clamp',
  });
  return { cardStyle: { transform: [{ translateX }], opacity } };
}

const fadeSpec = {
  open:  { animation: 'timing' as const, config: { duration: 300, easing: Easing.out(Easing.cubic) } },
  close: { animation: 'timing' as const, config: { duration: 220, easing: Easing.in(Easing.cubic) } },
};

function fadeInterpolator({ current }: any) {
  return {
    cardStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp',
      }),
    },
  };
}

const modalSpec = {
  open:  { animation: 'timing' as const, config: { duration: 480, easing: Easing.out(Easing.poly(5)) } },
  close: { animation: 'timing' as const, config: { duration: 360, easing: Easing.in(Easing.poly(4)) } },
};

function modalInterpolator({ current, layouts }: any) {
  const h = layouts.screen.height;
  const translateY = current.progress.interpolate({
    inputRange: [0, 1], outputRange: [h, 0], extrapolate: 'clamp',
  });
  const opacity = current.progress.interpolate({
    inputRange: [0, 0.3, 1], outputRange: [0, 0.6, 1], extrapolate: 'clamp',
  });
  return { cardStyle: { transform: [{ translateY }], opacity } };
}

export default function AppNavigator() {
  const { colors, isDark } = useTheme();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) return null;

  const isLoggedIn = session !== null;

  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.bg,
          text: colors.text,
          border: colors.border,
          notification: colors.danger,
        },
        fonts: {
          regular: { fontFamily: 'CabinetGrotesk-Regular', fontWeight: '400' },
          medium: { fontFamily: 'CabinetGrotesk-Medium', fontWeight: '500' },
          bold: { fontFamily: 'CabinetGrotesk-Bold', fontWeight: '700' },
          heavy: { fontFamily: 'ClashDisplay-Bold', fontWeight: '700' },
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { flex: 1, backgroundColor: colors.background },
          cardOverlayEnabled: false,
          gestureEnabled: Platform.OS !== 'web',
        }}
      >
        {!isLoggedIn ? (
          <>
            <Stack.Screen name="Login"          component={LoginScreen}          options={{ cardStyleInterpolator: fadeInterpolator, transitionSpec: fadeSpec }} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ cardStyleInterpolator: slideInterpolator, transitionSpec: slideSpec }} />
            <Stack.Screen name="ResetPassword"  component={ResetPasswordScreen}  options={{ cardStyleInterpolator: slideInterpolator, transitionSpec: slideSpec }} />
          </>
        ) : (
          <>
            {/* Tab roots */}
            <Stack.Screen name="ShowList" component={ShowListScreen} options={{ cardStyleInterpolator: fadeInterpolator,  transitionSpec: fadeSpec }} />
            <Stack.Screen name="Calendar" component={CalendarScreen} options={{ cardStyleInterpolator: fadeInterpolator,  transitionSpec: fadeSpec }} />

            {/* Detail screens */}
            <Stack.Screen name="ShowDetail"   component={ShowDetailScreen}   options={{ cardStyleInterpolator: slideInterpolator, transitionSpec: slideSpec, gestureEnabled: true, gestureDirection: 'horizontal' }} />
            <Stack.Screen name="Settings"     component={SettingsScreen}     options={{ cardStyleInterpolator: slideInterpolator, transitionSpec: slideSpec, gestureEnabled: true, gestureDirection: 'horizontal' }} />
            <Stack.Screen name="TeamSettings" component={TeamSettingsScreen} options={{ cardStyleInterpolator: slideInterpolator, transitionSpec: slideSpec, gestureEnabled: true, gestureDirection: 'horizontal' }} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ cardStyleInterpolator: slideInterpolator, transitionSpec: slideSpec }} />

            {/* Modal */}
            <Stack.Screen name="CreateShow" component={CreateShowScreen} options={{ cardStyleInterpolator: modalInterpolator, transitionSpec: modalSpec, gestureEnabled: true, gestureDirection: 'vertical' }} />
            <Stack.Screen name="TaskDetail" component={TaskDetailScreen} options={{ cardStyleInterpolator: slideInterpolator, transitionSpec: slideSpec, gestureEnabled: true, gestureDirection: 'horizontal' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
