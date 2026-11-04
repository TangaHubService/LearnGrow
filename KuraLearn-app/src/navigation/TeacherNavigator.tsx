import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";

import { TeacherDashboardScreen } from "../screens/teacher/TeacherDashboardScreen";
import { ClassListScreen } from "../screens/teacher/ClassListScreen";
import { StudentsListScreen } from "../screens/teacher/StudentsListScreen";
import { MarkAttendanceScreen } from "../screens/teacher/MarkAttendanceScreen";
import { LessonsManagementScreen } from "../screens/teacher/LessonsManagementScreen";
import { QuizzesManagementScreen } from "../screens/teacher/QuizzesManagementScreen";
import { ReportsScreen } from "../screens/teacher/ReportsScreen";
import { AICopilotScreen } from "../screens/teacher/AICopilotScreen";
import { TeacherProfileScreen } from "../screens/teacher/TeacherProfileScreen";
import { NotificationsScreen } from "../screens/student/NotificationsScreen";
import { SettingsScreen } from "../screens/student/SettingsScreen";

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const ClassesStack = createNativeStackNavigator();
const ContentStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: "🏠",
    Classes: "👨‍🏫",
    Content: "📝",
    Profile: "👤",
  };
  return (
    <Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.5 }}>
      {icons[label] ?? "•"}
    </Text>
  );
}

function HomeTab() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="TeacherDashboard" component={TeacherDashboardScreen} />
      <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
      <HomeStack.Screen name="Reports" component={ReportsScreen} />
    </HomeStack.Navigator>
  );
}

function ClassesTab() {
  return (
    <ClassesStack.Navigator screenOptions={{ headerShown: false }}>
      <ClassesStack.Screen name="ClassList" component={ClassListScreen} />
      <ClassesStack.Screen name="StudentsList" component={StudentsListScreen} />
      <ClassesStack.Screen name="MarkAttendance" component={MarkAttendanceScreen} />
    </ClassesStack.Navigator>
  );
}

function ContentTab() {
  return (
    <ContentStack.Navigator screenOptions={{ headerShown: false }}>
      <ContentStack.Screen name="Lessons" component={LessonsManagementScreen} />
      <ContentStack.Screen name="Quizzes" component={QuizzesManagementScreen} />
      <ContentStack.Screen name="AICopilot" component={AICopilotScreen} />
    </ContentStack.Navigator>
  );
}

function ProfileTab() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="TeacherProfile" component={TeacherProfileScreen} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
    </ProfileStack.Navigator>
  );
}

export function TeacherNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "white",
          borderTopColor: "#e2e8f0",
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: "#4f46e5",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeTab}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ focused }) => <TabIcon label="Home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ClassesTab"
        component={ClassesTab}
        options={{
          tabBarLabel: "Classes",
          tabBarIcon: ({ focused }) => <TabIcon label="Classes" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ContentTab"
        component={ContentTab}
        options={{
          tabBarLabel: "Content",
          tabBarIcon: ({ focused }) => <TabIcon label="Content" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileTab}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ focused }) => <TabIcon label="Profile" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
