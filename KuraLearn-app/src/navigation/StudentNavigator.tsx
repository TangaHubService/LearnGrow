import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";

import { StudentDashboardScreen } from "../screens/student/StudentDashboardScreen";
import { SubjectsScreen } from "../screens/student/SubjectsScreen";
import { CoursesScreen } from "../screens/student/CoursesScreen";
import { LessonScreen } from "../screens/student/LessonScreen";
import { AITutorScreen } from "../screens/student/AITutorScreen";
import { QuizScreen } from "../screens/student/QuizScreen";
import { QuizResultScreen } from "../screens/student/QuizResultScreen";
import { MarksScreen } from "../screens/student/MarksScreen";
import { AttendanceScreen } from "../screens/student/AttendanceScreen";
import { TimetableScreen } from "../screens/student/TimetableScreen";
import { ProfileScreen } from "../screens/student/ProfileScreen";
import { SettingsScreen } from "../screens/student/SettingsScreen";
import { NotificationsScreen } from "../screens/student/NotificationsScreen";
import { LibraryScreen } from "../screens/student/LibraryScreen";
import { RewardsScreen } from "../screens/student/RewardsScreen";
import { GoalsScreen } from "../screens/student/GoalsScreen";

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const LearnStack = createNativeStackNavigator();
const AIStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: "🏠",
    Learn: "📚",
    "AI Tutor": "🤖",
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
      <HomeStack.Screen name="StudentDashboard" component={StudentDashboardScreen} />
      <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
      <HomeStack.Screen name="Library" component={LibraryScreen} />
    </HomeStack.Navigator>
  );
}

function LearnTab() {
  return (
    <LearnStack.Navigator screenOptions={{ headerShown: false }}>
      <LearnStack.Screen name="Subjects" component={SubjectsScreen} />
      <LearnStack.Screen name="Courses" component={CoursesScreen} />
      <LearnStack.Screen name="Lesson" component={LessonScreen} />
      <LearnStack.Screen name="Quiz" component={QuizScreen} />
      <LearnStack.Screen name="QuizResult" component={QuizResultScreen} />
    </LearnStack.Navigator>
  );
}

function AITab() {
  return (
    <AIStack.Navigator screenOptions={{ headerShown: false }}>
      <AIStack.Screen name="AITutor" component={AITutorScreen} />
    </AIStack.Navigator>
  );
}

function ProfileTab() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
      <ProfileStack.Screen name="Rewards" component={RewardsScreen} />
      <ProfileStack.Screen name="Goals" component={GoalsScreen} />
      <ProfileStack.Screen name="Marks" component={MarksScreen} />
      <ProfileStack.Screen name="Attendance" component={AttendanceScreen} />
      <ProfileStack.Screen name="Timetable" component={TimetableScreen} />
    </ProfileStack.Navigator>
  );
}

export function StudentNavigator() {
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
        name="LearnTab"
        component={LearnTab}
        options={{
          tabBarLabel: "Learn",
          tabBarIcon: ({ focused }) => <TabIcon label="Learn" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="AITab"
        component={AITab}
        options={{
          tabBarLabel: "AI Tutor",
          tabBarIcon: ({ focused }) => <TabIcon label="AI Tutor" focused={focused} />,
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
