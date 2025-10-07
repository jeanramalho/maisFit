import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootNavigator } from "./src/navigation";
import { FitTheme } from "./src/theme/FitTheme";


export default function App() {

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar barStyle="light-content" backgroundColor={FitTheme.colors.background} />
      </NavigationContainer>
    </SafeAreaProvider>
  )
}